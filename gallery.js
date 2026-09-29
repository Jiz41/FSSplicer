// FSSplicer: アーカイヴ一覧描画
"use strict";

const HORSE_COLOR_HEX = {
  0: "#6b3f2a", // 鹿毛
  1: "#4a2c1c", // 黒鹿毛
  2: "#2e1c14", // 青鹿毛
  3: "#1a1a1a", // 青毛
  4: "#8b4a26", // 栗毛
  5: "#5c3a24", // 栃栗毛
  6: "#a0623a", // 尾花栗毛
  7: "#b8b8b0", // 芦毛
  8: "#e8e0d5", // 白毛
};

function galleryColorHex(horseColor) {
  return HORSE_COLOR_HEX[horseColor] || HORSE_COLOR_HEX[0];
}

function buildGalleryCard(horse) {
  const card = document.createElement("button");
  card.className = "gallery-card";
  card.type = "button";

  const wrap = document.createElement("div");
  wrap.className = "gallery-silhouette-wrap";

  const backdrop = document.createElement("div");
  backdrop.className = "gallery-silhouette-backdrop";
  wrap.appendChild(backdrop);

  const layer = document.createElement("div");
  layer.className = "gallery-silhouette-layer";
  layer.style.backgroundColor = galleryColorHex(horse.horse_color);
  wrap.appendChild(layer);

  const isNew = horse.created_at && (Date.now() - horse.created_at < 6 * 60 * 60 * 1000);
  if (isNew) {
    const ribbon = document.createElement("div");
    ribbon.className = "gallery-new-ribbon";
    const ribbonText = document.createElement("span");
    ribbonText.textContent = "NEW";
    ribbon.appendChild(ribbonText);
    wrap.appendChild(ribbon);
  }

  card.appendChild(wrap);

  const name = document.createElement("div");
  name.className = "gallery-card-name";
  name.textContent = (currentLang() === "en" && horse.name_en) ? horse.name_en : horse.name_jp;
  card.appendChild(name);

  const creator = document.createElement("div");
  creator.className = "gallery-card-creator";
  creator.textContent = "by " + horse.creator_name;
  card.appendChild(creator);

  const ratings = document.createElement("div");
  ratings.className = "gallery-card-ratings";
  if (horse.turf_rating !== null && horse.turf_rating !== undefined) {
    const chip = document.createElement("span");
    chip.className = "gallery-rating-chip";
    chip.textContent = t("detail_turf_label") + horse.turf_rating;
    ratings.appendChild(chip);
  }
  if (horse.dirt_rating !== null && horse.dirt_rating !== undefined) {
    const chip = document.createElement("span");
    chip.className = "gallery-rating-chip";
    chip.textContent = t("detail_dirt_label") + horse.dirt_rating;
    ratings.appendChild(chip);
  }
  if (horse.like_count !== null && horse.like_count !== undefined) {
    const chip = document.createElement("span");
    chip.className = "gallery-rating-chip";
    chip.textContent = "🥕" + horse.like_count;
    ratings.appendChild(chip);
  }
  card.appendChild(ratings);

  card.addEventListener("click", () => {
    location.href = "detail.html?id=" + encodeURIComponent(horse.id);
  });

  return card;
}

function fillGrid(gridId, horses) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = "";
  (horses || []).forEach((horse) => {
    grid.appendChild(buildGalleryCard(horse));
  });
}

function renderGallery(data) {
  const empty = document.getElementById("gallery-empty");
  const sections = document.getElementById("gallery-sections");
  const newHorses = (data && data.new) || [];
  const rankingHorses = (data && data.ranking) || [];

  if (newHorses.length === 0 && rankingHorses.length === 0) {
    if (empty) empty.hidden = false;
    if (sections) sections.hidden = true;
    return;
  }

  if (empty) empty.hidden = true;
  if (sections) sections.hidden = false;
  fillGrid("gallery-grid-new", newHorses);
  fillGrid("gallery-grid-ranking", rankingHorses);
}

let cachedGalleryData = null;

async function loadGallery() {
  try {
    const res = await fetch("/api/horses");
    const data = await res.json();
    cachedGalleryData = data;
    renderGallery(data);
  } catch (err) {
    renderGallery(null);
  }
}

function updateGalleryTitle() {
  document.title = t("gallery_title") + " | FSSplicer";
}

const BROWSE_PAGE_SIZE = 10;
let browseAllHorses = [];
let browseFilteredHorses = [];
let browseCurrentPage = 1;
let browseLoaded = false;

function browseMatches(horse, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const nameField = currentLang() === "en" ? horse.name_en : horse.name_jp;
  const fields = [nameField, horse.creator_name];
  return fields.some((f) => f && String(f).toLowerCase().includes(q));
}

