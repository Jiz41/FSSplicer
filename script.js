// FSSplicer: 馬データCSV改変ツール
"use strict";

// ---- 列定義（HorseMasterData 78列準拠のヘッダー文字列そのまま） ----
const COLUMN_ORDER = [
  "id", "name_jp", "name_en", "gender", "birth_year", "birth_month", "birth_day",
  "horse_color", "physical", "owner", "main_jockey", "region",
  "turf_rating", "dirt_rating", "min_distance", "max_distance", "optimal_distance",
  "acceleration", "start_score", "cornering_score", "hill_score", "heavy_track_score",
  "fighting_spirit", "consistency", "health",
  "preferred_pace", "direction_aptitude", "running_style", "growth_curve",
  "peak_age", "retire_age",
  "head_mark", "right_front_leg_mark", "left_front_leg_mark", "right_hind_leg_mark", "left_hind_leg_mark",
  "bridle_type", "bridle_color_1", "bridle_color_2", "bridle_design", "bridle_design_color_1", "bridle_design_color_2",
  "bit_type", "bit_guard_type", "bit_guard_color",
  "mask_type", "mask_pattern", "mask_color_1", "mask_color_2",
  "ear_cover_type", "ear_cover_color_1", "ear_cover_color_2",
  "blinker_pacifier_type", "blinker_pacifier_color",
  "shadow_roll_type", "shadow_roll_color",
  "cheek_pieces_type", "cheek_pieces_color",
  "brow_band_type", "brow_band_color",
  "breast_girth_type", "neck_strap_type", "chest_color_1", "chest_color_2", "breast_girth_fur_color",
  "front_bandage_type", "front_bandage_color_1", "front_bandage_color_2",
  "hind_bandage_type", "hind_bandage_color_1", "hind_bandage_color_2",
  "front_mane_type", "back_mane_type", "mane_color_1", "mane_color_2"
];

const GEAR_COLUMNS = COLUMN_ORDER.slice(COLUMN_ORDER.indexOf("head_mark"), COLUMN_ORDER.indexOf("head_mark") + 5);

const STAT_AXES = [
  { key: "acceleration", label: "加速力", label_en: "Acceleration" },
  { key: "start_score", label: "スタート", label_en: "Start" },
  { key: "cornering_score", label: "コーナリング", label_en: "Cornering" },
  { key: "hill_score", label: "坂", label_en: "Hill" },
  { key: "heavy_track_score", label: "重馬場", label_en: "Heavy Track" },
  { key: "fighting_spirit", label: "闘争心", label_en: "Fighting Spirit" },
  { key: "consistency", label: "安定感", label_en: "Consistency" },
  { key: "health", label: "健康", label_en: "Health" }
];

const GEAR_LABELS_JP = {
  head_mark: "頭絡マーク", right_front_leg_mark: "右前脚マーク", left_front_leg_mark: "左前脚マーク",
  right_hind_leg_mark: "右後脚マーク", left_hind_leg_mark: "左後脚マーク",
  bridle_type: "頭絡タイプ", bridle_color_1: "頭絡色1", bridle_color_2: "頭絡色2",
  bridle_design: "頭絡デザイン", bridle_design_color_1: "頭絡デザイン色1", bridle_design_color_2: "頭絡デザイン色2",
  bit_type: "ハミタイプ", bit_guard_type: "ハミガードタイプ", bit_guard_color: "ハミガード色",
  mask_type: "マスクタイプ", mask_pattern: "マスク柄", mask_color_1: "マスク色1", mask_color_2: "マスク色2",
  ear_cover_type: "イヤーカバータイプ", ear_cover_color_1: "イヤーカバー色1", ear_cover_color_2: "イヤーカバー色2",
  blinker_pacifier_type: "ブリンカー/パシファイアタイプ", blinker_pacifier_color: "ブリンカー/パシファイア色",
  shadow_roll_type: "シャドーロールタイプ", shadow_roll_color: "シャドーロール色",
  cheek_pieces_type: "チークピースタイプ", cheek_pieces_color: "チークピース色",
  brow_band_type: "ブローバンドタイプ", brow_band_color: "ブローバンド色",
  breast_girth_type: "胸繋タイプ", neck_strap_type: "ネックストラップタイプ",
  chest_color_1: "胸繋色1", chest_color_2: "胸繋色2", breast_girth_fur_color: "胸繋ファー色",
  front_bandage_type: "前肢バンテージタイプ", front_bandage_color_1: "前肢バンテージ色1", front_bandage_color_2: "前肢バンテージ色2",
  hind_bandage_type: "後肢バンテージタイプ", hind_bandage_color_1: "後肢バンテージ色1", hind_bandage_color_2: "後肢バンテージ色2",
  front_mane_type: "前髪タイプ", back_mane_type: "後髪タイプ",
  mane_color_1: "たてがみ色1", mane_color_2: "たてがみ色2"
};

