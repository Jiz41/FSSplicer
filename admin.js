// FSSplicer: 管理用ページ ロジック
"use strict";

const ADMIN_KEY_STORAGE = "fssp_admin_key";
let adminKey = "";
let currentTab = "all";

function getStoredKey() {
  try {
    return localStorage.getItem(ADMIN_KEY_STORAGE) || "";
  } catch (err) {
    return "";
  }
}

function setStoredKey(key) {
  try {
    localStorage.setItem(ADMIN_KEY_STORAGE, key);
  } catch (err) {
    // noop
  }
}

function clearStoredKey() {
  try {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
  } catch (err) {
    // noop
  }
}

function showAuthModal(showError) {
  const modal = document.getElementById("admin-auth-modal");
  const errorEl = document.getElementById("admin-auth-error");
  if (modal) modal.classList.remove("hidden");
  if (errorEl) errorEl.hidden = !showError;
}

function hideAuthModal() {
  const modal = document.getElementById("admin-auth-modal");
  if (modal) modal.classList.add("hidden");
}

async function fetchAdminList(flagged) {
  const url = flagged ? "/api/admin/horses?flagged=1" : "/api/admin/horses";
  const res = await fetch(url, {
    headers: { "X-Admin-Key": adminKey },
  });
  if (res.status === 401) {
    throw new Error("unauthorized");
  }
  const data = await res.json();
  return (data && data.items) || [];
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString("ja-JP");
}

function renderList(items, flaggedView) {
  const container = document.getElementById("admin-list-container");
  if (!container) return;
  container.innerHTML = "";

  if (!items || items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "現在対象がありません";
    container.appendChild(empty);
    return;
  }

  const table = document.createElement("table");
  table.className = "admin-table";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const headers = ["馬名", "製作者名", "登録日時"];
  if (flaggedView) headers.push("抵触ワード");
  headers.push("操作");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  items.forEach((horse) => {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    const jp = horse.name_jp || "";
    const en = horse.name_en || "";
    nameTd.textContent = en ? (jp ? `${jp} / ${en}` : en) : jp;
    tr.appendChild(nameTd);

    const creatorTd = document.createElement("td");
    creatorTd.textContent = horse.creator_name || "";
    tr.appendChild(creatorTd);

    const dateTd = document.createElement("td");
    dateTd.textContent = formatDate(horse.created_at);
    tr.appendChild(dateTd);

    if (flaggedView) {
      const flagTd = document.createElement("td");
      flagTd.textContent = horse.ng_flag || "";
      tr.appendChild(flagTd);
    }

    const opTd = document.createElement("td");

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "admin-row-btn";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => handleDelete(horse.id, tr));
    opTd.appendChild(deleteBtn);

    if (flaggedView) {
      const restoreBtn = document.createElement("button");
      restoreBtn.type = "button";
      restoreBtn.className = "admin-row-btn restore";
      restoreBtn.textContent = "公開に戻す";
      restoreBtn.addEventListener("click", () => handleRestore(horse.id, tr));
      opTd.appendChild(restoreBtn);
    }

    tr.appendChild(opTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

async function handleDelete(id, tr) {
  if (!confirm("この馬を削除します。よろしいですか？")) return;
  try {
    const res = await fetch("/api/admin/horses/" + encodeURIComponent(id), {
      method: "DELETE",
      headers: { "X-Admin-Key": adminKey },
    });
    if (res.status === 401) {
      clearStoredKey();
      showAuthModal(true);
      return;
    }
    if (res.ok) {
      tr.remove();
    } else {
      alert("削除に失敗しました");
    }
  } catch (err) {
    alert("削除に失敗しました");
  }
}

async function handleRestore(id, tr) {
  try {
    const res = await fetch("/api/admin/horses/" + encodeURIComponent(id), {
      method: "POST",
      headers: { "X-Admin-Key": adminKey },
    });
    if (res.status === 401) {
      clearStoredKey();
      showAuthModal(true);
      return;
    }
    if (res.ok) {
      tr.remove();
    } else {
      alert("操作に失敗しました");
    }
  } catch (err) {
    alert("操作に失敗しました");
  }
}

async function loadCurrentTab() {
  const flaggedView = currentTab === "flagged";
  try {
    const items = await fetchAdminList(flaggedView);
    renderList(items, flaggedView);
  } catch (err) {
    if (err && err.message === "unauthorized") {
      clearStoredKey();
      showAuthModal(true);
    } else {
      const container = document.getElementById("admin-list-container");
      if (container) container.innerHTML = "<p class=\"admin-empty\">読み込みに失敗しました</p>";
    }
  }
}

function setupTabs() {
  const allBtn = document.getElementById("admin-tab-all");
  const flaggedBtn = document.getElementById("admin-tab-flagged");
  if (!allBtn || !flaggedBtn) return;

  allBtn.addEventListener("click", () => {
    currentTab = "all";
    allBtn.classList.add("active");
    flaggedBtn.classList.remove("active");
    loadCurrentTab();
  });

  flaggedBtn.addEventListener("click", () => {
    currentTab = "flagged";
    flaggedBtn.classList.add("active");
    allBtn.classList.remove("active");
    loadCurrentTab();
  });
}

function setupAuthModal() {
  const submitBtn = document.getElementById("admin-key-submit");
  const input = document.getElementById("admin-key-input");
  if (!submitBtn || !input) return;

  submitBtn.addEventListener("click", async () => {
    const key = input.value.trim();
    if (!key) return;
    adminKey = key;
    try {
      const items = await fetchAdminList(false);
      setStoredKey(key);
      hideAuthModal();
      renderList(items, false);
    } catch (err) {
      showAuthModal(true);
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitBtn.click();
  });
}

async function init() {
  setupTabs();
  setupAuthModal();

  const stored = getStoredKey();
  if (stored) {
    adminKey = stored;
    try {
      const items = await fetchAdminList(false);
      renderList(items, false);
      return;
    } catch (err) {
      clearStoredKey();
      adminKey = "";
    }
  }
  showAuthModal(false);
}

document.addEventListener("DOMContentLoaded", init);
