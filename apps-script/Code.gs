/**
 * Backend Google Apps Script: simpan hantaran pelajar ke Google Sheet + Drive.
 * Jalankan setup() sekali, kemudian Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone).
 *
 * Keselamatan data:
 *  - PDF dan baris Sheet tidak pernah dipadam oleh skrip; "padam" hanya tanda Status=Dipadam.
 *  - Semua input disahkan di server; sel dilindungi daripada formula injection.
 *  - LockService elak baris bertindih; had kadar hantaran; had cuba kata laluan admin.
 *  - backup() salin Sheet setiap hari (simpan 30 salinan terkini).
 */

var HEADERS = ['Tarikh Hantar', 'Nama Pelajar', 'No. Matrik', 'Tajuk Web', 'Link Laman Web', 'Link Slide (PDF)', 'Nama Fail', 'Status', 'ID'];
var SHEET_NAME = 'Hantaran Pelajar';
var MAX_PDF_BYTES = 15 * 1024 * 1024;
var MAX_PER_HOUR = 200;

function setup() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SHEET_ID')) {
    var ss = SpreadsheetApp.create('Projek Website Saya - Hantaran Pelajar');
    var sh = ss.getSheets()[0];
    sh.setName(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    props.setProperty('SHEET_ID', ss.getId());
  }
  if (!props.getProperty('FOLDER_ID')) {
    props.setProperty('FOLDER_ID', DriveApp.createFolder('Slaid Pelajar').getId());
  }
  if (!props.getProperty('BACKUP_FOLDER_ID')) {
    props.setProperty('BACKUP_FOLDER_ID', DriveApp.createFolder('Sandaran Hantaran').getId());
  }
  if (!props.getProperty('ADMIN_PASSWORD')) {
    props.setProperty('ADMIN_PASSWORD', Utilities.getUuid().slice(0, 12));
  }
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('backup').timeBased().everyDays(1).create();
  Logger.log('Sheet: ' + sheetUrl_());
  Logger.log('Kata laluan admin: ' + props.getProperty('ADMIN_PASSWORD') + ' (tukar di Project Settings > Script properties)');
}

function backup() {
  var p = PropertiesService.getScriptProperties();
  var folder = DriveApp.getFolderById(p.getProperty('BACKUP_FOLDER_ID'));
  var name = 'Sandaran ' + Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  DriveApp.getFileById(p.getProperty('SHEET_ID')).makeCopy(name, folder);
  var files = [];
  var it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files.slice(30).forEach(function (f) { f.setTrashed(true); }); // hanya salinan sandaran lama
}

function sheetUrl_() {
  return SpreadsheetApp.openById(prop_('SHEET_ID')).getUrl();
}

function prop_(k) {
  return PropertiesService.getScriptProperties().getProperty(k);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  return SpreadsheetApp.openById(prop_('SHEET_ID')).getSheetByName(SHEET_NAME);
}

