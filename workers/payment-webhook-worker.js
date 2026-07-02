/**
 * インフォトップ「購入者情報送信API（Webhook）」受け皿（Cloudflare Workers + KV 用）
 * ---------------------------------------------------------------------
 * 懇親会管理システム.html の「設定」→「決済受信エンドポイントURL」から
 * GETで呼ばれ、これまでに受信した決済（購入者）情報をJSON配列で返す。
 *
 * 全体の流れ:
 *   インフォトップ側 --(購入・キャンセル発生のたびにWebhookでPOST)--> このWorker（受信して保存）
 *   懇親会管理システム.html --(「決済情報を同期」ボタンでGET)--> このWorker（保存済みを取得）
 *
 * ■ インフォトップ側の仕様（社内Wiki「購入者情報送信API連携の設定」より）
 * - 送信は Content-Type: application/x-www-form-urlencoded の POST（JSONではない）。
 *   例: type=3&item=99999&itemname=商品名&itemcount=1&user=9999999&username=購入者氏名&usermail=xxx@yyy.com&order=9999999
 * - type の意味: 3=一般商品 購入確定 / 6=月額課金 入会・課金 / 4=一般商品 キャンセル / 2=月額課金 退会
 * - 「購入者情報送信API_申込書」に以下2つのURLを記入して営業部→開発部経由で申請・登録してもらう
 *     登録データ受信URL（type=3, 6を受け取る）
 *     取消データ受信URL（type=4, 2を受け取る）
 *   → このWorkerは type を見て内部で自動判別するので、両方の欄に「同じこのWorkerのURL」を
 *     記入してしまって問題ない（プログラム上は1本で受けられる）。
 * - 応答（戻り値）は申込書で指定した固定の文字列をそのまま返す必要がある（JSONではなく生テキスト）。
 *   申込書の記入例は半角英字大文字「OK」。このWorkerも既定でプレーンテキスト "OK" を返す
 *   （下のSUCCESS_RESPONSE変数で申込書に書いた値と合わせること）。
 * - 送信元IPを許可リストに入れる必要がある場合、申込書の「接続許可IPアドレス」欄で
 *   案内されたインフォトップ側のIPを、こちら側で明示的に拒否していなければ通常は問題ない
 *   （Cloudflare Workers はどこからのアクセスも受けるため、IP制限は基本的に不要）。
 *
 * ■ デプロイ手順（Cloudflare ダッシュボード）
 * 1) Workers & Pages → Create → Start with Hello World! → 名前を付けて Deploy
 *    （例: infotop-payment-webhook）
 * 2) 左メニュー「Storage & databases」→「KV」→「Create a namespace」
 *    名前は何でも良い（例: PAYMENTS）→ Create
 * 3) 作成したWorkerの「Settings」→「Bindings」→「Add binding」→「KV Namespace」
 *    - Variable name: PAYMENTS   ← このスペルのまま（コード内で参照している名前）
 *    - KV namespace: 手順2で作ったものを選択
 *    → Deploy
 * 4) Worker の「Edit code」でこのファイルの中身をまるごと貼り付けて Deploy
 * 5) 「Settings」→「Variables and Secrets」で以下を追加
 *      GET_TOKEN        = 任意の文字列（懇親会管理システム.html「設定」の
 *                          決済受信エンドポイント「認証トークン」に同じ値を入れる）
 *      SUCCESS_RESPONSE = OK   （申込書の「戻り値に設定する値」欄に書いた値と必ず一致させる）
 *      WEBHOOK_KEY       = 任意の文字列（省略可。設定した場合、申込書に記入するURLの末尾に
 *                          ?key=この値 を付ける。省略時はURLさえ知られなければ誰でもPOSTできる状態）
 * 6) 発行されたWorkerのURL（例: https://infotop-payment-webhook.xxx.workers.dev）を
 *    - 「購入者情報送信API_申込書」の「登録データ受信 URL」「取消データ受信 URL」の
 *      両方に同じURLを記入し、営業担当経由でインフォトップに申請する
 *      （WEBHOOK_KEYを設定した場合は末尾に ?key=WEBHOOK_KEYの値 を付けて記入）
 *    - 懇親会管理システム.html の「設定」→「決済受信エンドポイントURL」にも同じURLを登録
 *      （認証トークンはGET_TOKENと同じ値）
 * 7) インフォトップ開発部の検証手順（③404エラー回避用事前確認）で
 *    ボディなしの curl -X POST が飛んでくることがあるが、このWorkerは空ボディでも
 *    SUCCESS_RESPONSEを返すだけで正常応答するので追加対応は不要。
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function parseIncoming(request) {
  const ctype = request.headers.get('Content-Type') || '';
  const text = await request.text();
  if (!text) return {};
  if (ctype.includes('application/json')) {
    try { return JSON.parse(text); } catch (e) { return {}; }
  }
  // application/x-www-form-urlencoded がインフォトップの実際の送信形式
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    if (!env.PAYMENTS) {
      return new Response('KV binding "PAYMENTS" が未設定です（Settings→Bindingsで追加）', {
        status: 500,
        headers: CORS,
      });
    }

    const url = new URL(request.url);

    // --- 受信: インフォトップ側からのWebhook（登録データ受信URL／取消データ受信URL 共通） ---
    if (request.method === 'POST') {
      if (env.WEBHOOK_KEY && url.searchParams.get('key') !== env.WEBHOOK_KEY) {
        return new Response('unauthorized', { status: 401, headers: CORS });
      }
      const rec = await parseIncoming(request);
      if (Object.keys(rec).length) {
        rec.__receivedAt = new Date().toISOString();
        const key = 'rec:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
        await env.PAYMENTS.put(key, JSON.stringify(rec));
      }
      // インフォトップ側は「戻り値」として固定の生テキストを期待している（JSONではない）
      return new Response(env.SUCCESS_RESPONSE || 'OK', {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'text/plain' },
      });
    }

    // --- 取得: 懇親会管理システム.html からの同期リクエスト ---
    if (request.method === 'GET') {
      const auth = request.headers.get('Authorization') || '';
      if (env.GET_TOKEN && auth !== `Bearer ${env.GET_TOKEN}`) {
        return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
          status: 401,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
      const out = [];
      let cursor;
      do {
        const list = await env.PAYMENTS.list({ prefix: 'rec:', cursor });
        for (const k of list.keys) {
          const v = await env.PAYMENTS.get(k.name);
          if (v) {
            try { out.push(JSON.parse(v)); } catch (e) {}
          }
        }
        cursor = list.cursor;
        if (list.list_complete) break;
      } while (cursor);
      return new Response(JSON.stringify(out), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method Not Allowed', { status: 405, headers: CORS });
  },
};
