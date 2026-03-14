const SHEET_ID = '1z8yJ6ZM9Rs11KG6pKdG8J1_tdLRCy3MVF9lxJL-pnuQ';
const PHOTO_FOLDER_ID = '1GLI_Bdnoa2-YMCCL4oQ2V824hUDdTm9s';

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'items';

    if (action === 'items') {
      return jsonOutput({ ok: true, items: getPublicItems_() });
    }

    if (action === 'adminData') {
      requireAdmin_();
      return jsonOutput({
        ok: true,
        items: getAllItems_(),
        claims: getAllClaims_(),
        user: Session.getActiveUser().getEmail() || ''
      });
    }

    return jsonOutput({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action;

    if (action === 'claimItem') {
      return jsonOutput(claimItem_(body));
    }

    if (action === 'createItem') {
      requireAdmin_();
      return jsonOutput(createItem_(body));
    }

    if (action === 'markReturned') {
      requireAdmin_();
      return jsonOutput(markReturned_(body));
    }

    if (action === 'deleteItem') {
      requireAdmin_();
      return jsonOutput(deleteItem_(body));
    }

    if (action === 'updateClaimStatus') {
      requireAdmin_();
      return jsonOutput(updateClaimStatus_(body));
    }

    return jsonOutput({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err && err.message || err) });
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function getSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name);
  return sheet;
}

function getRowsAsObjects_(sheetName) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values[0];

  return values.slice(1)
    .filter(row => row.some(Boolean))
    .map(row => {
      const out = {};
      headers.forEach((h, i) => out[h] = row[i]);
      return out;
    });
}

function requireAdmin_() {
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase().trim();
  const admins = getRowsAsObjects_('admins')
    .map(r => String(r.email || '').toLowerCase().trim());

  if (!email || admins.indexOf(email) === -1) {
    throw new Error('Unauthorized');
  }
}

function buildThumbnailUrl_(fileId) {
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w1200';
}

function getPublicItems_() {
  return getRowsAsObjects_('items')
    .filter(item => item.status === 'available' || item.status === 'claimed_pending')
    .map(item => ({
      id: item.id,
      category: item.category,
      color: item.color,
      notes: item.notes,
      dateFound: item.dateFound,
      status: item.status,
      imageUrl: buildThumbnailUrl_(item.photoFileId)
    }));
}

function getAllItems_() {
  return getRowsAsObjects_('items').map(item => ({
    id: item.id,
    photoFileId: item.photoFileId,
    category: item.category,
    color: item.color,
    notes: item.notes,
    dateFound: item.dateFound,
    status: item.status,
    createdAt: item.createdAt,
    imageUrl: buildThumbnailUrl_(item.photoFileId)
  }));
}

function getAllClaims_() {
  return getRowsAsObjects_('claims');
}

function nextItemId_() {
  const items = getRowsAsObjects_('items');
  const max = items.reduce((n, item) => {
    const m = String(item.id || '').match(/KLS-(\d+)/);
    return Math.max(n, m ? Number(m[1]) : 0);
  }, 0);
  return 'KLS-' + String(max + 1).padStart(4, '0');
}

function claimItem_(body) {
  const itemId = String(body.itemId || '').trim();
  const parentEmail = String(body.parentEmail || '').trim();
  const studentFirst = String(body.studentFirst || '').trim();
  const studentLastInitial = String(body.studentLastInitial || '').trim().slice(0, 1).toUpperCase();
  const note = String(body.note || '').trim();

  if (!itemId || !parentEmail || !studentFirst || !studentLastInitial) {
    return { ok: false, error: 'Missing required fields' };
  }

  const itemSheet = getSheet_('items');
  const itemValues = itemSheet.getDataRange().getValues();
  const headers = itemValues[0];
  const idIdx = headers.indexOf('id');
  const statusIdx = headers.indexOf('status');

  let foundRow = -1;
  for (let i = 1; i < itemValues.length; i++) {
    if (String(itemValues[i][idIdx]) === itemId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) {
    return { ok: false, error: 'Item not found' };
  }

  const currentStatus = String(itemSheet.getRange(foundRow, statusIdx + 1).getValue() || '');
  if (currentStatus !== 'available') {
    return { ok: false, error: 'Item is no longer available' };
  }

  itemSheet.getRange(foundRow, statusIdx + 1).setValue('claimed_pending');

  const claimSheet = getSheet_('claims');
  claimSheet.appendRow([
    Utilities.getUuid(),
    itemId,
    parentEmail,
    studentFirst,
    studentLastInitial,
    note,
    new Date().toISOString(),
    'pending'
  ]);

  return { ok: true };
}

function createItem_(body) {
  const base64 = String(body.imageBase64 || '');
  const mimeType = String(body.mimeType || 'image/jpeg');
  const category = String(body.category || '').trim();
  const color = String(body.color || '').trim();
  const notes = String(body.notes || '').trim();
  const dateFound = String(body.dateFound || '').trim();

  if (!base64 || !category || !dateFound) {
    return { ok: false, error: 'Missing required fields' };
  }

  const itemId = nextItemId_();
  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mimeType, itemId + '.jpg');
  const file = DriveApp.getFolderById(PHOTO_FOLDER_ID).createFile(blob);

  getSheet_('items').appendRow([
    itemId,
    file.getId(),
    category,
    color,
    notes,
    dateFound,
    'available',
    new Date().toISOString()
  ]);

  return { ok: true, itemId: itemId };
}

function updateClaimStatus_(body) {
  const claimId = String(body.claimId || '').trim();
  const status = String(body.status || '').trim();
  if (!claimId || !status) return { ok: false, error: 'Missing fields' };

  const sheet = getSheet_('claims');
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIdx = headers.indexOf('id');
  const statusIdx = headers.indexOf('status');

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIdx]) === claimId) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(status);
      return { ok: true };
    }
  }

  return { ok: false, error: 'Claim not found' };
}

function markReturned_(body) {
  const itemId = String(body.itemId || '').trim();
  if (!itemId) return { ok: false, error: 'Missing itemId' };

  const itemSheet = getSheet_('items');
  const itemValues = itemSheet.getDataRange().getValues();
  const headers = itemValues[0];
  const idIdx = headers.indexOf('id');
  const fileIdx = headers.indexOf('photoFileId');

  for (let i = 1; i < itemValues.length; i++) {
    if (String(itemValues[i][idIdx]) === itemId) {
      const fileId = itemValues[i][fileIdx];

      try {
        DriveApp.getFileById(fileId).setTrashed(true);
      } catch (err) {}

      itemSheet.deleteRow(i + 1);
      deleteClaimsForItem_(itemId);
      return { ok: true };
    }
  }

  return { ok: false, error: 'Item not found' };
}

function deleteItem_(body) {
  return markReturned_(body);
}

function deleteClaimsForItem_(itemId) {
  const sheet = getSheet_('claims');
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const itemIdIdx = headers.indexOf('itemId');

  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][itemIdIdx]) === itemId) {
      sheet.deleteRow(i + 1);
    }
  }
}
