const PRODUCTS = [
  {
    id: "p1",
    title: "Hoodie Oversize Unisex",
    brand: "Erigo",
    category: "Fashion",
    description: "Nyaman dipakai, cocok untuk segala aktivitas.",
    badge: "hot",
    badgeLabel: "🔥 Hot",
    callout: "Murce Banget!",
    tone: 0,
    shopeeUrl: "https://shopee.co.id",
    tiktokUrl: "https://tiktok.com"
  },
  {
    id: "p2",
    title: "Castrol Official",
    brand: "Castrol",
    category: "Otomotif",
    description: "Performa terbaik untuk kendaraanmu.",
    badge: "official",
    badgeLabel: "☑ Official Store",
    callout: "Pas Butuh",
    tone: 4,
    shopeeUrl: "https://shopee.co.id",
    tiktokUrl: "https://tiktok.com"
  },
  {
    id: "p3",
    title: "Skincare Set",
    brand: "Wardah",
    category: "Kecantikan",
    description: "Rawat diri, rayakan versi terbaikmu!",
    badge: "best",
    badgeLabel: "✨ Best Choice",
    callout: "Auto Glowing",
    tone: 5,
    shopeeUrl: "https://shopee.co.id",
    tiktokUrl: "https://tiktok.com"
  }
];

const CATEGORIES = ["Semua", "Fashion", "Otomotif", "Kecantikan", "Elektronik", "Rumah Tangga"];
const BADGES = [
  { id: "all", label: "Semua" },
  { id: "hot", label: "🔥 Hot" },
  { id: "best", label: "👑 Best Seller" },
  { id: "official", label: "☑ Official" }
];

let selectedCategory = "Semua";
let selectedBadge = "all";
let searchQuery = "";
let favorites = JSON.parse(localStorage.getItem("uti_favs") || "[]");

const categoryChips = document.getElementById("categoryChips");
const badgeChips = document.getElementById("badgeChips");
const productList = document.getElementById("productList");
const resultCount = document.getElementById("resultCount");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const resetFilters = document.getElementById("resetFilters");
const emptyState = document.getElementById("emptyState");
const emptyReset = document.getElementById("emptyReset");
const toast = document.getElementById("toast");

function init() {
  renderCategoryChips();
  renderBadgeChips();
  renderProducts();
  setupEventListeners();
}

function renderCategoryChips() {
  let html = `<button class="chip ${selectedCategory === 'Favorit' ? 'fav active' : ''}" data-cat="Favorit">♥ Favorit (${favorites.length})</button>`;
  CATEGORIES.forEach(cat => {
    const active = selectedCategory === cat ? "active" : "";
    html += `<button class="chip ${active}" data-cat="${cat}">${cat}</button>`;
  });
  categoryChips.innerHTML = html;
}

function renderBadgeChips() {
  let html = "";
  BADGES.forEach(b => {
    const active = selectedBadge === b.id ? "active" : "";
    html += `<button class="chip badge-chip ${active}" data-badge="${b.id}">${b.label}</button>`;
  });
  badgeChips.innerHTML = html;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function toggleFav(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(item => item !== id);
    showToast("Dihapus dari favorit");
  } else {
    favorites.push(id);
    showToast("Ditambahkan ke favorit ❤️");
  }
  localStorage.setItem("uti_favs", JSON.stringify(favorites));
  renderCategoryChips();
  renderProducts();
}

function renderProducts() {
  let filtered = PRODUCTS.filter(p => {
    if (selectedCategory === "Favorit") {
      if (!favorites.includes(p.id)) return false;
    } else if (selectedCategory !== "Semua" && p.category !== selectedCategory) {
      return false;
    }

    if (selectedBadge !== "all" && p.badge !== selectedBadge) {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchTitle && !matchBrand && !matchCat) return false;
    }

    return true;
  });

  resultCount.textContent = `${filtered.length} produk ditemukan`;

  if (filtered.length === 0) {
    productList.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  let html = "";
  filtered.forEach(p => {
    const isFav = favorites.includes(p.id);
    html += `
      <article class="product-card">
        <div class="callout tone-${p.tone}">
          <span>${p.callout}</span>
        </div>
        <div class="card-main">
          <div class="topline">
            <span class="badge ${p.badge}">${p.badgeLabel}</span>
          </div>
          <h3 class="product-title">${p.title}</h3>
          <div class="brand">${p.brand}</div>
          <span class="category">${p.category}</span>
          <p class="description">${p.description}</p>
          <div class="card-actions">
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${p.id}')">
              ${isFav ? '♥' : '♡'}
            </button>
            <a href="${p.shopeeUrl}" target="_blank" class="store-btn shopee">🛍️ Shopee →</a>
            <a href="${p.tiktokUrl}" target="_blank" class="store-btn tiktok">🎵 TikTok →</a>
          </div>
        </div>
      </article>
    `;
  });

  productList.innerHTML = html;
}

function setupEventListeners() {
  categoryChips.addEventListener("click", e => {
    if (e.target.classList.contains("chip")) {
      selectedCategory = e.target.dataset.cat;
      renderCategoryChips();
      renderProducts();
    }
  });

  badgeChips.addEventListener("click", e => {
    if (e.target.classList.contains("badge-chip")) {
      selectedBadge = e.target.dataset.badge;
      renderBadgeChips();
      renderProducts();
    }
  });

  searchInput.addEventListener("input", e => {
    searchQuery = e.target.value;
    clearSearch.style.display = searchQuery ? "block" : "none";
    renderProducts();
  });

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearch.style.display = "none";
    renderProducts();
  });

  const resetAll = () => {
    selectedCategory = "Semua";
    selectedBadge = "all";
    searchQuery = "";
    searchInput.value = "";
    clearSearch.style.display = "none";
    renderCategoryChips();
    renderBadgeChips();
    renderProducts();
  };

  resetFilters.addEventListener("click", resetAll);
  emptyReset.addEventListener("click", resetAll);

  // Dialog Disclaimer
  const dialog = document.getElementById("disclaimerDialog");
  document.getElementById("disclaimerBtn").addEventListener("click", () => dialog.showModal());
  document.getElementById("closeDisclaimer").addEventListener("click", () => dialog.close());
  document.getElementById("modalOk").addEventListener("click", () => dialog.close());

  document.getElementById("footerCta").addEventListener("click", () => {
    showToast("Menampilkan semua produk pilihan ✨");
    resetAll();
  });
}

document.addEventListener("DOMContentLoaded", init);
