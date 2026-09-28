// FSSplicer: アーカイヴ詳細ページ
"use strict";

// ---- 毛色→色（gallery.js HORSE_COLOR_HEX/galleryColorHex と同一実装。詳細ページ単独で読めるようここにも定義） ----
const DETAIL_HORSE_COLOR_HEX = {
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
  return DETAIL_HORSE_COLOR_HEX[horseColor] || DETAIL_HORSE_COLOR_HEX[0];
}

// ---- レーダーチャート（FSScreener script.js より移植） ----
const RADAR_AXIS_ORDER = [
  "acceleration", "start_score", "hill_score", "heavy_track_score",
  "health", "consistency", "fighting_spirit", "cornering_score"
];

const DETAIL_RADAR_SIZE = 210;
const DETAIL_RADAR_CX = DETAIL_RADAR_SIZE / 2;
const DETAIL_RADAR_CY = DETAIL_RADAR_SIZE / 2;
const DETAIL_RADAR_R = DETAIL_RADAR_SIZE * 0.29; // RADAR_R/RADAR_SIZE(105/360)と同比率

function radarAxes() {
  return RADAR_AXIS_ORDER.map(key => STAT_AXES.find(a => a.key === key));
}

function buildDetailRadarSVG(horse) {
  const axes = radarAxes();

  const pointAt = (axisIndex, ratio) => {
    const angle = -Math.PI / 2 + axisIndex * (Math.PI / 4);
    return {
      x: DETAIL_RADAR_CX + DETAIL_RADAR_R * ratio * Math.cos(angle),
      y: DETAIL_RADAR_CY + DETAIL_RADAR_R * ratio * Math.sin(angle)
    };
  };

  const polygonPoints = ratioFn => axes
    .map((axis, i) => {
      const p = pointAt(i, ratioFn(axis, i));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  let svg = `<polygon class="radar-base" points="${polygonPoints(() => 1)}"/>`;
  svg += `<polygon class="radar-ring" points="${polygonPoints(() => 1 / 3)}"/>`;
  svg += `<polygon class="radar-ring" points="${polygonPoints(() => 2 / 3)}"/>`;

  axes.forEach((axis, i) => {
    const p = pointAt(i, 1);
    svg += `<line class="radar-spoke" x1="${DETAIL_RADAR_CX}" y1="${DETAIL_RADAR_CY}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}"/>`;
  });

  svg += `<polygon class="radar-value" points="${polygonPoints(axis => {
    const v = horse[axis.key];
    return (typeof v === "number" && !isNaN(v)) ? v : 0;
  })}"/>`;

  axes.forEach((axis, i) => {
    const lp = pointAt(i, 1);
    const lx = DETAIL_RADAR_CX + (lp.x - DETAIL_RADAR_CX) * 1.22;
    const ly = DETAIL_RADAR_CY + (lp.y - DETAIL_RADAR_CY) * 1.22;
    let anchor = "middle";
    if (lx < DETAIL_RADAR_CX - 5) anchor = "end";
    else if (lx > DETAIL_RADAR_CX + 5) anchor = "start";
    const isVerticalEdge = lx >= DETAIL_RADAR_CX - 5 && lx <= DETAIL_RADAR_CX + 5;
    const dy = ly < DETAIL_RADAR_CY - 5 ? -2 : (ly > DETAIL_RADAR_CY + 5 ? 8 : 3);
    const labelText = statAxisLabel(axis);
    const words = labelText.split(" ");
    let textBody;
    if (words.length > 1 && !isVerticalEdge) {
      const lineDy = 9;
      const startDy = ly < DETAIL_RADAR_CY - 5 ? -(lineDy * (words.length - 1)) : 0;
      textBody = words
        .map((w, wi) => `<tspan x="${lx.toFixed(1)}" dy="${wi === 0 ? startDy : lineDy}">${w}</tspan>`)
        .join("");
      svg += `<text class="radar-label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}">${textBody}</text>`;
    } else {
      svg += `<text class="radar-label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dy="${dy}">${labelText}</text>`;
    }
  });

  return `<svg viewBox="0 0 ${DETAIL_RADAR_SIZE} ${DETAIL_RADAR_SIZE}" class="detail-radar">${svg}</svg>`;
}

// ---- 年齢表示（gallery_mockup.html ageText() より移植） ----
function ageText(ageFloat) {
  const years = Math.floor(ageFloat);
  const months = Math.round((ageFloat - years) * 12);
  return years + "歳" + months + "ヶ月";
}

// ---- スライダー表示（gallery_mockup.html sliderRow() を編集不可表示用に移植） ----
function sliderRowHTML(label, value, min, max, lowLabel, highLabel) {
  const ratio = (value - min) / (max - min);
  const pct = ratio * 100;
  const fillLeft = ratio < 0.5 ? pct : 50;
  const fillWidth = Math.abs(pct - 50);
  return '<div class="gallery-detail-stat-row">' +
    '<div class="gallery-detail-stat-label">' + label + '（' + lowLabel + ' - ' + highLabel + '）</div>' +
    '<div class="gallery-detail-slider-track">' +
    '<div class="gallery-detail-slider-fill" style="left:' + fillLeft + '%;width:' + fillWidth + '%;"></div>' +
    '<div class="gallery-detail-slider-dot" style="left:' + pct + '%;"></div>' +
    '</div></div>';
}

// ---- いいねトークン管理 ----
function getLikerToken() {
  let token = localStorage.getItem("fssp_liker_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("fssp_liker_token", token);
  }
  return token;
}

function likedHorseIds() {
  try {
    return JSON.parse(localStorage.getItem("fssp_liked_horses") || "[]");
  } catch (e) {
    return [];
  }
}

function markHorseLiked(horseId) {
  const liked = likedHorseIds();
  if (!liked.includes(horseId)) {
    liked.push(horseId);
    localStorage.setItem("fssp_liked_horses", JSON.stringify(liked));
  }
}

// ---- 描画 ----
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function lineageNodeHTML(entry, isSelf) {
  const label = escapeHtml(entry.name_jp) + "（by " + escapeHtml(entry.creator_name) + "）";
  if (isSelf) {
    return '<div class="gallery-detail-lineage-node is-self">' + label + "</div>";
  }
  return '<a class="gallery-detail-lineage-node" href="detail.html?id=' +
    encodeURIComponent(entry.id) + '">' + label + "</a>";
}

function renderLineage(horse) {
  const container = document.getElementById("detail-lineage-body");
  const parent = horse.parent || null;
  const children = Array.isArray(horse.children) ? horse.children : [];

  if (!parent && children.length === 0) {
    container.innerHTML = '<div class="gallery-detail-lineage-empty">この馬を元にした改変はまだありません</div>';
    return;
  }

  let html = '<div class="gallery-detail-lineage-tree">';
  if (parent) {
    html += lineageNodeHTML(parent, false);
    html += '<div class="gallery-detail-lineage-arrow">&darr; 改変</div>';
  }
  html += lineageNodeHTML({ id: horse.id, name_jp: horse.name_jp, creator_name: horse.creator_name }, true);
  if (children.length) {
    html += '<div class="gallery-detail-lineage-arrow">&darr; 改変</div>';
    children.forEach((c) => {
      html += lineageNodeHTML(c, false);
    });
  }
  html += "</div>";
  container.innerHTML = html;
}

function renderRunningStyle(runningStyleRaw) {
  const container = document.getElementById("detail-running-style");
  container.innerHTML = "";
  const labels = ["逃げ", "先行", "差し", "追込"];
  const values = String(runningStyleRaw || "").split("/").map(v => Number(v));
  let mainIndex = 0;
  let mainValue = -Infinity;
  values.forEach((v, i) => {
    if (!Number.isNaN(v) && v > mainValue) {
      mainValue = v;
      mainIndex = i;
    }
  });
  labels.forEach((label, i) => {
    const chip = document.createElement("span");
    chip.className = "gallery-detail-rs-chip" + (i === mainIndex ? " is-main" : "");
    chip.textContent = label;
    container.appendChild(chip);
  });
}

function renderHorse(horse) {
  document.title = horse.name_jp + " | FSSplicer";
  document.getElementById("detail-name").textContent = horse.name_jp;
  document.getElementById("detail-creator").textContent = "by " + horse.creator_name;

  const silhouette = document.getElementById("detail-silhouette");
  silhouette.style.backgroundColor = galleryColorHex(horse.horse_color);

  document.getElementById("detail-turf").textContent = horse.turf_rating !== null ? horse.turf_rating : "-";
  document.getElementById("detail-dirt").textContent = horse.dirt_rating !== null ? horse.dirt_rating : "-";

  document.getElementById("detail-radar-wrap").innerHTML = buildDetailRadarSVG(horse);

  document.getElementById("detail-distance").textContent =
    (horse.min_distance !== null ? horse.min_distance : "-") + "m - " +
    (horse.max_distance !== null ? horse.max_distance : "-") + "m（得意: " +
    (horse.optimal_distance !== null ? horse.optimal_distance : "-") + "m）";

  renderRunningStyle(horse.running_style);

  renderLineage(horse);

  document.getElementById("detail-slider-physical").innerHTML =
    sliderRowHTML("フィジカル", horse.physical !== null ? horse.physical : 0, 0, 1, "小", "大");
  document.getElementById("detail-slider-direction").innerHTML =
    sliderRowHTML("回り適性", horse.direction_aptitude !== null ? horse.direction_aptitude : 0, -1, 1, "左", "右");
  document.getElementById("detail-slider-pace").innerHTML =
    sliderRowHTML("得意ペース", horse.preferred_pace !== null ? horse.preferred_pace : 0, -1, 1, "遅", "早");

  document.getElementById("detail-age-peak").textContent = horse.peak_age !== null ? ageText(horse.peak_age) : "-";
  document.getElementById("detail-age-retire").textContent = horse.retire_age !== null ? ageText(horse.retire_age) : "-";

  document.getElementById("detail-like-count").textContent = horse.like_count;
  const likeBtn = document.getElementById("detail-like-btn");
  if (likedHorseIds().includes(horse.id)) {
    likeBtn.disabled = true;
    likeBtn.classList.add("is-liked");
  }
  likeBtn.addEventListener("click", async () => {
    if (likeBtn.disabled) return;
    likeBtn.disabled = true;
    try {
      const res = await fetch(`/api/horses/${encodeURIComponent(horse.id)}/like`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liker_token: getLikerToken() }),
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById("detail-like-count").textContent = data.like_count;
        markHorseLiked(horse.id);
        likeBtn.classList.add("is-liked");
      } else {
        likeBtn.disabled = false;
      }
    } catch (e) {
      likeBtn.disabled = false;
    }
  });

  const deleteBtn = document.getElementById("detail-delete-btn");
  const deleteError = document.getElementById("detail-delete-error");
  deleteBtn.addEventListener("click", async () => {
    const password = document.getElementById("detail-delete-password").value;
    if (!password) {
      deleteError.textContent = "パスワードを入力してください";
      deleteError.hidden = false;
      return;
    }
    if (!confirm(horse.name_jp + " を削除します。よろしいですか？")) return;
    deleteBtn.disabled = true;
    try {
      const res = await fetch(`/api/horses/${encodeURIComponent(horse.id)}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ delete_password: password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        location.href = "gallery.html";
      } else {
        deleteError.textContent = data.error || "削除に失敗しました";
        deleteError.hidden = false;
        deleteBtn.disabled = false;
      }
    } catch (e) {
      deleteError.textContent = "削除に失敗しました";
      deleteError.hidden = false;
      deleteBtn.disabled = false;
    }
  });
}

async function loadDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const loading = document.getElementById("gallery-detail-loading");
  const errorEl = document.getElementById("gallery-detail-error");
  const content = document.getElementById("gallery-detail-content");

  if (!id) {
    loading.hidden = true;
    errorEl.hidden = false;
    return;
  }

  try {
    const res = await fetch(`/api/horses/${encodeURIComponent(id)}`);
    if (!res.ok) {
      loading.hidden = true;
      errorEl.hidden = false;
      return;
    }
    const horse = await res.json();
    renderHorse(horse);
    loading.hidden = true;
    content.hidden = false;
  } catch (e) {
    loading.hidden = true;
    errorEl.hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDetail();
});