const GEAR_LABELS_EN = {
  head_mark: "Head Mark", right_front_leg_mark: "Right Front Leg Mark", left_front_leg_mark: "Left Front Leg Mark",
  right_hind_leg_mark: "Right Hind Leg Mark", left_hind_leg_mark: "Left Hind Leg Mark",
  bridle_type: "Bridle Type", bridle_color_1: "Bridle Color 1", bridle_color_2: "Bridle Color 2",
  bridle_design: "Bridle Design", bridle_design_color_1: "Bridle Design Color 1", bridle_design_color_2: "Bridle Design Color 2",
  bit_type: "Bit Type", bit_guard_type: "Bit Guard Type", bit_guard_color: "Bit Guard Color",
  mask_type: "Mask Type", mask_pattern: "Mask Pattern", mask_color_1: "Mask Color 1", mask_color_2: "Mask Color 2",
  ear_cover_type: "Ear Cover Type", ear_cover_color_1: "Ear Cover Color 1", ear_cover_color_2: "Ear Cover Color 2",
  blinker_pacifier_type: "Blinker/Pacifier Type", blinker_pacifier_color: "Blinker/Pacifier Color",
  shadow_roll_type: "Shadow Roll Type", shadow_roll_color: "Shadow Roll Color",
  cheek_pieces_type: "Cheek Pieces Type", cheek_pieces_color: "Cheek Pieces Color",
  brow_band_type: "Brow Band Type", brow_band_color: "Brow Band Color",
  breast_girth_type: "Breast Girth Type", neck_strap_type: "Neck Strap Type",
  chest_color_1: "Chest Color 1", chest_color_2: "Chest Color 2", breast_girth_fur_color: "Breast Girth Fur Color",
  front_bandage_type: "Front Bandage Type", front_bandage_color_1: "Front Bandage Color 1", front_bandage_color_2: "Front Bandage Color 2",
  hind_bandage_type: "Hind Bandage Type", hind_bandage_color_1: "Hind Bandage Color 1", hind_bandage_color_2: "Hind Bandage Color 2",
  front_mane_type: "Front Mane Type", back_mane_type: "Back Mane Type",
  mane_color_1: "Mane Color 1", mane_color_2: "Mane Color 2"
};

