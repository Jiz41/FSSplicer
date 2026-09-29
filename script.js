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
    subtitle: "Full Stride 馬データエディット補助ツール",
    x_share_summary: "Xで共有する",
    x_share_step1: "下のテンプレをコピーしてポスト",
    btn_x_template_copy: "Xテンプレをコピー",
    x_template_fallback_name: "新しい馬",
    x_template_copy_success: "コピーしました",
    x_template_copy_failed: "コピーに失敗しました",
    section_source: "元の馬データを読み込む",
    hint_source: "シートの行をID列から丸ごとコピーして貼り付け、読み込むボタンを押すと未編集の項目は元の馬の値のまま出力されます",
    hint_gear_tack_ingame: "馬具（頭絡・ハミ・マスク等）とたてがみは、CSV貼り付け後にゲーム内で直接編集してください",
    btn_load_source: "読み込む",
    load_source_empty: "貼り付け内容が空です",
    load_source_mismatch: "列数が一致しません（{n}列検出、75列または74列が必要）",
    load_source_success: "元データを読み込みました。編集したい項目だけ変更してください",
    load_source_from_url_success: "共有されたデータを読み込みました",
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
    pace_low_label: "遅",
    pace_high_label: "早",
    label_direction_aptitude: "回り適性（-1〜1）",
    direction_left_label: "左",
    direction_right_label: "右",
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
    hint_physical_weight: "0.5前後が馬体重460〜470kg程度の目安です。マイナス方向で小さく、プラス方向で大きくなります。",
    ameri_link: "実在馬のステータスは、\"FSSp専属秘書・谷上アメリ\"と一緒に考える →",
    howto_summary: "使い方",
    howto_1: "改変したい馬を、配布されているスプレッドシートで探し、その行をコピーします（行全体を選択してコピー）",
    howto_2: "コピーした行を「元の馬データを読み込む」に貼り付け、読み込むボタンを押します（未編集の項目は元の馬の値のまま出力されます）",
    howto_3: "基本情報・能力値（8軸）を好きな値に変更します。毛色は下のサンプル画像をタップしても選べます",
    howto_4: "馬具（頭絡・ハミ・マスク等）とたてがみは、ゲーム内で見ながら直接編集してください。このツールでは顔・脚マークのみ数値で指定できます（脚マークは見本画像の番号が目安です）",
    howto_5: "「CSVを生成」を押すとタブ区切りのCSVができ、スプレッドシートにそのまま貼り付けられます",
    howto_6: "作った馬をみんなに見てもらいたい場合は「アーカイヴに登録する」を開き、製作者名と削除用パスワードを入力すると登録できます",
    howto_7: "アーカイヴの詳細ページで「この馬を元に作る」を選ぶと、このページにその馬のデータが入力済みの状態で開けます",
    howto_8: "ヘッダーの📲ボタンを押すと、アプリのようにホーム画面から起動できるようになります。iOSの場合は共有ボタン（□に↑のアイコン）から「ホーム画面に追加」を選んでください",
    btn_generate: "CSVを生成",
    btn_copy: "クリップボードにコピー",
    related_hub: "FULL STRIDE 非公式ツール集はこちら",
    footer_unofficial: "本ツールはファンによる非公式データ改変ツールです。",
    footer_trademark_pre: "『FULL STRIDE』の名称は、",
    footer_trademark_post: "の商標または登録商標です。",
    alert_required: "馬名（日本語）・馬名（英語）は必須です。",
    archive_register_summary: "アーカイヴに登録する",
    archive_register_hint: "製作者名と削除用パスワードを入力すると、みんなが見られるアーカイヴにこの馬を登録できます",
    archive_creator_name_label: "製作者名",
    archive_delete_password_label: "削除用パスワード（半角英数字6桁）",
    archive_register_btn: "アーカイヴに登録",
    archive_register_success: "登録しました。こちらから見られます →",
    archive_register_error_name: "馬名を入力してください",
    archive_register_error_creator: "製作者名を入力してください",
    archive_register_error_password: "削除用パスワードは半角英数字6桁で入力してください",
    archive_register_error_generic: "登録に失敗しました",
    copy_success: "コピーしました",
    copy_failed: "コピーに失敗しました",
    color_sample_note: "タップで選択できます（画像の著作権はBlue Bullet社に帰属します）",
    leg_sample_note: "番号は各脚マークの値に対応します（4本まとめて変更した際の見た目です。画像の著作権はBlue Bullet社に帰属します）",
    head_mark_legend_summary: "頭絡マーク見本を表示",
    head_sample_note: "番号は頭絡マークの値に対応します（画像の著作権はBlue Bullet社に帰属します）",
    head_source_prefix: "引用元：Blue Bullet株式会社が公開する資料「",
    head_source_suffix: "」",
    install_guide_title: "ホーム画面に追加",
    install_guide_ios: "共有ボタン（□に↑のアイコン）をタップ→「ホーム画面に追加」を選ぶと、アプリのように使えます",
    changelog_summary: "更新履歴",
    accordion_hint: "（タップで開閉）",
    footer_disclaimer_summary: "利用規約・免責事項",
    disclaimer_site_title: "サイトの性質について",
    disclaimer_site_body: "本サイトは、個人が制作する『FULL STRIDE』の非公式ファンツールであり、株式会社Blue Bullet（以下「開発元」）とは一切関係のない、非営利の個人運営サイトです。開発元、JRA（日本中央競馬会）、地方競馬関連団体、その他本サイトに登場する競走馬・関係者の所属団体・企業とも、提携・後援・監修等の関係は一切ありません。",
    disclaimer_ip_title: "知的財産権について",
    disclaimer_ip_body: "『FULL STRIDE』の名称は、開発元に帰属する商標です。本ツールは、開発元がGoogleスプレッドシートを通じて公式に提供している馬データ編集機能を、より簡単に操作できるようフォーム化したものです。本ツール内で参照している馬具・毛色・頭絡マーク等の見本画像は、開発元公式の配信・投稿ガイドラインおよび公式資料に基づき掲載しており、著作権は開発元に帰属します。",
    disclaimer_data_title: "データの取り扱いについて",
    disclaimer_data_body: "本ツールはすべての処理をお使いの端末内（ブラウザ）で完結しており、入力いただいた馬データが外部のサーバーに送信されることは一切ありません。生成されたCSVはご自身でスプレッドシートに貼り付けていただく仕組みです。なお、アクセス状況の把握のため外部のアクセスカウンターサービスを利用しており、その際にアクセス元の情報が当該サービスに送信されます。",
    disclaimer_liability_title: "免責事項",
    disclaimer_liability_body: "本サイトのご利用、または本サイトに掲載された情報の利用によって生じたいかなる損害についても、運営者は責任を負いかねます。また、本サイトはメンテナンス・技術的な事情等により、予告なく内容の変更、機能の停止、サービスの終了を行う場合があります。本免責事項の内容は、必要に応じて予告なく変更されることがあります。",
    disclaimer_contact_title: "お問い合わせ",
    disclaimer_contact_body: "掲載内容についてのご指摘、誤りのご報告、修正・削除のご依頼等は、フッター記載のXアカウントまでご連絡ください。",
    disclaimer_dates: "制定日：2026年9月24日",
    menu_header: "MENU",
    menu_home: "馬データ入力（ホーム）",
    menu_howto: "使い方",
    menu_gallery: "アーカイヴ",
    gallery_title: "アーカイヴ",
    gallery_new_title: "新着",
    gallery_ranking_title: "注目馬ランキング TOP10",
    gallery_browse_all: "全件表示",
    gallery_search_placeholder: "馬名・製作者名で検索",
    gallery_search_no_results: "該当する馬が見つかりません",
    gallery_page_indicator: "{current}/{total}",
    gallery_empty: "まだ登録された馬がいません",
    archive_howto_summary: "使い方",
    archive_howto_1: "「新着」には最近登録された4頭、「注目馬ランキング」には評価（いいね）の多い順で10頭が表示されます",
    archive_howto_2: "カードをタップすると、その馬の詳細ページが開きます",
    archive_howto_3: "詳細ページでは、能力レーダーチャートや距離適性などの詳しいステータスが見られます",
    archive_howto_4: "人参アイコンをタップすると、その馬を評価（いいね）できます",
    archive_howto_5: "Xのアイコンをタップすると、その馬をXで共有できます",
    archive_howto_6: "「この馬を元に作る」を選ぶと、この馬のデータを元にしたホーム（エディター）が開けます。改変してアーカイヴに再登録すると、系譜として辿れるようになります",
    archive_howto_7: "自分が登録した馬は、削除用パスワードで詳細ページから削除できます",
    menu_disclaimer: "利用規約",
    menu_changelog: "更新履歴",
    menu_links: "リンク",
    menu_aria: "メニュー",
    detail_back_link: "アーカイヴへ戻る",
    detail_loading: "読み込み中...",
    detail_not_found: "馬が見つかりません",
    detail_like_caption: "評価する",
    detail_share_caption: "共有する",
    detail_section_stats: "能力",
    detail_section_other: "その他ステータス",
    detail_distance_label: "距離適性",
    detail_turf_label: "芝",
    detail_dirt_label: "ダ",
    detail_running_style_label: "脚質",
    detail_section_age: "年齢",
    detail_age_peak_label: "ピーク",
    detail_age_retire_label: "引退",
    detail_lineage_summary: "系譜",
    detail_remix_btn: "この馬を元に作る",
    detail_delete_summary: "この馬を削除する",
    detail_delete_password_placeholder: "削除用パスワード",
    detail_delete_btn: "削除する",
    rs_label_0: "逃げ",
    rs_label_1: "先行",
    rs_label_2: "差し",
    rs_label_3: "追込",
    detail_slider_physical_label: "フィジカル",
    detail_slider_direction_label: "回り適性",
    detail_slider_pace_label: "得意ペース",
    physical_low_label: "小",
    physical_high_label: "大",
    detail_lineage_arrow: "改変",
    detail_lineage_empty: "この馬を元にした改変はまだありません",
    detail_delete_error_empty_password: "パスワードを入力してください",
    detail_delete_confirm: "{name} を削除します。よろしいですか？",
    detail_delete_error_generic: "削除に失敗しました"
  },
  en: {
    subtitle: "Full Stride horse data editing tool (unofficial fan tool)",
    x_share_summary: "Share on X",
    x_share_step1: "Copy the template below and post it",
    btn_x_template_copy: "Copy X Template",
    x_template_fallback_name: "a new horse",
    x_template_copy_success: "Copied",
    x_template_copy_failed: "Copy failed",
    section_source: "Load Source Horse Data",
    hint_source: "Copy an entire row from the sheet (including the ID column) and paste it, then press Load. Unedited fields will be output using the original horse's values.",
    hint_gear_tack_ingame: "Please edit tack (bridle, bit, mask, etc.) and mane directly in-game after pasting the CSV.",
    btn_load_source: "Load",
    load_source_empty: "Pasted content is empty",
    load_source_mismatch: "Column count mismatch ({n} columns detected, expected 75 or 74)",
    load_source_success: "Source data loaded. Only change the fields you want to edit",
    load_source_from_url_success: "Loaded the shared horse data",
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
    pace_low_label: "Slow",
    pace_high_label: "Fast",
    label_direction_aptitude: "Direction Aptitude (-1 to 1)",
    direction_left_label: "Left",
    direction_right_label: "Right",
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
    hint_physical_weight: "Around 0.5 corresponds to roughly 460-470kg of body weight. Lower values are smaller, higher values are larger.",
    ameri_link: "Think it through with \"FSSp's dedicated secretary, Ameri Tanigami\" →",
    howto_summary: "How to use",
    howto_1: "Find the horse you want to modify in the distributed spreadsheet and copy its whole row",
    howto_2: "Paste the copied row into \"Load source horse data\" and press Load (unedited fields keep the original horse's values)",
    howto_3: "Edit the basic info and the 8 stat values as you like. You can also tap a sample image below to pick a coat color",
    howto_4: "Please edit tack (bridle, bit, mask, etc.) and mane directly in-game while looking at them. This tool only lets you set numeric values for face/leg marks (use the leg mark sample numbers as a guide)",
    howto_5: "Press \"Generate CSV\" to get a tab-separated CSV ready to paste into Sheets",
    howto_6: "If you want everyone to see the horse you made, open \"Register to the Archive\" and enter your creator name and a delete password to register it",
    howto_7: "On the archive's detail page, choose \"Remix This Horse\" to open this page pre-filled with that horse's data",
    howto_8: "Tap the 📲 button in the header to launch this tool from your home screen like an app. On iOS, use the Share button (the square with an up arrow) and select \"Add to Home Screen\"",
    btn_generate: "Generate CSV",
    btn_copy: "Copy to Clipboard",
    related_hub: "See all FULL STRIDE fan tools",
    footer_unofficial: "This is an unofficial fan-made data editing tool.",
    footer_trademark_pre: "\"FULL STRIDE\" is a trademark or registered trademark of ",
    footer_trademark_post: ".",
    alert_required: "Name (Japanese) and Name (English) are required.",
    archive_register_summary: "Register to the Archive",
    archive_register_hint: "Enter your name and a delete password to register this horse to the public archive",
    archive_creator_name_label: "Creator Name",
    archive_delete_password_label: "Delete Password (6 alphanumeric characters)",
    archive_register_btn: "Register",
    archive_register_success: "Registered! View it here →",
    archive_register_error_name: "Please enter a horse name",
    archive_register_error_creator: "Please enter a creator name",
    archive_register_error_password: "Delete password must be 6 alphanumeric characters",
    archive_register_error_generic: "Registration failed",
    copy_success: "Copied",
    copy_failed: "Copy failed",
    color_sample_note: "Tap to select (images © Blue Bullet Inc.)",
    leg_sample_note: "Numbers correspond to each leg mark's value (shown as all four legs changed together. Images © Blue Bullet Inc.)",
    head_mark_legend_summary: "Show Head Mark Samples",
    head_sample_note: "Numbers correspond to each head mark's value (Images © Blue Bullet Inc.)",
    head_source_prefix: "Source: \"",
    head_source_suffix: "\" published by Blue Bullet Inc.",
    install_guide_title: "Add to Home Screen",
    install_guide_ios: "Tap the Share button (square with an up arrow), then choose \"Add to Home Screen\" to use this like an app.",
    changelog_summary: "Update Log",
    accordion_hint: "(Tap to expand)",
    footer_disclaimer_summary: "Terms & Disclaimer",
    disclaimer_site_title: "About This Site",
    disclaimer_site_body: "This site is an unofficial fan tool for FULL STRIDE, created by an individual and operated on a non-commercial basis. It has no affiliation whatsoever with Blue Bullet Inc. (hereafter \"the developer\"). Neither the developer, the Japan Racing Association (JRA), any local racing associations, nor any organizations or companies associated with the racehorses or individuals featured on this site have any partnership, endorsement, or supervisory relationship with this site.",
    disclaimer_ip_title: "Intellectual Property",
    disclaimer_ip_body: "The name \"FULL STRIDE\" is a trademark of the developer. This tool is a form-based interface for the horse data editing feature the developer officially provides via Google Sheets, designed to make it easier to use. The sample images of tack, coat colors, and head marks referenced in this tool are used based on the developer's official streaming/posting guidelines and official reference materials, and their copyright belongs to the developer.",
    disclaimer_data_title: "Data Handling",
    disclaimer_data_body: "All processing in this tool takes place entirely within your own device (browser); none of the horse data you enter is ever sent to an external server. The generated CSV is meant to be pasted into your spreadsheet by you. Separately, this site uses a third-party visitor counter service to track site traffic, and information about the visitor's origin is sent to that service in the process.",
    disclaimer_liability_title: "Limitation of Liability",
    disclaimer_liability_body: "The operator is not liable for any damages arising from your use of this site or the information presented on it. This site may be modified, have features suspended, or be discontinued without notice due to maintenance or other circumstances. The contents of this disclaimer may also be changed without notice as needed.",
    disclaimer_contact_title: "Contact",
    disclaimer_contact_body: "For corrections, error reports, or requests to remove content, please contact us via the X account listed in the footer.",
    disclaimer_dates: "Established: September 24, 2026",
    menu_header: "MENU",
    menu_home: "Horse Data Entry (Home)",
    menu_howto: "How to Use",
    menu_gallery: "Archive",
    gallery_title: "Archive",
    gallery_new_title: "New",
    gallery_ranking_title: "Featured Horses Ranking TOP10",
    gallery_browse_all: "Show All",
    gallery_search_placeholder: "Search by horse or creator name",
    gallery_search_no_results: "No matching horses found",
    gallery_page_indicator: "{current}/{total}",
    gallery_empty: "No horses have been registered yet",
    archive_howto_summary: "How to Use",
    archive_howto_1: "\"New\" shows the 4 most recently registered horses, and \"Good Ranking\" shows the top 10 by evaluation (likes)",
    archive_howto_2: "Tap a card to open that horse's detail page",
    archive_howto_3: "The detail page shows detailed stats such as the ability radar chart and distance aptitude",
    archive_howto_4: "Tap the carrot icon to evaluate (like) the horse",
    archive_howto_5: "Tap the X icon to share the horse on X",
    archive_howto_6: "Choose \"Remix This Horse\" to open the home editor pre-filled with this horse's data. If you modify it and register it again, it becomes traceable as a lineage",
    archive_howto_7: "You can delete a horse you registered from its detail page using the delete password",
    menu_disclaimer: "Terms & Disclaimer",
    menu_changelog: "Changelog",
    menu_links: "Links",
    menu_aria: "Menu",
    detail_back_link: "Back to Archive",
    detail_loading: "Loading...",
    detail_not_found: "Horse not found",
    detail_like_caption: "Evaluate",
    detail_share_caption: "Share",
    detail_section_stats: "Stats",
    detail_section_other: "Other Stats",
    detail_distance_label: "Distance Aptitude",
    detail_turf_label: "Turf",
    detail_dirt_label: "Dirt",
    detail_running_style_label: "Running Style",
    detail_section_age: "Age",
    detail_age_peak_label: "Peak",
    detail_age_retire_label: "Retire",
    detail_lineage_summary: "Lineage",
    detail_remix_btn: "Remix This Horse",
    detail_delete_summary: "Delete This Horse",
    detail_delete_password_placeholder: "Delete Password",
    detail_delete_btn: "Delete",
    rs_label_0: "Front Runner",
    rs_label_1: "Stalker",
    rs_label_2: "Chaser",
    rs_label_3: "Closer",
    detail_slider_physical_label: "Physical",
    detail_slider_direction_label: "Direction Aptitude",
    detail_slider_pace_label: "Preferred Pace",
    physical_low_label: "Small",
    physical_high_label: "Large",
    detail_lineage_arrow: "Remix",
    detail_lineage_empty: "No remixes of this horse yet",
    detail_delete_error_empty_password: "Please enter the password",
    detail_delete_confirm: "Delete {name}? This cannot be undone.",
    detail_delete_error_generic: "Failed to delete"
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
  const saved = localStorage.getItem("fssp_lang");
  if (saved === "ja" || saved === "en") return saved;
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
  if (!grid) return;
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
  if (!grid) return;
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

  const sourceP = document.createElement("p");
  sourceP.className = "color-sample-source-link";

  const prefixSpan = document.createElement("span");
  prefixSpan.setAttribute("data-i18n", "head_source_prefix");
  prefixSpan.textContent = t("head_source_prefix");

  const sourceLink = document.createElement("a");
  sourceLink.href = "https://docs.google.com/presentation/d/1nASJ09HOYHABJ_1u1Tx5P3WaJmeGLipmWdi4t_2AjFg/edit?usp=sharing";
  sourceLink.target = "_blank";
  sourceLink.rel = "noopener noreferrer";
  sourceLink.textContent = "Full Stride Horse Edit Reference";

  const suffixSpan = document.createElement("span");
  suffixSpan.setAttribute("data-i18n", "head_source_suffix");
  suffixSpan.textContent = t("head_source_suffix");

  sourceP.appendChild(prefixSpan);
  sourceP.appendChild(sourceLink);
  sourceP.appendChild(suffixSpan);

  wrap.appendChild(note);
  wrap.appendChild(row);
  wrap.appendChild(sourceP);
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
  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) menuToggle.setAttribute("aria-label", t("menu_aria"));
}

