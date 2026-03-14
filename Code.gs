const SHEET_ID = "PASTE_SHEET_ID";
const PHOTO_FOLDER_ID = "PASTE_FOLDER_ID";

function doGet() {
  return ContentService.createTextOutput(JSON.stringify(getItems()))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  submitClaim(data);
  return ContentService.createTextOutput(JSON.stringify({success:true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function getItems() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("items");
  const rows = sheet.getDataRange().getValues();
  rows.shift();

  return rows.map(r => ({
    id: r[0],
    photoFileId: r[1],
    category: r[2],
    color: r[3],
    notes: r[4],
    dateFound: r[5],
    status: r[6]
  })).filter(i => i.status === "available");
}

function submitClaim(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("claims");

  sheet.appendRow([
    Utilities.getUuid(),
    data.itemId,
    data.parentEmail,
    data.studentFirst,
    data.studentLastInitial,
    data.note,
    new Date()
  ]);
}