// ---- i18n辞書（基本ラベル） ----
const I18N = {
  ja: {
    subtitle: "Full Stride 馬データ改変ツール",
    tab_input: "馬データ入力",
    tab_parse: "解析",
    btn_share_copy: "Xシェア用にコピー",
    x_share_summary: "Xで共有する",
    x_share_step1: "①下のテンプレをコピーしてポスト",
    x_share_step2: "②投稿したツイートにリプライ（スレッドで繋げる）して、以下をコピペ",
    btn_x_template_copy: "Xテンプレをコピー",
    x_template_fallback_name: "新しい馬",
    share_copy_success: "|区切りでコピーしました",
    share_copy_failed: "コピーに失敗しました",
    share_copy_empty: "先にCSVを生成してください",
    section_parse: "|区切りをタブ区切りに変換",
    hint_parse: "Xで共有された|区切りの文字列を貼り付けて「解析」を押すと、Sheetsにそのまま貼り付けられるタブ区切りに変換します",
    btn_parse_run: "解析",
    parse_empty: "貼り付け内容が空です",
    parse_success: "変換しました",
    section_source: "元の馬データを読み込む",
    hint_source: "シートの行をID列から丸ごとコピーして貼り付け、読み込むボタンを押すと未編集の項目は元の馬の値のまま出力されます",
    hint_gear_tack_ingame: "馬具（頭絡・ハミ・マスク等）とたてがみは、CSV貼り付け後にゲーム内で直接編集してください",
    btn_load_source: "読み込む",
    load_source_empty: "貼り付け内容が空です",
    load_source_mismatch: "列数が一致しません（{n}列検出、75列または74列が必要）",
    load_source_success: "元データを読み込みました。編集したい項目だけ変更してください",
    section_basic: "基本情報",
    section_stats: "能力値",
    section_gear: "顔・脚マーク",
    section_output: "CSV出力",
    label_id: "ID",
    label_name_jp: "馬名（日本語）",
    label_name_en: "馬名（英語）",
    label_gender: "性別",
    gender_0: "牡", gender_1: "牝", gender_2: "セン",
    label_birth_year: "生年", label_birth_month: "生月", label_birth_day: "生日",
    label_horse_color: "毛色",
    color_0: "鹿毛", color_1: "黒鹿毛", color_2: "青鹿毛", color_3: "青毛", color_4: "栗毛",
    color_5: "栃栗毛", color_6: "尾花栗毛", color_7: "芦毛", color_8: "白毛",
    label_physical: "フィジカル（0〜1）",
    label_owner: "馬主（固定値）",
    label_main_jockey: "主戦騎手（固定値）",
    label_region: "地域（固定値）",
    label_turf_rating: "芝レーティング",
    label_dirt_rating: "ダートレーティング",
    label_min_distance: "距離適性（下限）(m)",
    label_max_distance: "距離適性（上限）(m)",
    label_optimal_distance: "得意距離(m)",
    label_preferred_pace: "得意ペース（-1〜1）",
    label_direction_aptitude: "回り適性（-1〜1）",
    label_running_style: "脚質",
    running_style_0_label: "逃げ",
    running_style_1_label: "先行",
    running_style_2_label: "差し",
    running_style_3_label: "追込",
    hint_running_style: "メイン脚質は1、サブ脚質は0.5〜0.7を推奨",
    label_growth_curve: "成長タイプ",
    growth_prodigy: "天才", growth_early: "早熟", growth_normal: "普通", growth_late: "晩成",
    label_peak_age: "ピーク年齢",
    label_retire_age: "引退年齢",
    hint_age_decimal: "小数点は年内の経過月数を表します（例：0.5＝約6ヶ月＝6月ごろ、0.92＝約11ヶ月＝年末ごろ）",
    howto_summary: "使い方",
    howto_1: "改変したい馬のID列の値を「元の馬データを読み込む」に貼り付け、読み込むボタンを押します（未編集の項目は元の馬の値のまま出力されます）",
    howto_2: "基本情報・能力値（8軸）を好きな値に変更します。毛色は下のサンプル画像をタップしても選べます",
    howto_3: "馬具（頭絡・ハミ・マスク等）とたてがみは、ゲーム内で見ながら直接編集してください。このツールでは顔・脚マークのみ数値で指定できます（脚マークは見本画像の番号が目安です）",
    howto_4: "「CSVを生成」を押すとタブ区切りのCSVができ、Sheetsにそのまま貼り付けられます",
    howto_5: "Xで共有したい場合は「Xで共有する」を開き、①テンプレをコピーして投稿→②その投稿にリプライ（スレッド）して、以下でコピーした｜区切りのCSVを貼り付けてください",
    howto_6: "Xで共有された｜区切りの文字列を受け取ったら、「解析」タブに貼り付けて「解析」を押すとタブ区切りに戻り、そのままSheetsに貼り付けられます",
    btn_generate: "CSVを生成",
    btn_copy: "クリップボードにコピー",
    related_hub: "FULL STRIDE 非公式ツール集はこちら",
    footer_unofficial: "本ツールはファンによる非公式データ改変ツールです。",
    footer_trademark_pre: "『FULL STRIDE』の名称は、",
    footer_trademark_post: "の商標または登録商標です。",
    alert_required: "馬名（日本語）・馬名（英語）は必須です。",
    copy_success: "コピーしました",
    copy_failed: "コピーに失敗しました",
    color_sample_note: "タップで選択できます（画像の著作権はBlue Bullet社に帰属します）",
    leg_sample_note: "番号は各脚マークの値に対応します（4本まとめて変更した際の見た目です。画像の著作権はBlue Bullet社に帰属します）",
    head_mark_legend_summary: "頭絡マーク見本を表示",
    head_sample_note: "番号は頭絡マークの値に対応します（画像の著作権はBlue Bullet社に帰属します）",
    head_source_link: "本表はBlue Bullet株式会社が公開する資料「Full Stride Horse Edit Reference」を参照しています",
    install_guide_title: "ホーム画面に追加",
    install_guide_ios: "共有ボタン（□に↑のアイコン）をタップ→「ホーム画面に追加」を選ぶと、アプリのように使えます",
    changelog_summary: "更新履歴",
    accordion_hint: "（タップで開閉）"
  },
  en: {
    subtitle: "Full Stride horse data editing tool (unofficial fan tool)",
    tab_input: "Horse Data Input",
    tab_parse: "Parse",
    btn_share_copy: "Copy for X Sharing",
    x_share_summary: "Share on X",
    x_share_step1: "① Copy the template below and post it",
    x_share_step2: "② Reply to that post (as a thread) and paste the following",
    btn_x_template_copy: "Copy X Template",
    x_template_fallback_name: "a new horse",
    share_copy_success: "Copied with | separators",
    share_copy_failed: "Copy failed",
    share_copy_empty: "Generate the CSV first",
    section_parse: "Convert | separators to tabs",
    hint_parse: "Paste a |-separated string shared on X and press Parse to convert it into tab-separated text ready to paste into Sheets",
    btn_parse_run: "Parse",
    parse_empty: "Pasted content is empty",
    parse_success: "Converted",
    section_source: "Load Source Horse Data",
    hint_source: "Copy an entire row from the sheet (including the ID column) and paste it, then press Load. Unedited fields will be output using the original horse's values.",
    hint_gear_tack_ingame: "Please edit tack (bridle, bit, mask, etc.) and mane directly in-game after pasting the CSV.",
    btn_load_source: "Load",
    load_source_empty: "Pasted content is empty",
    load_source_mismatch: "Column count mismatch ({n} columns detected, expected 75 or 74)",
    load_source_success: "Source data loaded. Only change the fields you want to edit",
    section_basic: "Basic Info",
    section_stats: "Stats",
    section_gear: "Face & Leg Marks",
    section_output: "CSV Output",
    label_id: "ID",
    label_name_jp: "Name (Japanese)",
    label_name_en: "Name (English)",
    label_gender: "Gender",
    gender_0: "Male", gender_1: "Female", gender_2: "Gelding",
    label_birth_year: "Birth Year", label_birth_month: "Birth Month", label_birth_day: "Birth Day",
    label_horse_color: "Coat Color",
    color_0: "Bay", color_1: "Dark Bay", color_2: "Brown", color_3: "Black", color_4: "Chestnut",
    color_5: "Liver Chestnut", color_6: "Flaxen Chestnut", color_7: "Gray", color_8: "White",
    label_physical: "Physical (0-1)",
    label_owner: "Owner (fixed)",
    label_main_jockey: "Main Jockey (fixed)",
    label_region: "Region (fixed)",
    label_turf_rating: "Turf Rating",
    label_dirt_rating: "Dirt Rating",
    label_min_distance: "Distance Aptitude (Min, m)",
    label_max_distance: "Distance Aptitude (Max, m)",
    label_optimal_distance: "Optimal Distance (m)",
    label_preferred_pace: "Preferred Pace (-1 to 1)",
    label_direction_aptitude: "Direction Aptitude (-1 to 1)",
    label_running_style: "Running Style",
    running_style_0_label: "Front Runner",
    running_style_1_label: "Stalker",
    running_style_2_label: "Chaser",
    running_style_3_label: "Closer",
    hint_running_style: "Recommended: 1 for main running style, 0.5-0.7 for sub styles",
    label_growth_curve: "Growth Type",
    growth_prodigy: "Prodigy", growth_early: "Early Bloomer", growth_normal: "Normal", growth_late: "Late Bloomer",
    label_peak_age: "Peak Age",
    label_retire_age: "Retire Age",
    hint_age_decimal: "The decimal represents elapsed months within the year (e.g. 0.5 ≈ 6 months, around June; 0.92 ≈ 11 months, around year-end).",
    howto_summary: "How to use",
    howto_1: "Paste the horse's ID into \"Load source horse data\" and press Load (unedited fields keep the original horse's values)",
    howto_2: "Edit the basic info and the 8 stat values as you like. You can also tap a sample image below to pick a coat color",
    howto_3: "Please edit tack (bridle, bit, mask, etc.) and mane directly in-game while looking at them. This tool only lets you set numeric values for face/leg marks (use the leg mark sample numbers as a guide)",
    howto_4: "Press \"Generate CSV\" to get a tab-separated CSV ready to paste into Sheets",
    howto_5: "To share on X, open \"Share on X\": ① copy the template and post it, then ② reply to that post (as a thread) and paste the |-separated CSV you copied below",
    howto_6: "Got a |-separated string shared on X? Paste it in the \"Parse\" tab and press Parse to convert it back to tab-separated text for Sheets",
    btn_generate: "Generate CSV",
    btn_copy: "Copy to Clipboard",
    related_hub: "See all FULL STRIDE fan tools",
    footer_unofficial: "This is an unofficial fan-made data editing tool.",
    footer_trademark_pre: "\"FULL STRIDE\" is a trademark or registered trademark of ",
    footer_trademark_post: ".",
    alert_required: "Name (Japanese) and Name (English) are required.",
    copy_success: "Copied",
    copy_failed: "Copy failed",
    color_sample_note: "Tap to select (images © Blue Bullet Inc.)",
    leg_sample_note: "Numbers correspond to each leg mark's value (shown as all four legs changed together. Images © Blue Bullet Inc.)",
    head_mark_legend_summary: "Show Head Mark Samples",
    head_sample_note: "Numbers correspond to each head mark's value (Images © Blue Bullet Inc.)",
    head_source_link: "This table references material \"Full Stride Horse Edit Reference\" published by Blue Bullet Inc.",
    install_guide_title: "Add to Home Screen",
    install_guide_ios: "Tap the Share button (square with an up arrow), then choose \"Add to Home Screen\" to use this like an app.",
    changelog_summary: "Update Log",
    accordion_hint: "(Tap to expand)"
  }
};