// Halang formula injection (=, +, -, @) dan potong panjang
function clean_(v, max) {
  var s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function isHttpUrl_(s) {
  return /^https?:\/\/[^\s]+$/i.test(s);
}

function rows_() {
  var data = sheet_().getDataRange().getValues();
  return data.slice(1).map(function (r, i) {
    return {
      row: i + 2,
      submittedAt: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      nama: String(r[1]), noMatrik: String(r[2]), tajukWeb: String(r[3]),
      linkLamanWeb: String(r[4]), slidePdfUrl: String(r[5]), slideFileName: String(r[6]),
      status: String(r[7]), id: String(r[8])
    };
  });
}

function stripRow_(r) {
  delete r.row;
  return r;
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'list') {
    var list = rows_().filter(function (r) { return r.status === 'Aktif'; }).reverse();
    return json_({ ok: true, submissions: list.map(stripRow_) });
  }
  return json_({ ok: true });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === 'submit') return json_(submit_(body));
    return json_(admin_(body));
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function submit_(b) {
  var nama = clean_(b.nama, 100), matrik = clean_(b.noMatrik, 30), tajuk = clean_(b.tajukWeb, 200);
  var web = String(b.linkLamanWeb || '').trim().slice(0, 500);
  if (nama.length < 2 || matrik.length < 2 || tajuk.length < 2) throw new Error('Maklumat tidak lengkap.');
  if (!isHttpUrl_(web)) throw new Error('Pautan laman web tidak sah.');

  var cache = CacheService.getScriptCache();
  var hourKey = 'g_' + Math.floor(Date.now() / 3600000);
  var rlKey = 'rl_' + matrik.toLowerCase();
  if (cache.get(rlKey)) throw new Error('Sila tunggu seminit sebelum hantar semula.');
  if (Number(cache.get(hourKey) || 0) >= MAX_PER_HOUR) throw new Error('Terlalu banyak hantaran. Cuba sebentar lagi.');

  var pdfUrl, fileName = clean_(b.slideFileName || 'Slaid.pdf', 120);
  var src = String(b.slidePdfUrl || '');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (src.indexOf('data:') === 0) {
      var m = src.match(/^data:application\/pdf;base64,([A-Za-z0-9+\/=]+)$/);
      if (!m) throw new Error('Fail mesti PDF.');
      var bytes = Utilities.base64Decode(m[1]);
      if (bytes.length > MAX_PDF_BYTES) throw new Error('PDF melebihi 15MB.');
      if (String.fromCharCode(bytes[0] & 255, bytes[1] & 255, bytes[2] & 255, bytes[3] & 255) !== '%PDF') throw new Error('Fail bukan PDF sebenar.');
      var safeName = matrik.replace(/[^\w\-]/g, '_') + '_' + Date.now() + '.pdf';
      var file = DriveApp.getFolderById(prop_('FOLDER_ID')).createFile(Utilities.newBlob(bytes, 'application/pdf', safeName));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      pdfUrl = file.getUrl();
    } else if (isHttpUrl_(src) && src.length <= 500) {
      pdfUrl = src;
    } else {
      throw new Error('Slaid PDF diperlukan.');
    }
    sheet_().appendRow([new Date(), nama, matrik, tajuk, web, pdfUrl, fileName, 'Aktif', Utilities.getUuid()]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  cache.put(rlKey, '1', 60);
  cache.put(hourKey, String(Number(cache.get(hourKey) || 0) + 1), 3600);
  return { ok: true };
}

function admin_(b) {
  var cache = CacheService.getScriptCache();
  if (Number(cache.get('adminfail') || 0) >= 5) throw new Error('Terlalu banyak cubaan. Cuba 10 minit lagi.');
  var pw = prop_('ADMIN_PASSWORD');
  var given = String(b.password || '');
  var diff = pw.length ^ given.length;
  for (var i = 0; i < pw.length; i++) diff |= pw.charCodeAt(i) ^ (given.charCodeAt(i) || 0);
  if (diff !== 0) {
    cache.put('adminfail', String(Number(cache.get('adminfail') || 0) + 1), 600);
    throw new Error('Kata laluan salah.');
  }
  if (b.action === 'adminList') {
    return {
      ok: true,
      sheetUrl: sheetUrl_(),
      folderUrl: DriveApp.getFolderById(prop_('FOLDER_ID')).getUrl(),
      submissions: rows_().reverse().map(stripRow_)
    };
  }
  if (b.action === 'adminSetStatus') {
    var status = b.status === 'Dipadam' ? 'Dipadam' : 'Aktif';
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var target = rows_().filter(function (r) { return r.id === String(b.id); })[0];
      if (!target) throw new Error('Rekod tidak dijumpai.');
      sheet_().getRange(target.row, 8).setValue(status);
    } finally {
      lock.releaseLock();
    }
    return { ok: true };
  }
  throw new Error('Tindakan tidak sah.');
}