// ---- 基本情報の単体スライダー（得意ペース・回り適性・体格）の現在値表示 ----
function setupBasicSliders() {
  ["preferred_pace", "direction_aptitude", "physical"].forEach(key => {
    const range = document.getElementById(key + "_range");
    const num = document.getElementById(key);
    if (!range || !num) return;
    range.addEventListener("input", () => { num.value = range.value; });
    num.addEventListener("input", () => { range.value = num.value; });
  });
}

function setupHamburgerMenu() {
  const toggle = document.getElementById("menu-toggle");
  const drawer = document.getElementById("menu-drawer");
  if (!toggle || !drawer) return;

  function openMenu() {
    drawer.classList.add("open");
    toggle.classList.add("open");
  }
  function closeMenu() {
    drawer.classList.remove("open");
    toggle.classList.remove("open");
  }

  toggle.addEventListener("click", () => {
    if (drawer.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) closeMenu();
  });

  drawer.querySelectorAll("nav a[data-target]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("data-target");
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.open = true;
      closeMenu();
      setTimeout(() => {
        if (targetEl && typeof targetEl.scrollIntoView === "function") {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 400);
    });
  });
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
    localStorage.setItem("fssp_lang", next);
    applyLanguage(next);
    updateLabel();
  });

  updateLabel();
}