const HORSE_COLOR_SAMPLES = [
  { value: "0", file: "kage" },
  { value: "1", file: "kurokage" },
  { value: "2", file: "aokage" },
  { value: "3", file: "aoge" },
  { value: "4", file: "kurige" },
  { value: "5", file: "tochikurige" },
  { value: "6", file: "obanakurige" },
  { value: "7", file: "ashige" },
  { value: "8", file: "shiroge" }
];

const LEG_MARK_SAMPLES = [
  { value: "0", file: "leg0" },
  { value: "1", file: "leg1" },
  { value: "2", file: "leg2" },
  { value: "3", file: "leg3" },
  { value: "4", file: "leg4" },
  { value: "5", file: "leg5" }
];

const LEG_MARK_KEYS = ["right_front_leg_mark", "left_front_leg_mark", "right_hind_leg_mark", "left_hind_leg_mark"];

const HEAD_MARK_SAMPLES = Array.from({ length: 50 }, (_, i) => ({ value: String(i), file: "head" + i }));

function buildColorSampleStrip() {
  const row = document.getElementById("color-sample-row");
  const select = document.getElementById("horse_color");
  if (!row || !select) return;

  HORSE_COLOR_SAMPLES.forEach((sample) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-sample-btn";
    btn.dataset.value = sample.value;

    const img = document.createElement("img");
    img.src = "assets/reference/horse_color/" + sample.file + ".webp";
    img.alt = "";
    img.loading = "lazy";

    const credit = document.createElement("span");
    credit.className = "color-sample-credit";
    credit.textContent = "©BLUE BULLET";

    const wrap = document.createElement("span");
    wrap.className = "color-sample-imgwrap";
    wrap.appendChild(img);
    wrap.appendChild(credit);

    btn.appendChild(wrap);
    btn.addEventListener("click", () => {
      select.value = sample.value;
      row.querySelectorAll(".color-sample-btn").forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
    });

    row.appendChild(btn);
  });

  select.addEventListener("change", () => {
    row.querySelectorAll(".color-sample-btn").forEach((b) => {
      b.classList.toggle("is-selected", b.dataset.value === select.value);
    });
  });
}

