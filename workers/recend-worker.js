/**
 * recend メール送信バックエンド（Cloudflare Workers 用）
 * ----------------------------------------------------
 * 懇親会管理システム.html の「recendで一斉送信」「領収書 発行・送信」から
 * 呼び出される送信エンドポイント。Resend API を使って実際にメールを送信する。
 *
 * ■ デプロイ手順（Cloudflare ダッシュボード）
 * 1) https://dash.cloudflare.com にログイン → 左メニュー「Workers & Pages」
 * 2) 「Create」→「Create Worker」→ 名前を付けて Deploy（中身は空でOK、後で上書き）
 * 3) 作成された Worker を開き「Edit code」（Quick Edit）でこのファイルの中身を
 *    まるごと貼り付けて「Deploy」
 * 4) Worker の「Settings」→「Variables and Secrets」で以下を追加（すべて Secret 推奨）
 *      RESEND_API_KEY   = re_xxxxxxxxxxxxxxxxxxxxxxxx             （Resend発行のAPIキー。※公開リポジトリに実キーを書かないこと）
 *      SHARED_SECRET     = 任意のランダム文字列                     （このHTML側の「認証トークン」に入れる値と同じにする）
 *      FROM_EMAIL        = インフォトップ懇親会事務局 <eigyo1@send.infotop.jp>
 *      REPLY_TO_EMAIL    = eigyo1@infotop.jp
 *      TEST_MODE         = true          （テスト中は必ずtrueのままにする）
 *      TEST_RECIPIENT    = soga.naoya@first-penguin.co.jp
 *    ※ TEST_MODE=true の間は、参加者リストの本当の宛先に関わらず
 *      「全て TEST_RECIPIENT 宛」に送信される（誤送信防止）。
 *      本番運用に切り替える際は TEST_MODE を false にする（または変数ごと削除）。
 * 5) 発行された Worker の URL（例: https://recend-xxxx.your-subdomain.workers.dev）を
 *    懇親会管理システム.html の「設定」画面の
 *      recend 送信エンドポイントURL → 上記URL
 *      認証トークン              → SHARED_SECRETと同じ値
 *    に入力して保存する。
 */

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }

    const auth = request.headers.get('Authorization') || '';
    if (!env.SHARED_SECRET || auth !== `Bearer ${env.SHARED_SECRET}`) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid json' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const FROM = env.FROM_EMAIL || 'インフォトップ懇親会事務局 <eigyo1@send.infotop.jp>';
    const REPLY_TO = env.REPLY_TO_EMAIL || 'eigyo1@infotop.jp';
    const TEST_MODE = String(env.TEST_MODE || '').toLowerCase() === 'true';
    const TEST_RECIPIENT = env.TEST_RECIPIENT || '';

    const FOOTER =
      env.COMPANY_FOOTER ||
      '\n\n_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/\n' +
      '株式会社ファーストペンギン\n' +
      'インフォトップイベント事務局\n' +
      '〒160-0023 東京都新宿区西新宿3丁目7-30\n' +
      'フロンティアグラン西新宿8階\n' +
      'TEL：050-3490-4902\n' +
      'MAIL：eigyo1@infotop.jp\n' +
      '_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/';

    async function sendOne({ to, subject, text, html }) {
      let actualTo = to;
      let actualSubject = subject;
      let actualText = text;
      if (TEST_MODE && TEST_RECIPIENT) {
        // 件名に宛先アドレスや記号[]を入れると迷惑メール判定されやすいため、
        // テスト時の「本来の宛先」情報は本文側に書く。
        actualSubject = `【テスト配信】${subject}`;
        if (actualText != null) {
          actualText = `※これはテスト配信です。本来の宛先: ${to}\n\n${actualText}`;
        }
        actualTo = TEST_RECIPIENT;
      }
      if (actualText != null) actualText += FOOTER;

      const body = { from: FROM, to: [actualTo], reply_to: REPLY_TO, subject: actualSubject };
      if (html) body.html = html;
      else body.text = actualText || '';

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      let j = {};
      try { j = await res.json(); } catch (e) {}
      return { ok: res.ok, status: res.status, to: actualTo, originalTo: to, id: j.id, error: j.message };
    }

    let results = [];
    if (payload.type === 'reminder') {
      results = await Promise.all(
        (payload.messages || []).map((m) => sendOne({ to: m.to, subject: m.subject, text: m.body }))
      );
    } else if (payload.type === 'receipt') {
      results = [
        await sendOne({
          to: payload.to,
          subject: '【領収書】' + (payload.event?.name || ''),
          html: payload.html,
        }),
      ];
    } else if (payload.type === 'receipt_batch') {
      results = await Promise.all(
        (payload.items || []).map((it) =>
          sendOne({ to: it.to, subject: '【領収書】' + (payload.event?.name || ''), html: it.html })
        )
      );
    } else {
      return new Response(JSON.stringify({ ok: false, error: 'unknown type: ' + payload.type }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const allOk = results.length > 0 && results.every((r) => r.ok);
    return new Response(JSON.stringify({ ok: allOk, testMode: TEST_MODE, results }), {
      status: allOk ? 200 : 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