function setupWordmarkLink() {
  const wordmark = document.querySelector(".wordmark");
  if (!wordmark) return;
  const path = location.pathname;
  const isHome = path.endsWith("index.html") || path === "/" || path.endsWith("/");
  if (isHome) return;
  wordmark.classList.add("wordmark-link");
  wordmark.addEventListener("click", () => {
    location.href = "index.html";
  });
}

// ---- 元馬データの読み込み（スキップ列を元馬の値で埋めるため） ----
let sourceRowValues = {};

function loadSourceFromText(raw, status) {
  raw = (raw || "").trim();
  if (!raw) {
    if (status) status.textContent = t("load_source_empty");
    return false;
  }
  const fields = raw.split("\t");
  let cols;
  if (fields.length === COLUMN_ORDER.length) {
    cols = COLUMN_ORDER;
  } else if (fields.length === COLUMN_ORDER.length - 1) {
    cols = COLUMN_ORDER.filter(c => c !== "id");
  } else {
    if (status) status.textContent = t("load_source_mismatch").replace("{n}", fields.length);
    return false;
  }

  sourceRowValues = {};
  cols.forEach((col, i) => { sourceRowValues[col] = fields[i]; });

  COLUMN_ORDER.forEach(col => {
    if (col === "id" || col === "running_style" || sourceRowValues[col] === undefined) return;
    const el = document.getElementById(col);
    if (el) el.value = sourceRowValues[col];
    const rangeEl = document.getElementById(col + "_range");
    if (rangeEl) rangeEl.value = sourceRowValues[col];
    const displayEl = document.getElementById(col + "_display");
    if (displayEl) displayEl.textContent = sourceRowValues[col];
  });
  if (sourceRowValues.running_style !== undefined) {
    const parts = sourceRowValues.running_style.split("/");
    [0, 1, 2, 3].forEach(i => {
      const el = document.getElementById("running_style_" + i);
      if (el && parts[i] !== undefined) el.value = parts[i];
    });
  }

  if (status) status.textContent = t("load_source_success");
  return true;
}