function currentLang() {
  return document.documentElement.getAttribute("data-lang") || "ja";
}

function t(key) {
  const lang = currentLang();
  return (I18N[lang] && I18N[lang][key] !== undefined) ? I18N[lang][key] : (I18N.ja[key] || "");
}

function gearLabelFor(key) {
  const lang = currentLang();
  return lang === "en" ? GEAR_LABELS_EN[key] : GEAR_LABELS_JP[key];
}

function statAxisLabel(axis) {
  const lang = currentLang();
  return lang === "en" ? axis.label_en : axis.label;
}

// ---- 能力値スライダーの構築 ----
function buildStatGrid() {
  const grid = document.getElementById("stat-grid");
  grid.innerHTML = "";
  STAT_AXES.forEach(axis => {
    const row = document.createElement("div");
    row.className = "stat-row";

    const label = document.createElement("label");
    label.setAttribute("for", axis.key + "_range");
    label.textContent = statAxisLabel(axis);
    row.appendChild(label);

    const controls = document.createElement("div");
    controls.className = "stat-row-controls";

    const range = document.createElement("input");
    range.type = "range";
    range.id = axis.key + "_range";
    range.min = "0";
    range.max = "1";
    range.step = "0.01";
    range.value = "0";

    const num = document.createElement("input");
    num.type = "number";
    num.id = axis.key;
    num.min = "0";
    num.max = "1";
    num.step = "0.01";
    num.value = "0";

    range.addEventListener("input", () => { num.value = range.value; });
    num.addEventListener("input", () => { range.value = num.value; });

    controls.appendChild(range);
    controls.appendChild(num);
    row.appendChild(controls);
    grid.appendChild(row);
  });
}

// ---- 馬具グリッドの構築 ----
function buildGearGrid() {
  const grid = document.getElementById("gear-grid");
  grid.innerHTML = "";
  GEAR_COLUMNS.forEach(key => {
    const field = document.createElement("div");
    field.className = "gear-field";

    const label = document.createElement("label");
    label.setAttribute("for", key);
    label.textContent = gearLabelFor(key) + " / " + key;

    const input = document.createElement("input");
    input.type = "number";
    input.id = key;
    input.step = "1";
    input.value = "0";

    field.appendChild(label);
    field.appendChild(input);
    grid.appendChild(field);

    if (key === "head_mark") {
      grid.appendChild(buildHeadMarkLegend());
      grid.appendChild(buildLegMarkLegend());
    }
  });

}

