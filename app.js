const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwyHzBz-VtWFPzl3h0d3o6cKgMhnxs1G8iZUg7HkCjK4clB9CJP-z_FlXA1eyTtfQmkOA/exec',
  FAVORITES_KEY: 'katalog_uti_v2_favorites',
  CATEGORIES: ['Favorit','Semua','Fashion','Rumah Tangga','Sport & Hobi','Otomotif','Gadget','Kesehatan','Kecantikan'],
  BADGES: ['Hot','Best Seller','New','Best Choice','Official Store']
};

const state = {
  products: [],
  category: 'Semua',
  badge: 'Semua',
  query: ''
};

const els = {
  search: document.getElementById('searchInput'),
  clear: document.getElementById('clearSearch'),
  categoryChips: document.getElementById('categoryChips'),
  badgeChips: document.getElementById('badgeChips'),
  list: document.getElementById('productList'),
  empty: document.getElementById('emptyState'),
  count: document.getElementById('resultCount'),
  reset: document.getElementById('resetFilters'),
  emptyReset: document.getElementById('emptyReset'),
  disclaimer: document.getElementById('disclaimerDialog'),
  disclaimerBtn: document.getElementById('disclaimerBtn'),
  closeDisclaimer: document.getElementById('closeDisclaimer'),
  modalOk: document.getElementById('modalOk'),
  footerCta: document.getElementById('footerCta'),
  toast: document.getElementById('toast')
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  renderCategoryChips();
  renderBadgeChips();
  bindEvents();
  loadProducts();
}

function bindEvents() {
  els.search.addEventListener('input', () => {
    state.query = els.search.value.trim().toLowerCase();
    els.clear.style.display = state.query ? 'grid' : 'none';
    renderProducts();
  });

  els.clear.addEventListener('click', () => {
    els.search.value = '';
    state.query = '';
    els.clear.style.display = 'none';
    renderProducts();
    els.search.focus();
  });

  els.reset.addEventListener('click', resetFilters);
  els.emptyReset.addEventListener('click', resetFilters);

  els.disclaimerBtn.addEventListener('click', () => els.disclaimer.showModal());
  els.closeDisclaimer.addEventListener('click', () => els.disclaimer.close());
  els.modalOk.addEventListener('click', () => els.disclaimer.close());

  els.footerCta.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
    showToast('Yuk cari produk favoritmu ✨');
  });
}

function renderCategoryChips() {
  els.categoryChips.innerHTML = CONFIG.CATEGORIES.map(c => {
    const cls = c === 'Favorit' ? 'chip fav' : 'chip';
    return `<button class="${cls} ${state.category === c ? 'active':''}" data-category="${escapeAttr(c)}">${categoryIcon(c)} ${escapeHtml(c)}</button>`;
  }).join('');

  els.categoryChips.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.category;
      renderCategoryChips();
      renderProducts();
    });
  });
}

function renderBadgeChips() {
  const all = ['Semua', ...CONFIG.BADGES];
  els.badgeChips.innerHTML = all.map(b =>
    `<button class="chip badge-chip ${state.badge === b ? 'active':''}" data-badge="${escapeAttr(b)}">${badgeIcon(b)} ${escapeHtml(b)}</button>`
  ).join('');

  els.badgeChips.querySelectorAll('[data-badge]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.badge = btn.dataset.badge;
      renderBadgeChips();
      renderProducts();
    });
  });
}

function loadProducts() {
  if (!CONFIG.API_URL || CONFIG.API_URL.includes('PASTE_APPS')) {
    state.products = demoProducts();
    showToast('Mode demo aktif — masukkan URL Apps Script untuk data Google Sheet.');
    renderProducts();
    return;
  }

  const callback = 'katalogUtiCallback_' + Date.now();
  window[callback] = data => {
    delete window[callback];
    if (!data || !data.ok) {
      state.products = demoProducts();
      showToast('Data Google Sheet gagal dimuat. Menampilkan demo.');
    } else {
      state.products = Array.isArray(data.products) ? data.products : [];
    }
    renderProducts();
  };

  const script = document.createElement('script');
  script.src = CONFIG.API_URL + (CONFIG.API_URL.includes('?') ? '&' : '?') +
    'action=products&callback=' + encodeURIComponent(callback);
  script.onerror = () => {
    delete window[callback];
    state.products = demoProducts();
    showToast('Koneksi API gagal. Menampilkan demo.');
    renderProducts();
  };
  document.body.appendChild(script);

  setTimeout(() => {
    if (window[callback]) {
      delete window[callback];
      state.products = demoProducts();
      showToast('API terlalu lama merespons. Menampilkan demo.');
      renderProducts();
    }
  }, 10000);
}

