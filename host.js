import {
  AVAILABLE_LANGUAGES,
  clearTemplate,
  CTA_ITEM_TYPE,
  defaultTemplate,
  FIXED_LOCALE,
  getHostPrivateItem,
  HOST_PRIVATE_ITEM,
  REQUIRED_LOCALES,
  isCtaItem,
  isImageItem,
  isHostPrivateItem,
  loadTemplate,
  normalizeTemplate,
  saveTemplate,
} from "./content.js?v=20260609c";
import {
  deleteSectionImage,
  fetchRemoteTemplateRow,
  getHostSupabase,
  HOST_EMAIL,
  IMAGE_MAX_BYTES,
  publishRemoteTemplate,
  uploadSectionImage,
} from "./supabase.js";
import {
  escapeAttribute,
  escapeHtml,
  normalizeCtaHref,
  normalizeCtaKind,
  sanitizeHref,
  sanitizeImageSrc,
} from "./security.js?v=20260528b";

const iconPaths = {
  shield:
    '<path d="M12 3l6 2.7v5.7c0 3.7-2.3 6.9-6 8.6-3.7-1.7-6-4.9-6-8.6V5.7L12 3z"/><path d="M9.4 11.8 11 13.4l3.7-3.8"/>',
  wifi:
    '<path d="M1 8 A 15.5 15.5 0 0 1 23 8"/><path d="M4.5 11.5 A 10.6 10.6 0 0 1 19.5 11.5"/><path d="M8 15 A 5.6 5.6 0 0 1 16 15"/><circle cx="12" cy="19.5" r="1.5" style="fill: currentColor; stroke: none;"/>',
  bolt:
    '<path d="M13.2 3.8 6.8 13h4.6l-.7 7.2 6.5-9.3h-4.8z"/>',
  clock:
    '<circle cx="12" cy="12" r="8"/><path d="M12 7.8v4.6l3 1.8"/>',
  calendar:
    '<rect x="5" y="6" width="14" height="13" rx="2"/><path d="M8 4.8v2.4"/><path d="M16 4.8v2.4"/><path d="M5 9.5h14"/>',
  spark:
    '<path d="M12 3.8 13.3 8 17.5 9.3 13.3 10.6 12 14.8 10.7 10.6 6.5 9.3 10.7 8 12 3.8z"/><path d="M18.2 14.5 19 16.6l2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1z"/>',
  key:
    '<circle cx="8.3" cy="14.2" r="3.2"/><path d="M11.2 14.2H20"/><path d="M16.4 14.2v-2.4"/><path d="M13.8 14.2v2.4"/>',
  lock:
    '<rect x="6.2" y="10.2" width="11.6" height="9" rx="2"/><path d="M8.7 10.2V8.3a3.3 3.3 0 0 1 6.6 0v1.9"/>',
  safe:
    '<rect x="5" y="4.5" width="14" height="15" rx="2.2"/><circle cx="12" cy="12" r="2.5"/><path d="M12 9.5v5"/><path d="M9.5 12H14.5"/>',
  pin:
    '<path d="M12 20s5-4.7 5-9a5 5 0 1 0-10 0c0 4.3 5 9 5 9z"/><circle cx="12" cy="11" r="1.8"/>',
  user:
    '<circle cx="12" cy="8.7" r="3.2"/><path d="M6.4 19.2a6.5 6.5 0 0 1 11.2 0"/>',
  image:
    '<rect x="4.8" y="6.2" width="14.4" height="11.6" rx="2"/><circle cx="9.1" cy="10" r="1.3"/><path d="m6.7 15.6 3.2-3.3 2.4 2.4 2.2-2.1 2.8 3"/>',
  checkin:
    '<rect x="1.5" y="9.5" width="12" height="11" rx="2"/><path d="M5 9.5v11M10 9.5v11"/><path d="M5.5 9.5V6a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v3.5"/><path d="M13 9 A 5 5 0 1 1 14.5 12"/><path d="M17.5 7.5V4M17.5 7.5l2.5 3"/><path d="M14 17.5h7.5M18.5 14.5L21.5 17.5L18.5 20.5"/>',
  notepad:
    '<circle cx="5" cy="5.5" r="1.8"/><circle cx="5" cy="5.5" r="0.2" style="fill: currentColor; stroke: none;"/><path d="M5 3.7h12.2A1.8 1.8 0 0 1 19 5.5v11.2"/><path d="M5 7.3h12.2"/><circle cx="19" cy="18.5" r="1.8"/><circle cx="19" cy="18.5" r="0.2" style="fill: currentColor; stroke: none;"/><path d="M19 20.3H6.8A1.8 1.8 0 0 1 5 18.5V7.3"/><path d="M19 16.7H6.8"/><path d="M6.8 7.3v9.4"/><path d="M17.2 7.3v9.4"/><path d="M9 8.5h6M9 10.5h6M9 12.5h6M9 14.5h4.5M9 16.5h2.5"/>',
  keypad:
    '<circle cx="5" cy="16" r="3.5"/><circle cx="5" cy="16" r="1"/><path d="M8.5 14.5h9.5l3.5 1.5-3.5 1.5h-2v2h-1.5v-2h-2.5v2h-1.5v-2h-3.5"/><rect x="10.5" y="4" width="2.8" height="2.8" rx="0.6"/><rect x="14.3" y="4" width="2.8" height="2.8" rx="0.6"/><rect x="18.1" y="4" width="2.8" height="2.8" rx="0.6"/><rect x="10.5" y="7.8" width="2.8" height="2.8" rx="0.6"/><rect x="14.3" y="7.8" width="2.8" height="2.8" rx="0.6"/><rect x="18.1" y="7.8" width="2.8" height="2.8" rx="0.6"/>',
  vault:
    '<rect x="2" y="2" width="20" height="18" rx="2.5"/><path d="M5 20v2a1 1 0 0 0 1 1h0a1 1 0 0 0 1-1v-2M17 20v2a1 1 0 0 0 1 1h0a1 1 0 0 0 1-1v-2"/><rect x="5" y="5" width="14" height="12" rx="1.5"/><rect x="3" y="7" width="2" height="3" rx="1"/><rect x="3" y="14" width="2" height="3" rx="1"/><circle cx="12" cy="11" r="4.2"/><circle cx="12" cy="11" r="1.3"/><circle cx="14.8" cy="11" r="0.6"/><circle cx="14" cy="13" r="0.6"/><circle cx="12" cy="13.8" r="0.6"/><circle cx="10" cy="13" r="0.6"/><circle cx="9.2" cy="11" r="0.6"/><circle cx="10" cy="9" r="0.6"/><circle cx="12" cy="8.2" r="0.6"/><circle cx="14" cy="9" r="0.6"/>',
  binoculars:
    '<path d="M2 5.5l6.7-3.5 6.7 3.5 6.7-3.5v15l-6.7 3.5-6.7-3.5-6.7 3.5Z M8.7 2v15 M15.4 5.5v15"/>',
  avatar:
    '<path d="M6.5 11c1.8-2 4-2 5.5-1c1.8-1 4-1 5.5.5c.5-4-1-6-5.5-6s-6 2-5.5 6.5z" style="fill: currentColor;"/><path d="M6.5 11a1.8 1.8 0 0 0 0 3.6M17.5 11a1.8 1.8 0 0 1 0 3.6"/><path d="M6.5 12.5v2.5a5.5 5.5 0 0 0 11 0v-2.5"/><circle cx="9.8" cy="12.5" r="1" style="fill: currentColor; stroke: none;"/><circle cx="14.2" cy="12.5" r="1" style="fill: currentColor; stroke: none;"/><path d="M11.5 14.2a0.5 0.5 0 0 0 1 0"/><path d="M9.5 16a2.5 2.5 0 0 0 5 0"/>',
  phone:
    '<path d="M7.2 5.8c.5-.5 1.2-.5 1.7 0l1.5 1.5c.5.5.5 1.2 0 1.7l-1 1c1 1.9 2.6 3.5 4.5 4.5l1-1c.5-.5 1.2-.5 1.7 0l1.5 1.5c.5.5.5 1.2 0 1.7l-.9.9c-.8.8-2 1.1-3.1.8-2.6-.7-5.2-2.2-7.2-4.2s-3.5-4.6-4.2-7.2c-.3-1.1 0-2.3.8-3.1z"/>',
  mail:
    '<rect x="4" y="6.2" width="16" height="11.6" rx="2"/><path d="m5.3 7.7 6.7 5 6.7-5"/>',
  home:
    '<path d="M4.5 10.2 12 4l7.5 6.2"/><path d="M6.5 9.4V19h11V9.4"/>',
  luggage:
    '<rect x="6.4" y="7.2" width="11.2" height="11.4" rx="2"/><path d="M9.7 7.2V5.8c0-.8.7-1.4 1.5-1.4h1.6c.8 0 1.5.6 1.5 1.4v1.4"/><path d="M12 10v5"/>',
  car:
    '<path d="M5.2 14.8h13.6"/><path d="m7 14.8 1-4.2c.2-.7.8-1.2 1.5-1.2h5c.7 0 1.3.5 1.5 1.2l1 4.2"/><circle cx="8.3" cy="16.8" r="1.3"/><circle cx="15.7" cy="16.8" r="1.3"/>',
  bus:
    '<rect x="6.3" y="4.8" width="11.4" height="12" rx="2"/><path d="M8.5 8h2.6"/><path d="M13 8h2.5"/><path d="M8 18.2 6.9 20"/><path d="M17.1 18.2 16 20"/><circle cx="9" cy="15.2" r="0.7" fill="currentColor" stroke="none"/><circle cx="15" cy="15.2" r="0.7" fill="currentColor" stroke="none"/>',
  cart:
    '<circle cx="10" cy="17.5" r="1.2"/><circle cx="16" cy="17.5" r="1.2"/><path d="M5 6h1.6l1.2 7h8.2l1.6-5.2H8.3"/>',
  utensils:
    '<path d="M7 3.8v7.8"/><path d="M5.2 3.8v4.4"/><path d="M8.8 3.8v4.4"/><path d="M7 11.6V20"/><path d="M15.5 3.8c1.4 1.5 2 3 2 4.8 0 2-.8 3.5-2.4 4.6V20"/><path d="M14.2 3.8v8.2"/>',
  cross:
    '<path d="M12 5.4v13.2"/><path d="M5.4 12h13.2"/>',
  train:
    '<rect x="7" y="5.2" width="10" height="11.6" rx="2"/><path d="M9.5 8.2h5"/><path d="M9.5 11.2h5"/><path d="M9.2 18.2 8 20"/><path d="M14.8 18.2 16 20"/>',
  wave:
    '<path d="M3.8 15.2c1.2 0 1.2-1 2.4-1s1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.4 1"/><path d="M4 10.5c1 0 1-.8 2-.8s1 .8 2 .8 1-.8 2-.8 1 .8 2 .8 1-.8 2-.8 1 .8 2 .8"/>',
  route:
    '<circle cx="6.4" cy="6.4" r="2.2"/><circle cx="17.6" cy="17.6" r="2.2"/><path d="M8.4 7.8c2.2 1 3.9 2.2 5.1 3.8 1 1.3 1.8 2.6 2 4.2"/><path d="M10.2 5.6h5.2"/><path d="M14.2 5.6 16 7.4"/><path d="M14.2 5.6 16 3.8"/>',
  link:
    '<path d="M10.7 13.3 13.3 10.7"/><path d="M8.1 15.9 6.6 17.4a3 3 0 0 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0"/><path d="M15.9 8.1l1.5-1.5a3 3 0 1 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0"/>',
  chat:
    '<path d="M5.2 18.5 6 15.8a6.9 6.9 0 1 1 2.7 1.6z"/><path d="M8.4 11.4h7.2"/><path d="M8.4 8.8h4.6"/>',
  map:
    '<path d="M3.2 6.1 8.6 4l6.8 2.1 5.4-2.1v13.9l-5.4 2.1-6.8-2.1-5.4 2.1z"/><path d="M8.6 4v13.9"/><path d="M15.4 6.1V20"/>',
  ticket:
    '<path d="M4.2 8.2A2.2 2.2 0 0 0 6.4 6h11.2a2.2 2.2 0 0 0 2.2 2.2v2.2a2.2 2.2 0 0 0-2.2 2.2H6.4a2.2 2.2 0 0 0-2.2-2.2z"/><path d="M12 6v8.8"/><path d="M12 8.2v1.2"/><path d="M12 11.4v1.2"/>',
  skyline:
    '<path d="M3.8 18.2h16.4"/><path d="M5.3 18.2V10.8h3.2v7.4"/><path d="M9.7 18.2V7.8h3.6v10.4"/><path d="M14.8 18.2V9.6h3v8.6"/><path d="M11.5 7.8V5.4h1.1v2.4"/>',
  trail:
    '<path d="M4.2 9.3 7.6 5.6 10.1 8.2 13 5l3.1 3.7 2.2-2.4 1.5 1.7"/><path d="M12.5 19.5c.3-1.8.6-3.2 1.4-4.4l1.2-1.8"/><circle cx="10.9" cy="12.1" r="1.2"/><path d="M10.9 13.3 9.2 15.5"/><path d="M10.6 14.4 12.9 16"/><path d="M9.2 15.5 7.8 19.4"/><path d="M13 16l2 3.4"/><path d="M15.2 19.4h3.1"/>',
  id:
    '<rect x="4.8" y="6" width="14.4" height="12" rx="2"/><circle cx="9.3" cy="11" r="1.6"/><path d="M7.2 14.4c.7-1.1 1.5-1.6 2.1-1.6s1.4.5 2.1 1.6"/><path d="M13.6 10h3.1"/><path d="M13.6 13h3.1"/>',
  receipt:
    '<path d="M7 4.8h10v14.4l-1.4-.8-1.6.8-1.6-.8-1.6.8-1.6-.8-1.2.8z"/><path d="M9.3 8h5.4"/><path d="M9.3 11h5.4"/><path d="M9.3 14h3.2"/>',
};

