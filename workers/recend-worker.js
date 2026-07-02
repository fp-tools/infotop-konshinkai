/**
 * recend メール送信バックエンド v2（Cloudflare Workers 用）
 * ----------------------------------------------------
 * 懇親会管理システムの「リマインド一斉送信」「領収書 発行・送信」「自動返信(QR)」
 * 「予約配信」から呼び出される送信エンドポイント。Resend API を使って送信する。
 *
 * ■ エンドポイント一覧
 *   POST   /                 即時送信（type: reminder / receipt / receipt_batch）
 *   POST   /schedule         予約配信の登録  { sendAt, eventId, eventName, subject, payload }
 *   GET    /schedule         予約ジョブ一覧（実行済み・結果含む）
 *   DELETE /schedule?id=xxx  予約の取消（pending のみ）
 *   GET    /opens            開封記録の一覧 { opens: { mid: {count,first,last} } }
 *   GET    /open?mid=xxx     開封トラッキング用 1x1 GIF（メール本文に埋め込まれる・認証なし）
 *   ※ /open 以外はすべて Authorization: Bearer SHARED_SECRET が必要
 *
 * ■ デプロイ手順（Cloudflare ダッシュボード）
 * 1) Workers & Pages → Create Worker → このファイルを貼り付けて Deploy
 * 2) Settings → Variables and Secrets で以下を追加（Secret 推奨）
 *      RESEND_API_KEY   = re_xxxxxxxxxxxxxxxxxxxxxxxx  （Resend発行のAPIキー。※公開リポジトリに実キーを書かないこと）
 *      SHARED_SECRET     = 任意のランダム文字列          （HTML側「設定」の認証トークンと同じ値にする）
 *      FROM_EMAIL        = インフォトップ懇親会事務局 <eigyo1@send.infotop.jp>
 *      REPLY_TO_EMAIL    = eigyo1@infotop.jp
 *      TEST_MODE         = true   （テスト中は必ずtrue。本番切替時にfalseへ）
 *      TEST_RECIPIENT    = テスト受信用アドレス
 * 3) 【必須・予約配信/開封トラッキング用】KVネームスペースを作成し、
 *    Settings → Bindings → KV Namespace で
 *      Variable name: MAILLOG   ← このスペルのまま
 *    をバインドする（未設定でも即時送信だけは動く）
 * 4) 【必須・予約配信用】Settings → Triggers → Cron Triggers に
 *      *\/5 * * * *   （5分おき。バックスラッシュは除いて入力する）
 *    を追加する。予約時刻を過ぎた最初のcron実行で送信される（最大5分の遅れ）。
 * 5) 発行された Worker の URL を、懇親会管理システムの「設定」→
 *    「recend 送信エンドポイントURL」に入力し、認証トークンに SHARED_SECRET と同じ値を入れる。
 *
 * ■ 開封トラッキングの仕組みと限界
 *   HTMLメール末尾の 1x1 透明GIF（GET /open?mid=...）が読み込まれた時点で「開封」を記録する。
 *   受信側が画像の自動表示をブロックしている場合は開封してもカウントされない（実開封数 ≧ 計測値）。
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const JSON_HEADERS = { ...CORS, 'Content-Type': 'application/json' };

// 1x1 透明GIF
const PIXEL = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), (c) => c.charCodeAt(0));

const jres = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });

function authed(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return env.SHARED_SECRET && auth === `Bearer ${env.SHARED_SECRET}`;
}

function footerText(env) {
  return (
    env.COMPANY_FOOTER ||
    '\n\n_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/\n' +
    '株式会社ファーストペンギン\n' +
    'インフォトップイベント事務局\n' +
    '〒160-0023 東京都新宿区西新宿3丁目7-30\n' +
    'フロンティアグラン西新宿8階\n' +
    'TEL：050-3490-4902\n' +
    'MAIL：eigyo1@infotop.jp\n' +
    '_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/'
  );
}
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const footerHtml = (env) => '<div style="white-space:pre-wrap;color:#6b7686;font-size:12px;margin-top:20px">' + escHtml(footerText(env).trim()) + '</div>';

/**
 * メール1通分のオブジェクト（Resend形式）を作る。TEST_MODE時は宛先を差し替える。
 * m: { to, subject, text?, body?, html? }
 */
