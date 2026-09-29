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
    chip.textContent = "芝" + horse.turf_rating;
    ratings.appendChild(chip);
  }
  if (horse.dirt_rating !== null && horse.dirt_rating !== undefined) {
    const chip = document.createElement("span");
    chip.className = "gallery-rating-chip";
    chip.textContent = "ダ" + horse.dirt_rating;
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

async function loadGallery() {
  try {
    const res = await fetch("/api/horses");
    const data = await res.json();
    renderGallery(data);
  } catch (err) {
    renderGallery(null);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadGallery();
});
