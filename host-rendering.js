import {
  AVAILABLE_LANGUAGES,
  CTA_ITEM_TYPE,
  FIXED_LOCALE,
  getHostPrivateItem,
  HOST_PRIVATE_ITEM,
  MEDIA_ITEM_TYPE,
  REQUIRED_LOCALES,
  isCtaItem,
  isImageItem,
  isMediaItem,
  isHostPrivateItem,
  normalizeTemplate,
} from "./content.js?v=20260615g";
import {
  IMAGE_MAX_BYTES,
  DOCUMENT_MAX_BYTES,
  VIDEO_MAX_BYTES,
} from "./supabase.js";
import {
  escapeAttribute,
  escapeHtml,
  normalizeCtaHref,
  normalizeCtaKind,
  sanitizeCssColor,
  sanitizeHref,
  sanitizeImageSrc,
} from "./security.js?v=20260615g";
import { renderIcon, iconPaths } from "./icons.js?v=20260615g";
import { themeValue, iconColorStyle } from "./theme-utils.js?v=20260615g";
import {
  getState,
  getSelectedEditorLocale,
  getExpandedSectionIds,
  getExpandedCategoryIds,
  getExpandedPanelIds,
  currentLocaleState,
  syncExpandedSections,
} from "./host-state.js?v=20260615g";
import { dom } from "./host.js?v=20260615g";

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