const AUTO_PUBLISH_DELAY = 2500;
const EDITOR_HASH = "#editor";

const dom = {
  gate: document.querySelector("#host-gate"),
  app: document.querySelector("#host-app"),
  email: document.querySelector("#host-email"),
  password: document.querySelector("#host-password"),
  login: document.querySelector("#host-login"),
  logout: document.querySelector("#host-logout"),
  shareGuest: document.querySelector("#host-share-guest"),
  status: document.querySelector("#host-status"),
  save: document.querySelector("#host-save"),
  reset: document.querySelector("#host-reset"),
  export: document.querySelector("#host-export"),
  import: document.querySelector("#host-import"),
  addSection: document.querySelector("#host-add-section"),
  editorLocale: document.querySelector("#field-editor-locale"),
  optionalLocale: document.querySelector("#field-optional-locale"),
  appName: document.querySelector("#field-app-name"),
  subtitle: document.querySelector("#field-subtitle"),
  heroMeta: document.querySelector("#field-hero-meta"),
  address: document.querySelector("#field-address"),
  license: document.querySelector("#field-license"),
  fontPrimary: document.querySelector("#field-font-primary"),
  fontSecondary: document.querySelector("#field-font-secondary"),
  titleSize: document.querySelector("#field-title-size"),
  subtitleSize: document.querySelector("#field-subtitle-size"),
  menuSize: document.querySelector("#field-menu-size"),
  menuWeight: document.querySelector("#field-menu-weight"),
  sectionTitleSize: document.querySelector("#field-section-title-size"),
  bodySize: document.querySelector("#field-body-size"),
  bodyWeight: document.querySelector("#field-body-weight"),
  colorBackground: document.querySelector("#field-color-background"),
  colorText: document.querySelector("#field-color-text"),
  colorMuted: document.querySelector("#field-color-muted"),
  colorIcon: document.querySelector("#field-color-icon"),
  colorLine: document.querySelector("#field-color-line"),
  colorRow: document.querySelector("#field-color-row"),
  colorRowHover: document.querySelector("#field-color-row-hover"),
  colorSheet: document.querySelector("#field-color-sheet"),
  appWidth: document.querySelector("#field-app-width"),
  pagePadding: document.querySelector("#field-page-padding"),
  heroHeight: document.querySelector("#field-hero-height"),
  buttonHeight: document.querySelector("#field-button-height"),
  buttonRadius: document.querySelector("#field-button-radius"),
  buttonGap: document.querySelector("#field-button-gap"),
  iconSize: document.querySelector("#field-icon-size"),
  showChevron: document.querySelector("#field-show-chevron"),
  sheetWidth: document.querySelector("#field-sheet-width"),
  sheetRadius: document.querySelector("#field-sheet-radius"),
  contentGap: document.querySelector("#field-content-gap"),
  sheetAnimation: document.querySelector("#field-sheet-animation"),
  footerName: document.querySelector("#field-footer-name"),
  footerSubtitle: document.querySelector("#field-footer-subtitle"),
  footerLines: document.querySelector("#field-footer-lines"),
  sections: document.querySelector("#host-sections"),
};

const supabase = getHostSupabase();

