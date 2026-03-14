
const API_URL = 'https://script.google.com/macros/s/AKfycbwqyqr7Ah2AeTDmRM-NsosokE3LmmZthWO5PL5V1fBMiDINDySvUtDeBzJni23zt8n3DA/exec';

const state = {
  items: [],
  filtered: []
};

const galleryEl = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const claimModal = document.getElementById('claimModal');
const claimForm = document.getElementById('claimForm');
const cancelClaimBtn = document.getElementById('cancelClaimBtn');

async function loadItems() {
  galleryEl.innerHTML = '<div class="notice">Loading items…</div>';
  const res = await fetch(`${API_URL}?action=items`);
  const data = await res.json();
  state.items = data.items || [];
  buildCategoryOptions();
  applyFilters();
}

function buildCategoryOptions() {
  const categories = [...new Set(state.items.map(i => i.category).filter(Boolean))].sort();
  categoryFilter.innerHTML = '<option value="">All categories</option>' +
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const status = statusFilter.value;

  state.filtered = state.items.filter(item => {
    const haystack = [item.id, item.category, item.color, item.notes].join(' ').toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (category && item.category !== category) return false;
    if (status && item.status !== status) return false;
    return true;
  });

  renderItems();
}

function renderItems() {
  if (!state.filtered.length) {
    galleryEl.innerHTML = '<div class="notice">No matching items found.</div>';
    return;
  }

  galleryEl.innerHTML = state.filtered.map(item => `
    <article class="card">
      <img src="${escapeAttr(item.imageUrl)}" alt="Lost item ${escapeAttr(item.id)}" loading="lazy" />
      <div class="card-body">
        <div class="badge">${escapeHtml(item.id)}</div>
        <div><strong>${escapeHtml(item.category || 'Item')}</strong></div>
        <div class="meta">${escapeHtml(item.color || 'Unknown color')}</div>
        <div class="meta">${escapeHtml(item.notes || '')}</div>
        <div class="meta">Found: ${escapeHtml(item.dateFound || '')}</div>
        <div class="actions">
          ${item.status === 'available'
            ? `<button class="btn-primary" onclick="openClaim('${escapeJs(item.id)}')">Claim</button>`
            : `<button class="btn-secondary" disabled>Claim pending</button>`}
        </div>
      </div>
    </article>
  `).join('');
}

function openClaim(itemId) {
  document.getElementById('claimItemId').value = itemId;
  claimModal.classList.add('open');
}

function closeClaim() {
  claimModal.classList.remove('open');
  claimForm.reset();
}

claimForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    action: 'claimItem',
    itemId: document.getElementById('claimItemId').value,
    parentEmail: document.getElementById('parentEmail').value.trim(),
    studentFirst: document.getElementById('studentFirst').value.trim(),
    studentLastInitial: document.getElementById('studentLastInitial').value.trim().slice(0, 1).toUpperCase(),
    note: document.getElementById('claimNote').value.trim()
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!data.ok) {
    alert(data.error || 'Could not submit claim');
    return;
  }

  alert('Claim submitted. Staff will verify the item.');
  closeClaim();
  await loadItems();
});

cancelClaimBtn.addEventListener('click', closeClaim);
searchInput.addEventListener('input', applyFilters);
categoryFilter.addEventListener('change', applyFilters);
statusFilter.addEventListener('change', applyFilters);
claimModal.addEventListener('click', (e) => {
  if (e.target === claimModal) closeClaim();
});

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

loadItems();