function renderProducts() {
  const products = filteredProducts();
  els.count.textContent = `${products.length} produk`;
  els.list.innerHTML = products.map((p, i) => productCard(p, i)).join('');
  els.empty.classList.toggle('hidden', products.length !== 0);
  els.list.classList.toggle('hidden', products.length === 0);

  els.list.querySelectorAll('[data-fav]').forEach(btn => {
    btn.addEventListener('click', () => toggleFavorite(btn.dataset.fav));
  });
}

function filteredProducts() {
  const favs = getFavorites();
  return state.products.filter(p => {
    const matchCat =
      state.category === 'Semua' ? true :
      state.category === 'Favorit' ? favs.has(String(p.id)) :
      p.category === state.category;

    const matchBadge =
      state.badge === 'Semua' ? true : p.badge === state.badge;

    const haystack = [
      p.item,p.brand,p.category,p.description,p.callout,p.badge
    ].join(' ').toLowerCase();

    return matchCat && matchBadge && (!state.query || haystack.includes(state.query));
  });
}

function productCard(p, index) {
  const fav = getFavorites().has(String(p.id));
  const tone = index % 7;
  const callout = p.callout || fallbackCallout(p.category, index);
  const badge = p.badge || '';
  const badgeClass = badgeCss(badge);
  const shopee = validHttpUrl(p.shopeeUrl);
  const tiktok = validHttpUrl(p.tiktokUrl);

  return `
    <article class="product-card">
      <div class="callout tone-${tone}">
        <span>${escapeHtml(callout)}</span>
      </div>
      <div class="card-main">
        <div class="topline">
          ${badge ? `<span class="badge ${badgeClass}">${badgeIcon(badge)} ${escapeHtml(badge)}</span>` : ''}
        </div>
        <h2 class="product-title">${escapeHtml(p.item)}</h2>
        <div class="brand">${escapeHtml(p.brand || 'Pilihan Uti')}</div>
        <span class="category">${categoryIcon(p.category)} ${escapeHtml(p.category)}</span>
        <p class="description">${escapeHtml(p.description || 'Pilihan menarik yang layak kamu cek.')}</p>
        <div class="card-actions">
          <button class="fav-btn ${fav ? 'active':''}" data-fav="${escapeAttr(String(p.id))}" aria-label="Favorit">${fav ? '♥' : '♡'}</button>
          <a class="store-btn shopee ${shopee ? '' : 'disabled'}" href="${shopee ? escapeAttr(shopee) : '#'}" target="_blank" rel="noopener noreferrer">🛍 Shopee →</a>
          <a class="store-btn tiktok ${tiktok ? '' : 'disabled'}" href="${tiktok ? escapeAttr(tiktok) : '#'}" target="_blank" rel="noopener noreferrer">♪ TikTok →</a>
        </div>
      </div>
    </article>
  `;
}

function toggleFavorite(id) {
  const favs = getFavorites();
  if (favs.has(id)) {
    favs.delete(id);
    showToast('Dihapus dari favorit');
  } else {
    favs.add(id);
    showToast('Ditambahkan ke favorit 💗');
  }
  localStorage.setItem(CONFIG.FAVORITES_KEY, JSON.stringify([...favs]));
  renderCategoryChips();
  renderProducts();
}

function getFavorites() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONFIG.FAVORITES_KEY) || '[]');
    return new Set(raw.map(String));
  } catch (_) {
    return new Set();
  }
}

function resetFilters() {
  state.category = 'Semua';
  state.badge = 'Semua';
  state.query = '';
  els.search.value = '';
  els.clear.style.display = 'none';
  renderCategoryChips();
  renderBadgeChips();
  renderProducts();
}