let state = null;
let session = null;
let latestRemoteUpdatedAt = null;
let autoPublishTimer = null;
let authBound = false;
let editorBound = false;
let editorReady = false;
let editorLoading = false;
let selectedEditorLocale = FIXED_LOCALE;
const TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const TRANSLATE_SEPARATOR = "\n[[[STAMPACE_TRANSLATE_SPLIT]]]\n";
const TRANSLATE_CHUNK_LIMIT = 2400;
const TRANSLATE_TIMEOUT_MS = 8000;
const TRANSLATE_LOCALE_MAP = {
  sc: "ca",
};
const translationCache = new Map();
let lastTranslationFallbackLocales = [];
const expandedSectionIds = new Set();
let shouldSeedExpandedSection = true;
const expandedPanelIds = new Set();
const ITALIAN_TEMPLATE_BASE = defaultTemplate.locales[FIXED_LOCALE];
const SARDINIAN_TEMPLATE_BASE = defaultTemplate.locales.sc;
const LINK_ITEM_PREFIX = "LINK";
const AVAILABLE_FONTS = [
  { value: "Roboto", label: "Roboto (Sans-serif pulito)" },
  { value: "Inter", label: "Inter (Sans-serif moderno)" },
  { value: "Outfit", label: "Outfit (Sans-serif geometrico elegante)" },
  { value: "Playfair Display", label: "Playfair Display (Serif elegante)" },
  { value: "Lora", label: "Lora (Serif editoriale leggibile)" },
  { value: "Montserrat", label: "Montserrat (Sans-serif bold moderno)" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond (Serif lusso tradizionale)" }
];
const FONT_WEIGHT_OPTIONS = [
  { value: "300", label: "Leggero" },
  { value: "400", label: "Normale" },
  { value: "500", label: "Medio" },
  { value: "600", label: "Grassetto" },
];
const TEXT_SIZE_OPTIONS = [
  { value: "0.9rem", label: "Piccolo" },
  { value: "0.98rem", label: "Normale" },
  { value: "1.08rem", label: "Grande" },
  { value: "1.18rem", label: "Molto grande" },
];
const TITLE_SIZE_OPTIONS = [
  { value: "1.08rem", label: "Compatto" },
  { value: "1.18rem", label: "Normale" },
  { value: "1.32rem", label: "Grande" },
  { value: "1.48rem", label: "Importante" },
];
const SECTION_TITLE_SIZE_OPTIONS = [
  { value: "1.18rem", label: "Compatto" },
  { value: "1.32rem", label: "Normale" },
  { value: "1.48rem", label: "Grande" },
  { value: "1.64rem", label: "Molto grande" },
];
const APP_WIDTH_OPTIONS = [
  { value: "30rem", label: "Stretta" },
  { value: "34rem", label: "Normale" },
  { value: "40rem", label: "Ampia" },
  { value: "48rem", label: "Molto ampia" },
];
const SPACING_OPTIONS = [
  { value: "0.55rem", label: "Compatta" },
  { value: "0.8rem", label: "Normale" },
  { value: "1rem", label: "Aria media" },
  { value: "1.25rem", label: "Ampia" },
];
const HERO_HEIGHT_OPTIONS = [
  { value: "12.5rem", label: "Bassa" },
  { value: "15.5rem", label: "Normale" },
  { value: "18.75rem", label: "Alta" },
  { value: "22rem", label: "Molto alta" },
];
const BUTTON_HEIGHT_OPTIONS = [
  { value: "3.35rem", label: "Compatta" },
  { value: "3.7rem", label: "Normale" },
  { value: "4.1rem", label: "Grande" },
  { value: "4.55rem", label: "Molto grande" },
];
const RADIUS_OPTIONS = [
  { value: "0.45rem", label: "Squadrato" },
  { value: "0.72rem", label: "Morbido" },
  { value: "1rem", label: "Arrotondato" },
  { value: "1.45rem", label: "Molto arrotondato" },
];
const SHEET_RADIUS_OPTIONS = [
  { value: "1rem", label: "Morbido" },
  { value: "1.8rem", label: "Arrotondato" },
  { value: "2.4rem", label: "Molto arrotondato" },
];
const ICON_SIZE_OPTIONS = [
  { value: "1.75rem", label: "Piccole" },
  { value: "2.06rem", label: "Normali" },
  { value: "2.35rem", label: "Grandi" },
];
const SOLID_COLOR_OPTIONS = [
  { value: "#070605", label: "Nero caldo" },
  { value: "#0e0c0a", label: "Bruno scuro" },
  { value: "#17120e", label: "Legno scuro" },
  { value: "#f3eadc", label: "Avorio" },
  { value: "#e7d8c1", label: "Oro chiaro" },
  { value: "#dfc39c", label: "Oro caldo" },
  { value: "#5fa8ff", label: "Blu elegante" },
  { value: "#e45f53", label: "Rosso terracotta" },
  { value: "#44c77a", label: "Verde WhatsApp" },
];
const SOFT_COLOR_OPTIONS = [
  { value: "rgba(231, 216, 193, 0.58)", label: "Molto discreto" },
  { value: "rgba(231, 216, 193, 0.72)", label: "Discreto" },
  { value: "rgba(231, 216, 193, 0.88)", label: "Chiaro" },
  { value: "#e7d8c1", label: "Pieno" },
];
const SURFACE_COLOR_OPTIONS = [
  { value: "rgba(17, 14, 11, 0.28)", label: "Molto leggero" },
  { value: "rgba(17, 14, 11, 0.34)", label: "Normale" },
  { value: "rgba(27, 22, 17, 0.48)", label: "Più visibile" },
  { value: "rgba(40, 31, 23, 0.62)", label: "Intenso" },
];
const LINE_COLOR_OPTIONS = [
  { value: "rgba(224, 205, 177, 0.08)", label: "Sottile" },
  { value: "rgba(224, 205, 177, 0.12)", label: "Normale" },
  { value: "rgba(224, 205, 177, 0.2)", label: "Visibile" },
  { value: "rgba(224, 205, 177, 0.32)", label: "Marcato" },
];
const SHEET_COLOR_OPTIONS = [
  { value: "rgba(10, 8, 6, 0.88)", label: "Scuro leggero" },
  { value: "rgba(10, 8, 6, 0.92)", label: "Scuro elegante" },
  { value: "rgba(17, 14, 11, 0.96)", label: "Legno scuro" },
];
let draggingSectionId = null;
const CTA_KIND_OPTIONS = [
  { value: "web", label: "Web" },
  { value: "maps", label: "Google Maps" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Telefono" },
];
const CTA_ICON_OPTIONS = [
  { value: "map", label: "Mappa" },
  { value: "phone", label: "Telefono" },
  { value: "mail", label: "Email" },
  { value: "chat", label: "Chat" },
  { value: "link", label: "Link" },
  { value: "route", label: "Percorso" },
  { value: "car", label: "Auto" },
  { value: "ticket", label: "Ticket" },
  { value: "home", label: "Casa" },
  { value: "key", label: "Chiave" },
];
const SECTION_ICON_OPTIONS = [
  { value: "spark", label: "Automatica" },
  { value: "checkin", label: "Check-in" },
  { value: "notepad", label: "Regole" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "keypad", label: "Key-box / Codici" },
  { value: "key", label: "Chiavi" },
  { value: "lock", label: "Serratura" },
  { value: "vault", label: "Cassaforte" },
  { value: "bolt", label: "Energia / Contatore" },
  { value: "luggage", label: "Bagagli" },
  { value: "pin", label: "Posizione" },
  { value: "map", label: "Mappa" },
  { value: "route", label: "Percorso" },
  { value: "car", label: "Auto / Parcheggio" },
  { value: "bus", label: "Bus / Transfer" },
  { value: "train", label: "Treno" },
  { value: "utensils", label: "Ristoranti" },
  { value: "cart", label: "Spesa" },
  { value: "cross", label: "Farmacia / Emergenze" },
  { value: "wave", label: "Mare" },
  { value: "trail", label: "Escursioni" },
  { value: "binoculars", label: "Dintorni" },
  { value: "receipt", label: "Pagamenti" },
  { value: "id", label: "Documenti" },
  { value: "phone", label: "Telefono" },
  { value: "mail", label: "Email" },
  { value: "home", label: "Casa" },
  { value: "user", label: "Host" },
];
const CTA_PRESET_OPTIONS = [
  { kind: "web", label: "CTA Web" },
  { kind: "maps", label: "CTA Mappa" },
  { kind: "whatsapp", label: "CTA WhatsApp" },
  { kind: "email", label: "CTA Email" },
  { kind: "tel", label: "CTA Telefono" },
];

function serializeFooterLines(lines = []) {
  return lines.join("\n");
}

function parseFooterLines(value) {
  return value
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] ?? iconPaths.spark}</svg>`;
}

function themeValue(group, key, fallback) {
  const value = group?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizedSectionText(section) {
  return `${section?.menuTitle ?? ""} ${section?.sectionTitle ?? ""} ${section?.lead ?? ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function inferSectionIcon(section) {
  const text = normalizedSectionText(section);

  if (/key[-\s]?box|keybox|lockbox|cassetta.*chiav|chiav.*cassetta|tastier|keypad|codic/.test(text)) return "keypad";
  if (/contator|elettric|corrente|energia|salvavita|quadro|luce/.test(text)) return "bolt";
  if (/bagagli|bagaglio|valig|deposito|luggage|baggage/.test(text)) return "luggage";
  if (/wifi|wi-fi|rete|password|connession/.test(text)) return "wifi";
  if (/check[-\s]?in|check[-\s]?out|arriv|partenz|orari/.test(text)) return "checkin";
  if (/regol|vietat|divieto|fum|rumor|silenzio/.test(text)) return "notepad";
  if (/cassafort|safe|valori/.test(text)) return "vault";
  if (/chiav|serratur|porta|access/.test(text)) return "key";
  if (/escursion|tour|gita|trek|experience|esperienz|sentier/.test(text)) return "trail";
  if (/ristorant|locali|bar|aperitiv|food|drink|cibo|spesa|market|supermercat/.test(text)) return "utensils";
  if (/mobilit|transfer|navetta|aeroport|bus|taxi|trasport/.test(text)) return "skyline";
  if (/noleggio|rent|auto|car rental|vehicle|parchegg/.test(text)) return "car";
  if (/farmacia|emergenz|medic|ospedal/.test(text)) return "cross";
  if (/spiagg|mare|poetto/.test(text)) return "wave";
  if (/mappa|quartiere|dintorn|local|posizion|indirizz|come arrivare/.test(text)) return "pin";

  return "";
}

function resolvedSectionIcon(section) {
  if (section?.icon && section.icon !== "spark" && iconPaths[section.icon]) return section.icon;
  return inferSectionIcon(section) || (iconPaths[section?.icon] ? section.icon : "spark");
}

function sectionIconOptions(selectedIcon = "spark") {
  if (!selectedIcon || SECTION_ICON_OPTIONS.some((option) => option.value === selectedIcon)) {
    return SECTION_ICON_OPTIONS;
  }
  return [
    ...SECTION_ICON_OPTIONS,
    { value: selectedIcon, label: `Icona salvata (${selectedIcon})` },
  ];
}

function applyTheme(theme) {
  const primaryFont = theme?.fontPrimary || "Roboto";
  const secondaryFont = theme?.fontSecondary || "Roboto";
  const colors = theme?.colors || {};

  const serifFonts = ["Playfair Display", "Lora", "Cormorant Garamond"];
  const primaryFallback = serifFonts.includes(primaryFont) ? "serif" : "sans-serif";
  const secondaryFallback = serifFonts.includes(secondaryFont) ? "serif" : "sans-serif";

  document.documentElement.style.setProperty("--font-primary", `"${primaryFont}", ${primaryFallback}`);
  document.documentElement.style.setProperty("--font-secondary", `"${secondaryFont}", ${secondaryFallback}`);
  document.documentElement.style.setProperty("--copy", themeValue(colors, "text", "#e7d8c1"));
  document.documentElement.style.setProperty("--text", "var(--copy)");
  document.documentElement.style.setProperty("--muted", themeValue(colors, "muted", "rgba(231, 216, 193, 0.72)"));
  document.documentElement.style.setProperty("--line", themeValue(colors, "line", "rgba(224, 205, 177, 0.12)"));

  const fontsToLoad = new Set([primaryFont, secondaryFont]);
  const linkId = "google-fonts-dynamic";
  let linkEl = document.getElementById(linkId);
  if (!linkEl) {
    linkEl = document.createElement("link");
    linkEl.id = linkId;
    linkEl.rel = "stylesheet";
    document.head.appendChild(linkEl);
  }

  const fontQueries = [];
  fontsToLoad.forEach((font) => {
    if (font === "System") return;
    const formattedName = font.replace(/ /g, "+");
    if (["Playfair Display", "Lora", "Cormorant Garamond"].includes(font)) {
      fontQueries.push(`family=${formattedName}:ital,wght@0,300..700;1,300..700`);
    } else {
      fontQueries.push(`family=${formattedName}:wght@300;400;500;600`);
    }
  });

  if (fontQueries.length > 0) {
    linkEl.href = `https://fonts.googleapis.com/css2?${fontQueries.join("&")}&display=swap`;
  } else {
    linkEl.removeAttribute("href");
  }
}

function ctaDefaultIcon(kind = "web") {
  const fallbackMap = {
    web: "link",
    maps: "map",
    whatsapp: "chat",
    email: "mail",
    tel: "phone",
  };
  return fallbackMap[kind] ?? "link";
}

function ctaDefaultLabel(kind = "web") {
  const fallbackMap = {
    web: "Apri link",
    maps: "Apri mappa",
    whatsapp: "Scrivi su WhatsApp",
    email: "Invia email",
    tel: "Chiama",
  };
  return fallbackMap[kind] ?? "Apri link";
}

function ctaDefaultHref(kind = "web") {
  const fallbackMap = {
    web: "https://example.com",
    maps: "https://maps.google.com/",
    whatsapp: "+39",
    email: "email@example.com",
    tel: "+39",
  };
  return fallbackMap[kind] ?? "https://example.com";
}

function optionsHtml(options, selectedValue) {
  const selected = typeof selectedValue === "string" ? selectedValue : "";
  const mergedOptions = selected && !options.some((option) => option.value === selected)
    ? [...options, { value: selected, label: "Valore personalizzato salvato" }]
    : options;
  return mergedOptions.map(
    (option) => `<option value="${escapeAttribute(option.value)}" ${option.value === selectedValue ? "selected" : ""}>${escapeHtml(option.label)}</option>`,
  ).join("");
}

function setFieldValue(field, value) {
  if (field) field.value = value ?? "";
}

function fillSelect(field, options, selectedValue) {
  if (!field) return;
  field.innerHTML = optionsHtml(options, selectedValue);
}

function fillDesignSelects(theme) {
  const colors = theme?.colors || {};
  const typography = theme?.typography || {};
  const layout = theme?.layout || {};
  const buttons = theme?.buttons || {};
  const motion = theme?.motion || {};

  fillSelect(dom.titleSize, TITLE_SIZE_OPTIONS, typography.titleSize);
  fillSelect(dom.subtitleSize, TEXT_SIZE_OPTIONS, typography.subtitleSize);
  fillSelect(dom.menuSize, TEXT_SIZE_OPTIONS, typography.menuSize);
  fillSelect(dom.menuWeight, FONT_WEIGHT_OPTIONS, typography.menuWeight);
  fillSelect(dom.sectionTitleSize, SECTION_TITLE_SIZE_OPTIONS, typography.sectionTitleSize);
  fillSelect(dom.bodySize, TEXT_SIZE_OPTIONS, typography.bodySize);
  fillSelect(dom.bodyWeight, FONT_WEIGHT_OPTIONS, typography.bodyWeight);
  fillSelect(dom.colorBackground, SOLID_COLOR_OPTIONS, colors.background);
  fillSelect(dom.colorText, SOLID_COLOR_OPTIONS, colors.text);
  fillSelect(dom.colorMuted, SOFT_COLOR_OPTIONS, colors.muted);
  fillSelect(dom.colorIcon, SOLID_COLOR_OPTIONS, colors.icon);
  fillSelect(dom.colorLine, LINE_COLOR_OPTIONS, colors.line);
  fillSelect(dom.colorRow, SURFACE_COLOR_OPTIONS, colors.row);
  fillSelect(dom.colorRowHover, SURFACE_COLOR_OPTIONS, colors.rowHover);
  fillSelect(dom.colorSheet, SHEET_COLOR_OPTIONS, colors.sheet);
  fillSelect(dom.appWidth, APP_WIDTH_OPTIONS, layout.appWidth);
  fillSelect(dom.pagePadding, SPACING_OPTIONS, layout.pagePadding);
  fillSelect(dom.heroHeight, HERO_HEIGHT_OPTIONS, layout.heroHeight);
  fillSelect(dom.buttonHeight, BUTTON_HEIGHT_OPTIONS, layout.buttonHeight);
  fillSelect(dom.buttonRadius, RADIUS_OPTIONS, layout.buttonRadius);
  fillSelect(dom.buttonGap, SPACING_OPTIONS, layout.buttonGap);
  fillSelect(dom.iconSize, ICON_SIZE_OPTIONS, buttons.iconSize);
  fillSelect(dom.sheetWidth, APP_WIDTH_OPTIONS, layout.sheetWidth);
  fillSelect(dom.sheetRadius, SHEET_RADIUS_OPTIONS, layout.sheetRadius);
  fillSelect(dom.contentGap, SPACING_OPTIONS, layout.contentGap);
  setFieldValue(dom.showChevron, buttons.showChevron);
  setFieldValue(dom.sheetAnimation, motion.sheetAnimation);
}

function themeDraftFromFields() {
  return {
    fontPrimary: dom.fontPrimary.value,
    fontSecondary: dom.fontSecondary.value,
    colors: {
      background: dom.colorBackground.value,
      text: dom.colorText.value,
      muted: dom.colorMuted.value,
      icon: dom.colorIcon.value,
      line: dom.colorLine.value,
      row: dom.colorRow.value,
      rowHover: dom.colorRowHover.value,
      sheet: dom.colorSheet.value,
    },
    typography: {
      titleSize: dom.titleSize.value,
      subtitleSize: dom.subtitleSize.value,
      menuSize: dom.menuSize.value,
      sectionTitleSize: dom.sectionTitleSize.value,
      bodySize: dom.bodySize.value,
      menuWeight: dom.menuWeight.value,
      bodyWeight: dom.bodyWeight.value,
    },
    layout: {
      appWidth: dom.appWidth.value,
      pagePadding: dom.pagePadding.value,
      heroHeight: dom.heroHeight.value,
      buttonHeight: dom.buttonHeight.value,
      buttonRadius: dom.buttonRadius.value,
      buttonGap: dom.buttonGap.value,
      sheetWidth: dom.sheetWidth.value,
      sheetRadius: dom.sheetRadius.value,
      contentGap: dom.contentGap.value,
    },
    buttons: {
      iconSize: dom.iconSize.value,
      showChevron: dom.showChevron.value,
    },
    motion: {
      sheetAnimation: dom.sheetAnimation.value,
    },
  };
}

function buildCtaPreset(kind = "web") {
  return {
    type: CTA_ITEM_TYPE,
    kind,
    label: ctaDefaultLabel(kind),
    href: ctaDefaultHref(kind),
    icon: ctaDefaultIcon(kind),
  };
}

function translationKey(targetLocale, text) {
  return `${targetLocale}::${text}`;
}

async function translateBatch(texts, targetLocale) {
  if (!texts.length || targetLocale === FIXED_LOCALE) return texts;
  const serviceLocale = TRANSLATE_LOCALE_MAP[targetLocale] ?? targetLocale;

  const translated = [];
  let currentChunk = [];
  let currentSize = 0;

  async function flushChunk() {
    if (!currentChunk.length) return;
    const joined = currentChunk.join(TRANSLATE_SEPARATOR);
    const params = new URLSearchParams({
      client: "gtx",
      sl: FIXED_LOCALE,
      tl: serviceLocale,
      dt: "t",
      q: joined,
    });
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
    try {
      const response = await fetch(`${TRANSLATE_ENDPOINT}?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error("Servizio di traduzione non disponibile.");
      }
      const payload = await response.json();
      const translatedText = (payload[0] ?? []).map((part) => part[0] ?? "").join("");
      const parts = translatedText.split(TRANSLATE_SEPARATOR);
      if (parts.length !== currentChunk.length) {
        throw new Error("Formato risposta traduzione non valido.");
      }
      translated.push(...parts);
    } finally {
      window.clearTimeout(timeoutId);
    }
    currentChunk = [];
    currentSize = 0;
  }

  for (const text of texts) {
    const nextSize = currentSize + text.length + TRANSLATE_SEPARATOR.length;
    if (currentChunk.length && nextSize > TRANSLATE_CHUNK_LIMIT) {
      await flushChunk();
    }
    currentChunk.push(text);
    currentSize += text.length + TRANSLATE_SEPARATOR.length;
  }

  await flushChunk();
  return translated;
}

async function translateTexts(texts, targetLocale) {
  const results = new Array(texts.length);
  const missingTexts = [];
  const missingIndexes = [];

  texts.forEach((text, index) => {
    if (!text || targetLocale === FIXED_LOCALE) {
      results[index] = text;
      return;
    }
    const key = translationKey(targetLocale, text);
    if (translationCache.has(key)) {
      results[index] = translationCache.get(key);
      return;
    }
    missingTexts.push(text);
    missingIndexes.push(index);
  });

  if (missingTexts.length) {
    let translated;
    try {
      translated = await translateBatch(missingTexts, targetLocale);
    } catch {
      lastTranslationFallbackLocales.push(targetLocale);
      translated = missingTexts;
    }
    translated.forEach((value, idx) => {
      const source = missingTexts[idx];
      const index = missingIndexes[idx];
      const key = translationKey(targetLocale, source);
      translationCache.set(key, value);
      results[index] = value;
    });
  }

  return results;
}

function preserveWifiValue(text, targetLocale) {
  const separators = [":", "："];
  const match = separators
    .map((separator) => ({ separator, index: text.indexOf(separator) }))
    .find((entry) => entry.index > -1);

  if (!match) return null;

  const label = text.slice(0, match.index).trim().toLowerCase();
  const value = text.slice(match.index + 1).trim();
  if (!value) return null;

  const protectedLabels = ["nome rete", "network name", "ssid", "nome da rede", "nom du réseau", "nombre de la red", "netzwerkname", "netwerknaam"];
  if (!protectedLabels.includes(label)) return null;

  const localizedLabels = {
    it: "Nome rete",
    en: "Network name",
    fr: "Nom du réseau",
    es: "Nombre de la red",
    de: "Netzwerkname",
    nl: "Netwerknaam",
    pt: "Nome da rede",
    pl: "Nazwa sieci",
    cs: "Název sítě",
    ru: "Имя сети",
    zh: "网络名称",
    hi: "नेटवर्क नाम",
    ja: "ネットワーク名",
  };

  return `${localizedLabels[targetLocale] ?? localizedLabels.it}: ${value}`;
}

async function buildTranslatedLocale(italianLocale, targetLocale) {
  if (targetLocale === FIXED_LOCALE) {
    return JSON.parse(JSON.stringify(italianLocale));
  }

  if (targetLocale === "sc") {
    return {
      heroMeta: [...(italianLocale.heroMeta ?? [])],
      subtitle: italianLocale.subtitle,
      sections: italianLocale.sections.map((section, sectionIndex) => {
        const itBaseSection = ITALIAN_TEMPLATE_BASE.sections[sectionIndex] ?? {};
        const scBaseSection = SARDINIAN_TEMPLATE_BASE.sections[sectionIndex] ?? section;

        const pickSectionValue = (currentValue, italianBaseValue, sardinianBaseValue) =>
          currentValue !== italianBaseValue ? currentValue : sardinianBaseValue;

              const items = section.items.map((item, itemIndex) => {
                if (isImageItem(item)) return { ...item };
                if (isHostPrivateItem(item)) return { ...getHostPrivateItem(targetLocale) };
                if (isCtaItem(item)) {
                  const itBaseItem = itBaseSection.items?.[itemIndex];
                  const scBaseItem = scBaseSection.items?.[itemIndex];
                  return {
                    ...item,
                    label: item.label !== itBaseItem?.label ? item.label : scBaseItem?.label ?? item.label,
                  };
                }

                const itBaseItem = itBaseSection.items?.[itemIndex];
                const scBaseItem = scBaseSection.items?.[itemIndex];

          if (typeof item === "string") {
            return item !== itBaseItem ? item : scBaseItem ?? item;
          }

          return {
            ...item,
            title: item.title !== itBaseItem?.title ? item.title : scBaseItem?.title ?? item.title,
            body: item.body !== itBaseItem?.body ? item.body : scBaseItem?.body ?? item.body,
            label: item.label !== itBaseItem?.label ? item.label : scBaseItem?.label ?? item.label,
          };
        });

        return {
          id: section.id,
          icon: section.icon,
          menuTitle: pickSectionValue(section.menuTitle, itBaseSection.menuTitle, scBaseSection.menuTitle ?? section.menuTitle),
          sectionTitle: pickSectionValue(section.sectionTitle, itBaseSection.sectionTitle, scBaseSection.sectionTitle ?? section.sectionTitle),
          lead: pickSectionValue(section.lead, itBaseSection.lead, scBaseSection.lead ?? section.lead),
          items,
        };
      }),
    };
  }

  const draftLocale = {
    heroMeta: [],
    subtitle: "",
    sections: italianLocale.sections.map((section) => ({
      id: section.id,
      icon: section.icon,
      menuTitle: "",
      sectionTitle: "",
      lead: "",
      items: [],
    })),
  };

  const texts = [];
  const appliers = [];

  (italianLocale.heroMeta ?? []).forEach((line) => {
    const nextIndex = draftLocale.heroMeta.push("") - 1;
    texts.push(line);
    appliers.push((value) => {
      draftLocale.heroMeta[nextIndex] = value;
    });
  });

  italianLocale.sections.forEach((section, sectionIndex) => {
    const targetSection = draftLocale.sections[sectionIndex];

    texts.push(section.menuTitle);
    appliers.push((value) => {
      targetSection.menuTitle = value;
    });

    texts.push(section.sectionTitle);
    appliers.push((value) => {
      targetSection.sectionTitle = value;
    });

    texts.push(section.lead);
    appliers.push((value) => {
      targetSection.lead = value;
    });

    section.items.forEach((item) => {
      if (isImageItem(item)) {
        targetSection.items.push({ ...item });
        return;
      }

      if (isHostPrivateItem(item)) {
        targetSection.items.push({ ...getHostPrivateItem(targetLocale) });
        return;
      }

      if (isCtaItem(item)) {
        const translatedItem = { ...item, label: "" };
        const nextIndex = targetSection.items.push(translatedItem) - 1;
        texts.push(item.label ?? "");
        appliers.push((value) => {
          targetSection.items[nextIndex].label = value;
        });
        return;
      }

      if (typeof item === "string") {
        const nextIndex = targetSection.items.push("") - 1;
        const preservedWifiEntry = section.id === "wifi" ? preserveWifiValue(item, targetLocale) : null;
        if (preservedWifiEntry) {
          targetSection.items[nextIndex] = preservedWifiEntry;
        } else {
          texts.push(item);
          appliers.push((value) => {
            targetSection.items[nextIndex] = value;
          });
        }
        return;
      }

      const translatedItem = { ...item, title: "", body: "", label: "" };
      const nextIndex = targetSection.items.push(translatedItem) - 1;

      texts.push(item.title ?? "");
      appliers.push((value) => {
        targetSection.items[nextIndex].title = value;
      });

      texts.push(item.body ?? "");
      appliers.push((value) => {
        targetSection.items[nextIndex].body = value;
      });

      texts.push(item.label ?? "");
      appliers.push((value) => {
        targetSection.items[nextIndex].label = value;
      });
    });
  });

  const translatedTexts = await translateTexts(texts, targetLocale);
  translatedTexts.forEach((value, index) => {
    appliers[index](value);
  });

  return draftLocale;
}

async function buildPublishedTemplate(template) {
  const next = JSON.parse(JSON.stringify(template));
  const italianLocale = next.locales[FIXED_LOCALE];
  const enabledLocaleCodes = new Set(next.enabledLocales ?? REQUIRED_LOCALES);
  lastTranslationFallbackLocales = [];

  for (const language of AVAILABLE_LANGUAGES) {
    if (language.code === FIXED_LOCALE) continue;
    if (!enabledLocaleCodes.has(language.code)) continue;
    next.locales[language.code] = await buildTranslatedLocale(italianLocale, language.code);
  }

  return normalizeTemplate(next);
}

function currentLocaleState() {
  return state.locales[selectedEditorLocale] ?? state.locales[FIXED_LOCALE];
}

function syncExpandedSections() {
  const sectionIds = currentLocaleState().sections.map((section) => section.id);
  [...expandedSectionIds].forEach((id) => {
    if (!sectionIds.includes(id)) expandedSectionIds.delete(id);
  });
  if (shouldSeedExpandedSection && !expandedSectionIds.size && sectionIds.length) {
    expandedSectionIds.add(sectionIds[0]);
    shouldSeedExpandedSection = false;
  }
}

function isPanelExpanded(panelId) {
  return expandedPanelIds.has(panelId);
}

function togglePanel(panelId) {
  if (!panelId) return;
  if (expandedPanelIds.has(panelId)) {
    expandedPanelIds.delete(panelId);
  } else {
    expandedPanelIds.add(panelId);
  }
  dom.app.querySelectorAll("[data-panel-id]").forEach((panel) => {
    if (panel.dataset.panelId !== panelId) return;
    const expanded = isPanelExpanded(panelId);
    panel.classList.toggle("is-collapsed", !expanded);
    const toggle = panel.querySelector('[data-action="toggle-panel"]');
    if (toggle) toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
}

function syncPanelState() {
  dom.app.querySelectorAll("[data-panel-id]").forEach((panel) => {
    const expanded = isPanelExpanded(panel.dataset.panelId);
    panel.classList.toggle("is-collapsed", !expanded);
    const toggle = panel.querySelector('[data-action="toggle-panel"]');
    if (toggle) toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
}

function sectionBadge(section) {
  const parts = [];
  if (section.id.startsWith("custom-")) {
    parts.push("Sezione personalizzata");
  } else if (section.id === "host") {
    parts.push("Sezione fissa");
  } else {
    parts.push(section.id);
  }
  if (section.hidden) {
    parts.push("Nascosta nell'app ospiti");
  }
  return parts.join(" · ");
}

function renderOptionalLocaleSelect() {
  const selectedOptionalLocale = state.enabledLocales.find((code) => !REQUIRED_LOCALES.includes(code)) ?? "";
  const optionalLanguages = AVAILABLE_LANGUAGES.filter((language) => !language.mandatory);

  dom.optionalLocale.innerHTML = [
    '<option value="">Nessuna lingua extra</option>',
    ...optionalLanguages.map(
      (language) =>
        `<option value="${escapeAttribute(language.code)}" ${language.code === selectedOptionalLocale ? "selected" : ""}>${escapeHtml(language.label)} (${escapeHtml(language.nativeLabel)})</option>`,
    ),
  ].join("");
}

function setStatus(message, variant = "") {
  dom.status.textContent = message;
  dom.status.className = `host-status${variant ? ` is-${variant}` : ""}`;
}

function serializeItems(items) {
  return items
    .filter((item) => !isHostPrivateItem(item) && !isImageItem(item) && !isCtaItem(item))
    .map((item) => {
      if (typeof item === "string") return item;
      if (item?.href) {
        return [
          LINK_ITEM_PREFIX,
          item.href ?? "",
          item.title ?? "",
          item.body ?? "",
          item.label ?? "",
        ].join(" | ");
      }
      return JSON.stringify(item);
    })
    .map((item) => `+ ${item}`)
    .join("\n\n");
}

function parseLinkItem(value) {
  const parts = value.split("|").map((part) => part.trim());
  if (parts.length < 2 || parts[0].toUpperCase() !== LINK_ITEM_PREFIX) return null;

  const [, href = "", title = "", body = "", label = ""] = parts;
  const safeHref = sanitizeHref(href);
  if (!safeHref) return null;

  return {
    title,
    body,
    label: label || href,
    href: safeHref,
  };
}

function parseItems(value) {
  const lines = value.replace(/\r/g, "").split("\n");
  const blocks = [];
  let current = [];

  const flush = () => {
    const joined = current.join("\n").trim();
    if (joined) blocks.push(joined);
    current = [];
  };

  lines.forEach((line) => {
    const plusMatch = line.match(/^\s*\+\s?(.*)$/);
    if (plusMatch) {
      flush();
      current.push(plusMatch[1]);
      return;
    }

    if (!current.length && line.trim()) {
      current.push(line.trim());
      return;
    }

    if (current.length) {
      current.push(line);
    }
  });

  flush();

  return blocks.map((item) => {
    const parsedLink = parseLinkItem(item);
    if (parsedLink) return parsedLink;
    if (item.startsWith("{") && item.endsWith("}")) {
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    }
    return item;
  });
}

function renderSectionCtas(section) {
  const ctas = section.items.filter(isCtaItem);
  const editable = selectedEditorLocale === FIXED_LOCALE;

  if (!ctas.length) {
    return `<p class="host-cta-empty">Nessun pulsante grafico configurato.</p>`;
  }

  return ctas
    .map(
      (item, index) => {
        const kind = normalizeCtaKind(item.kind);
        const href = normalizeCtaHref(kind, item.href);
        const icon = item.icon || ctaDefaultIcon(kind);
        return `
        <article class="host-cta-item host-cta-item--${escapeAttribute(kind)}" data-cta-item data-cta-index="${escapeAttribute(index)}">
          <div class="host-cta-meta">
            <span class="host-cta-icon-preview host-cta-icon-preview--${escapeAttribute(kind)}" aria-hidden="true">${renderIcon(icon)}</span>
            <span class="host-cta-heading">
              <strong>${escapeHtml(item.label || "Nuovo pulsante grafico")}</strong>
              <span>${escapeHtml(CTA_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? "Web")}</span>
            </span>
            <div class="host-cta-actions">
              <button class="ghost-button host-order-button" type="button" data-action="move-cta-up" ${!editable || index === 0 ? "disabled" : ""} aria-label="Sposta CTA in alto">↑</button>
              <button class="ghost-button host-order-button" type="button" data-action="move-cta-down" ${!editable || index === ctas.length - 1 ? "disabled" : ""} aria-label="Sposta CTA in basso">↓</button>
              <button class="ghost-button host-remove-cta" type="button" data-action="remove-cta" ${!editable ? "disabled" : ""}>Rimuovi</button>
            </div>
          </div>
          <div class="host-cta-grid">
            <label>
              <span>Tipo</span>
              <select data-cta-field="kind" ${!editable ? "disabled" : ""}>
                ${CTA_KIND_OPTIONS.map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === kind ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>Icona</span>
              <select data-cta-field="icon" ${!editable ? "disabled" : ""}>
                ${CTA_ICON_OPTIONS.map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === icon ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>Etichetta bottone</span>
              <input data-cta-field="label" type="text" value="${escapeAttribute(item.label ?? "")}" ${!editable ? "disabled" : ""} />
            </label>
            <label>
              <span>Destinazione</span>
              <input data-cta-field="href" type="text" value="${escapeAttribute(href || item.href || "")}" ${!editable ? "disabled" : ""} />
            </label>
          </div>
        </article>
      `;
      },
    )
    .join("");
}

function renderSectionImages(section) {
  const images = section.items.filter(isImageItem);
  if (!images.length) {
    return `<p class="host-image-empty">Nessuna immagine caricata.</p>`;
  }

  return images
    .map(
      (item, index) => {
        const src = sanitizeImageSrc(item.src);
        if (!src) return "";
        const size = item.size || "grande";
        return `
        <article class="host-image-item" data-image-item data-image-index="${escapeAttribute(index)}" data-image-path="${escapeAttribute(item.path ?? "")}" data-image-src="${escapeAttribute(src)}">
          <img src="${escapeAttribute(src)}" alt="${escapeAttribute(item.alt || "")}" loading="lazy" />
          <div class="host-image-fields">
            <label>
              <span>Alt text</span>
              <input data-image-field="alt" type="text" value="${escapeAttribute(item.alt ?? "")}" />
            </label>
            <label>
              <span>Didascalia</span>
              <input data-image-field="caption" type="text" value="${escapeAttribute(item.caption ?? "")}" />
            </label>
            <label>
              <span>Dimensione</span>
              <select data-image-field="size">
                <option value="grande" ${size === "grande" ? "selected" : ""}>Grande (100%)</option>
                <option value="media" ${size === "media" ? "selected" : ""}>Media (65%)</option>
                <option value="piccola" ${size === "piccola" ? "selected" : ""}>Piccola (40%)</option>
              </select>
            </label>
          </div>
          <button class="ghost-button host-image-remove" type="button" data-action="remove-image">Rimuovi</button>
        </article>
      `;
      },
    )
    .join("");
}

function renderSectionEditors() {
  const localeState = currentLocaleState();
  syncExpandedSections();
  const localeHostPrivateItem = localeState.sections
    .find((section) => section.id === "host")
    ?.items.find(isHostPrivateItem) ?? HOST_PRIVATE_ITEM;

  dom.sections.innerHTML = localeState.sections
    .map(
      (section, index) => `
        <section class="host-section-card${expandedSectionIds.has(section.id) ? "" : " is-collapsed"}${section.hidden ? " is-hidden-section" : ""}${selectedEditorLocale === FIXED_LOCALE ? " is-draggable" : ""}" data-section-id="${escapeAttribute(section.id)}" data-section-hidden="${section.hidden ? "true" : "false"}">
          <div class="host-section-meta">
            <div class="host-section-meta-main">
              <button class="host-section-toggle" type="button" data-action="toggle-section" aria-expanded="${expandedSectionIds.has(section.id) ? "true" : "false"}">
                <span class="host-section-icon" data-section-icon-preview>${renderIcon(resolvedSectionIcon(section))}</span>
                <span class="host-section-heading">
                  <span>
                    <p class="host-kicker">${escapeHtml(section.id)}</p>
                    <h2>${escapeHtml(section.menuTitle)}</h2>
                    <p class="host-section-badge">${escapeHtml(sectionBadge(section))}</p>
                  </span>
                  <span class="host-section-chevron" aria-hidden="true">⌄</span>
                </span>
              </button>
            </div>
            <div class="host-section-actions">
              <button
                class="ghost-button host-drag-handle"
                type="button"
                data-action="drag-section"
                draggable="${selectedEditorLocale === FIXED_LOCALE ? "true" : "false"}"
                ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}
                aria-label="Trascina per riordinare"
                title="Trascina per riordinare"
              >↕</button>
              <button class="ghost-button host-section-secondary" type="button" data-action="duplicate-section" ${selectedEditorLocale !== FIXED_LOCALE || section.id === "host" ? "disabled" : ""}>Duplica</button>
              <button class="ghost-button host-section-secondary" type="button" data-action="toggle-section-visibility" ${selectedEditorLocale !== FIXED_LOCALE || section.id === "host" ? "disabled" : ""}>${section.hidden ? "Mostra" : "Nascondi"}</button>
              <button class="ghost-button host-remove-section" type="button" data-action="remove-section">Rimuovi pulsante</button>
            </div>
          </div>
          <div class="host-section-body">
            <div class="host-section-grid">
              <label>
                <span>Titolo nel menu</span>
                <input data-field="menuTitle" type="text" value="${escapeAttribute(section.menuTitle)}" />
              </label>
              <label>
                <span>Titolo sezione</span>
                <input data-field="sectionTitle" type="text" value="${escapeAttribute(section.sectionTitle)}" />
              </label>
              <label>
                <span>Icona sezione</span>
                <select data-field="icon" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>
                  ${sectionIconOptions(section.icon).map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === section.icon ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Testo introduttivo</span>
                <textarea data-field="lead">${escapeHtml(section.lead)}</textarea>
              </label>
              <label>
                <span>Contenuti: usa "+" all'inizio di una riga per creare un nuovo paragrafo</span>
                <textarea data-field="items">${escapeHtml(serializeItems(section.items))}</textarea>
              </label>
              <div class="host-content-tools">
                <button class="ghost-button" type="button" data-action="add-link">Aggiungi link</button>
                <button class="ghost-button" type="button" data-action="add-cta" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>Aggiungi pulsante grafico</button>
                <div class="host-cta-presets">
                  ${CTA_PRESET_OPTIONS.map((preset) => `<button class="ghost-button host-cta-preset" type="button" data-action="add-cta-preset" data-cta-kind="${escapeAttribute(preset.kind)}" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>${escapeHtml(preset.label)}</button>`).join("")}
                </div>
                <p class="host-content-note">Formato link: <code>+ LINK | https://example.com | Titolo | Descrizione | Etichetta</code></p>
              </div>
            </div>
            <div class="host-cta-editor">
              <div class="host-section-media-head">
                <div>
                  <p class="host-kicker">Pulsanti grafici</p>
                  <p class="host-media-note">CTA larghe con icona, etichetta e destinazione. Si aprono sempre in una nuova scheda.</p>
                </div>
              </div>
              <div class="host-cta-list">
                ${renderSectionCtas(section)}
              </div>
              ${
                selectedEditorLocale !== FIXED_LOCALE
                  ? `<p class="host-lock-note">I pulsanti grafici si gestiscono solo mentre modifichi la lingua italiana.</p>`
                  : ""
              }
            </div>
            <div class="host-section-media">
              <div class="host-section-media-head">
                <div>
                  <p class="host-kicker">Immagini sezione</p>
                  <p class="host-media-note">JPEG, PNG o WEBP. Max ${Math.round(IMAGE_MAX_BYTES / (1024 * 1024))} MB.</p>
                </div>
                <label class="ghost-button file-button host-upload-button">
                  <span>Aggiungi immagine</span>
                  <input data-image-upload type="file" accept="image/jpeg,image/png,image/webp" />
                </label>
              </div>
              <div class="host-image-list">
                ${renderSectionImages(section)}
              </div>
            </div>
            ${
              section.id === "host"
                ? `<p class="host-lock-note">La voce "${escapeHtml(localeHostPrivateItem.title)}" viene reinserita automaticamente e non può essere eliminata.</p>`
                : ""
            }
          </div>
        </section>
      `,
    )
    .join("");
}

function syncFields() {
  if (dom.fontPrimary && dom.fontPrimary.options.length === 0) {
    const fontOptions = optionsHtml(AVAILABLE_FONTS);
    dom.fontPrimary.innerHTML = fontOptions;
    dom.fontSecondary.innerHTML = fontOptions;
  }
  applyTheme(state.theme);
  const localeState = currentLocaleState();
  const theme = state.theme || {};
  dom.appName.value = state.appName;
  dom.address.value = state.address;
  dom.license.value = state.license;
  dom.fontPrimary.value = state.theme?.fontPrimary || "Roboto";
  dom.fontSecondary.value = state.theme?.fontSecondary || "Roboto";
  fillDesignSelects(theme);
  dom.subtitle.value = localeState.subtitle;
  dom.heroMeta.value = serializeFooterLines(localeState.heroMeta || state.heroMeta || []);
  dom.footerName.value = state.footer.name;
  dom.footerSubtitle.value = state.footer.subtitle;
  dom.footerLines.value = serializeFooterLines(state.footer.lines);
  dom.editorLocale.innerHTML = AVAILABLE_LANGUAGES.map(
    (language) => `<option value="${escapeAttribute(language.code)}" ${language.code === selectedEditorLocale ? "selected" : ""}>${escapeHtml(language.label)} (${escapeHtml(language.nativeLabel)})</option>`,
  ).join("");
  syncPanelState();
  renderOptionalLocaleSelect();
  renderSectionEditors();
}

function collectTemplate() {
  const next = JSON.parse(JSON.stringify(state));
  const sectionCards = [...dom.sections.querySelectorAll("[data-section-id]")];
  const sections = sectionCards.map((card) => {
    const id = card.dataset.sectionId;
    const base = currentLocaleState().sections.find((section) => section.id === id);
    const ctaItems = [...card.querySelectorAll("[data-cta-item]")].map((item) => {
      const kind = normalizeCtaKind(item.querySelector('[data-cta-field="kind"]').value);
      const label = item.querySelector('[data-cta-field="label"]').value.trim();
      const href = normalizeCtaHref(kind, item.querySelector('[data-cta-field="href"]').value);
      const icon = item.querySelector('[data-cta-field="icon"]').value || ctaDefaultIcon(kind);
      return {
        type: CTA_ITEM_TYPE,
        kind,
        label,
        href,
        icon,
      };
    }).filter((item) => item.label && item.href);
    const imageItems = [...card.querySelectorAll("[data-image-item]")].map((item) => ({
      type: "image",
      path: item.dataset.imagePath || "",
      src: sanitizeImageSrc(item.dataset.imageSrc || ""),
      alt: item.querySelector('[data-image-field="alt"]').value,
      caption: item.querySelector('[data-image-field="caption"]').value,
      size: item.querySelector('[data-image-field="size"]')?.value || "grande",
    })).filter((item) => item.src);
    const selectedIcon = card.querySelector('[data-field="icon"]')?.value || base.icon || "spark";
    return {
      id,
      icon: selectedIcon.trim() || "spark",
      hidden: card.dataset.sectionHidden === "true",
      menuTitle: card.querySelector('[data-field="menuTitle"]').value,
      sectionTitle: card.querySelector('[data-field="sectionTitle"]').value,
      lead: card.querySelector('[data-field="lead"]').value,
      items: [...parseItems(card.querySelector('[data-field="items"]').value), ...ctaItems, ...imageItems],
    };
  });

  const optionalEnabled = dom.optionalLocale.value && !REQUIRED_LOCALES.includes(dom.optionalLocale.value)
    ? [dom.optionalLocale.value]
    : [];

  next.appName = dom.appName.value;
  next.address = dom.address.value;
  next.license = dom.license.value;
  const heroMeta = parseFooterLines(dom.heroMeta.value);
  if (selectedEditorLocale === FIXED_LOCALE) {
    next.heroMeta = heroMeta;
  }
  next.footer = {
    name: dom.footerName.value,
    subtitle: dom.footerSubtitle.value,
    lines: parseFooterLines(dom.footerLines.value),
  };
  next.theme = themeDraftFromFields();
  next.enabledLocales = [...REQUIRED_LOCALES, ...optionalEnabled];
  next.locales[selectedEditorLocale] = {
    ...next.locales[selectedEditorLocale],
    heroMeta,
    subtitle: dom.subtitle.value,
    sections,
  };

  return normalizeTemplate(next);
}

function sectionDraftFromCard(sectionCard) {
  if (!sectionCard) return null;
  return {
    icon: sectionCard.querySelector('[data-field="icon"]')?.value || "spark",
    menuTitle: sectionCard.querySelector('[data-field="menuTitle"]')?.value || "",
    sectionTitle: sectionCard.querySelector('[data-field="sectionTitle"]')?.value || "",
    lead: sectionCard.querySelector('[data-field="lead"]')?.value || "",
  };
}

function updateSectionIconPreview(sectionCard) {
  const preview = sectionCard?.querySelector("[data-section-icon-preview]");
  const draft = sectionDraftFromCard(sectionCard);
  if (!preview || !draft) return;
  preview.innerHTML = renderIcon(resolvedSectionIcon(draft));
}

function switchEditorLocale(nextLocale) {
  if (!AVAILABLE_LANGUAGES.some((language) => language.code === nextLocale)) return;

  state = saveTemplate(collectTemplate());
  selectedEditorLocale = nextLocale;
  shouldSeedExpandedSection = true;
  syncFields();
  setStatus(`Ora stai modificando la lingua ${nextLocale.toUpperCase()}.`, "success");
}

function updateEnabledLocales() {
  state = saveTemplate(collectTemplate());
  syncFields();
  setStatus("Lingue visibili aggiornate. L'app ospiti si sincronizza automaticamente.", "success");
  queueAutoPublish();
}

function createSectionId() {
  return `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function sectionDataSelector(sectionId) {
  return `[data-section-id="${CSS.escape(String(sectionId ?? ""))}"]`;
}

function addSection() {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Aggiungi nuovi pulsanti solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  state = collectTemplate();
  currentLocaleState().sections.push({
    id: createSectionId(),
    icon: "spark",
    hidden: false,
    menuTitle: "Nuovo pulsante",
    sectionTitle: "Nuova sezione",
    lead: "",
    items: [],
  });
  expandedSectionIds.add(currentLocaleState().sections.at(-1).id);
  state = saveTemplate(state);
  syncFields();
  queueAutoPublish();
  setStatus("Nuovo pulsante aggiunto. Ora compila i campi della nuova sezione.", "success");
}

function cloneSection(section) {
  return JSON.parse(JSON.stringify(section));
}

function duplicateSection(sectionId) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Duplica sezioni solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  state = collectTemplate();
  const sections = currentLocaleState().sections;
  const sectionIndex = sections.findIndex((section) => section.id === sectionId);
  if (sectionIndex < 0) return;

  const sourceSection = sections[sectionIndex];
  if (sourceSection.id === "host") return;

  const duplicated = cloneSection(sourceSection);
  duplicated.id = createSectionId();
  duplicated.hidden = false;
  duplicated.menuTitle = `${sourceSection.menuTitle} copia`;
  duplicated.sectionTitle = `${sourceSection.sectionTitle} copia`;

  sections.splice(sectionIndex + 1, 0, duplicated);
  expandedSectionIds.add(duplicated.id);
  state = saveTemplate(state);
  syncFields();
  queueAutoPublish();
  setStatus(`Sezione "${sourceSection.menuTitle}" duplicata.`, "success");
}

function toggleSectionVisibility(sectionId) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Gestisci la visibilità solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  state = collectTemplate();
  const section = currentLocaleState().sections.find((item) => item.id === sectionId);
  if (!section || section.id === "host") return;

  section.hidden = !section.hidden;
  state = saveTemplate(state);
  syncFields();
  queueAutoPublish();
  setStatus(
    section.hidden
      ? `La sezione "${section.menuTitle}" è stata nascosta nell'app ospiti.`
      : `La sezione "${section.menuTitle}" è di nuovo visibile nell'app ospiti.`,
    "success",
  );
}

function appendLinkTemplate(sectionId) {
  const sectionCard = dom.sections.querySelector(sectionDataSelector(sectionId));
  const textarea = sectionCard?.querySelector('[data-field="items"]');
  if (!textarea) return;

  const scaffold = "+ LINK | https://example.com | Titolo link | Descrizione del link | Apri link";
  const currentValue = textarea.value.trimEnd();
  textarea.value = currentValue ? `${currentValue}\n\n${scaffold}` : scaffold;
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  setStatus("Scaffold link aggiunto. Compila URL, titolo, descrizione ed etichetta.", "success");
}

function updateSectionCtas(sectionId, updater) {
  state = collectTemplate();
  const section = currentLocaleState().sections.find((item) => item.id === sectionId);
  if (!section) return;

  const textItems = section.items.filter((item) => !isImageItem(item) && !isCtaItem(item));
  const imageItems = section.items.filter(isImageItem);
  const ctaItems = section.items.filter(isCtaItem);
  const nextCtas = updater([...ctaItems]) ?? ctaItems;

  section.items = [...textItems, ...nextCtas, ...imageItems];
  state = saveTemplate(state);
  syncFields();
  queueAutoPublish();
}

function addCta(sectionId, kind = "web") {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Aggiungi pulsanti grafici solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  updateSectionCtas(sectionId, (ctaItems) => {
    ctaItems.push(buildCtaPreset(kind));
    return ctaItems;
  });
  setStatus("Nuovo pulsante grafico aggiunto. Compila etichetta, destinazione e icona.", "success");
}

function toggleSection(sectionId) {
  if (!sectionId) return;
  if (expandedSectionIds.has(sectionId)) {
    expandedSectionIds.delete(sectionId);
  } else {
    expandedSectionIds.add(sectionId);
  }
  renderSectionEditors();
}

function removeSection(sectionId) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Rimuovi sezioni solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  state = collectTemplate();
  const sections = currentLocaleState().sections;
  const target = sections.find((section) => section.id === sectionId);
  if (!target) return;

  const confirmed = window.confirm(`Vuoi rimuovere il pulsante "${target.menuTitle}"?`);
  if (!confirmed) return;

  currentLocaleState().sections = sections.filter((section) => section.id !== sectionId);
  expandedSectionIds.delete(sectionId);
  state = saveTemplate(state);
  syncFields();
  queueAutoPublish();
  setStatus(`Pulsante "${target.menuTitle}" rimosso.`, "success");
}

function moveSection(sectionId, direction) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Riordina i pulsanti solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  state = collectTemplate();
  const sections = currentLocaleState().sections;
  const currentIndex = sections.findIndex((section) => section.id === sectionId);
  if (currentIndex < 0) return;

  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= sections.length) return;

  [sections[currentIndex], sections[nextIndex]] = [sections[nextIndex], sections[currentIndex]];
  state = saveTemplate(state);
  syncFields();
  queueAutoPublish();
  setStatus(`Ordine aggiornato: "${sections[nextIndex].menuTitle}" spostato.`, "success");
}

function clearSectionDropState() {
  dom.sections.querySelectorAll("[data-section-id]").forEach((card) => {
    card.classList.remove("is-dragging");
    delete card.dataset.dropPosition;
  });
}

function reorderSection(sectionId, targetSectionId, position = "before") {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Riordina i pulsanti solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  if (!sectionId || !targetSectionId || sectionId === targetSectionId) return;

  state = collectTemplate();
  const sections = currentLocaleState().sections;
  const sourceIndex = sections.findIndex((section) => section.id === sectionId);
  const targetIndex = sections.findIndex((section) => section.id === targetSectionId);
  if (sourceIndex < 0 || targetIndex < 0) return;

  const [movedSection] = sections.splice(sourceIndex, 1);
  let insertIndex = sections.findIndex((section) => section.id === targetSectionId);
  if (insertIndex < 0) {
    sections.push(movedSection);
  } else {
    if (position === "after") insertIndex += 1;
    sections.splice(insertIndex, 0, movedSection);
  }

  state = saveTemplate(state);
  syncFields();
  queueAutoPublish();
  setStatus(`Ordine aggiornato: "${movedSection.menuTitle}" riposizionato.`, "success");
}

function removeCta(sectionId, ctaIndex) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Rimuovi pulsanti grafici solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  updateSectionCtas(sectionId, (ctaItems) => ctaItems.filter((_, index) => index !== ctaIndex));
  setStatus("Pulsante grafico rimosso.", "success");
}

function moveCta(sectionId, ctaIndex, direction) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Riordina i pulsanti grafici solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  updateSectionCtas(sectionId, (ctaItems) => {
    const nextIndex = ctaIndex + direction;
    if (nextIndex < 0 || nextIndex >= ctaItems.length) return ctaItems;
    [ctaItems[ctaIndex], ctaItems[nextIndex]] = [ctaItems[nextIndex], ctaItems[ctaIndex]];
    return ctaItems;
  });
  setStatus("Ordine dei pulsanti grafici aggiornato.", "success");
}

function isAuthorizedSession(nextSession) {
  const email = nextSession?.user?.email?.toLowerCase();
  return Boolean(nextSession && email === HOST_EMAIL.toLowerCase());
}

function updateAccessState() {
  const allowed = isAuthorizedSession(session);
  const showEditor = allowed && window.location.hash === EDITOR_HASH && editorReady;
  dom.gate.classList.toggle("hidden", showEditor);
  dom.app.classList.toggle("hidden", !showEditor);
}

async function hydrateEditorState() {
  shouldSeedExpandedSection = true;
  state = await loadTemplate({ preferLocal: true });

  try {
    const remote = await fetchRemoteTemplateRow(supabase);
    latestRemoteUpdatedAt = remote.updated_at ?? null;
    if (remote.content) {
      state = normalizeTemplate(remote.content);
    }
  } catch {
    latestRemoteUpdatedAt = null;
  }

  syncFields();
}

async function openEditor() {
  if (!isAuthorizedSession(session) || editorLoading) return;

  editorLoading = true;
  setStatus("Caricamento editor...", "");
  editorReady = false;
  if (window.location.hash !== EDITOR_HASH) {
    window.location.hash = EDITOR_HASH;
  }
  updateAccessState();
  try {
    await hydrateEditorState();
    bindEditorEvents();
    editorReady = true;
    updateAccessState();
    setStatus("Accesso host attivo. Le modifiche si sincronizzano live.", "success");
  } finally {
    editorLoading = false;
  }
}

function saveCurrentTemplate() {
  state = saveTemplate(collectTemplate());
  setStatus("Bozza locale salvata su questo browser.", "success");
}

function downloadTemplate() {
  const blob = new Blob([JSON.stringify(collectTemplate(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "template.json";
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("template.json esportato.", "success");
}

async function publishNow({ silent = false } = {}) {
  if (!isAuthorizedSession(session)) {
    setStatus("Accedi come host per sincronizzare le modifiche live.", "error");
    return;
  }

  state = saveTemplate(collectTemplate());
  if (!silent) {
    setStatus("Traduzione e sincronizzazione live in corso...", "");
  }

  try {
    state = await buildPublishedTemplate(state);
    saveTemplate(state);
    const published = await publishRemoteTemplate(state, supabase);
    latestRemoteUpdatedAt = published.updated_at ?? null;
    const fallbackLocales = [...new Set(lastTranslationFallbackLocales)];
    const fallbackNote = fallbackLocales.length
      ? ` Traduzione non disponibile per: ${fallbackLocales.map((code) => code.toUpperCase()).join(", ")}; pubblicato il testo italiano.`
      : "";
    if (!silent) {
      setStatus(`Template sincronizzato live. L'app ospiti si aggiorna in remoto.${fallbackNote}`, "success");
    } else {
      setStatus(`Modifiche sincronizzate live.${fallbackNote}`, "success");
    }
  } catch {
    setStatus("Sincronizzazione live fallita. Verifica accesso host, setup Supabase o traduzione online.", "error");
  }
}

function queueAutoPublish() {
  if (!isAuthorizedSession(session)) return;
  window.clearTimeout(autoPublishTimer);
  setStatus("Modifica rilevata. Sincronizzazione live tra pochi secondi...", "");
  autoPublishTimer = window.setTimeout(() => {
    publishNow({ silent: true });
  }, AUTO_PUBLISH_DELAY);
}

async function restoreDefaultTemplate() {
  clearTemplate();
  shouldSeedExpandedSection = true;
  state = normalizeTemplate(defaultTemplate);
  syncFields();
  setStatus("Template ripristinato ai valori di default.", "success");
  await publishNow({ silent: true });
}

async function importTemplate(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      shouldSeedExpandedSection = true;
      state = saveTemplate(parsed);
      syncFields();
      setStatus("Template importato correttamente.", "success");
      await publishNow({ silent: true });
    } catch {
      setStatus("Il file JSON non è valido.", "error");
    }
  };
  reader.readAsText(file);
}

async function handleImageUpload(sectionId, file) {
  if (!file) return;
  if (!isAuthorizedSession(session)) {
    setStatus("Accedi come host per caricare immagini.", "error");
    return;
  }

  state = collectTemplate();
  setStatus("Upload immagine in corso...", "");

  try {
    const uploaded = await uploadSectionImage(file, sectionId, supabase);
    const section = currentLocaleState().sections.find((item) => item.id === sectionId);
    if (!section) return;

    section.items.push({
      type: "image",
      path: uploaded.path,
      src: uploaded.src,
      alt: file.name.replace(/\.[^.]+$/, ""),
      caption: "",
    });

    state = saveTemplate(state);
    syncFields();
    setStatus("Immagine caricata. La sincronizzazione live parte ora.", "success");
    queueAutoPublish();
  } catch (error) {
    setStatus(error.message || "Upload immagine fallito.", "error");
  }
}

function countImagePathUsage(templateState, imagePath) {
  if (!imagePath || !templateState?.locales?.[FIXED_LOCALE]) return 0;
  return templateState.locales[FIXED_LOCALE].sections.reduce((count, section) => {
    const items = Array.isArray(section?.items) ? section.items : [];
    return count + items.filter((item) => isImageItem(item) && item.path === imagePath).length;
  }, 0);
}

async function removeImage(sectionId, imageIndex) {
  state = collectTemplate();
  const section = currentLocaleState().sections.find((item) => item.id === sectionId);
  if (!section) return;
  const imageItems = section.items.filter(isImageItem);
  const target = imageItems[imageIndex];
  if (!target) return;

  try {
    const pathUsageCount = countImagePathUsage(state, target.path);
    if (target.path && pathUsageCount <= 1 && isAuthorizedSession(session)) {
      await deleteSectionImage(target.path, supabase);
    }

    section.items = section.items.filter((item) => item !== target);
    state = saveTemplate(state);
    syncFields();
    setStatus("Immagine rimossa dalla sezione.", "success");
    queueAutoPublish();
  } catch (error) {
    setStatus(error.message || "Rimozione immagine fallita.", "error");
  }
}

async function login() {
  const password = dom.password.value.trim();
  if (!password) {
    setStatus("Inserisci la password host.", "error");
    return;
  }

  setStatus("Accesso host in corso...", "");
  const { error } = await supabase.auth.signInWithPassword({
    email: HOST_EMAIL,
    password,
  });

  if (error) {
    setStatus("Accesso fallito. Verifica la password host in Supabase Auth.", "error");
    return;
  }

  dom.password.value = "";
  await openEditor();
}

async function logout() {
  window.clearTimeout(autoPublishTimer);
  await supabase.auth.signOut();
  session = null;
  editorReady = false;
  window.location.replace("./host.html");
  updateAccessState();
  setStatus("Sessione host chiusa.", "success");
}

function guestAppUrl() {
  return "https://stampacecharming.pages.dev/";
}

function guestSharePayload() {
  const url = guestAppUrl();
  return {
    title: "Guest Book- Stampace Charming",
    text: "Guest Book- Stampace Charming",
    url,
  };
}

async function shareGuestApp() {
  const payload = guestSharePayload();
  const mobileShare = navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobileShare) {
    try {
      await navigator.share(payload);
      setStatus("Condivisione app guest avviata.", "success");
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  const message = `${payload.text}\n${payload.url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  setStatus("WhatsApp aperto. Scegli il contatto a cui inviare la Guest App.", "success");
}

function bindEditorEvents() {
  if (editorBound) return;
  editorBound = true;

  dom.addSection.addEventListener("click", addSection);
  dom.logout.addEventListener("click", logout);
  dom.shareGuest.addEventListener("click", shareGuestApp);

  dom.app.addEventListener("input", (event) => {
    if (!event.target.matches("input, textarea")) return;
    if (event.target.matches('[data-field="menuTitle"], [data-field="sectionTitle"], [data-field="lead"]')) {
      updateSectionIconPreview(event.target.closest("[data-section-id]"));
    }
    queueAutoPublish();
  });

  dom.editorLocale.addEventListener("change", (event) => {
    switchEditorLocale(event.target.value);
  });

  dom.optionalLocale.addEventListener("change", () => {
    updateEnabledLocales();
  });

  dom.fontPrimary.addEventListener("change", () => {
    state = saveTemplate(collectTemplate());
    syncFields();
    queueAutoPublish();
  });

  dom.fontSecondary.addEventListener("change", () => {
    state = saveTemplate(collectTemplate());
    syncFields();
    queueAutoPublish();
  });

  dom.app.addEventListener("change", (event) => {
    if (!event.target.matches("[data-theme-field]")) return;
    queueAutoPublish();
  });

  dom.sections.addEventListener("change", (event) => {
    const uploader = event.target.closest("[data-image-upload]");
    if (!uploader) return;
    const sectionCard = event.target.closest("[data-section-id]");
    handleImageUpload(sectionCard?.dataset.sectionId, event.target.files?.[0]);
    event.target.value = "";
  });

  dom.sections.addEventListener("change", (event) => {
    if (event.target.matches('[data-field="icon"]')) {
      updateSectionIconPreview(event.target.closest("[data-section-id]"));
      queueAutoPublish();
      return;
    }
    if (!event.target.matches('[data-cta-field], [data-image-field="size"]')) return;
    queueAutoPublish();
  });

  dom.sections.addEventListener("click", (event) => {
    const toggleTrigger = event.target.closest('[data-action="toggle-section"]');
    if (toggleTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      toggleSection(sectionCard?.dataset.sectionId);
      return;
    }

    const removeSectionTrigger = event.target.closest('[data-action="remove-section"]');
    if (removeSectionTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      removeSection(sectionCard?.dataset.sectionId);
      return;
    }

    const duplicateSectionTrigger = event.target.closest('[data-action="duplicate-section"]');
    if (duplicateSectionTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      duplicateSection(sectionCard?.dataset.sectionId);
      return;
    }

    const toggleVisibilityTrigger = event.target.closest('[data-action="toggle-section-visibility"]');
    if (toggleVisibilityTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      toggleSectionVisibility(sectionCard?.dataset.sectionId);
      return;
    }

    const addLinkTrigger = event.target.closest('[data-action="add-link"]');
    if (addLinkTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      appendLinkTemplate(sectionCard?.dataset.sectionId);
      return;
    }

    const addCtaTrigger = event.target.closest('[data-action="add-cta"]');
    if (addCtaTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      addCta(sectionCard?.dataset.sectionId);
      return;
    }

    const addCtaPresetTrigger = event.target.closest('[data-action="add-cta-preset"]');
    if (addCtaPresetTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      addCta(sectionCard?.dataset.sectionId, addCtaPresetTrigger.dataset.ctaKind || "web");
      return;
    }

    const removeCtaTrigger = event.target.closest('[data-action="remove-cta"]');
    if (removeCtaTrigger) {
      const ctaCard = event.target.closest("[data-cta-item]");
      const sectionCard = event.target.closest("[data-section-id]");
      removeCta(sectionCard?.dataset.sectionId, Number.parseInt(ctaCard?.dataset.ctaIndex ?? "-1", 10));
      return;
    }

    const moveCtaUpTrigger = event.target.closest('[data-action="move-cta-up"]');
    if (moveCtaUpTrigger) {
      const ctaCard = event.target.closest("[data-cta-item]");
      const sectionCard = event.target.closest("[data-section-id]");
      moveCta(sectionCard?.dataset.sectionId, Number.parseInt(ctaCard?.dataset.ctaIndex ?? "-1", 10), -1);
      return;
    }

    const moveCtaDownTrigger = event.target.closest('[data-action="move-cta-down"]');
    if (moveCtaDownTrigger) {
      const ctaCard = event.target.closest("[data-cta-item]");
      const sectionCard = event.target.closest("[data-section-id]");
      moveCta(sectionCard?.dataset.sectionId, Number.parseInt(ctaCard?.dataset.ctaIndex ?? "-1", 10), 1);
      return;
    }

    const removeTrigger = event.target.closest('[data-action="remove-image"]');
    if (!removeTrigger) return;
    const imageItem = event.target.closest("[data-image-item]");
    const sectionCard = event.target.closest("[data-section-id]");
    removeImage(sectionCard?.dataset.sectionId, Number.parseInt(imageItem?.dataset.imageIndex ?? "-1", 10));
  });

  dom.sections.addEventListener("dragstart", (event) => {
    const handle = event.target.closest('[data-action="drag-section"]');
    if (!handle || selectedEditorLocale !== FIXED_LOCALE) {
      event.preventDefault();
      return;
    }

    const sectionCard = event.target.closest("[data-section-id]");
    draggingSectionId = sectionCard?.dataset.sectionId ?? null;
    if (!draggingSectionId) {
      event.preventDefault();
      return;
    }

    clearSectionDropState();
    sectionCard.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggingSectionId);
  });

  dom.sections.addEventListener("dragover", (event) => {
    if (!draggingSectionId) return;
    const sectionCard = event.target.closest("[data-section-id]");
    if (!sectionCard || sectionCard.dataset.sectionId === draggingSectionId) return;

    event.preventDefault();
    const rect = sectionCard.getBoundingClientRect();
    const position = event.clientY > rect.top + rect.height / 2 ? "after" : "before";
    dom.sections.querySelectorAll("[data-section-id]").forEach((card) => {
      if (card !== sectionCard) delete card.dataset.dropPosition;
    });
    sectionCard.dataset.dropPosition = position;
  });

  dom.sections.addEventListener("drop", (event) => {
    const sectionCard = event.target.closest("[data-section-id]");
    if (!draggingSectionId || !sectionCard) return;

    event.preventDefault();
    const targetSectionId = sectionCard.dataset.sectionId;
    const position = sectionCard.dataset.dropPosition || "before";
    clearSectionDropState();
    reorderSection(draggingSectionId, targetSectionId, position);
    draggingSectionId = null;
  });

  dom.sections.addEventListener("dragend", () => {
    draggingSectionId = null;
    clearSectionDropState();
  });

  dom.app.addEventListener("click", (event) => {
    const panelTrigger = event.target.closest('[data-action="toggle-panel"]');
    if (!panelTrigger) return;
    const panel = event.target.closest("[data-panel-id]");
    togglePanel(panel?.dataset.panelId);
  });
}

function bindAuthEvents() {
  if (authBound) return;
  authBound = true;

  dom.login.addEventListener("click", login);
  dom.password.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      login();
    }
  });
  supabase.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession;
    if (!isAuthorizedSession(session)) {
      editorReady = false;
      editorLoading = false;
      updateAccessState();
      return;
    }

    if (window.location.hash === EDITOR_HASH && !editorReady) {
      openEditor().catch(() => {
        setStatus("Caricamento editor fallito.", "error");
      });
      return;
    }

    if (window.location.hash === EDITOR_HASH && editorReady) {
      setStatus("Accesso host attivo. Le modifiche si sincronizzano live.", "success");
    }
  });

  window.addEventListener("hashchange", () => {
    if (isAuthorizedSession(session) && window.location.hash === EDITOR_HASH && !editorReady) {
      openEditor().catch(() => {
        setStatus("Caricamento editor fallito.", "error");
      });
      return;
    }

    if (window.location.hash !== EDITOR_HASH) {
      editorReady = false;
      editorLoading = false;
      updateAccessState();
    }
  });
}

async function init() {
  dom.email.value = HOST_EMAIL;
  bindAuthEvents();

  const { data } = await supabase.auth.getSession();
  session = data.session;
  updateAccessState();

  if (isAuthorizedSession(session) && window.location.hash === EDITOR_HASH) {
    await openEditor();
    return;
  }

  setStatus("", "");
}

init();