function buildLegMarkLegend() {
  const wrap = document.createElement("div");
  wrap.className = "color-sample-strip";

  const note = document.createElement("p");
  note.className = "color-sample-note";
  note.setAttribute("data-i18n", "leg_sample_note");
  note.textContent = t("leg_sample_note");

  const row = document.createElement("div");
  row.className = "color-sample-row";

  LEG_MARK_SAMPLES.forEach((sample) => {
    const item = document.createElement("div");
    item.className = "color-sample-legend-item";

    const imgWrap = document.createElement("span");
    imgWrap.className = "color-sample-imgwrap";

    const img = document.createElement("img");
    img.src = "assets/reference/leg_mark/" + sample.file + ".webp";
    img.alt = "";
    img.loading = "lazy";

    const credit = document.createElement("span");
    credit.className = "color-sample-credit";
    credit.textContent = "©BLUE BULLET";

    imgWrap.appendChild(img);
    imgWrap.appendChild(credit);

    const num = document.createElement("span");
    num.className = "color-sample-legend-num";
    num.textContent = sample.value;

    item.appendChild(imgWrap);
    item.appendChild(num);
    row.appendChild(item);
  });

  wrap.appendChild(note);
  wrap.appendChild(row);
  return wrap;
}

function buildHeadMarkLegend() {
  const details = document.createElement("details");
  details.className = "usage-details head-mark-legend-details";

  const summary = document.createElement("summary");
  summary.setAttribute("data-i18n", "head_mark_legend_summary");
  summary.textContent = t("head_mark_legend_summary");
  details.appendChild(summary);

  const wrap = document.createElement("div");
  wrap.className = "color-sample-strip";

  const note = document.createElement("p");
  note.className = "color-sample-note";
  note.setAttribute("data-i18n", "head_sample_note");
  note.textContent = t("head_sample_note");

  const row = document.createElement("div");
  row.className = "color-sample-grid";

  HEAD_MARK_SAMPLES.forEach((sample) => {
    const item = document.createElement("div");
    item.className = "color-sample-legend-item";

    const imgWrap = document.createElement("span");
    imgWrap.className = "color-sample-imgwrap";

    const img = document.createElement("img");
    img.src = "assets/reference/head_mark/" + sample.file + ".webp";
    img.alt = "";
    img.loading = "lazy";

    const credit = document.createElement("span");
    credit.className = "color-sample-credit";
    credit.textContent = "©BLUE BULLET";

    imgWrap.appendChild(img);
    imgWrap.appendChild(credit);

    item.appendChild(imgWrap);
    row.appendChild(item);
  });

  const sourceLink = document.createElement("a");
  sourceLink.href = "https://docs.google.com/presentation/d/1nASJ09HOYHABJ_1u1Tx5P3WaJmeGLipmWdi4t_2AjFg/edit?usp=sharing";
  sourceLink.target = "_blank";
  sourceLink.rel = "noopener noreferrer";
  sourceLink.className = "color-sample-source-link";
  sourceLink.setAttribute("data-i18n", "head_source_link");
  sourceLink.textContent = t("head_source_link");

  wrap.appendChild(note);
  wrap.appendChild(row);
  wrap.appendChild(sourceLink);
  details.appendChild(wrap);
  return details;
}

function buildMarkSampleStrip(targetInputs, samples, basePath, noteKey) {
  const strip = document.createElement("div");
  strip.className = "color-sample-strip";

  const key = noteKey || "color_sample_note";
  const note = document.createElement("p");
  note.className = "color-sample-note";
  note.setAttribute("data-i18n", key);
  note.textContent = t(key);

  const row = document.createElement("div");
  row.className = "color-sample-row";

  samples.forEach((sample) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-sample-btn";
    btn.dataset.value = sample.value;

    const img = document.createElement("img");
    img.src = basePath + sample.file + ".webp";
    img.alt = "";
    img.loading = "lazy";

    const credit = document.createElement("span");
    credit.className = "color-sample-credit";
    credit.textContent = "©BLUE BULLET";

    const wrap = document.createElement("span");
    wrap.className = "color-sample-imgwrap";
    wrap.appendChild(img);
    wrap.appendChild(credit);

    btn.appendChild(wrap);
    btn.addEventListener("click", () => {
      targetInputs.forEach((el) => { if (el) el.value = sample.value; });
      row.querySelectorAll(".color-sample-btn").forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
    });

    row.appendChild(btn);
  });

  strip.appendChild(note);
  strip.appendChild(row);
  return strip;
}