function buildEmail(m, env) {
  const FROM = env.FROM_EMAIL || 'インフォトップ懇親会事務局 <eigyo1@send.infotop.jp>';
  const REPLY_TO = env.REPLY_TO_EMAIL || 'eigyo1@infotop.jp';
  const TEST_MODE = String(env.TEST_MODE || '').toLowerCase() === 'true';
  const TEST_RECIPIENT = env.TEST_RECIPIENT || '';

  let to = m.to;
  let subject = m.subject || '';
  let text = m.text != null ? m.text : m.body;
  let html = m.html;

  if (TEST_MODE && TEST_RECIPIENT) {
    // 件名に宛先や[]を入れると迷惑メール判定されやすいため本文側に書く
    subject = `【テスト配信】${subject}`;
    if (text != null) text = `※これはテスト配信です。本来の宛先: ${m.to}\n\n${text}`;
    if (html != null) html = `<div style="background:#fdf4dd;padding:8px 12px;font-size:12px">※これはテスト配信です。本来の宛先: ${escHtml(m.to)}</div>` + html;
    to = TEST_RECIPIENT;
  }
  if (text != null) text += footerText(env);
  if (html != null) html += footerHtml(env);

  const mail = { from: FROM, to: [to], reply_to: REPLY_TO, subject };
  if (html) {
    mail.html = html;
    if (text != null) mail.text = text; // マルチパート（画像非表示環境向け）
  } else {
    mail.text = text || '';
  }
  return { mail, originalTo: m.to, actualTo: to };
}

/** 複数通を Resend の batch API（最大100通/リクエスト）で送信する */
async function sendMany(messages, env) {
  const built = messages.map((m) => buildEmail(m, env));
  const results = [];
  for (let i = 0; i < built.length; i += 100) {
    const chunk = built.slice(i, i + 100);
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk.map((b) => b.mail)),
    });
    let j = {};
    try { j = await res.json(); } catch (e) {}
    const ids = (j && j.data) || [];
    chunk.forEach((b, k) => {
      results.push({
        ok: res.ok,
        status: res.status,
        to: b.actualTo,
        originalTo: b.originalTo,
        id: ids[k] && ids[k].id,
        error: res.ok ? undefined : (j && j.message) || 'send failed',
      });
    });
  }
  return results;
}

/** 即時送信payload（type: reminder / receipt / receipt_batch）を実行する */
async function sendPayload(payload, env) {
  if (payload.type === 'reminder') {
    return sendMany(payload.messages || [], env);
  }
  if (payload.type === 'receipt') {
    return sendMany([{ to: payload.to, subject: '【領収書】' + (payload.event?.name || ''), html: payload.html }], env);
  }
  if (payload.type === 'receipt_batch') {
    return sendMany((payload.items || []).map((it) => ({ to: it.to, subject: '【領収書】' + (payload.event?.name || ''), html: it.html })), env);
  }
  return null;
}