function setupLoadSource() {
  const btn = document.getElementById("load-source-btn");
  const input = document.getElementById("source-input");
  const status = document.getElementById("load-source-status");
  if (!btn || !input) return;

  btn.addEventListener("click", () => {
    loadSourceFromText(input.value, status);
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
  if (!btn || !output) return;

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
  if (!btn || !output) return;

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

// ---- 共有URLの生成（現在のフォーム内容を|区切りCSVにしてクエリパラメータへ埋め込む） ----
function buildShareUrl() {
  const encoded = encodeURIComponent(generateCsvRow().split("\t").join("|"));
  return "https://fssplicer.pages.dev/?data=" + encoded;
}

// ---- アーカイヴ登録 ----
function setupArchiveRegister() {
  const btn = document.getElementById("archive-register-btn");
  const creatorInput = document.getElementById("archive-creator-name");
  const passwordInput = document.getElementById("archive-delete-password");
  const status = document.getElementById("archive-register-status");
  if (!btn || !creatorInput || !passwordInput || !status) return;

  const savedCreator = localStorage.getItem("fssp_creator_name");
  if (savedCreator) creatorInput.value = savedCreator;

  btn.addEventListener("click", async () => {
    status.textContent = "";

    const nameJp = document.getElementById("name_jp").value.trim();
    if (!nameJp) {
      status.textContent = t("archive_register_error_name");
      return;
    }

    const creatorName = creatorInput.value.trim();
    if (!creatorName) {
      status.textContent = t("archive_register_error_creator");
      return;
    }

    const deletePassword = passwordInput.value.trim();
    if (!/^[A-Za-z0-9]{6}$/.test(deletePassword)) {
      status.textContent = t("archive_register_error_password");
      return;
    }

    localStorage.setItem("fssp_creator_name", creatorName);
    const parentId = sessionStorage.getItem("fssp_remix_parent_id") || null;

    try {
      const res = await fetch("/api/horses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_jp: nameJp,
          creator_name: creatorName,
          csv_data: generateCsvRow(),
          parent_id: parentId,
          delete_password: deletePassword
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.id) {
        sessionStorage.removeItem("fssp_remix_parent_id");
        status.textContent = "";
        const link = document.createElement("a");
        link.href = `detail.html?id=${encodeURIComponent(data.id)}`;
        link.textContent = t("archive_register_success");
        status.appendChild(link);
      } else {
        status.textContent = data.error || t("archive_register_error_generic");
      }
    } catch (e) {
      status.textContent = t("archive_register_error_generic");
    }
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
  if (!btn) return;
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

  const modalClose = document.getElementById("install-modal-close");
  const modal = document.getElementById("install-modal");
  if (modalClose) modalClose.addEventListener("click", hideInstallModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.id === "install-modal") hideInstallModal();
    });
  }
}

// ---- 初期化 ----
document.addEventListener("DOMContentLoaded", () => {
  applyLanguage(currentLang());
  setupHamburgerMenu();
  setupLangToggle();
  setupWordmarkLink();
  setupBasicSliders();
  buildColorSampleStrip();
  setupLoadSource();
  setupGenerate();
  setupCopy();
  setupArchiveRegister();
  setupInstallButton();
  loadChangelog();

  const params = new URLSearchParams(location.search);
  const sharedData = params.get("data");
  if (sharedData) {
    const status = document.getElementById("load-source-status");
    const raw = sharedData.split("|").join("\t");
    const loaded = loadSourceFromText(raw, status);
    if (loaded && status) status.textContent = t("load_source_from_url_success");
  }

  const parentId = params.get("parent");
  if (parentId) {
    sessionStorage.setItem("fssp_remix_parent_id", parentId);
  }

  const hashTarget = document.getElementById(location.hash.slice(1));
  if (hashTarget && hashTarget.tagName === "DETAILS") {
    hashTarget.open = true;
    setTimeout(() => hashTarget.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }
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