function fallbackCallout(category, index) {
  const map = {
    'Fashion':['Murce ✨','Cocok Sih! 💗','Auto Kece! ✨','Ide Bagus! 👀'],
    'Rumah Tangga':['Be Healthy 🌿','Pas Butuh 💡','Biar Rapi! 🏡','Cocok Sih! ✨'],
    'Sport & Hobi':['Hiking Yuk! 🥾','Camping Yuk! ⛺','Gas Olahraga! 💪','Siap Aktivitas! 🔥'],
    'Otomotif':['Pas Butuh 🚗','Gas Jalan! 🏁','Rawat Yuk! 🔧','Wajib Cek! 👀'],
    'Gadget':['Ide Bagus! 💡','Upgrade Yuk! ⚡','Cocok Sih! ✨','Worth Cek! 👀'],
    'Kesehatan':['Be Healthy 🌿','Jaga Diri 💚','Sehat Yuk! ✨'],
    'Kecantikan':['Be Kind 💗','Self Care Yuk! ✨','Glow Up! 💖']
  };
  const arr = map[category] || ['Ide Bagus! ✨','Cocok Sih! 💗','Pas Butuh! 👀'];
  return arr[index % arr.length];
}

function demoProducts() {
  return [
    {id:'001',item:'Hoodie Oversize Unisex',brand:'Erigo',category:'Fashion',shopeeUrl:'https://shopee.co.id/',tiktokUrl:'https://www.tiktok.com/',callout:'Murce Banget!',description:'Nyaman dipakai, cocok untuk segala aktivitas.',badge:'Hot'},
    {id:'002',item:'Tumbler Stainless 500ml',brand:'Tyeso',category:'Rumah Tangga',shopeeUrl:'https://shopee.co.id/',tiktokUrl:'https://www.tiktok.com/',callout:'Sehat Selalu',description:'Teman setia di setiap aktivitasmu.',badge:'Best Seller'},
    {id:'003',item:'Sepatu Running Pria',brand:'Nike',category:'Sport & Hobi',shopeeUrl:'https://shopee.co.id/',tiktokUrl:'https://www.tiktok.com/',callout:'Gas Olahraga!',description:'Langkah nyaman, penuh semangat!',badge:'New'},
    {id:'004',item:'iPhone 14 128GB',brand:'Apple',category:'Gadget',shopeeUrl:'https://shopee.co.id/',tiktokUrl:'https://www.tiktok.com/',callout:'Upgrade Yuk!',description:'Desain premium, performa luar biasa.',badge:'Official Store'},
    {id:'005',item:'Castrol Official',brand:'Castrol',category:'Otomotif',shopeeUrl:'https://shopee.co.id/',tiktokUrl:'https://www.tiktok.com/',callout:'Pas Butuh',description:'Performa terbaik untuk kendaraanmu.',badge:'Official Store'},
    {id:'006',item:'Skincare Set',brand:'Wardah',category:'Kecantikan',shopeeUrl:'https://shopee.co.id/',tiktokUrl:'https://www.tiktok.com/',callout:'Auto Glowing',description:'Rawat diri, rayakan versi terbaikmu!',badge:'Best Choice'}
  ];
}

function categoryIcon(c) {
  return ({'Favorit':'♥','Semua':'▦','Fashion':'♧','Rumah Tangga':'⌂','Sport & Hobi':'✚','Otomotif':'▣','Gadget':'▯','Kesehatan':'⊕','Kecantikan':'✿'})[c] || '✦';
}
function badgeIcon(b) {
  return ({'Hot':'♨','Best Seller':'♛','New':'✦','Best Choice':'✧','Official Store':'▣','Semua':'✦'})[b] || '✦';
}
function badgeCss(b) {
  return b === 'Hot' ? 'hot' : b === 'Best Seller' ? 'best' : b === 'New' ? 'new' : b === 'Best Choice' ? 'choice' : b === 'Official Store' ? 'official' : '';
}
function validHttpUrl(url) {
  return /^https:\/\/[^\s]+$/i.test(String(url || '')) ? String(url) : '';
}
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function escapeAttr(v){ return escapeHtml(v); }
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}