const CTA_KIND_OPTIONS = [
  { value: "web", label: "Web" },
  { value: "maps", label: "Google Maps" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "email", label: "Email" },
  { value: "gmail", label: "Gmail" },
  { value: "tel", label: "Telefono" },
  { value: "airbnb", label: "Airbnb" },
  { value: "booking", label: "Booking" },
  { value: "vrbo", label: "Vrbo" },
  { value: "paypal", label: "PayPal" },
  { value: "revolut", label: "Revolut" },
];
const CTA_ICON_OPTIONS = [
  { value: "map", label: "Mappa" },
  { value: "phone", label: "Telefono" },
  { value: "mail", label: "Email" },
  { value: "gmail", label: "Gmail" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
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
  { value: "paypal", label: "PayPal" },
  { value: "revolut", label: "Revolut" },
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
  { value: "whatsapp", label: "WhatsApp" },
  { value: "gmail", label: "Gmail" },
  { value: "telegram", label: "Telegram" },
  { value: "home", label: "Casa" },
  { value: "city", label: "Città" },
  { value: "skyline", label: "Skyline città" },
  { value: "user", label: "Host" },
];
const CTA_PRESET_OPTIONS = [
  { kind: "web", label: "CTA Web" },
  { kind: "maps", label: "CTA Mappa" },
  { kind: "whatsapp", label: "CTA WhatsApp" },
  { kind: "telegram", label: "CTA Telegram" },
  { kind: "email", label: "CTA Email" },
  { kind: "gmail", label: "CTA Gmail" },
  { kind: "tel", label: "CTA Telefono" },
  { kind: "airbnb", label: "Icona Airbnb" },
  { kind: "booking", label: "Icona Booking" },
  { kind: "vrbo", label: "Icona Vrbo" },
  { kind: "paypal", label: "CTA PayPal" },
  { kind: "revolut", label: "CTA Revolut" },
];
const LINK_ITEM_PREFIX = "LINK";

function ctaDefaultIcon(kind = "web") {
  const fallbackMap = {
    web: "link", maps: "map", whatsapp: "whatsapp", telegram: "telegram",
    email: "gmail", gmail: "gmail", tel: "phone", airbnb: "airbnb",
    booking: "booking", vrbo: "vrbo", paypal: "paypal", revolut: "revolut",
  };
  return fallbackMap[kind] ?? "link";
}

function ctaDefaultLabel(kind = "web") {
  const fallbackMap = {
    web: "Apri link", maps: "Apri mappa", whatsapp: "Scrivi su WhatsApp",
    telegram: "Scrivi su Telegram", email: "Invia email", gmail: "Invia email",
    tel: "Chiama", airbnb: "Airbnb", booking: "Booking", vrbo: "Vrbo",
    paypal: "PayPal", revolut: "Revolut",
  };
  return fallbackMap[kind] ?? "Apri link";
}

function ctaDefaultHref(kind = "web") {
  const fallbackMap = {
    web: "https://example.com", maps: "https://maps.google.com/", whatsapp: "+39",
    telegram: "username", email: "email@example.com", gmail: "email@example.com",
    tel: "+39", airbnb: "https://www.airbnb.it/", booking: "https://www.booking.com/",
    vrbo: "https://www.vrbo.com/", paypal: "https://www.paypal.me/", revolut: "https://revolut.me/",
  };
  return fallbackMap[kind] ?? "https://example.com";
}

// Helpers
export function serializeFooterLines(lines = []) {
  return lines.join("\n");
}

export function parseFooterLines(value) {
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

  if (/whatsapp|wa\.me|wa\b/.test(text)) return "whatsapp";
  if (/telegram|t\.me|tg\b/.test(text)) return "telegram";
  if (/gmail/.test(text)) return "gmail";
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

export function applyTheme(theme) {
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
  if (localeTemplate) {
    const categoriesList = Array.isArray(localeTemplate.categories) ? localeTemplate.categories : [];
    categoriesList.forEach((cat) => {
      if (cat && cat.fontFamily) {
        fontsToLoad.add(cat.fontFamily);
      }
    });
  }

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

function colorInputHtml(fieldName, selectedValue = "", { cta = false, media = false, fallback = "#dfc39c", disabled = false } = {}) {
  const attr = media ? "data-media-field" : (cta ? "data-cta-field" : "data-field");
  return `<input ${attr}="${escapeAttribute(fieldName)}" class="host-color-picker" type="color" value="${escapeAttribute(colorToInputValue(selectedValue, fallback))}" ${disabled ? "disabled" : ""} />`;
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

export function themeDraftFromFields() {
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

function sectionBadge(section) {
  const parts = [];
  if (section.id.startsWith("custom-")) {
    parts.push("Sezione personalizzata");
  } else if (section.id === "host") {
    parts.push("Sezione fissa");
  } else {
    parts.push(section.id);
  }

  const locState = currentLocaleState();
  if (locState && section.category) {
    if (section.category === "top") {
      parts.push("Sempre visibile");
    } else {
      const parentCat = (locState.categories || []).find((c) => c.id === section.category);
      const parentName = parentCat ? (parentCat.menuTitle || parentCat.id) : section.category;
      parts.push(`In: "${parentName}"`);
    }
  }

  if (section.hidden) {
    parts.push("Nascosta nell'app ospiti");
  }
  return parts.join(" · ");
}

function renderOptionalLocaleSelect() {
  const state = getState();
  if (!state) return;
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

export function setStatus(message, variant = "") {
  if (dom.status) {
    dom.status.textContent = message;
    dom.status.className = `host-status${variant ? ` is-${variant}` : ""}`;
  }

  const pill = document.querySelector("#host-status-pill");
  if (pill) {
    const text = pill.querySelector(".host-status-text");
    pill.className = "host-status-pill";
    if (variant === "success") {
      pill.classList.add("is-success");
      if (text) text.textContent = "Attivo";
    } else if (variant === "error") {
      pill.classList.add("is-error");
      if (text) text.textContent = "Errore";
    } else {
      pill.classList.add("is-pending");
      if (text) text.textContent = (message && message.includes("Caricamento")) ? "Caricamento..." : "Salvataggio...";
    }
  }
}

export function serializeItems(items) {
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

export function renderSectionCtas(section) {
  const ctas = section.items.filter(isCtaItem);
  const editable = getSelectedEditorLocale() === FIXED_LOCALE;
  const state = getState();
  const themeColors = state?.theme?.colors || {};

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
              ${colorInputHtml("iconColor", iconColor, { cta: true, fallback: themeColors.icon || "#dfc39c", disabled: !editable })}
            </label>
            <label>
              <span>Colore sfondo</span>
              ${colorInputHtml("bgColor", item.bgColor || "", { cta: true, fallback: themeColors.row || "#17120e", disabled: !editable })}
            </label>
            <label>
              <span>Colore scritte</span>
              ${colorInputHtml("textColor", item.textColor || "", { cta: true, fallback: themeColors.text || "#e7d8c1", disabled: !editable })}
            </label>
            <label>
              <span>Font del titolo</span>
              <select data-cta-field="fontFamily" ${!editable ? "disabled" : ""}>
                <option value="">(Usa predefinito del tema)</option>
                ${AVAILABLE_FONTS.map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === (item.fontFamily || "") ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
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
            <label>
              <span>Visibilità</span>
              <select data-cta-field="hidden" ${!editable ? "disabled" : ""}>
                <option value="false" ${!item.hidden ? "selected" : ""}>Visibile</option>
                <option value="true" ${item.hidden ? "selected" : ""}>Nascosto</option>
              </select>
            </label>
          </div>
        </article>
      `;
      },
    )
    .join("");
}

export function renderCategoryCtas(cat) {
  const autoSecId = `section-${cat.id}`;
  const locState = currentLocaleState();
  const autoSec = locState ? (locState.sections || []).find((s) => s.id === autoSecId) : null;
  const ctas = autoSec ? autoSec.items.filter(isCtaItem) : [];
  const editable = getSelectedEditorLocale() === FIXED_LOCALE;
  const state = getState();
  const themeColors = state?.theme?.colors || {};

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
              ${colorInputHtml("iconColor", iconColor, { cta: true, fallback: themeColors.icon || "#dfc39c", disabled: !editable })}
            </label>
            <label>
              <span>Colore sfondo</span>
              ${colorInputHtml("bgColor", item.bgColor || "", { cta: true, fallback: themeColors.row || "#17120e", disabled: !editable })}
            </label>
            <label>
              <span>Colore scritte</span>
              ${colorInputHtml("textColor", item.textColor || "", { cta: true, fallback: themeColors.text || "#e7d8c1", disabled: !editable })}
            </label>
            <label>
              <span>Font del titolo</span>
              <select data-cta-field="fontFamily" ${!editable ? "disabled" : ""}>
                <option value="">(Usa predefinito del tema)</option>
                ${AVAILABLE_FONTS.map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === (item.fontFamily || "") ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
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

export function renderSectionImages(section) {
  const images = section.items.filter(isImageItem);
  const editable = getSelectedEditorLocale() === FIXED_LOCALE;
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

export function renderSectionMedia(section) {
  const mediaItems = section.items.filter(isMediaItem);
  const editable = getSelectedEditorLocale() === FIXED_LOCALE;
  if (!mediaItems.length) {
    return `<p class="host-media-empty">Nessun documento o video caricato.</p>`;
  }

  return mediaItems
    .map(
      (item, index) => {
        const src = sanitizeImageSrc(item.src);
        if (!src) return "";
        const kindLabel = item.mediaKind === "video" ? "🎬 Video" : "📄 Documento";
        
        let extraFieldsHtml = "";
        if (item.mediaKind !== "video") {
          const icon = item.icon || "book";
          const iconColor = sanitizeCssColor(item.iconColor);
          const bgColor = sanitizeCssColor(item.bgColor);
          const textColor = sanitizeCssColor(item.textColor);
          const fontFamily = item.fontFamily || "";

          extraFieldsHtml = `
            <div class="host-media-grid" style="margin-top: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem;">
              <label>
                <span>Icona</span>
                <select data-media-field="icon" ${!editable ? "disabled" : ""}>
                  ${CTA_ICON_OPTIONS.map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === icon ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Colore icona</span>
                ${colorInputHtml("iconColor", iconColor, { media: true, fallback: "#dfc39c", disabled: !editable })}
              </label>
              <label>
                <span>Colore sfondo</span>
                ${colorInputHtml("bgColor", bgColor, { media: true, fallback: "#2d2319", disabled: !editable })}
              </label>
              <label>
                <span>Colore scritte</span>
                ${colorInputHtml("textColor", textColor, { media: true, fallback: "#e7d8c1", disabled: !editable })}
              </label>
              <label>
                <span>Font del titolo</span>
                <select data-media-field="fontFamily" ${!editable ? "disabled" : ""}>
                  <option value="">(Usa predefinito del tema)</option>
                  ${AVAILABLE_FONTS.map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === fontFamily ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
                </select>
              </label>
            </div>
          `;
        }

        return `
        <article class="host-media-item" data-media-item data-media-index="${escapeAttribute(index)}" data-media-path="${escapeAttribute(item.path ?? "")}" data-media-src="${escapeAttribute(src)}" data-media-kind="${escapeAttribute(item.mediaKind || "document")}" data-media-file-name="${escapeAttribute(item.fileName || "")}" data-media-mime-type="${escapeAttribute(item.mimeType || "")}" data-media-size-bytes="${escapeAttribute(item.sizeBytes || 0)}">
          <div class="host-media-item-header">
            <span class="host-media-kind-badge">${escapeHtml(kindLabel)}</span>
            <button class="ghost-button host-media-remove" type="button" data-action="remove-media" ${!editable ? "disabled" : ""}>Rimuovi</button>
          </div>
          <div class="host-media-fields">
            <label>
              <span>Titolo</span>
              <input data-media-field="title" type="text" value="${escapeAttribute(item.title ?? "")}" ${!editable ? "disabled" : ""} />
            </label>
            <label>
              <span>Didascalia</span>
              <input data-media-field="caption" type="text" value="${escapeAttribute(item.caption ?? "")}" ${!editable ? "disabled" : ""} />
            </label>
            ${extraFieldsHtml}
          </div>
        </article>
      `;
      },
    )
    .join("");
}

export function renderSectionEditors() {
  const localeState = currentLocaleState();
  if (!localeState) return;
  syncExpandedSections();
  const localeHostPrivateItem = localeState.sections
    .find((section) => section.id === "host")
    ?.items.find(isHostPrivateItem) ?? HOST_PRIVATE_ITEM;

  const categories = localeState.categories || [];
  const catIds = categories.map(cat => cat.id);
  const expandedSectionIds = getExpandedSectionIds();
  const selectedEditorLocale = getSelectedEditorLocale();
  const state = getState();
  const themeColors = state?.theme?.colors || {};

  const visibleSections = localeState.sections.filter((section) => {
    if (!section || !section.id) return false;
    if (section.id.startsWith("section-cat-")) return false;
    if (catIds.some(catId => section.id === `section-${catId}`)) return false;
    return true;
  });
  const totalVisibleSections = visibleSections.length;

  dom.sections.innerHTML = visibleSections
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
              <button class="ghost-button host-order-button" type="button" data-action="move-section-up" ${selectedEditorLocale !== FIXED_LOCALE || index === 0 ? "disabled" : ""} aria-label="Sposta sezione in alto" title="Sposta sezione in alto">↑</button>
              <button class="ghost-button host-order-button" type="button" data-action="move-section-down" ${selectedEditorLocale !== FIXED_LOCALE || index === totalVisibleSections - 1 ? "disabled" : ""} aria-label="Sposta sezione in basso" title="Sposta sezione in basso">↓</button>
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
                ${colorInputHtml("iconColor", section.iconColor, { fallback: themeColors.icon || "#dfc39c", disabled: selectedEditorLocale !== FIXED_LOCALE })}
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
              ${section.id === "host" ? `
              <label>
                <span>Testo sopra PayPal/Revolut</span>
                <textarea data-field="payText">${escapeHtml(section.payText || "")}</textarea>
              </label>
              ` : ""}
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
              ${selectedEditorLocale !== FIXED_LOCALE
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
            ${section.id === "host"
          ? `<p class="host-lock-note">L'accesso riservato resta sempre disponibile come icona tonda nella sezione Host.</p>`
          : ""
        }
          </div>
        </section>
      `,
    )
    .join("");
}

export function renderCategoryEditors() {
  if (!dom.categories) return;

  const localeState = currentLocaleState();
  if (!localeState) return;
  const categories = localeState.categories || [];
  const sections = localeState.sections || [];
  const catIds = categories.map(c => c.id);
  const expandedCategoryIds = getExpandedCategoryIds();
  const selectedEditorLocale = getSelectedEditorLocale();
  const state = getState();
  const themeColors = state?.theme?.colors || {};

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
                    <p class="host-kicker">${escapeHtml(cat.id)}</p>
                    <h2>${escapeHtml(cat.menuTitle)}</h2>
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
                <span>Mostra in</span>
                <select data-field="placement" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>
                  <option value="homepage" ${cat.placement === "homepage" || !cat.placement ? "selected" : ""}>Homepage</option>
                  <option value="host" ${cat.placement === "host" ? "selected" : ""}>Scheda Dettagli Host</option>
                </select>
              </label>
              <label>
                <span>Icona</span>
                <select data-field="icon" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>
                  ${sectionIconOptions(cat.icon).map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === cat.icon ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Colore icona</span>
                ${colorInputHtml("iconColor", cat.iconColor, { fallback: themeColors.icon || "#dfc39c", disabled: selectedEditorLocale !== FIXED_LOCALE })}
              </label>
              <label>
                <span>Colore sfondo</span>
                ${colorInputHtml("bgColor", cat.bgColor, { fallback: themeColors.row || "#17120e", disabled: selectedEditorLocale !== FIXED_LOCALE })}
              </label>
              <label>
                <span>Colore testo</span>
                ${colorInputHtml("textColor", cat.textColor, { fallback: themeColors.text || "#e7d8c1", disabled: selectedEditorLocale !== FIXED_LOCALE })}
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

            ${cat.placement === "host" ? `
              <div class="host-grid-wide" style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--line);">
                <div class="host-content-tools">
                  <button class="ghost-button" type="button" data-action="category-add-cta" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>Aggiungi pulsante grafico</button>
                  <div class="host-cta-presets">
                    ${CTA_PRESET_OPTIONS.map((preset) => `<button class="ghost-button host-cta-preset" type="button" data-action="category-add-cta-preset" data-cta-kind="${escapeAttribute(preset.kind)}" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>${escapeHtml(preset.label)}</button>`).join("")}
                  </div>
                </div>
              </div>
              <div class="host-cta-editor">
                <div class="host-section-media-head">
                  <div>
                    <p class="host-kicker">Pulsanti rapidi</p>
                    <p class="host-media-note">CTA larghe con icona, etichetta e destinazione. Si aprono sempre in una nuova scheda.</p>
                  </div>
                </div>
                <div class="host-cta-list">
                  ${renderCategoryCtas(cat)}
                </div>
              </div>
            ` : `
              <div class="host-grid-wide" style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--line);">
                <span style="font-weight: 500; display: block; margin-bottom: 0.75rem; font-size: 0.9rem;">Sottomenu collegati (Sezioni)</span>
                <div class="host-category-sections-manager">
                  <div style="max-width: 24rem;">
                    <select class="host-category-add-select" data-action="connect-section" data-category-id="${escapeAttribute(cat.id)}" ${selectedEditorLocale !== FIXED_LOCALE ? "disabled" : ""}>
                      <option value="">+ Collega un sottomenu...</option>
                      ${sections
          .filter(sec => {
            if (sec.id === "host") return false;
            if (sec.category === cat.id) return false;
            if (sec.id.startsWith("section-cat-")) return false;
            if (catIds.some(catId => sec.id === `section-${catId}`)) return false;
            return true;
          })
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
                    ${sections.filter(sec => sec.category === cat.id && !sec.id.startsWith("section-cat-") && !catIds.some(catId => sec.id === `section-${catId}`)).map((sec) => `
                      <div class="host-category-connected-chip">
                        <span class="host-chip-label-text" title="${escapeAttribute(sec.menuTitle || sec.id)}">${escapeHtml(sec.menuTitle || sec.id)}</span>
                        ${selectedEditorLocale === FIXED_LOCALE ? `
                          <button type="button" class="host-chip-disconnect-btn" data-action="disconnect-section" data-section-id="${escapeAttribute(sec.id)}" aria-label="Riconnetti sottomenu a Sempre visibile">×</button>
                        ` : ""}
                      </div>
                    `).join("")}
                    ${sections.filter(sec => sec.category === cat.id && !sec.id.startsWith("section-cat-") && !catIds.some(catId => sec.id === `section-${catId}`)).length === 0 ? `
                      <span class="host-category-connected-empty">Nessun sottomenu collegato. Usa il menu a tendina sopra per collegare una sezione a questo pulsante.</span>
                    ` : ""}
                  </div>
                </div>
              </div>
            `}
          </div>
        </section>
      `
    )
    .join("");
}

export function syncFields() {
  const state = getState();
  if (!state) return;

  // Save focus and selection range
  const activeEl = document.activeElement;
  let focusState = null;
  if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) {
    const sectionCard = activeEl.closest("[data-section-id]");
    const categoryCard = activeEl.closest("[data-category-id]");
    const ctaItem = activeEl.closest("[data-cta-item]");
    const imageItem = activeEl.closest("[data-image-item]");
    const mediaItem = activeEl.closest("[data-media-item]");

    focusState = {
      sectionId: sectionCard ? sectionCard.dataset.sectionId : null,
      categoryId: categoryCard ? categoryCard.dataset.categoryId : null,
      ctaIndex: ctaItem ? ctaItem.dataset.ctaIndex : null,
      imageIndex: imageItem ? imageItem.dataset.imageIndex : null,
      mediaIndex: mediaItem ? mediaItem.dataset.mediaIndex : null,

      field: activeEl.dataset.field || null,
      ctaField: activeEl.dataset.ctaField || null,
      imageField: activeEl.dataset.imageField || null,
      mediaField: activeEl.dataset.mediaField || null,
      themeField: activeEl.dataset.themeField || null,

      id: activeEl.id || null,
      tagName: activeEl.tagName,

      selectionStart: ("selectionStart" in activeEl) ? activeEl.selectionStart : null,
      selectionEnd: ("selectionEnd" in activeEl) ? activeEl.selectionEnd : null,
    };
  }

  if (dom.fontPrimary && dom.fontPrimary.options.length === 0) {
    const fontOptions = optionsHtml(AVAILABLE_FONTS);
    dom.fontPrimary.innerHTML = fontOptions;
    dom.fontSecondary.innerHTML = fontOptions;
  }
  applyTheme(state.theme);
  const localeState = currentLocaleState();
  if (!localeState) return;
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
  const selectedEditorLocale = getSelectedEditorLocale();
  dom.editorLocale.innerHTML = AVAILABLE_LANGUAGES.map(
    (language) => `<option value="${escapeAttribute(language.code)}" ${language.code === selectedEditorLocale ? "selected" : ""}>${escapeHtml(language.label)} (${escapeHtml(language.nativeLabel)})</option>`,
  ).join("");
  // Sync tab active class
  const activeTab = window.localStorage.getItem("stampace-host-active-tab") || "general";
  const appContainer = document.querySelector("#host-app");
  if (appContainer) {
    appContainer.className = appContainer.className.split(" ").filter(c => !c.startsWith("tab-")).join(" ");
    appContainer.classList.add(`tab-${activeTab}`);
  }

  const tabButtons = document.querySelectorAll(".host-tab-btn");
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === activeTab);
  });

  syncPanelState();
  renderOptionalLocaleSelect();
  renderSectionEditors();

  // Restore focus and selection range
  if (focusState) {
    let container = document;
    if (focusState.sectionId) {
      container = document.querySelector(`[data-section-id="${CSS.escape(focusState.sectionId)}"]`);
    } else if (focusState.categoryId) {
      container = document.querySelector(`[data-category-id="${CSS.escape(focusState.categoryId)}"]`);
    }

    if (container) {
      let targetEl = null;
      if (focusState.ctaIndex !== null && focusState.ctaField) {
        targetEl = container.querySelector(`[data-cta-index="${CSS.escape(focusState.ctaIndex)}"] [data-cta-field="${CSS.escape(focusState.ctaField)}"]`);
      } else if (focusState.imageIndex !== null && focusState.imageField) {
        targetEl = container.querySelector(`[data-image-index="${CSS.escape(focusState.imageIndex)}"] [data-image-field="${CSS.escape(focusState.imageField)}"]`);
      } else if (focusState.mediaIndex !== null && focusState.mediaField) {
        targetEl = container.querySelector(`[data-media-index="${CSS.escape(focusState.mediaIndex)}"] [data-media-field="${CSS.escape(focusState.mediaField)}"]`);
      } else if (focusState.field) {
        targetEl = container.querySelector(`[data-field="${CSS.escape(focusState.field)}"]`);
      } else if (focusState.themeField) {
        targetEl = document.querySelector(`[data-theme-field="${CSS.escape(focusState.themeField)}"]`);
      } else if (focusState.id) {
        targetEl = document.getElementById(focusState.id);
      }

      if (targetEl) {
        targetEl.focus();
        if (typeof focusState.selectionStart === "number" && typeof focusState.selectionEnd === "number") {
          try {
            targetEl.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
          } catch (e) {
            // Ignore if input type doesn't support selection range
          }
        }
      }
    }
  }
}

export function collectTemplate() {
  const state = getState();
  const selectedEditorLocale = getSelectedEditorLocale();
  const next = JSON.parse(JSON.stringify(state));
  const themeColors = state?.theme?.colors || {};

  const categoryCards = [...(dom.categories?.querySelectorAll("[data-category-id]") || [])];
  const categoryCtas = {};
  const categories = categoryCards.map((card) => {
    const id = card.dataset.categoryId;
    const base = (currentLocaleState().categories || []).find((cat) => cat.id === id) || {};

    const iconColorInput = card.querySelector('[data-field="iconColor"]')?.value ?? card.querySelector('.host-color-picker[data-field="iconColor"]')?.value;
    const bgColorInput = card.querySelector('[data-field="bgColor"]')?.value ?? card.querySelector('.host-color-picker[data-field="bgColor"]')?.value;
    const textColorInput = card.querySelector('[data-field="textColor"]')?.value ?? card.querySelector('.host-color-picker[data-field="textColor"]')?.value;

    const iconColorRaw = sanitizeCssColor(iconColorInput);
    const bgColorRaw = sanitizeCssColor(bgColorInput);
    const textColorRaw = sanitizeCssColor(textColorInput);

    const iconColor = (iconColorRaw === (themeColors.icon || "#dfc39c")) ? "" : iconColorRaw;
    const bgColor = (bgColorRaw === (themeColors.row || "#17120e")) ? "" : bgColorRaw;
    const textColor = (textColorRaw === (themeColors.text || "#e7d8c1")) ? "" : textColorRaw;

    const placement = card.querySelector('[data-field="placement"]')?.value || "homepage";

    if (placement === "host") {
      const ctaItems = [...card.querySelectorAll("[data-cta-item]")].map((item) => {
        const kind = normalizeCtaKind(item.querySelector('[data-cta-field="kind"]').value);
        const label = item.querySelector('[data-cta-field="label"]').value.trim();
        let rawHref = item.querySelector('[data-cta-field="href"]').value.trim();
        if (kind === "telegram") {
          rawHref = rawHref.replace(/@/g, "");
        }
        const href = normalizeCtaHref(kind, rawHref);
        const icon = item.querySelector('[data-cta-field="icon"]').value || ctaDefaultIcon(kind);

        const itemIconColorInput = item.querySelector('[data-cta-field="iconColor"]')?.value ?? item.querySelector('.host-color-picker[data-cta-field="iconColor"]')?.value;
        const itemBgColorInput = item.querySelector('[data-cta-field="bgColor"]')?.value ?? item.querySelector('.host-color-picker[data-cta-field="bgColor"]')?.value;
        const itemTextColorInput = item.querySelector('[data-cta-field="textColor"]')?.value ?? item.querySelector('.host-color-picker[data-cta-field="textColor"]')?.value;

        const itemIconColorRaw = sanitizeCssColor(itemIconColorInput);
        const itemBgColorRaw = sanitizeCssColor(itemBgColorInput);
        const itemTextColorRaw = sanitizeCssColor(itemTextColorInput);

        const itemIconColor = (itemIconColorRaw === (themeColors.icon || "#dfc39c")) ? "" : itemIconColorRaw;
        const itemBgColor = (itemBgColorRaw === (themeColors.row || "#17120e")) ? "" : itemBgColorRaw;
        const itemTextColor = (itemTextColorRaw === (themeColors.text || "#e7d8c1")) ? "" : itemTextColorRaw;

        const fontFamily = item.querySelector('[data-cta-field="fontFamily"]')?.value || "";
        const hidden = item.querySelector('[data-cta-field="hidden"]')?.value === "true";
        return {
          type: CTA_ITEM_TYPE,
          kind,
          label,
          href,
          icon,
          iconColor: itemIconColor,
          bgColor: itemBgColor,
          textColor: itemTextColor,
          fontFamily,
          hidden,
        };
      });
      categoryCtas[id] = ctaItems;
    }

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
      placement,
    };
  });

  const sectionCards = [...dom.sections.querySelectorAll("[data-section-id]")];
  let sections = sectionCards.map((card) => {
    const id = card.dataset.sectionId;
    const base = currentLocaleState().sections.find((section) => section.id === id);
    const ctaItems = [...card.querySelectorAll("[data-cta-item]")].map((item) => {
      const kind = normalizeCtaKind(item.querySelector('[data-cta-field="kind"]').value);
      const label = item.querySelector('[data-cta-field="label"]').value.trim();
      let rawHref = item.querySelector('[data-cta-field="href"]').value.trim();
      if (kind === "telegram") {
        rawHref = rawHref.replace(/@/g, "");
      }
      const href = normalizeCtaHref(kind, rawHref);
      const icon = item.querySelector('[data-cta-field="icon"]').value || ctaDefaultIcon(kind);

      const itemIconColorInput = item.querySelector('[data-cta-field="iconColor"]')?.value ?? item.querySelector('.host-color-picker[data-cta-field="iconColor"]')?.value;
      const itemBgColorInput = item.querySelector('[data-cta-field="bgColor"]')?.value ?? item.querySelector('.host-color-picker[data-cta-field="bgColor"]')?.value;
      const itemTextColorInput = item.querySelector('[data-cta-field="textColor"]')?.value ?? item.querySelector('.host-color-picker[data-cta-field="textColor"]')?.value;

      const itemIconColorRaw = sanitizeCssColor(itemIconColorInput);
      const itemBgColorRaw = sanitizeCssColor(itemBgColorInput);
      const itemTextColorRaw = sanitizeCssColor(itemTextColorInput);

      const itemIconColor = (itemIconColorRaw === (themeColors.icon || "#dfc39c")) ? "" : itemIconColorRaw;
      const itemBgColor = (itemBgColorRaw === (themeColors.row || "#17120e")) ? "" : itemBgColorRaw;
      const itemTextColor = (itemTextColorRaw === (themeColors.text || "#e7d8c1")) ? "" : itemTextColorRaw;

      const fontFamily = item.querySelector('[data-cta-field="fontFamily"]')?.value || "";
      const hidden = item.querySelector('[data-cta-field="hidden"]')?.value === "true";
      return {
        type: CTA_ITEM_TYPE,
        kind,
        label,
        href,
        icon,
        iconColor: itemIconColor,
        bgColor: itemBgColor,
        textColor: itemTextColor,
        fontFamily,
        hidden,
      };
    });
    const imageItems = [...card.querySelectorAll("[data-image-item]")].map((item) => ({
      type: "image",
      path: item.dataset.imagePath || "",
      src: sanitizeImageSrc(item.dataset.imageSrc || ""),
      alt: item.querySelector('[data-image-field="alt"]').value,
      caption: item.querySelector('[data-image-field="caption"]').value,
      size: item.querySelector('[data-image-field="size"]')?.value || "grande",
    })).filter((item) => item.src);
    const mediaItems = [...card.querySelectorAll("[data-media-item]")].map((item) => {
      const itemIconColorInput = item.querySelector('[data-media-field="iconColor"]')?.value ?? item.querySelector('.host-color-picker[data-media-field="iconColor"]')?.value;
      const itemBgColorInput = item.querySelector('[data-media-field="bgColor"]')?.value ?? item.querySelector('.host-color-picker[data-media-field="bgColor"]')?.value;
      const itemTextColorInput = item.querySelector('[data-media-field="textColor"]')?.value ?? item.querySelector('.host-color-picker[data-media-field="textColor"]')?.value;

      const itemIconColorRaw = sanitizeCssColor(itemIconColorInput);
      const itemBgColorRaw = sanitizeCssColor(itemBgColorInput);
      const itemTextColorRaw = sanitizeCssColor(itemTextColorInput);

      const itemIconColor = (itemIconColorRaw === "#dfc39c") ? "" : itemIconColorRaw;
      const itemBgColor = (itemBgColorRaw === "#2d2319") ? "" : itemBgColorRaw;
      const itemTextColor = (itemTextColorRaw === "#e7d8c1") ? "" : itemTextColorRaw;

      return {
        type: MEDIA_ITEM_TYPE,
        mediaKind: item.dataset.mediaKind || "document",
        path: item.dataset.mediaPath || "",
        src: sanitizeImageSrc(item.dataset.mediaSrc || ""),
        title: item.querySelector('[data-media-field="title"]')?.value || "",
        caption: item.querySelector('[data-media-field="caption"]')?.value || "",
        fileName: item.dataset.mediaFileName || "",
        mimeType: item.dataset.mediaMimeType || "",
        sizeBytes: Number(item.dataset.mediaSizeBytes) || 0,
        icon: item.querySelector('[data-media-field="icon"]')?.value || "",
        iconColor: itemIconColor,
        bgColor: itemBgColor,
        textColor: itemTextColor,
        fontFamily: item.querySelector('[data-media-field="fontFamily"]')?.value || "",
      };
    }).filter((item) => item.src);

    const selectedIcon = card.querySelector('[data-field="icon"]')?.value || base.icon || "spark";
    const iconColorInput = card.querySelector('[data-field="iconColor"]')?.value ?? card.querySelector('.host-color-picker[data-field="iconColor"]')?.value;
    const iconColorRaw = sanitizeCssColor(iconColorInput);
    const iconColor = (iconColorRaw === (themeColors.icon || "#dfc39c")) ? "" : iconColorRaw;

    return {
      id,
      icon: selectedIcon.trim() || "spark",
      iconColor,
      hidden: card.dataset.sectionHidden === "true",
      category: card.querySelector('[data-field="category"]')?.value || "citta",
      menuTitle: card.querySelector('[data-field="menuTitle"]').value,
      sectionTitle: card.querySelector('[data-field="sectionTitle"]').value,
      lead: card.querySelector('[data-field="lead"]').value,
      payText: card.querySelector('[data-field="payText"]')?.value || "",
      items: [...parseItems(card.querySelector('[data-field="items"]').value), ...ctaItems, ...imageItems, ...mediaItems],
    };
  });

  const catIds = categories.map(cat => cat.id);
  sections = sections.filter(sec => {
    if (!sec || !sec.id) return false;
    if (sec.id.startsWith("section-cat-")) return false;
    if (catIds.some(catId => sec.id === `section-${catId}`)) return false;
    return true;
  });

  categories.forEach((cat) => {
    if (cat.placement === "host") {
      const ctaItems = categoryCtas[cat.id] || [];
      const autoSecId = `section-${cat.id}`;
      sections.push({
        id: autoSecId,
        icon: cat.icon || "spark",
        iconColor: cat.iconColor,
        hidden: cat.hidden,
        category: cat.id,
        menuTitle: cat.menuTitle,
        sectionTitle: cat.menuTitle,
        lead: "",
        items: ctaItems,
      });
    }
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

export function updateSectionIconPreview(sectionCard) {
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

export function updateCtaIconPreview(ctaCard) {
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

export function updateCategoryIconPreview(card) {
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

export function syncPanelState() {
  dom.app.querySelectorAll("[data-panel-id]").forEach((panel) => {
    panel.classList.remove("is-collapsed");
    const toggle = panel.querySelector('[data-action="toggle-panel"]');
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  });
}