// ---- 言語切り替え ----
function applyLanguage(lang) {
  document.documentElement.setAttribute("data-lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  buildStatGrid();
  buildGearGrid();
  renderChangelog();
}

function setupLangToggle() {
  const root = document.documentElement;
  const btn = document.getElementById("lang-toggle");

  function updateLabel() {
    const lang = root.getAttribute("data-lang") || "ja";
    btn.textContent = lang === "ja" ? "ENG" : "JPN";
  }

  btn.addEventListener("click", () => {
    const current = root.getAttribute("data-lang") || "ja";
    const next = current === "ja" ? "en" : "ja";
    applyLanguage(next);
    updateLabel();
  });

  updateLabel();
}

// ---- 元馬データの読み込み（スキップ列を元馬の値で埋めるため） ----
let sourceRowValues = {};

function setupLoadSource() {
  const btn = document.getElementById("load-source-btn");
  const input = document.getElementById("source-input");
  const status = document.getElementById("load-source-status");

  btn.addEventListener("click", () => {
    const raw = input.value.trim();
    if (!raw) {
      status.textContent = t("load_source_empty");
      return;
    }
    const fields = raw.split("\t");
    let cols;
    if (fields.length === COLUMN_ORDER.length) {
      cols = COLUMN_ORDER;
    } else if (fields.length === COLUMN_ORDER.length - 1) {
      cols = COLUMN_ORDER.filter(c => c !== "id");
    } else {
      status.textContent = t("load_source_mismatch").replace("{n}", fields.length);
      return;
    }

    sourceRowValues = {};
    cols.forEach((col, i) => { sourceRowValues[col] = fields[i]; });

    COLUMN_ORDER.forEach(col => {
      if (col === "id" || col === "running_style" || sourceRowValues[col] === undefined) return;
      const el = document.getElementById(col);
      if (el) el.value = sourceRowValues[col];
      const rangeEl = document.getElementById(col + "_range");
      if (rangeEl) rangeEl.value = sourceRowValues[col];
    });
    if (sourceRowValues.running_style !== undefined) {
      const parts = sourceRowValues.running_style.split("/");
      [0, 1, 2, 3].forEach(i => {
        const el = document.getElementById("running_style_" + i);
        if (el && parts[i] !== undefined) el.value = parts[i];
      });
    }

    status.textContent = t("load_source_success");
  });
}

// ---- 行データ生成（タブ区切り。Google Sheetsへの直接貼り付けで自動列分割させるため） ----
function collectValue(column) {
  if (column === "running_style") {
    const parts = [0, 1, 2, 3].map(i => {
      const el = document.getElementById("running_style_" + i);
      return el ? el.value : "0";
    });
    return parts.join("/");
  }
  const el = document.getElementById(column);
  if (el) return el.value;
  return sourceRowValues[column] !== undefined ? sourceRowValues[column] : "";
}

function generateCsvRow() {
  return COLUMN_ORDER.filter(col => col !== "id").map(col => collectValue(col)).join("\t");
}

function setupGenerate() {
  const btn = document.getElementById("generate-btn");
  const output = document.getElementById("csv-output");

  btn.addEventListener("click", () => {
    const nameJp = document.getElementById("name_jp").value.trim();
    const nameEn = document.getElementById("name_en").value.trim();

    if (!nameJp || !nameEn) {
      alert(t("alert_required"));
      return;
    }

    output.value = generateCsvRow();
    btn.classList.add("fss-pulse");
    setTimeout(() => btn.classList.remove("fss-pulse"), 600);
  });
}

function setupCopy() {
  const btn = document.getElementById("copy-btn");
  const output = document.getElementById("csv-output");
  const status = document.getElementById("copy-status");

  btn.addEventListener("click", async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = t("copy_success");
      status.classList.add("fss-copy-flash");
      setTimeout(() => status.classList.remove("fss-copy-flash"), 600);
    } catch (e) {
      status.textContent = t("copy_failed");
    }
  });
}

// ---- Xシェア用コピー(タブを|に置換) ----
function setupShareCopy() {
  const btn = document.getElementById("share-copy-btn");
  const output = document.getElementById("csv-output");
  const status = document.getElementById("copy-status");

  btn.addEventListener("click", async () => {
    if (!output.value) {
      status.textContent = t("share_copy_empty");
      return;
    }
    try {
      await navigator.clipboard.writeText(output.value.split("\t").join("|"));
      status.textContent = t("share_copy_success");
    } catch (e) {
      status.textContent = t("share_copy_failed");
    }
  });
}

// ---- Xテンプレプレビューの更新 ----
function buildXTemplateText() {
  const lang = currentLang();
  const nameEl = document.getElementById(lang === "en" ? "name_en" : "name_jp");
  const horseName = (nameEl && nameEl.value.trim()) || t("x_template_fallback_name");
  const url = "https://fssplicer.pages.dev/";
  if (lang === "en") {
    return `I made ${horseName} on FSSplicer\nConvert it to CSV at ${url}\n#FSSplicer`;
  }
  return `FSSplicerで${horseName}を作ってみました\n${url}でCSVに変換出来ます\n#FSSplicer`;
}

