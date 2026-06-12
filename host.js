import {
  AVAILABLE_LANGUAGES,
  clearTemplate,
  CTA_ITEM_TYPE,
  defaultTemplate,
  FIXED_LOCALE,
  getHostPrivateItem,
  HOST_PRIVATE_ITEM,
  MEDIA_ITEM_TYPE,
  REQUIRED_LOCALES,
  isCtaItem,
  isImageItem,
  isMediaItem,
  isHostPrivateItem,
  loadTemplate,
  normalizeTemplate,
  saveTemplate,
  SUBMENU_TRANSLATIONS,
} from "./content.js?v=20260610h";
import {
  deleteSectionImage,
  deleteSectionMedia,
  fetchRemoteTemplateRow,
  getHostSupabase,
  HOST_EMAIL,
  DOCUMENT_MAX_BYTES,
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
  publishRemoteTemplate,
  uploadSectionImage,
  uploadSectionMedia,
} from "./supabase.js";
import {
  escapeAttribute,
  escapeHtml,
  normalizeCtaHref,
  normalizeCtaKind,
  sanitizeCssColor,
  sanitizeHref,
  sanitizeImageSrc,
} from "./security.js?v=20260610h";
import { renderIcon, iconPaths } from "./icons.js?v=20260610h";
import { themeValue, iconColorStyle, iconColorValue } from "./theme-utils.js?v=20260610h";

// Unregister any active service worker on the host panel to avoid caching stale code
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((unregistered) => {
        if (unregistered) {
          console.log("Service Worker unregistered successfully for Host Panel.");
        }
      });
    }
  });
}



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
  addCategory: document.querySelector("#host-add-category"),
  categories: document.querySelector("#host-categories"),
  editorLocale: document.querySelector("#field-editor-locale"),
  optionalLocale: document.querySelector("#field-optional-locale"),
  appName: document.querySelector("#field-app-name"),
  subtitle: document.querySelector("#field-subtitle"),
  introLines: document.querySelector("#field-intro-lines"),
  fontPrimary: document.querySelector("#field-font-primary"),
  fontSecondary: document.querySelector("#field-font-secondary"),
  menuFont: document.querySelector("#field-menu-font"),
  ctaFont: document.querySelector("#field-cta-font"),
  sectionTitleFont: document.querySelector("#field-section-title-font"),
  titleSize: document.querySelector("#field-title-size"),
  subtitleSize: document.querySelector("#field-subtitle-size"),
  menuSize: document.querySelector("#field-menu-size"),
  menuWeight: document.querySelector("#field-menu-weight"),
  sectionTitleSize: document.querySelector("#field-section-title-size"),
  bodySize: document.querySelector("#field-body-size"),
  bodyWeight: document.querySelector("#field-body-weight"),
  introSize: document.querySelector("#field-intro-size"),
  introWeight: document.querySelector("#field-intro-weight"),
  introAlign: document.querySelector("#field-intro-align"),
  introFont: document.querySelector("#field-intro-font"),
  introColor: document.querySelector("#field-intro-color"),
  sectionLeadSize: document.querySelector("#field-section-lead-size"),
  sectionLeadWeight: document.querySelector("#field-section-lead-weight"),
  sectionLeadFont: document.querySelector("#field-section-lead-font"),
  sectionLeadColor: document.querySelector("#field-section-lead-color"),
  sectionBodySize: document.querySelector("#field-section-body-size"),
  sectionBodyWeight: document.querySelector("#field-section-body-weight"),
  sectionBodyFont: document.querySelector("#field-section-body-font"),
  sectionBodyColor: document.querySelector("#field-section-body-color"),
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
const STORAGE_TRANSLATION_CACHE_KEY = "stampace-translation-cache-v1";
let translationCache = new Map();
try {
  const storedTranslationCache = window.localStorage.getItem(STORAGE_TRANSLATION_CACHE_KEY);
  if (storedTranslationCache) {
    translationCache = new Map(JSON.parse(storedTranslationCache));
  }
} catch (e) {
  console.warn("Could not load translation cache", e);
}

