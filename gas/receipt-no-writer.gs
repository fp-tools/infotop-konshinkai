/**
 * 領収書No 書き込み用 GAS Webアプリ
 * ------------------------------------------------------------------
 * 管理アプリ（懇親会管理システム）が領収書を発行・送信したときに
 * 「申込番号 → 最新の領収書No」を受け取り、この GAS が紐づく
 * スプレッドシートの該当行（申込番号）の X 列に書き込みます。
 *
 * ■ 導入手順
 *  1. 対象スプレッドシートを開く → 拡張機能 → Apps Script
 *  2. このコードをすべて貼り付けて保存
 *  3. 下の CONFIG を必要に応じて調整（SECRET は必ず設定推奨）
 *  4. 右上「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *       - 実行するユーザー: 自分
 *       - アクセスできるユーザー: 全員（匿名を含む）
 *  5. 発行された「ウェブアプリ URL（.../exec）」をコピー
 *  6. 管理アプリの [設定] →「スプレッドシートへ領収書No自動書込（GAS）」に
 *       URL と 共有シークレット（= 下の SECRET）を貼って保存
 *  7. 動作テスト: 管理アプリで領収書を1件発行、または
 *       「領収書発行」タブの「シートへ領収書Noを書込（全件）」を押す
 *
 * ※ コードを変更したら、必ず「デプロイ」→「デプロイを管理」→ 鉛筆 →
 *    「新バージョン」で再デプロイしてください（URL は変わりません）。
 */

// ================= CONFIG（ここだけ調整） =================
var CONFIG = {
  SECRET: '',            // 管理アプリの「共有シークレット」と同じ文字列（空なら検証なし・非推奨）
  SHEET_NAME: '',        // 書き込むシート名。空なら「申込番号」ヘッダーを持つシートを自動検出
  ORDER_HEADER: '申込番号', // 申込番号ヘッダーの文言（部分一致・空白は無視して照合）
  RECEIPT_COL: 'X',      // 領収書Noを書き込む列（例: 'X'）
  HEADER_SCAN_ROWS: 30   // ヘッダー行を探す最大行数
};
// ========================================================

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (CONFIG.SECRET && String(body.secret || '') !== CONFIG.SECRET) {
      return _json({ ok: false, error: 'unauthorized' });
    }
    var items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return _json({ ok: false, error: 'no items' });

    var ctx = _resolveSheet();
    if (!ctx) return _json({ ok: false, error: '「' + CONFIG.ORDER_HEADER + '」ヘッダーを持つシートが見つかりません' });
    var sh = ctx.sheet, headerRow = ctx.headerRow, orderCol = ctx.orderCol;

    var receiptCol = _colToIndex(CONFIG.RECEIPT_COL); // 0-based
    var values = ctx.values;

    // 申込番号 → 行index（0-based）のマップ
    var rowByOrder = {};
    for (var r = headerRow + 1; r < values.length; r++) {
      var key = _norm(values[r][orderCol]);
      if (key) rowByOrder[key] = r;
    }

    var updated = 0, notFound = [];
    items.forEach(function (it) {
      var key = _norm(it.orderNo);
      var no = String(it.receiptNo || '');
      if (!key) return;
      var row = rowByOrder[key];
      if (row == null) { notFound.push(key); return; }
      sh.getRange(row + 1, receiptCol + 1).setValue(no); // 1-based
      updated++;
    });

    return _json({ ok: true, updated: updated, notFound: notFound, sheet: sh.getName() });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

// 動作確認用（ブラウザで /exec を開くと表示される）
function doGet() {
  var ctx = _resolveSheet();
  return _json({
    ok: true,
    msg: 'receipt-no-writer alive',
    sheet: ctx ? ctx.sheet.getName() : '(未検出)',
    orderHeaderFound: !!ctx,
    receiptCol: CONFIG.RECEIPT_COL
  });
}

// 「申込番号」ヘッダーを持つシートと、そのヘッダー行・列を特定する
function _resolveSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = CONFIG.SHEET_NAME ? [ss.getSheetByName(CONFIG.SHEET_NAME)].filter(String) : ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    if (!sh) continue;
    var values = sh.getDataRange().getValues();
    var scan = Math.min(values.length, CONFIG.HEADER_SCAN_ROWS);
    for (var r = 0; r < scan; r++) {
      for (var c = 0; c < values[r].length; c++) {
        if (_norm(values[r][c]).indexOf(_norm(CONFIG.ORDER_HEADER)) >= 0) {
          return { sheet: sh, headerRow: r, orderCol: c, values: values };
        }
      }
    }
  }
  return null;
}

function _norm(v) { return String(v == null ? '' : v).replace(/[\s\r\n]/g, '').trim(); }
function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
// 'A'->0, 'X'->23, 'AA'->26 ...
function _colToIndex(letter) {
  letter = String(letter).toUpperCase().replace(/[^A-Z]/g, '');
  var n = 0;
  for (var i = 0; i < letter.length; i++) n = n * 26 + (letter.charCodeAt(i) - 64);
  return n - 1;
}