// ---- Xテンプレコピー ----
function setupXTemplateCopy() {
  const btn = document.getElementById("x-template-copy-btn");
  const preview = document.getElementById("x-template-preview");
  const status = document.getElementById("x-template-copy-status");
  const details = document.getElementById("x-share-guide");

  details.addEventListener("toggle", () => {
    if (details.open) {
      preview.value = buildXTemplateText();
    }
  });

  btn.addEventListener("click", async () => {
    preview.value = buildXTemplateText();
    try {
      await navigator.clipboard.writeText(preview.value);
      status.textContent = t("share_copy_success");
    } catch (e) {
      status.textContent = t("share_copy_failed");
    }
  });
}

// ---- アコーディオン内のXシェア用コピー(既存ロジックを新ボタンに再配線) ----
function setupXShareCopyInner() {
  const btn = document.getElementById("x-share-copy-btn-inner");
  const output = document.getElementById("csv-output");
  const status = document.getElementById("x-share-copy-status");

  btn.addEventListener("click", async () => {
    if (!output.value) {
      status.textContent = t("share_copy_empty");
      return;
    }
    try {
      await navigator.clipboard.writeText(output.value.split("\t").join("|"));
      status.textContent = t("share_copy_success");
    } catch (e) {
      status.textContent = t("share_copy_failed");
    }
  });
}

// ---- 解析パネル(|区切り→タブ区切り変換) ----
function setupParsePanel() {
  const input = document.getElementById("parse-input");
  const btn = document.getElementById("parse-btn");
  const output = document.getElementById("parse-output");
  const status = document.getElementById("parse-status");
  const copyBtn = document.getElementById("parse-copy-btn");

  btn.addEventListener("click", () => {
    const raw = input.value.trim();
    if (!raw) {
      status.textContent = t("parse_empty");
      return;
    }
    output.value = raw.split("|").join("\t");
    status.textContent = t("parse_success");
  });

  copyBtn.addEventListener("click", async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = t("copy_success");
    } catch (e) {
      status.textContent = t("copy_failed");
    }
  });
}

// ---- タブ切り替え ----
function switchTab(tab) {
  const isParse = tab === "parse";
  document.getElementById("input-panel").style.display = isParse ? "none" : "";
  document.getElementById("parse-panel").style.display = isParse ? "" : "none";
  document.getElementById("tab-btn-input").classList.toggle("active", !isParse);
  document.getElementById("tab-btn-parse").classList.toggle("active", isParse);
}

function setupTabs() {
  document.querySelectorAll("#tab-bar .tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

// ---- PWAインストール ----
let deferredPrompt = null;

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isStandalone() {
  return window.navigator.standalone === true;
}

function showInstallButton() {
  const btn = document.getElementById("install-btn");
  if (btn) btn.style.display = "";
}

function hideInstallButton() {
  const btn = document.getElementById("install-btn");
  if (btn) btn.style.display = "none";
}

function showInstallModal() {
  const modal = document.getElementById("install-modal");
  if (modal) modal.classList.remove("hidden");
}

function hideInstallModal() {
  const modal = document.getElementById("install-modal");
  if (modal) modal.classList.add("hidden");
}

function setupInstallButton() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    hideInstallButton();
    deferredPrompt = null;
  });

  if (isIOSDevice() && !isStandalone()) {
    showInstallButton();
  }

  const btn = document.getElementById("install-btn");
  btn.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      hideInstallButton();
    } else if (isIOSDevice() && !isStandalone()) {
      showInstallModal();
    }
  });

  document.getElementById("install-modal-close").addEventListener("click", hideInstallModal);
  document.getElementById("install-modal").addEventListener("click", (e) => {
    if (e.target.id === "install-modal") hideInstallModal();
  });
}

// ---- 初期化 ----
document.addEventListener("DOMContentLoaded", () => {
  applyLanguage(currentLang());
  setupLangToggle();
  setupTabs();
  buildColorSampleStrip();
  setupLoadSource();
  setupGenerate();
  setupCopy();
  setupShareCopy();
  setupXTemplateCopy();
  setupXShareCopyInner();
  setupParsePanel();
  setupInstallButton();
  loadChangelog();
});

// ---- 更新履歴 ----
let changelogEntries = [];

async function loadChangelog() {
  try {
    const versionMeta = document.querySelector('meta[name="app-version"]');
    const v = versionMeta ? versionMeta.content : "";
    const res = await fetch(`data/changelog.json?v=${v}`);
    if (!res.ok) return;
    changelogEntries = await res.json();
    renderChangelog();
  } catch (e) {
    // 更新履歴が読めなくても致命的ではないため無視
  }
}

function renderChangelog() {
  const list = document.getElementById("changelog-list");
  if (!list) return;
  const lang = currentLang();
  list.innerHTML = changelogEntries
    .map(e => {
      const text = lang === "en" ? (e.text_en || e.text) : e.text;
      return `<li><span style="color:var(--muted); font-family:'IBM Plex Mono', monospace;">${e.date}</span> ${text}</li>`;
    })
    .join("");
}
