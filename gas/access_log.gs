/**
 * FSSplicer アクセスログ受信エンドポイント
 *
 * 送信元: /root/FSSplicer/functions/_shared.js の sendLog()
 *   Content-Type: application/json で以下のボディをPOSTしてくる:
 *     { nickname, path, country, region, city, ip, timestamp }
 *
 * 対象スプレッドシート: 1petpT5nLQKq1Cph1W6DoN5zVSbFqLFLWDlQSoUbF6_Q
 * シート名: log（無ければ自動作成しヘッダー行を書き込む）
 *
 * 注意: 送信元は fail-open 設計でレスポンス内容を見ない。
 *       パース失敗時もエラーを投げず 'ok' を返すこと。
 */

var SPREADSHEET_ID = '1petpT5nLQKq1Cph1W6DoN5zVSbFqLFLWDlQSoUbF6_Q';
var SHEET_NAME = 'log';
var LOG_HEADERS = ['timestamp', 'nickname', 'path', 'country', 'region', 'city', 'ip'];

function getOrCreateLogSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet === null) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(LOG_HEADERS);
  } else if (sheet.getLastColumn() < LOG_HEADERS.length) {
    // 既存シートに新規追加した列(ip等)のヘッダーが無い場合、不足分だけ補完する
    var lastCol = sheet.getLastColumn();
    sheet.getRange(1, lastCol + 1, 1, LOG_HEADERS.length - lastCol)
      .setValues([LOG_HEADERS.slice(lastCol)]);
  }
  return sheet;
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    // 不正なJSON: fail-open。呼び出し元はレスポンス内容を見ないため
    // ここでエラーを投げず素通りさせる。
    return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);

    var sheet = getOrCreateLogSheet_();
    sheet.appendRow([
      data.timestamp || '',
      data.nickname || '',
      data.path || '',
      data.country || '',
      data.region || '',
      data.city || '',
      data.ip || ''
    ]);
  } finally {
    lock.releaseLock();
  }

  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  return ContentService.createTextOutput('FSSplicer access log endpoint');
}