function saveTranslationCache() {
  try {
    window.localStorage.setItem(STORAGE_TRANSLATION_CACHE_KEY, JSON.stringify([...translationCache]));
  } catch (e) {
    console.warn("Could not save translation cache", e);
  }
}
let lastTranslationFallbackLocales = [];
const expandedSectionIds = new Set();
const expandedCategoryIds = new Set(["casa", "citta"]);
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
  { value: "Cormorant Garamond", label: "Cormorant Garamond (Serif lusso tradizionale)" },
  { value: "Poppins", label: "Poppins (Sans-serif geometrico morbido)" },
  { value: "Lato", label: "Lato (Sans-serif caldo e leggibile)" },
  { value: "Cinzel", label: "Cinzel (Serif classico romano scolpito)" },
  { value: "Merriweather", label: "Merriweather (Serif caldo e accogliente)" },
  { value: "Prata", label: "Prata (Serif elegante con forte contrasto)" },
  { value: "Italiana", label: "Italiana (Serif ispirato al design italiano)" },
  { value: "Bodoni Moda", label: "Bodoni Moda (Didone di lusso contemporaneo)" },
  { value: "Josefin Sans", label: "Josefin Sans (Sans-serif geometrico retro-chic)" },
  { value: "Oswald", label: "Oswald (Sans-serif condensato audace)" },
  { value: "Manrope", label: "Manrope (Sans-serif geometrico moderno pulito)" },
  { value: "Spectral", label: "Spectral (Serif elegante ottimizzato per lettura)" },
  { value: "Syne", label: "Syne (Sans-serif artistico e contemporaneo)" },
  { value: "DM Serif Display", label: "DM Serif Display (Display classico solido)" },
  { value: "Syncopate", label: "Syncopate (Sans-serif esteso e tecnologico)" },
  { value: "Cormorant", label: "Cormorant (Serif lussuoso e sottile)" },
  { value: "Libre Baskerville", label: "Libre Baskerville (Serif classico tradizionale)" },
  { value: "Quicksand", label: "Quicksand (Sans-serif geometrico arrotondato)" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Sans-serif moderno tech/design)" }
];
const FONT_WEIGHT_OPTIONS = [
  { value: "300", label: "Leggero" },
  { value: "400", label: "Normale" },
  { value: "500", label: "Medio" },
  { value: "600", label: "Grassetto" },
];
const EXTENDED_FONT_OPTIONS = [
  { value: "secondary", label: "Usa font testi (default)" },
  { value: "primary", label: "Usa font titoli" },
  ...AVAILABLE_FONTS
];
const TEXT_ALIGN_OPTIONS = [
  { value: "left", label: "Sinistra" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Destra" },
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
  { value: "#3fc7b0", label: "Teal mediterraneo" },
  { value: "#c98252", label: "Rame caldo" },
  { value: "#ffffff", label: "Bianco" },
];
const ICON_COLOR_OPTIONS = [
  { value: "", label: "Automatico" },
  { value: "#dfc39c", label: "Oro caldo" },
  { value: "#e7d8c1", label: "Oro chiaro" },
  { value: "#5fa8ff", label: "Blu elegante" },
  { value: "#e45f53", label: "Rosso terracotta" },
  { value: "#44c77a", label: "Verde WhatsApp" },
  { value: "#3fc7b0", label: "Teal mediterraneo" },
  { value: "#c98252", label: "Rame caldo" },
  { value: "#f3eadc", label: "Avorio" },
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
  { value: "airbnb", label: "Airbnb" },
  { value: "booking", label: "Booking" },
  { value: "vrbo", label: "Vrbo" },
];
const CTA_ICON_OPTIONS = [
  { value: "map", label: "Mappa" },
  { value: "phone", label: "Telefono" },
  { value: "mail", label: "Email" },
  { value: "gmail", label: "Gmail" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "chat", label: "Chat" },
  { value: "link", label: "Link" },
  { value: "route", label: "Percorso" },
  { value: "bicycle", label: "Bicicletta" },
  { value: "pedestrian", label: "Persona a piedi" },
  { value: "car", label: "Auto" },
  { value: "bus", label: "Bus" },
  { value: "taxi", label: "Taxi" },
  { value: "airplane", label: "Aeroporto" },
  { value: "ferry", label: "Traghetto" },
  { value: "boat", label: "Barca" },
  { value: "beach", label: "Spiaggia" },
  { value: "paddle", label: "SUP / Kayak" },
  { value: "walk", label: "Passeggiata" },
  { value: "trail", label: "Escursione" },
  { value: "camera", label: "Visita / Foto" },
  { value: "museum", label: "Museo / Cultura" },
  { value: "utensils", label: "Ristorante" },
  { value: "coffee", label: "Bar / Caffe" },
  { value: "wine", label: "Vino / Aperitivo" },
  { value: "shopping", label: "Shopping" },
  { value: "parking", label: "Parcheggio" },
  { value: "hospital", label: "Pronto soccorso" },
  { value: "info", label: "Informazioni" },
  { value: "warning", label: "Avviso" },
  { value: "star", label: "Consigliato" },
  { value: "heart", label: "Preferito" },
  { value: "globe", label: "Sito / Lingue" },
  { value: "book", label: "Guida" },
  { value: "ticket", label: "Ticket" },
  { value: "home", label: "Casa" },
  { value: "key", label: "Chiave" },
  { value: "airbnb", label: "Airbnb" },
  { value: "booking", label: "Booking" },
  { value: "vrbo", label: "Vrbo" },
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
  { value: "bicycle", label: "Bicicletta" },
  { value: "pedestrian", label: "Persona a piedi" },
  { value: "car", label: "Auto / Parcheggio" },
  { value: "bus", label: "Bus / Transfer" },
  { value: "train", label: "Treno" },
  { value: "utensils", label: "Ristoranti" },
  { value: "cart", label: "Spesa" },
  { value: "cross", label: "Farmacia / Emergenze" },
  { value: "wave", label: "Mare" },
  { value: "beach", label: "Spiaggia" },
  { value: "boat", label: "Barca" },
  { value: "paddle", label: "SUP / Kayak" },
  { value: "walk", label: "Passeggiata" },
  { value: "trail", label: "Escursioni" },
  { value: "camera", label: "Visite guidate / Foto" },
  { value: "museum", label: "Musei / Cultura" },
  { value: "binoculars", label: "Dintorni" },
  { value: "coffee", label: "Bar / Caffe" },
  { value: "wine", label: "Vino / Aperitivo" },
  { value: "shopping", label: "Shopping" },
  { value: "parking", label: "Parcheggio" },
  { value: "taxi", label: "Taxi" },
  { value: "airplane", label: "Aeroporto" },
  { value: "ferry", label: "Traghetto" },
  { value: "receipt", label: "Pagamenti" },
  { value: "id", label: "Documenti" },
  { value: "hospital", label: "Pronto soccorso" },
  { value: "info", label: "Informazioni" },
  { value: "warning", label: "Avvisi" },
  { value: "star", label: "Consigliati" },
  { value: "heart", label: "Preferiti" },
  { value: "globe", label: "Sito / Lingue" },
  { value: "book", label: "Guida" },
  { value: "phone", label: "Telefono" },
  { value: "mail", label: "Email" },
  { value: "home", label: "Casa" },
  { value: "city", label: "Città" },
  { value: "skyline", label: "Skyline città" },
  { value: "user", label: "Host" },
];
const CTA_PRESET_OPTIONS = [
  { kind: "web", label: "CTA Web" },
  { kind: "maps", label: "CTA Mappa" },
  { kind: "whatsapp", label: "CTA WhatsApp" },
  { kind: "email", label: "CTA Email" },
  { kind: "tel", label: "CTA Telefono" },
  { kind: "airbnb", label: "Icona Airbnb" },
  { kind: "booking", label: "Icona Booking" },
  { kind: "vrbo", label: "Icona Vrbo" },
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
  if (/spiagg|beach|poetto|mare/.test(text)) return "beach";
  if (/barca|boat|sail|vela|gommon|yacht/.test(text)) return "boat";
  if (/sup|kayak|canoa|paddle/.test(text)) return "paddle";
  if (/walk|walking|passeggiat|cammin/.test(text)) return "walk";
  if (/visita guid|guided tour|foto|photo|camera/.test(text)) return "camera";
  if (/muse|cultur|arte|storia/.test(text)) return "museum";
  if (/ristorant|locali|bar|aperitiv|food|drink|cibo|spesa|market|supermercat/.test(text)) return "utensils";
  if (/bici|biciclett|bike|cycling|ciclab/.test(text)) return "bicycle";
  if (/a piedi|pedon|pedestrian/.test(text)) return "pedestrian";
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
  const textStyles = theme?.textStyles || {};

  const serifFonts = ["Playfair Display", "Lora", "Cormorant Garamond"];
  const primaryFallback = serifFonts.includes(primaryFont) ? "serif" : "sans-serif";
  const secondaryFallback = serifFonts.includes(secondaryFont) ? "serif" : "sans-serif";

  const resolveFont = (val) => {
    if (val === "primary") return primaryFont;
    if (val === "secondary" || !val) return secondaryFont;
    return val;
  };

  const introFont = resolveFont(textStyles.introFont);
  const sectionLeadFont = resolveFont(textStyles.sectionLeadFont);
  const sectionBodyFont = resolveFont(textStyles.sectionBodyFont);
  const menuFont = resolveFont(textStyles.menuFont || "primary");
  const ctaFont = resolveFont(textStyles.ctaFont || "primary");
  const sectionTitleFont = resolveFont(textStyles.sectionTitleFont || "primary");

  const getFallback = (f) => serifFonts.includes(f) ? "serif" : "sans-serif";

  document.documentElement.style.setProperty("--font-primary", `"${primaryFont}", ${primaryFallback}`);
  document.documentElement.style.setProperty("--font-secondary", `"${secondaryFont}", ${secondaryFallback}`);
  document.documentElement.style.setProperty("--intro-font", `"${introFont}", ${getFallback(introFont)}`);
  document.documentElement.style.setProperty("--section-lead-font", `"${sectionLeadFont}", ${getFallback(sectionLeadFont)}`);
  document.documentElement.style.setProperty("--section-body-font", `"${sectionBodyFont}", ${getFallback(sectionBodyFont)}`);
  document.documentElement.style.setProperty("--menu-font", `"${menuFont}", ${getFallback(menuFont)}`);
  document.documentElement.style.setProperty("--cta-font", `"${ctaFont}", ${getFallback(ctaFont)}`);
  document.documentElement.style.setProperty("--section-title-font", `"${sectionTitleFont}", ${getFallback(sectionTitleFont)}`);

  document.documentElement.style.setProperty("--copy", themeValue(colors, "text", "#e7d8c1"));
  document.documentElement.style.setProperty("--text", "var(--copy)");
  document.documentElement.style.setProperty("--muted", themeValue(colors, "muted", "rgba(231, 216, 193, 0.72)"));
  document.documentElement.style.setProperty("--line", themeValue(colors, "line", "rgba(224, 205, 177, 0.12)"));

  const fontsToLoad = new Set([
    primaryFont,
    secondaryFont,
    introFont,
    sectionLeadFont,
    sectionBodyFont,
    menuFont,
    ctaFont,
    sectionTitleFont,
  ]);
  const localeTemplate = currentLocaleState();
  const categoriesList = Array.isArray(localeTemplate.categories) ? localeTemplate.categories : [];
  categoriesList.forEach((cat) => {
    if (cat && cat.fontFamily) {
      fontsToLoad.add(cat.fontFamily);
    }
  });

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
    if (["Playfair Display", "Lora", "Cormorant Garamond", "Cormorant", "Merriweather", "Spectral", "Libre Baskerville", "Bodoni Moda"].includes(font)) {
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
    whatsapp: "whatsapp",
    email: "gmail",
    tel: "phone",
    airbnb: "airbnb",
    booking: "booking",
    vrbo: "vrbo",
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
    airbnb: "Airbnb",
    booking: "Booking",
    vrbo: "Vrbo",
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
    airbnb: "https://www.airbnb.it/",
    booking: "https://www.booking.com/",
    vrbo: "https://www.vrbo.com/",
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

function colorToInputValue(value, fallback = "#dfc39c") {
  const color = sanitizeCssColor(value);
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return `#${color.slice(1).split("").map((char) => `${char}${char}`).join("")}`;
  }
  return fallback;
}

function setColorInputValue(field, value, fallback) {
  if (!field) return;
  field.value = colorToInputValue(value, fallback);
}

function colorInputHtml(fieldName, selectedValue = "", { cta = false, fallback = "#dfc39c" } = {}) {
  const attr = cta ? "data-cta-field" : "data-field";
  return `<input ${attr}="${escapeAttribute(fieldName)}" class="host-color-picker" type="color" value="${escapeAttribute(colorToInputValue(selectedValue, fallback))}" />`;
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
  fillSelect(dom.introSize, TEXT_SIZE_OPTIONS, typography.introSize);
  fillSelect(dom.introWeight, FONT_WEIGHT_OPTIONS, typography.introWeight);
  fillSelect(dom.introAlign, TEXT_ALIGN_OPTIONS, typography.introAlign);
  fillSelect(dom.introFont, EXTENDED_FONT_OPTIONS, theme?.textStyles?.introFont);
  fillSelect(dom.sectionLeadSize, TEXT_SIZE_OPTIONS, typography.sectionLeadSize);
  fillSelect(dom.sectionLeadWeight, FONT_WEIGHT_OPTIONS, typography.sectionLeadWeight);
  fillSelect(dom.sectionLeadFont, EXTENDED_FONT_OPTIONS, theme?.textStyles?.sectionLeadFont);
  fillSelect(dom.sectionBodySize, TEXT_SIZE_OPTIONS, typography.sectionBodySize);
  fillSelect(dom.sectionBodyWeight, FONT_WEIGHT_OPTIONS, typography.sectionBodyWeight);
  fillSelect(dom.sectionBodyFont, EXTENDED_FONT_OPTIONS, theme?.textStyles?.sectionBodyFont);
  fillSelect(dom.menuFont, EXTENDED_FONT_OPTIONS, theme?.textStyles?.menuFont);
  fillSelect(dom.ctaFont, EXTENDED_FONT_OPTIONS, theme?.textStyles?.ctaFont);
  fillSelect(dom.sectionTitleFont, EXTENDED_FONT_OPTIONS, theme?.textStyles?.sectionTitleFont);
  setColorInputValue(dom.colorBackground, colors.background, "#070605");
  setColorInputValue(dom.colorText, colors.text, "#e7d8c1");
  setColorInputValue(dom.colorMuted, colors.muted, "#cbb99d");
  setColorInputValue(dom.colorIcon, colors.icon, "#dfc39c");
  setColorInputValue(dom.colorLine, colors.line, "#504536");
  setColorInputValue(dom.colorRow, colors.row, "#17120e");
  setColorInputValue(dom.colorRowHover, colors.rowHover, "#241d17");
  setColorInputValue(dom.colorSheet, colors.sheet, "#0f0c09");
  setColorInputValue(dom.introColor, theme?.textStyles?.introColor, "#e7d8c1");
  setColorInputValue(dom.sectionLeadColor, theme?.textStyles?.sectionLeadColor, "#cbb99d");
  setColorInputValue(dom.sectionBodyColor, theme?.textStyles?.sectionBodyColor, "#e7d8c1");
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
      introSize: dom.introSize.value,
      introWeight: dom.introWeight.value,
      introAlign: dom.introAlign.value,
      sectionLeadSize: dom.sectionLeadSize.value,
      sectionLeadWeight: dom.sectionLeadWeight.value,
      sectionBodySize: dom.sectionBodySize.value,
      sectionBodyWeight: dom.sectionBodyWeight.value,
    },
    textStyles: {
      introFont: dom.introFont.value,
      introColor: dom.introColor.value,
      sectionLeadFont: dom.sectionLeadFont.value,
      sectionLeadColor: dom.sectionLeadColor.value,
      sectionBodyFont: dom.sectionBodyFont.value,
      sectionBodyColor: dom.sectionBodyColor.value,
      menuFont: dom.menuFont.value,
      ctaFont: dom.ctaFont.value,
      sectionTitleFont: dom.sectionTitleFont.value,
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
    iconColor: "",
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

async function translateIntroLine(text, targetLocale) {
  if (!text || targetLocale === FIXED_LOCALE) return text;
  const clean = text.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (clean === "keybox" || clean === "stampace") return text;
  const serviceLocale = TRANSLATE_LOCALE_MAP[targetLocale] ?? targetLocale;
  const key = translationKey(targetLocale, `introLines::${text}`);
  if (translationCache.has(key)) return translationCache.get(key);

  const params = new URLSearchParams({
    client: "gtx",
    sl: FIXED_LOCALE,
    tl: serviceLocale,
    dt: "t",
    q: text,
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
    const translated = (payload[0] ?? []).map((part) => part[0] ?? "").join("").trim();
    if (!translated || translated === text) {
      throw new Error("Traduzione vuota o invariata.");
    }
    translationCache.set(key, translated);
    saveTranslationCache();
    return translated;
  } catch {
    translationCache.delete(key);
    saveTranslationCache();
    lastTranslationFallbackLocales.push(targetLocale);
    return text;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function translateIntroLines(lines = [], targetLocale) {
  const translated = [];
  for (const line of lines) {
    translated.push(await translateIntroLine(line, targetLocale));
  }
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
    const clean = text.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (clean === "keybox" || clean === "stampace") {
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
    let shouldCache = true;
    try {
      translated = await translateBatch(missingTexts, targetLocale);
    } catch {
      lastTranslationFallbackLocales.push(targetLocale);
      translated = missingTexts;
      shouldCache = false;
    }
    translated.forEach((value, idx) => {
      const source = missingTexts[idx];
      const index = missingIndexes[idx];
      const key = translationKey(targetLocale, source);
      if (shouldCache) {
        translationCache.set(key, value);
      } else {
        translationCache.delete(key);
      }
      results[index] = value;
    });
    saveTranslationCache();
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
      introLines: [...(italianLocale.introLines ?? [])],
      subtitle: italianLocale.subtitle,
      categories: (italianLocale.categories || []).map((cat) => {
        const defaultTitle = SUBMENU_TRANSLATIONS.sc?.[cat.id] ?? 
                             SUBMENU_TRANSLATIONS.en[cat.id] ?? 
                             cat.menuTitle;
        return {
          ...cat,
          menuTitle: defaultTitle,
        };
      }),
      sections: italianLocale.sections.map((section, sectionIndex) => {
        const itBaseSection = ITALIAN_TEMPLATE_BASE.sections[sectionIndex] ?? {};
        const scBaseSection = SARDINIAN_TEMPLATE_BASE.sections[sectionIndex] ?? section;

        const pickSectionValue = (currentValue, italianBaseValue, sardinianBaseValue) =>
          currentValue !== italianBaseValue ? currentValue : sardinianBaseValue;

              const items = section.items.map((item, itemIndex) => {
                if (isImageItem(item)) return { ...item };
                if (isMediaItem(item)) return { ...item };
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
          iconColor: section.iconColor,
          menuTitle: pickSectionValue(section.menuTitle, itBaseSection.menuTitle, scBaseSection.menuTitle ?? section.menuTitle),
          sectionTitle: pickSectionValue(section.sectionTitle, itBaseSection.sectionTitle, scBaseSection.sectionTitle ?? section.sectionTitle),
          lead: pickSectionValue(section.lead, itBaseSection.lead, scBaseSection.lead ?? section.lead),
          items,
        };
      }),
    };
  }

  const draftLocale = {
    introLines: [],
    subtitle: "",
    categories: (italianLocale.categories || []).map((cat) => ({
      ...cat,
      menuTitle: "",
    })),
    sections: italianLocale.sections.map((section) => ({
      id: section.id,
      icon: section.icon,
      iconColor: section.iconColor,
      menuTitle: "",
      sectionTitle: "",
      lead: "",
      items: [],
    })),
  };

  const texts = [];
  const appliers = [];

  draftLocale.introLines = await translateIntroLines(italianLocale.introLines ?? [], targetLocale);

  texts.push(italianLocale.subtitle ?? "");
  appliers.push((value) => {
    draftLocale.subtitle = value;
  });

  (italianLocale.categories || []).forEach((cat, index) => {
    texts.push(cat.menuTitle || "");
    appliers.push((value) => {
      draftLocale.categories[index].menuTitle = value;
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
        const translatedItem = { ...item, alt: "", caption: "" };
        const nextIndex = targetSection.items.push(translatedItem) - 1;
        texts.push(item.alt ?? "");
        appliers.push((value) => {
          targetSection.items[nextIndex].alt = value;
        });
        texts.push(item.caption ?? "");
        appliers.push((value) => {
          targetSection.items[nextIndex].caption = value;
        });
        return;
      }

      if (isMediaItem(item)) {
        const translatedItem = { ...item, title: "", caption: "" };
        const nextIndex = targetSection.items.push(translatedItem) - 1;
        texts.push(item.title ?? "");
        appliers.push((value) => {
          targetSection.items[nextIndex].title = value;
        });
        texts.push(item.caption ?? "");
        appliers.push((value) => {
          targetSection.items[nextIndex].caption = value;
        });
        return;
      }

      if (isHostPrivateItem(item)) {
        targetSection.items.push({ ...getHostPrivateItem(targetLocale) });
        return;
      }

      if (isCtaItem(item)) {
        const isRestaurantSection = section.id === "around" || /ristoranti|locali/i.test(section.menuTitle || "");
        if (isRestaurantSection) {
          targetSection.items.push({ ...item });
          return;
        }
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
  next.locales = next.locales && typeof next.locales === "object" ? next.locales : {};
  next.locales[FIXED_LOCALE] = next.locales[FIXED_LOCALE] || {};
  const legacyIntroLines = Array.isArray(next.locales[FIXED_LOCALE].introLines)
    ? next.locales[FIXED_LOCALE].introLines
    : Array.isArray(next.locales[FIXED_LOCALE].heroMeta)
      ? next.locales[FIXED_LOCALE].heroMeta
      : Array.isArray(next.heroMeta)
        ? next.heroMeta
        : [];
  next.locales[FIXED_LOCALE].introLines = [...legacyIntroLines];
  delete next.locales[FIXED_LOCALE].heroMeta;
  delete next.heroMeta;
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
    .filter((item) => !isHostPrivateItem(item) && !isImageItem(item) && !isCtaItem(item) && !isMediaItem(item))
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
        const iconColor = sanitizeCssColor(item.iconColor);
        return `
        <article class="host-cta-item host-cta-item--${escapeAttribute(kind)}${item.hidden ? " is-hidden-cta" : ""}" data-cta-item data-cta-index="${escapeAttribute(index)}">
          <div class="host-cta-meta">
            <span class="host-cta-icon-preview host-cta-icon-preview--${escapeAttribute(kind)}" aria-hidden="true"${iconColorStyle(iconColor)}>${renderIcon(icon)}</span>
            <span class="host-cta-heading">
              <strong>${escapeHtml(item.label || "Nuovo pulsante grafico")}${item.hidden ? " (Nascosto)" : ""}</strong>
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
              <span>Colore icona</span>
              ${colorInputHtml("iconColor", iconColor, { cta: true })}
            </label>
            <label>
              <span>Etichetta bottone</span>
              <input data-cta-field="label" type="text" value="${escapeAttribute(item.label ?? "")}" ${!editable ? "disabled" : ""} />
            </label>
            <label>
              <span>Destinazione</span>
              <input data-cta-field="href" type="text" value="${escapeAttribute(href || item.href || "")}" ${!editable ? "disabled" : ""} />
            </label>
            <label>
              <span>Visibilità</span>
              <select data-cta-field="hidden" ${!editable ? "disabled" : ""}>
                <option value="false" ${!item.hidden ? "selected" : ""}>Visibile</option>
                <option value="true" ${item.hidden ? "selected" : ""}>Nascosta</option>
              </select>
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
  const editable = selectedEditorLocale === FIXED_LOCALE;
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
              <select data-image-field="size" ${!editable ? "disabled" : ""}>
                <option value="grande" ${size === "grande" ? "selected" : ""}>Grande (100%)</option>
                <option value="media" ${size === "media" ? "selected" : ""}>Media (65%)</option>
                <option value="piccola" ${size === "piccola" ? "selected" : ""}>Piccola (40%)</option>
              </select>
            </label>
          </div>
          <button class="ghost-button host-image-remove" type="button" data-action="remove-image" ${!editable ? "disabled" : ""}>Rimuovi</button>
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
                <span class="host-section-icon" data-section-icon-preview${iconColorStyle(section.iconColor)}>${renderIcon(resolvedSectionIcon(section))}</span>
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
              <button class="ghost-button host-remove-section" type="button" data-action="remove-section" ${section.id === "host" ? "disabled" : ""}>Rimuovi pulsante</button>
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
                <span>Colore icona</span>
                ${colorInputHtml("iconColor", section.iconColor)}
              </label>
              <label>
                <span>Categoria menu</span>
                <select data-field="category" ${selectedEditorLocale !== FIXED_LOCALE || section.id === "host" ? "disabled" : ""}>
                  <option value="top" ${section.category === "top" ? "selected" : ""}>Sempre visibile (in alto)</option>
                  ${(localeState.categories || []).map((cat) => `
                    <option value="${escapeAttribute(cat.id)}" ${section.category === cat.id ? "selected" : ""}>${escapeHtml(cat.menuTitle || "Nuovo Gruppo")}</option>
                  `).join("")}
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
                <button class="ghost-button" type="button" data-action="add-cta" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>${section.id === "host" ? "Aggiungi icona" : "Aggiungi pulsante grafico"}</button>
                <div class="host-cta-presets">
                  ${CTA_PRESET_OPTIONS.map((preset) => `<button class="ghost-button host-cta-preset" type="button" data-action="add-cta-preset" data-cta-kind="${escapeAttribute(preset.kind)}" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>${escapeHtml(preset.label)}</button>`).join("")}
                </div>
                <p class="host-content-note">Formato link: <code>+ LINK | https://example.com | Titolo | Descrizione | Etichetta</code></p>
              </div>
            </div>
            <div class="host-cta-editor">
              <div class="host-section-media-head">
                <div>
                  <p class="host-kicker">${section.id === "host" ? "Icone rapide" : "Pulsanti grafici"}</p>
                  <p class="host-media-note">${section.id === "host" ? "Icone tonde affiancate nella sezione Host. WhatsApp ed email mantengono il link automatico." : "CTA larghe con icona, etichetta e destinazione. Si aprono sempre in una nuova scheda."}</p>
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
                <label class="ghost-button file-button host-upload-button" style="${selectedEditorLocale !== FIXED_LOCALE ? "display: none;" : ""}">
                  <span>Aggiungi immagine</span>
                  <input data-image-upload type="file" accept="image/jpeg,image/png,image/webp" />
                </label>
              </div>
              <div class="host-image-list">
                ${renderSectionImages(section)}
              </div>
            </div>
            <div class="host-section-media">
              <div class="host-section-media-head">
                <div>
                  <p class="host-kicker">Documenti e video</p>
                  <p class="host-media-note">PDF, Word, Excel, PPT, TXT (max ${Math.round(DOCUMENT_MAX_BYTES / (1024 * 1024))} MB) oppure MP4, WebM, MOV (max ${Math.round(VIDEO_MAX_BYTES / (1024 * 1024))} MB).</p>
                </div>
                <label class="ghost-button file-button host-upload-button" style="${selectedEditorLocale !== FIXED_LOCALE ? "display: none;" : ""}">
                  <span>Aggiungi file</span>
                  <input data-media-upload type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp4,.webm,.mov" />
                </label>
              </div>
              <div class="host-media-list">
                ${renderSectionMedia(section)}
              </div>
            </div>
            ${
              section.id === "host"
                ? `<p class="host-lock-note">L'accesso riservato resta sempre disponibile come icona tonda nella sezione Host.</p>`
                : ""
            }
          </div>
        </section>
      `,
    )
    .join("");
}

function renderCategoryEditors() {
  if (!dom.categories) return;

  const localeState = currentLocaleState();
  const categories = localeState.categories || [];
  const sections = localeState.sections || [];

  dom.categories.innerHTML = categories
    .map(
      (cat, index) => `
        <section class="host-section-card${expandedCategoryIds.has(cat.id) ? "" : " is-collapsed"}${cat.hidden ? " is-hidden-section" : ""}" data-category-id="${escapeAttribute(cat.id)}" data-category-hidden="${cat.hidden ? "true" : "false"}">
          <div class="host-section-meta">
            <div class="host-section-meta-main">
              <button class="host-section-toggle" type="button" data-action="toggle-category" data-category-id="${escapeAttribute(cat.id)}" aria-expanded="${expandedCategoryIds.has(cat.id) ? "true" : "false"}">
                <span class="host-section-icon" data-category-icon-preview${iconColorStyle(cat.iconColor)}>${renderIcon(cat.icon)}</span>
                <span class="host-section-heading">
                  <span>
                    <p class="host-kicker">Pulsante Principale</p>
                    <h2>${escapeHtml(cat.menuTitle || "Nuovo Gruppo")}</h2>
                  </span>
                  <span class="host-section-chevron" aria-hidden="true">⌄</span>
                </span>
              </button>
            </div>
            <div class="host-section-actions">
              <button class="ghost-button host-section-secondary" type="button" data-action="toggle-category-visibility" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>${cat.hidden ? "Mostra" : "Nascondi"}</button>
              <button class="ghost-button host-remove-section" type="button" data-action="remove-category" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>Rimuovi</button>
            </div>
          </div>
          <div class="host-section-body">
            <div class="host-section-grid">
              <label>
                <span>Nome pulsante</span>
                <input data-field="menuTitle" type="text" value="${escapeAttribute(cat.menuTitle)}" />
              </label>
              <label>
                <span>Icona</span>
                <select data-field="icon" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>
                  ${sectionIconOptions(cat.icon).map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === cat.icon ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Colore icona</span>
                ${colorInputHtml("iconColor", cat.iconColor)}
              </label>
              <label>
                <span>Colore sfondo</span>
                ${colorInputHtml("bgColor", cat.bgColor)}
              </label>
              <label>
                <span>Colore testo</span>
                ${colorInputHtml("textColor", cat.textColor)}
              </label>
              <label>
                <span>Dimensione font</span>
                <input data-field="fontSize" type="text" placeholder="es. 16px, 1.1rem" value="${escapeAttribute(cat.fontSize || "")}" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""} />
              </label>
              <label>
                <span>Font family</span>
                <select data-field="fontFamily" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>
                  <option value="">(Usa predefinito del tema)</option>
                  ${AVAILABLE_FONTS.map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === cat.fontFamily ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Spaziatura (Padding)</span>
                <input data-field="padding" type="text" placeholder="es. 12px 16px" value="${escapeAttribute(cat.padding || "")}" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""} />
              </label>
            </div>

            <div class="host-grid-wide" style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--line);">
              <span style="font-weight: 500; display: block; margin-bottom: 0.75rem; font-size: 0.9rem;">Sottomenu collegati (Sezioni)</span>
              <div class="host-category-sections-manager">
                <div style="max-width: 24rem;">
                  <select class="host-category-add-select" data-action="connect-section" data-category-id="${escapeAttribute(cat.id)}" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>
                    <option value="">+ Collega un sottomenu...</option>
                    ${sections
                      .filter(sec => sec.id !== "host" && sec.category !== cat.id)
                      .map((sec) => {
                        let labelSuffix = "";
                        if (sec.category && sec.category !== "top") {
                          const parentCat = (localeState.categories || []).find(c => c.id === sec.category);
                          const parentName = parentCat ? (parentCat.menuTitle || parentCat.id) : sec.category;
                          labelSuffix = ` (attualmente in: ${parentName})`;
                        } else {
                          labelSuffix = " (Sempre visibile)";
                        }
                        return `<option value="${escapeAttribute(sec.id)}">${escapeHtml((sec.menuTitle || sec.id) + labelSuffix)}</option>`;
                      })
                      .join("")}
                  </select>
                </div>
                <div class="host-category-connected-list">
                  ${sections.filter(sec => sec.category === cat.id).map((sec) => `
                    <div class="host-category-connected-chip">
                      <span class="host-chip-label-text" title="${escapeAttribute(sec.menuTitle || sec.id)}">${escapeHtml(sec.menuTitle || sec.id)}</span>
                      ${selectedEditorLocale === FIXED_LOCALE ? `
                        <button type="button" class="host-chip-disconnect-btn" data-action="disconnect-section" data-section-id="${escapeAttribute(sec.id)}" aria-label="Riconnetti sottomenu a Sempre visibile">×</button>
                      ` : ""}
                    </div>
                  `).join("")}
                  ${sections.filter(sec => sec.category === cat.id).length === 0 ? `
                    <span class="host-category-connected-empty">Nessun sottomenu collegato. Usa il menu a tendina sopra per collegare una sezione a questo pulsante.</span>
                  ` : ""}
                </div>
              </div>
            </div>
          </div>
        </section>
      `
    )
    .join("");
}

function addCategory() {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Aggiungi nuovi gruppi solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  state = collectTemplate();
  const newId = `cat-${Date.now()}`;
  const newCat = {
    id: newId,
    icon: "spark",
    iconColor: "#dfc39c",
    bgColor: "",
    textColor: "",
    fontSize: "",
    fontFamily: "",
    padding: "",
    hidden: false,
    menuTitle: "Nuovo Gruppo",
  };
  currentLocaleState().categories = currentLocaleState().categories || [];
  currentLocaleState().categories.push(newCat);
  expandedCategoryIds.add(newId);
  state = saveTemplate(state);
  syncFields();
  queueAutoPublish();
  setStatus("Nuovo gruppo aggiunto.", "success");
}

function toggleCategory(categoryId) {
  if (expandedCategoryIds.has(categoryId)) {
    expandedCategoryIds.delete(categoryId);
  } else {
    expandedCategoryIds.add(categoryId);
  }
  renderCategoryEditors();
}

function removeCategory(categoryId) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Rimuovi i gruppi solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  if (categoryId === "casa" || categoryId === "citta") {
    if (!confirm("Sei sicuro di voler eliminare questo gruppo predefinito? Le sezioni collegate diventeranno 'Sempre visibili'.")) return;
  } else {
    if (!confirm("Sei sicuro di voler eliminare questo gruppo? Le sezioni collegate diventeranno 'Sempre visibili'.")) return;
  }
  
  state = collectTemplate();
  currentLocaleState().categories = (currentLocaleState().categories || []).filter((cat) => cat.id !== categoryId);
  expandedCategoryIds.delete(categoryId);

  // Update sections that belonged to this category to 'top' in the DOM dropdown selects
  const sectionCards = [...dom.sections.querySelectorAll("[data-section-id]")];
  sectionCards.forEach((card) => {
    const select = card.querySelector('[data-field="category"]');
    if (select && select.value === categoryId) {
      select.value = "top";
    }
  });
  
  state = saveTemplate(state);
  syncFields();
  queueAutoPublish();
  setStatus("Gruppo rimosso.", "success");
}

function toggleCategoryVisibility(categoryId) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    setStatus("Modifica la visibilità dei gruppi solo mentre modifichi la lingua italiana.", "error");
    return;
  }

  state = collectTemplate();
  const cat = (currentLocaleState().categories || []).find((c) => c.id === categoryId);
  if (cat) {
    cat.hidden = !cat.hidden;
    
    const card = dom.categories.querySelector(`[data-category-id="${categoryId}"]`);
    if (card) {
      card.dataset.categoryHidden = cat.hidden ? "true" : "false";
      card.classList.toggle("is-hidden-section", cat.hidden);
      const visibilityBtn = card.querySelector('[data-action="toggle-category-visibility"]');
      if (visibilityBtn) {
        visibilityBtn.textContent = cat.hidden ? "Mostra" : "Nascondi";
      }
    }

    state = saveTemplate(state);
    syncFields();
    queueAutoPublish();
  }
}

function updateCategoryIconPreview(card) {
  if (!card) return;
  const preview = card.querySelector("[data-category-icon-preview]");
  if (!preview) return;
  const selectedIcon = card.querySelector('[data-field="icon"]')?.value || "spark";
  const selectedColor = sanitizeCssColor(card.querySelector('[data-field="iconColor"]')?.value ?? card.querySelector('.host-color-picker[data-field="iconColor"]')?.value);
  preview.innerHTML = renderIcon(selectedIcon);
  if (selectedColor) {
    preview.style.setProperty("--icon-custom-color", selectedColor);
  } else {
    preview.style.removeProperty("--icon-custom-color");
  }
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
  dom.fontPrimary.value = state.theme?.fontPrimary || "Roboto";
  dom.fontSecondary.value = state.theme?.fontSecondary || "Roboto";
  fillDesignSelects(theme);
  dom.subtitle.value = localeState.subtitle;
  renderCategoryEditors();
  dom.introLines.value = serializeFooterLines(localeState.introLines || []);
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
  const categoryCards = [...(dom.categories?.querySelectorAll("[data-category-id]") || [])];
  const categories = categoryCards.map((card) => {
    const id = card.dataset.categoryId;
    const base = (currentLocaleState().categories || []).find((cat) => cat.id === id) || {};
    const iconColor = sanitizeCssColor(card.querySelector('[data-field="iconColor"]')?.value ?? card.querySelector('.host-color-picker[data-field="iconColor"]')?.value);
    const bgColor = sanitizeCssColor(card.querySelector('[data-field="bgColor"]')?.value ?? card.querySelector('.host-color-picker[data-field="bgColor"]')?.value);
    const textColor = sanitizeCssColor(card.querySelector('[data-field="textColor"]')?.value ?? card.querySelector('.host-color-picker[data-field="textColor"]')?.value);
    return {
      id,
      icon: card.querySelector('[data-field="icon"]')?.value || base.icon || "spark",
      iconColor,
      bgColor,
      textColor,
      fontSize: card.querySelector('[data-field="fontSize"]')?.value || "",
      fontFamily: card.querySelector('[data-field="fontFamily"]')?.value || "",
      padding: card.querySelector('[data-field="padding"]')?.value || "",
      hidden: card.dataset.categoryHidden === "true",
      menuTitle: card.querySelector('[data-field="menuTitle"]')?.value || "",
    };
  });

  const sectionCards = [...dom.sections.querySelectorAll("[data-section-id]")];
  const sections = sectionCards.map((card) => {
    const id = card.dataset.sectionId;
    const base = currentLocaleState().sections.find((section) => section.id === id);
    const ctaItems = [...card.querySelectorAll("[data-cta-item]")].map((item) => {
      const kind = normalizeCtaKind(item.querySelector('[data-cta-field="kind"]').value);
      const label = item.querySelector('[data-cta-field="label"]').value.trim();
      const href = normalizeCtaHref(kind, item.querySelector('[data-cta-field="href"]').value);
      const icon = item.querySelector('[data-cta-field="icon"]').value || ctaDefaultIcon(kind);
      const iconColor = sanitizeCssColor(item.querySelector('[data-cta-field="iconColor"]')?.value ?? item.querySelector('.host-color-picker[data-cta-field="iconColor"]')?.value);
      const hidden = item.querySelector('[data-cta-field="hidden"]')?.value === "true";
      return {
        type: CTA_ITEM_TYPE,
        kind,
        label,
        href,
        icon,
        iconColor,
        hidden,
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
    const mediaItems = [...card.querySelectorAll("[data-media-item]")].map((item) => ({
      type: MEDIA_ITEM_TYPE,
      mediaKind: item.dataset.mediaKind || "document",
      path: item.dataset.mediaPath || "",
      src: sanitizeImageSrc(item.dataset.mediaSrc || ""),
      title: item.querySelector('[data-media-field="title"]')?.value || "",
      caption: item.querySelector('[data-media-field="caption"]')?.value || "",
      fileName: item.dataset.mediaFileName || "",
      mimeType: item.dataset.mediaMimeType || "",
      sizeBytes: Number(item.dataset.mediaSizeBytes) || 0,
    })).filter((item) => item.src);
    const selectedIcon = card.querySelector('[data-field="icon"]')?.value || base.icon || "spark";
    const iconColor = sanitizeCssColor(card.querySelector('[data-field="iconColor"]')?.value ?? card.querySelector('.host-color-picker[data-field="iconColor"]')?.value);
    return {
      id,
      icon: selectedIcon.trim() || "spark",
      iconColor,
      hidden: card.dataset.sectionHidden === "true",
      category: card.querySelector('[data-field="category"]')?.value || "citta",
      menuTitle: card.querySelector('[data-field="menuTitle"]').value,
      sectionTitle: card.querySelector('[data-field="sectionTitle"]').value,
      lead: card.querySelector('[data-field="lead"]').value,
      items: [...parseItems(card.querySelector('[data-field="items"]').value), ...ctaItems, ...imageItems, ...mediaItems],
    };
  });

  const optionalEnabled = dom.optionalLocale.value && !REQUIRED_LOCALES.includes(dom.optionalLocale.value)
    ? [dom.optionalLocale.value]
    : [];

  next.appName = dom.appName.value;
  const introLines = parseFooterLines(dom.introLines.value);
  delete next.heroMeta;
  next.footer = {
    name: dom.footerName.value,
    subtitle: dom.footerSubtitle.value,
    lines: parseFooterLines(dom.footerLines.value),
  };
  next.theme = themeDraftFromFields();
  next.enabledLocales = [...REQUIRED_LOCALES, ...optionalEnabled];
  next.locales[selectedEditorLocale] = {
    ...next.locales[selectedEditorLocale],
    introLines,
    subtitle: dom.subtitle.value,
    categories,
    sections,
  };
  delete next.locales[selectedEditorLocale].heroMeta;

  return normalizeTemplate(next);
}

function sectionDraftFromCard(sectionCard) {
  if (!sectionCard) return null;
  return {
    icon: sectionCard.querySelector('[data-field="icon"]')?.value || "spark",
    iconColor: sanitizeCssColor(sectionCard.querySelector('[data-field="iconColor"]')?.value),
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
  const iconColor = sanitizeCssColor(draft.iconColor);
  if (iconColor) {
    preview.style.setProperty("--icon-custom-color", iconColor);
  } else {
    preview.style.removeProperty("--icon-custom-color");
  }
}

function updateCtaIconPreview(ctaCard) {
  const preview = ctaCard?.querySelector(".host-cta-icon-preview");
  if (!preview) return;
  const icon = ctaCard.querySelector('[data-cta-field="icon"]')?.value || "link";
  const iconColor = sanitizeCssColor(ctaCard.querySelector('[data-cta-field="iconColor"]')?.value);
  preview.innerHTML = renderIcon(icon);
  if (iconColor) {
    preview.style.setProperty("--icon-custom-color", iconColor);
  } else {
    preview.style.removeProperty("--icon-custom-color");
  }
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
    iconColor: "",
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
  if (target.id === "host") {
    setStatus("La sezione Host resta sempre presente per mantenere l'accesso rapido.", "error");
    return;
  }

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

function cleanupCorruptedMediaItems(tempState) {
  const FIXED_LOCALE = "it";
  if (!tempState?.locales?.[FIXED_LOCALE]) return tempState;

  let cleanedAny = false;
  const sections = tempState.locales[FIXED_LOCALE].sections;

  for (const section of sections) {
    if (Array.isArray(section.items)) {
      section.items = section.items.filter((item) => {
        if (
          item &&
          typeof item === "object" &&
          item.type === "image" &&
          item.src &&
          item.src.toLowerCase().endsWith(".mp4")
        ) {
          console.warn("[host] Removing corrupted video item treated as image:", item.src);
          cleanedAny = true;
          if (item.path && isAuthorizedSession(session)) {
            deleteSectionMedia(item.path, supabase).catch((err) => {
              console.error("[host] Failed to delete storage file:", item.path, err);
            });
          }
          return false;
        }
        return true;
      });
    }
  }

  if (cleanedAny) {
    console.log("[host] Corrupted items cleaned up from local state, saving and publishing...");
    const nextState = saveTemplate(normalizeTemplate(tempState));
    queueAutoPublish();
    return nextState;
  }

  return tempState;
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

  state = cleanupCorruptedMediaItems(state);
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

function renderSectionMedia(section) {
  const mediaItems = section.items.filter(isMediaItem);
  const editable = selectedEditorLocale === FIXED_LOCALE;
  if (!mediaItems.length) {
    return `<p class="host-media-empty">Nessun documento o video caricato.</p>`;
  }

  return mediaItems
    .map(
      (item, index) => {
        const src = sanitizeImageSrc(item.src);
        if (!src) return "";
        const kindLabel = item.mediaKind === "video" ? "🎬 Video" : "📄 Documento";
        const title = item.title || item.fileName || (item.mediaKind === "video" ? "Video" : "Documento");
        return `
        <article class="host-media-item" data-media-item data-media-index="${escapeAttribute(index)}" data-media-path="${escapeAttribute(item.path ?? "")}" data-media-src="${escapeAttribute(src)}" data-media-kind="${escapeAttribute(item.mediaKind || "document")}" data-media-file-name="${escapeAttribute(item.fileName || "")}" data-media-mime-type="${escapeAttribute(item.mimeType || "")}" data-media-size-bytes="${escapeAttribute(item.sizeBytes || 0)}">
          <div class="host-media-item-header">
            <span class="host-media-kind-badge">${escapeHtml(kindLabel)}</span>
            <button class="ghost-button host-media-remove" type="button" data-action="remove-media" ${!editable ? "disabled" : ""}>Rimuovi</button>
          </div>
          <div class="host-media-fields">
            <label>
              <span>Titolo</span>
              <input data-media-field="title" type="text" value="${escapeAttribute(item.title ?? "")}" />
            </label>
            <label>
              <span>Didascalia</span>
              <input data-media-field="caption" type="text" value="${escapeAttribute(item.caption ?? "")}" />
            </label>
          </div>
        </article>
      `;
      },
    )
    .join("");
}

async function handleMediaUpload(sectionId, file) {
  if (!file) return;
  if (!isAuthorizedSession(session)) {
    setStatus("Accedi come host per caricare file.", "error");
    return;
  }

  state = collectTemplate();
  setStatus("Upload file in corso...", "");

  try {
    const uploaded = await uploadSectionMedia(file, sectionId, supabase);
    const section = currentLocaleState().sections.find((item) => item.id === sectionId);
    if (!section) return;

    section.items.push({
      type: MEDIA_ITEM_TYPE,
      mediaKind: uploaded.mediaKind,
      path: uploaded.path,
      src: uploaded.src,
      title: file.name.replace(/\.[^.]+$/, ""),
      caption: "",
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });

    state = saveTemplate(state);
    syncFields();
    setStatus("File caricato. La sincronizzazione live parte ora.", "success");
    queueAutoPublish();
  } catch (error) {
    setStatus(error.message || "Upload file fallito.", "error");
  }
}

function countMediaPathUsage(templateState, mediaPath) {
  if (!mediaPath || !templateState?.locales?.[FIXED_LOCALE]) return 0;
  return templateState.locales[FIXED_LOCALE].sections.reduce((count, section) => {
    const items = Array.isArray(section?.items) ? section.items : [];
    return count + items.filter((item) => isMediaItem(item) && item.path === mediaPath).length;
  }, 0);
}

async function removeMedia(sectionId, mediaIndex) {
  state = collectTemplate();
  const section = currentLocaleState().sections.find((item) => item.id === sectionId);
  if (!section) return;
  const mediaItems = section.items.filter(isMediaItem);
  const target = mediaItems[mediaIndex];
  if (!target) return;

  try {
    const pathUsageCount = countMediaPathUsage(state, target.path);
    if (target.path && pathUsageCount <= 1 && isAuthorizedSession(session)) {
      await deleteSectionMedia(target.path, supabase);
    }

    section.items = section.items.filter((item) => item !== target);
    state = saveTemplate(state);
    syncFields();
    setStatus("File rimosso dalla sezione.", "success");
    queueAutoPublish();
  } catch (error) {
    setStatus(error.message || "Rimozione file fallita.", "error");
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
  if (dom.addCategory) {
    dom.addCategory.addEventListener("click", addCategory);
  }
  dom.logout.addEventListener("click", logout);
  dom.shareGuest.addEventListener("click", shareGuestApp);

  dom.app.addEventListener("input", (event) => {
    if (!event.target.matches("input, textarea")) return;
    if (event.target.closest("[data-section-id]") && event.target.matches('[data-field="menuTitle"], [data-field="sectionTitle"], [data-field="lead"]')) {
      updateSectionIconPreview(event.target.closest("[data-section-id]"));
    }
    if (event.target.closest("[data-category-id]") && event.target.matches('[data-field="menuTitle"]')) {
      const card = event.target.closest("[data-category-id]");
      const h2 = card.querySelector(".host-section-heading h2");
      if (h2) {
        h2.textContent = event.target.value.trim() || "Nuovo Gruppo";
      }
    }
    if (event.target.matches('[data-cta-field="label"]')) {
      const ctaCard = event.target.closest("[data-cta-item]");
      if (ctaCard) {
        const isHidden = ctaCard.querySelector('[data-cta-field="hidden"]')?.value === "true";
        const labelText = event.target.value.trim();
        const strong = ctaCard.querySelector(".host-cta-heading strong");
        if (strong) {
          strong.textContent = isHidden
            ? `${labelText || "Nuovo pulsante grafico"} (Nascosto)`
            : (labelText || "Nuovo pulsante grafico");
        }
      }
    }
    state = saveTemplate(collectTemplate());
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
    state = saveTemplate(collectTemplate());
    syncFields();
    queueAutoPublish();
  });

  dom.sections.addEventListener("change", (event) => {
    const imageUploader = event.target.closest("[data-image-upload]");
    if (imageUploader) {
      const sectionCard = event.target.closest("[data-section-id]");
      handleImageUpload(sectionCard?.dataset.sectionId, event.target.files?.[0]);
      event.target.value = "";
      return;
    }
    const mediaUploader = event.target.closest("[data-media-upload]");
    if (mediaUploader) {
      const sectionCard = event.target.closest("[data-section-id]");
      handleMediaUpload(sectionCard?.dataset.sectionId, event.target.files?.[0]);
      event.target.value = "";
      return;
    }

    if (event.target.matches('[data-cta-field="hidden"]')) {
      const ctaCard = event.target.closest("[data-cta-item]");
      if (ctaCard) {
        const isHidden = event.target.value === "true";
        ctaCard.classList.toggle("is-hidden-cta", isHidden);
        const labelInput = ctaCard.querySelector('[data-cta-field="label"]');
        const labelText = labelInput ? labelInput.value.trim() : "";
        const strong = ctaCard.querySelector(".host-cta-heading strong");
        if (strong) {
          strong.textContent = isHidden
            ? `${labelText || "Nuovo pulsante grafico"} (Nascosto)`
            : (labelText || "Nuovo pulsante grafico");
        }
      }
    }

    if (event.target.matches('[data-field="icon"], [data-field="iconColor"]')) {
      updateSectionIconPreview(event.target.closest("[data-section-id]"));
    } else if (event.target.matches('[data-cta-field="icon"], [data-cta-field="iconColor"]')) {
      updateCtaIconPreview(event.target.closest("[data-cta-item]"));
    }

    if (event.target.matches('[data-cta-field], [data-image-field], [data-media-field], [data-field]')) {
      state = saveTemplate(collectTemplate());

      const activeFocusedElement = document.activeElement;
      const sectionCard = activeFocusedElement?.closest('[data-section-id]');
      const activeFocusedSectionId = sectionCard?.dataset.sectionId;
      const activeFocusedField = activeFocusedElement?.dataset.field;
      const activeFocusedCtaId = activeFocusedElement?.closest('[data-cta-item]')?.dataset.ctaId;
      const activeFocusedCtaField = activeFocusedElement?.dataset.ctaField;
      const hasSelection = activeFocusedElement && ('selectionStart' in activeFocusedElement);
      const selectionStart = hasSelection ? activeFocusedElement.selectionStart : null;
      const selectionEnd = hasSelection ? activeFocusedElement.selectionEnd : null;

      syncFields();

      // Restore focus for sections
      if (activeFocusedSectionId) {
        const card = dom.sections.querySelector(`[data-section-id="${activeFocusedSectionId}"]`);
        let input = null;
        if (activeFocusedCtaId && activeFocusedCtaField) {
          const ctaCard = card?.querySelector(`[data-cta-item="${activeFocusedCtaId}"]`);
          input = ctaCard?.querySelector(`[data-cta-field="${activeFocusedCtaField}"]`);
        } else if (activeFocusedField) {
          input = card?.querySelector(`[data-field="${activeFocusedField}"]`);
        }
        if (input) {
          input.focus();
          if (hasSelection && typeof selectionStart === "number" && selectionStart !== null && selectionEnd !== null) {
            input.setSelectionRange(selectionStart, selectionEnd);
          }
        }
      }

      queueAutoPublish();
    }
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
    if (removeTrigger) {
      const imageItem = event.target.closest("[data-image-item]");
      const sectionCard = event.target.closest("[data-section-id]");
      removeImage(sectionCard?.dataset.sectionId, Number.parseInt(imageItem?.dataset.imageIndex ?? "-1", 10));
      return;
    }

    const removeMediaTrigger = event.target.closest('[data-action="remove-media"]');
    if (!removeMediaTrigger) return;
    const mediaItem = event.target.closest("[data-media-item]");
    const mediaSectionCard = event.target.closest("[data-section-id]");
    removeMedia(mediaSectionCard?.dataset.sectionId, Number.parseInt(mediaItem?.dataset.mediaIndex ?? "-1", 10));
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

  if (dom.categories) {
    dom.categories.addEventListener("click", (event) => {
      const toggleTrigger = event.target.closest('[data-action="toggle-category"]');
      if (toggleTrigger) {
        toggleCategory(toggleTrigger.dataset.categoryId);
        return;
      }

      const removeTrigger = event.target.closest('[data-action="remove-category"]');
      if (removeTrigger) {
        const categoryCard = event.target.closest("[data-category-id]");
        removeCategory(categoryCard?.dataset.categoryId);
        return;
      }

      const toggleVisibilityTrigger = event.target.closest('[data-action="toggle-category-visibility"]');
      if (toggleVisibilityTrigger) {
        const categoryCard = event.target.closest("[data-category-id]");
        toggleCategoryVisibility(categoryCard?.dataset.categoryId);
        return;
      }

      const disconnectTrigger = event.target.closest('[data-action="disconnect-section"]');
      if (disconnectTrigger) {
        const sectionId = disconnectTrigger.dataset.sectionId;
        const localeState = currentLocaleState();
        const section = (localeState.sections || []).find((s) => s.id === sectionId);
        if (section) {
          section.category = "top";
          const sectionCard = dom.sections.querySelector(`[data-section-id="${sectionId}"]`);
          if (sectionCard) {
            const select = sectionCard.querySelector('[data-field="category"]');
            if (select) {
              select.value = "top";
            }
          }
        }
        state = saveTemplate(collectTemplate());
        syncFields();
        queueAutoPublish();
        return;
      }
    });

    dom.categories.addEventListener("change", (event) => {
      const connectSelect = event.target.closest('[data-action="connect-section"]');
      if (connectSelect) {
        const sectionId = connectSelect.value;
        const categoryId = connectSelect.dataset.categoryId;
        if (sectionId) {
          const localeState = currentLocaleState();
          const section = (localeState.sections || []).find((s) => s.id === sectionId);
          if (section) {
            section.category = categoryId;
            const sectionCard = dom.sections.querySelector(`[data-section-id="${sectionId}"]`);
            if (sectionCard) {
              const select = sectionCard.querySelector('[data-field="category"]');
              if (select) {
                select.value = categoryId;
              }
            }
          }
          state = saveTemplate(collectTemplate());
          syncFields();
          queueAutoPublish();
        }
        return;
      }

      if (event.target.matches('[data-field="icon"], [data-field="iconColor"]')) {
        updateCategoryIconPreview(event.target.closest("[data-category-id]"));
      }
      if (event.target.matches('[data-field]')) {
        state = saveTemplate(collectTemplate());
        
        // Re-sync fields to update other dropdowns (like the sections' category dropdown)
        // Store focused element cursor details to restore them
        const activeFocusedElement = document.activeElement;
        const activeFocusedId = activeFocusedElement?.closest('[data-category-id]')?.dataset.categoryId;
        const activeFocusedField = activeFocusedElement?.dataset.field;
        const selectionStart = activeFocusedElement?.selectionStart;
        const selectionEnd = activeFocusedElement?.selectionEnd;
        
        syncFields();
        
        if (activeFocusedId && activeFocusedField) {
          const card = dom.categories.querySelector(`[data-category-id="${activeFocusedId}"]`);
          const input = card?.querySelector(`[data-field="${activeFocusedField}"]`);
          if (input) {
            input.focus();
            if (typeof selectionStart === "number") {
              input.setSelectionRange(selectionStart, selectionEnd);
            }
          }
        }
        
        queueAutoPublish();
      }
    });
  }
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