function renderBrowsePagination(totalPages) {
  const pager = document.getElementById("gallery-pagination");
  if (!pager) return;
  if (totalPages <= 1) {
    pager.style.display = "none";
    pager.innerHTML = "";
    return;
  }
  const label = t("gallery_page_indicator")
    .replace("{current}", browseCurrentPage)
    .replace("{total}", totalPages);
  pager.style.display = "flex";
  pager.innerHTML = `
    <button type="button" class="page-btn" data-page="first" ${browseCurrentPage === 1 ? "disabled" : ""}>&laquo;</button>
    <button type="button" class="page-btn" data-page="prev" ${browseCurrentPage === 1 ? "disabled" : ""}>&lsaquo;</button>
    <span class="page-indicator">${label}</span>
    <button type="button" class="page-btn" data-page="next" ${browseCurrentPage === totalPages ? "disabled" : ""}>&rsaquo;</button>
    <button type="button" class="page-btn" data-page="last" ${browseCurrentPage === totalPages ? "disabled" : ""}>&raquo;</button>
  `;
  pager.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.page === "first") browseCurrentPage = 1;
      else if (btn.dataset.page === "prev") browseCurrentPage = Math.max(1, browseCurrentPage - 1);
      else if (btn.dataset.page === "next") browseCurrentPage = Math.min(totalPages, browseCurrentPage + 1);
      else if (btn.dataset.page === "last") browseCurrentPage = totalPages;
      renderBrowseResults();
    });
  });
}

function renderBrowseResults() {
  const grid = document.getElementById("gallery-grid-browse");
  const emptyEl = document.getElementById("gallery-browse-empty");
  if (!grid) return;
  grid.innerHTML = "";

  if (browseFilteredHorses.length === 0) {
    if (emptyEl) emptyEl.hidden = false;
    renderBrowsePagination(0);
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  const totalPages = Math.max(1, Math.ceil(browseFilteredHorses.length / BROWSE_PAGE_SIZE));
  if (browseCurrentPage > totalPages) browseCurrentPage = totalPages;
  if (browseCurrentPage < 1) browseCurrentPage = 1;
  const startIdx = (browseCurrentPage - 1) * BROWSE_PAGE_SIZE;
  const pageItems = browseFilteredHorses.slice(startIdx, startIdx + BROWSE_PAGE_SIZE);

  pageItems.forEach((horse) => {
    grid.appendChild(buildGalleryCard(horse));
  });

  renderBrowsePagination(totalPages);
}

function applyBrowseFilter() {
  const input = document.getElementById("gallery-search-input");
  const query = input ? input.value : "";
  browseFilteredHorses = browseAllHorses.filter((h) => browseMatches(h, query));
  browseCurrentPage = 1;
  renderBrowseResults();
}

async function loadBrowseAll() {
  if (browseLoaded) return;
  try {
    const res = await fetch("/api/horses?browse=1");
    const data = await res.json();
    browseAllHorses = (data && data.items) || [];
    browseLoaded = true;
  } catch (err) {
    browseAllHorses = [];
    browseLoaded = true;
  }
  applyBrowseFilter();
}

function closeBrowseView() {
  const btn = document.getElementById("gallery-browse-all-btn");
  const btnLabel = btn ? btn.querySelector("[data-i18n]") : null;
  const section = document.getElementById("gallery-browse-section");
  const sections = document.getElementById("gallery-sections");
  if (section) section.hidden = true;
  if (sections) sections.hidden = false;
  if (btnLabel) {
    btnLabel.setAttribute("data-i18n", "gallery_browse_all");
    btnLabel.textContent = t("gallery_browse_all");
  }
}

function openBrowseView() {
  const btn = document.getElementById("gallery-browse-all-btn");
  const btnLabel = btn ? btn.querySelector("[data-i18n]") : null;
  const section = document.getElementById("gallery-browse-section");
  const sections = document.getElementById("gallery-sections");
  if (sections) sections.hidden = true;
  if (section) section.hidden = false;
  loadBrowseAll();
  if (btnLabel) {
    btnLabel.setAttribute("data-i18n", "gallery_browse_close");
    btnLabel.textContent = t("gallery_browse_close");
  }
}

function setupBrowseAll() {
  const btn = document.getElementById("gallery-browse-all-btn");
  const section = document.getElementById("gallery-browse-section");
  const backBtn = document.getElementById("gallery-browse-back-btn");
  const searchInput = document.getElementById("gallery-search-input");
  if (!btn || !section) return;

  btn.addEventListener("click", () => {
    if (section.hidden) {
      openBrowseView();
    } else {
      closeBrowseView();
    }
  });

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      closeBrowseView();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyBrowseFilter();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadGallery();
  updateGalleryTitle();
  setupBrowseAll();
  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      updateGalleryTitle();
      if (cachedGalleryData) renderGallery(cachedGalleryData);
      if (browseLoaded) applyBrowseFilter();
    });
  }
});