async function kvListAll(kv, prefix) {
  const out = [];
  let cursor;
  do {
    const list = await kv.list({ prefix, cursor });
    for (const k of list.keys) {
      const v = await kv.get(k.name);
      if (v) { try { out.push({ key: k.name, value: JSON.parse(v) }); } catch (e) {} }
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);
  return out;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    // --- 開封トラッキング用ピクセル（認証なし・メールから読み込まれる） ---
    if (request.method === 'GET' && path === '/open') {
      const mid = (url.searchParams.get('mid') || '').slice(0, 64);
      if (mid && env.MAILLOG) {
        ctx.waitUntil((async () => {
          const key = 'open:' + mid;
          let rec = { count: 0, first: '', last: '' };
          try { const v = await env.MAILLOG.get(key); if (v) rec = JSON.parse(v); } catch (e) {}
          const now = new Date().toISOString();
          rec.count = (rec.count || 0) + 1;
          rec.first = rec.first || now;
          rec.last = now;
          await env.MAILLOG.put(key, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 180 });
        })());
      }
      return new Response(PIXEL, { status: 200, headers: { ...CORS, 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }

    // --- これ以降は認証必須 ---
    if (!authed(request, env)) return jres({ ok: false, error: 'unauthorized' }, 401);

    // --- 開封記録一覧 ---
    if (request.method === 'GET' && path === '/opens') {
      if (!env.MAILLOG) return jres({ ok: false, error: 'KV binding "MAILLOG" が未設定です（Settings→Bindingsで追加）' }, 500);
      const rows = await kvListAll(env.MAILLOG, 'open:');
      const opens = {};
      rows.forEach((r) => { opens[r.key.slice(5)] = r.value; });
      return jres({ ok: true, opens });
    }

    // --- 予約配信 ---
    if (path === '/schedule') {
      if (!env.MAILLOG) return jres({ ok: false, error: 'KV binding "MAILLOG" が未設定です（Settings→Bindingsで追加）' }, 500);

      if (request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch (e) { return jres({ ok: false, error: 'invalid json' }, 400); }
        const sendAt = Date.parse(body.sendAt);
        if (!sendAt || isNaN(sendAt)) return jres({ ok: false, error: 'sendAt が不正です' }, 400);
        if (!body.payload || !body.payload.type) return jres({ ok: false, error: 'payload がありません' }, 400);
        const id = 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const job = {
          id,
          sendAt: new Date(sendAt).toISOString(),
          createdAt: new Date().toISOString(),
          eventId: body.eventId || '',
          eventName: body.eventName || '',
          subject: body.subject || '',
          count: (body.payload.messages || body.payload.items || []).length,
          status: 'pending',
          payload: body.payload,
        };
        await env.MAILLOG.put('job:' + id, JSON.stringify(job), { expirationTtl: 60 * 60 * 24 * 180 });
        return jres({ ok: true, id, sendAt: job.sendAt });
      }

      if (request.method === 'GET') {
        const rows = await kvListAll(env.MAILLOG, 'job:');
        // payload（本文全体）は返さない（一覧が重くなるため）
        const jobs = rows.map((r) => { const { payload, ...rest } = r.value; return rest; });
        return jres({ ok: true, jobs });
      }

      if (request.method === 'DELETE') {
        const id = url.searchParams.get('id') || '';
        const v = await env.MAILLOG.get('job:' + id);
        if (!v) return jres({ ok: false, error: '予約が見つかりません' }, 404);
        let job; try { job = JSON.parse(v); } catch (e) { job = null; }
        if (!job || job.status !== 'pending') return jres({ ok: false, error: '実行済み・実行中のため取消できません' }, 409);
        job.status = 'canceled';
        job.canceledAt = new Date().toISOString();
        await env.MAILLOG.put('job:' + id, JSON.stringify(job), { expirationTtl: 60 * 60 * 24 * 180 });
        return jres({ ok: true });
      }
    }

    // --- 即時送信（従来互換: POST /） ---
    if (request.method === 'POST' && path === '/') {
      let payload;
      try { payload = await request.json(); } catch (e) { return jres({ ok: false, error: 'invalid json' }, 400); }
      const results = await sendPayload(payload, env);
      if (results === null) return jres({ ok: false, error: 'unknown type: ' + payload.type }, 400);
      const allOk = results.length > 0 && results.every((r) => r.ok);
      const TEST_MODE = String(env.TEST_MODE || '').toLowerCase() === 'true';
      return jres({ ok: allOk, testMode: TEST_MODE, results }, allOk ? 200 : 502);
    }

    return new Response('Method Not Allowed', { status: 405, headers: CORS });
  },

  // --- Cron Trigger: 予約配信の実行（Settings→Triggers→Cron Triggersで */5 * * * * を設定） ---
  async scheduled(event, env, ctx) {
    if (!env.MAILLOG) return;
    const now = Date.now();
    const rows = await kvListAll(env.MAILLOG, 'job:');
    for (const r of rows) {
      const job = r.value;
      if (!job || job.status !== 'pending') continue;
      if (Date.parse(job.sendAt) > now) continue;
      // 二重送信防止: 先に実行中へ更新してから送る
      job.status = 'sending';
      await env.MAILLOG.put(r.key, JSON.stringify(job), { expirationTtl: 60 * 60 * 24 * 180 });
      let results = [];
      try { results = (await sendPayload(job.payload, env)) || []; } catch (e) { results = [{ ok: false, error: String(e) }]; }
      job.status = results.length && results.every((x) => x.ok) ? 'sent' : 'error';
      job.sentAt = new Date().toISOString();
      job.results = results.map((x) => ({ to: x.originalTo || x.to, ok: !!x.ok, id: x.id, error: x.error }));
      delete job.payload; // 送信済みジョブは本文を保持しない
      await env.MAILLOG.put(r.key, JSON.stringify(job), { expirationTtl: 60 * 60 * 24 * 180 });
    }
  },
};
