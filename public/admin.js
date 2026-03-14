const API_URL = 'https://script.google.com/macros/s/AKfycbwqyqr7Ah2AeTDmRM-NsosokE3LmmZthWO5PL5V1fBMiDINDySvUtDeBzJni23zt8n3DA/exec';

const authMessage = document.getElementById('authMessage');
const accessDenied = document.getElementById('accessDenied');
const adminApp = document.getElementById('adminApp');

const createItemForm = document.getElementById('createItemForm');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const itemsTableBody = document.getElementById('itemsTableBody');
const claimsTableBody = document.getElementById('claimsTableBody');

let selectedImage = null;
let isAuthorized = false;

async function initAdmin() {
  authMessage.textContent = 'Checking access...';
  adminApp.classList.add('hidden');
  accessDenied.classList.add('hidden');

  try {
    const res = await fetch(`${API_URL}?action=adminData`, {
      credentials: 'include'
    });

    const data = await res.json();

    if (!data.ok) {
      showAccessDenied(data.error || 'Unauthorized');
      return;
    }

    isAuthorized = true;
    authMessage.textContent = `Signed in as ${data.user || 'admin'}`;
    adminApp.classList.remove('hidden');

    renderItems(data.items || []);
    renderClaims(data.claims || []);
    wireEvents();
  } catch (err) {
    showAccessDenied('Unable to verify admin access.');
  }
}

function showAccessDenied(message) {
  isAuthorized = false;
  authMessage.textContent = '';
  accessDenied.classList.remove('hidden');
  accessDenied.innerHTML = `
    <h2 class="section-title">Access denied</h2>
    <p>${escapeHtml(message)}</p>
  `;
  adminApp.classList.add('hidden');
}

function wireEvents() {
  if (wireEvents.done) return;
  wireEvents.done = true;

  photoInput.addEventListener('change', async () => {
    if (!isAuthorized) return;
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    selectedImage = await compressImage(file, 1600, 0.82);
    photoPreview.src = selectedImage.dataUrl;
    photoPreview.classList.remove('hidden');
  });

  createItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isAuthorized) return;

    if (!selectedImage) {
      alert('Select an image first');
      return;
    }

    const payload = {
      action: 'createItem',
      imageBase64: selectedImage.base64,
      mimeType: 'image/jpeg',
      category: document.getElementById('categoryInput').value,
      color: document.getElementById('colorInput').value.trim(),
      notes: document.getElementById('notesInput').value.trim(),
      dateFound: document.getElementById('dateFoundInput').value
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    const data = await res.json();
    if (!data.ok) {
      alert(data.error || 'Could not create item');
      return;
    }

    alert(`Created ${data.itemId}`);
    createItemForm.reset();
    selectedImage = null;
    photoPreview.classList.add('hidden');
    photoPreview.removeAttribute('src');
    await refreshAdminData();
  });
}

async function refreshAdminData() {
  const res = await fetch(`${API_URL}?action=adminData`, {
    credentials: 'include'
  });
  const data = await res.json();

  if (!data.ok) {
    showAccessDenied(data.error || 'Unauthorized');
    return;
  }

  renderItems(data.items || []);
  renderClaims(data.claims || []);
}

function renderItems(items) {
  if (!items.length) {
    itemsTableBody.innerHTML = `<tr><td colspan="5">No items yet.</td></tr>`;
    return;
  }

  itemsTableBody.innerHTML = items.map(item => `
    <tr>
      <td><strong>${escapeHtml(item.id)}</strong></td>
      <td><img src="${escapeAttr(item.imageUrl)}" alt="${escapeAttr(item.id)}" style="width:72px;height:72px;object-fit:cover;border-radius:12px;" /></td>
      <td>
        <div>${escapeHtml(item.category || '')}</div>
        <div class="small">${escapeHtml(item.color || '')}</div>
        <div class="small">${escapeHtml(item.notes || '')}</div>
      </td>
      <td>${escapeHtml(item.status || '')}</td>
      <td>
        <div class="actions">
          <button class="btn-success" onclick="markReturned('${escapeJs(item.id)}')">Returned + delete</button>
          <button class="btn-danger" onclick="deleteItem('${escapeJs(item.id)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderClaims(claims) {
  if (!claims.length) {
    claimsTableBody.innerHTML = `<tr><td colspan="7">No claims yet.</td></tr>`;
    return;
  }

  claimsTableBody.innerHTML = claims.map(claim => `
    <tr>
      <td>${escapeHtml(claim.id || '')}</td>
      <td>${escapeHtml(claim.itemId || '')}</td>
      <td>${escapeHtml(maskEmail(claim.parentEmail || ''))}</td>
      <td>${escapeHtml((claim.studentFirst || '') + ' ' + (claim.studentLastInitial || ''))}</td>
      <td>${escapeHtml(claim.note || '')}</td>
      <td>${escapeHtml(claim.status || '')}</td>
      <td>
        <div class="actions">
          <button class="btn-secondary" onclick="updateClaimStatus('${escapeJs(claim.id)}','reviewed')">Mark reviewed</button>
          <button class="btn-success" onclick="updateClaimStatus('${escapeJs(claim.id)}','verified')">Mark verified</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function markReturned(itemId) {
  if (!isAuthorized) return;
  if (!confirm(`Return and permanently delete ${itemId}?`)) return;
  await postAction({ action: 'markReturned', itemId });
  await refreshAdminData();
}

async function deleteItem(itemId) {
  if (!isAuthorized) return;
  if (!confirm(`Delete ${itemId}? This removes the image and any claims.`)) return;
  await postAction({ action: 'deleteItem', itemId });
  await refreshAdminData();
}

async function updateClaimStatus(claimId, status) {
  if (!isAuthorized) return;
  await postAction({ action: 'updateClaimStatus', claimId, status });
  await refreshAdminData();
}

async function postAction(payload) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  const data = await res.json();
  if (!data.ok) alert(data.error || 'Request failed');
}

function maskEmail(email) {
  const [name, domain] = String(email).split('@');
  if (!name || !domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}

function escapeHtml(str) {
  return String(str || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
}
function escapeAttr(str) { return escapeHtml(str); }
function escapeJs(str) { return String(str || '').replaceAll("'", "\\'"); }

async function compressImage(file, maxSize = 1600, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64 = dataUrl.split(',')[1];
  return { dataUrl, base64 };
}

initAdmin();
