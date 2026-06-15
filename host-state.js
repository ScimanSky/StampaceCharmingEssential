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
} from "./content.js?v=20260615g";
import {
  deleteSectionImage,
  deleteSectionMedia,
  fetchRemoteTemplateRow,
  getHostSupabase,
  HOST_EMAIL,
  publishRemoteTemplate,
  uploadSectionImage,
  uploadSectionMedia,
} from "./supabase.js";
import {
  normalizeCtaHref,
  normalizeCtaKind,
  sanitizeCssColor,
  sanitizeImageSrc,
} from "./security.js?v=20260615g";

// State variables
let state = null;
let session = null;
let latestRemoteUpdatedAt = null;
let autoPublishTimer = null;
let editorReady = false;
let editorLoading = false;
let selectedEditorLocale = FIXED_LOCALE;
const expandedSectionIds = new Set();
const expandedCategoryIds = new Set(["casa", "citta"]);
let shouldSeedExpandedSection = true;
const expandedPanelIds = new Set();
let lastTranslationFallbackLocales = [];

const AUTO_PUBLISH_DELAY = 2500;
const TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const TRANSLATE_SEPARATOR = "\n[[[STAMPACE_TRANSLATE_SPLIT]]]\n";
const TRANSLATE_CHUNK_LIMIT = 2400;
const TRANSLATE_TIMEOUT_MS = 8000;
const TRANSLATE_LOCALE_MAP = {
  sc: "ca",
};
const STORAGE_TRANSLATION_CACHE_KEY = "stampace-translation-cache-v1";

const supabase = getHostSupabase();

// Translation cache
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

// State Change Observers
const listeners = new Set();
export function onStateChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function notifyStateChange() {
  for (const callback of listeners) {
    callback();
  }
}

// Getters and Setters
export function getState() { return state; }
export function setState(val) { state = val; notifyStateChange(); }
export function setStateSilent(val) { state = val; }
export function getSession() { return session; }
export function setSession(val) { session = val; notifyStateChange(); }
export function getLatestRemoteUpdatedAt() { return latestRemoteUpdatedAt; }
export function setLatestRemoteUpdatedAt(val) { latestRemoteUpdatedAt = val; }
export function getSelectedEditorLocale() { return selectedEditorLocale; }
export function setSelectedEditorLocale(val) { selectedEditorLocale = val; notifyStateChange(); }
export function getExpandedSectionIds() { return expandedSectionIds; }
export function getExpandedCategoryIds() { return expandedCategoryIds; }
export function getExpandedPanelIds() { return expandedPanelIds; }
export function getShouldSeedExpandedSection() { return shouldSeedExpandedSection; }
export function setShouldSeedExpandedSection(val) { shouldSeedExpandedSection = val; }
export function isEditorReady() { return editorReady; }
export function setEditorReady(val) { editorReady = val; notifyStateChange(); }
export function isEditorLoading() { return editorLoading; }
export function setEditorLoading(val) { editorLoading = val; notifyStateChange(); }
export function getLastTranslationFallbackLocales() { return lastTranslationFallbackLocales; }

export function currentLocaleState() {
  if (!state) return null;
  return state.locales[selectedEditorLocale] ?? state.locales[FIXED_LOCALE];
}

export function isAuthorizedSession() {
  const email = session?.user?.email?.toLowerCase();
  return Boolean(session && email === HOST_EMAIL.toLowerCase());
}

export function togglePanel(panelId) {
  if (!panelId) return;
  if (expandedPanelIds.has(panelId)) {
    expandedPanelIds.delete(panelId);
  } else {
    expandedPanelIds.add(panelId);
  }
  notifyStateChange();
}

export function toggleCategory(categoryId) {
  if (expandedCategoryIds.has(categoryId)) {
    expandedCategoryIds.delete(categoryId);
  } else {
    expandedCategoryIds.add(categoryId);
  }
  notifyStateChange();
}

export function toggleSection(sectionId) {
  if (!sectionId) return;
  if (expandedSectionIds.has(sectionId)) {
    expandedSectionIds.delete(sectionId);
  } else {
    expandedSectionIds.add(sectionId);
  }
  notifyStateChange();
}

export function syncExpandedSections() {
  const locState = currentLocaleState();
  if (!locState) return;
  const sectionIds = locState.sections.map((section) => section.id);
  [...expandedSectionIds].forEach((id) => {
    if (!sectionIds.includes(id)) expandedSectionIds.delete(id);
  });
  if (shouldSeedExpandedSection && !expandedSectionIds.size && sectionIds.length) {
    expandedSectionIds.add(sectionIds[0]);
    shouldSeedExpandedSection = false;
  }
}

// Translations
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
    ru: "Имя sieci",
    zh: "网络名称",
    hi: "नेटवर्क नाम",
    ja: "ネットワーク名",
  };

  return `${localizedLabels[targetLocale] ?? localizedLabels.it}: ${value}`;
}

const ITALIAN_TEMPLATE_BASE = defaultTemplate.locales[FIXED_LOCALE];
const SARDINIAN_TEMPLATE_BASE = defaultTemplate.locales.sc;

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

export async function buildPublishedTemplate(template) {
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

// Cleanup routines
function cleanupCorruptedMediaItems(tempState) {
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
          if (item.path && isAuthorizedSession()) {
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

function cleanupOrphanedCategoriesAndDuplicates(tempState) {
  if (!tempState?.locales) return tempState;

  let cleanedAny = false;
  const locales = tempState.locales;

  Object.keys(locales).forEach((locale) => {
    const localeData = locales[locale];
    if (!localeData || !localeData.sections) return;

    const wifiSec = localeData.sections.find((s) => s.id === "wifi");
    if (wifiSec && wifiSec.category === "top") {
      wifiSec.category = "casa";
      cleanedAny = true;
    }

    const mapSec = localeData.sections.find((s) => s.id === "custom-mpnjxoue");
    if (mapSec && mapSec.category === "top") {
      mapSec.category = "casa";
      cleanedAny = true;
    }

    const kb1 = localeData.sections.find((s) => s.id === "custom-mq6bdpmrcoj0");
    if (kb1 && (kb1.hidden || kb1.category !== "casa")) {
      kb1.category = "casa";
      kb1.hidden = false;
      cleanedAny = true;
    }

    const initialCount = localeData.sections.length;
    localeData.sections = localeData.sections.filter((s) => s.id !== "custom-mq8ee5bfaaz6");
    if (localeData.sections.length !== initialCount) {
      cleanedAny = true;
    }
  });

  if (cleanedAny) {
    console.log("[host] Cleaned up orphaned categories and duplicate keybox from template.");
    const nextState = saveTemplate(normalizeTemplate(tempState));
    queueAutoPublish();
    return nextState;
  }

  return tempState;
}

// Hydrate state
export async function hydrateEditorState() {
  shouldSeedExpandedSection = true;
  let tempState = await loadTemplate({ preferLocal: true });

  try {
    const remote = await fetchRemoteTemplateRow(supabase);
    latestRemoteUpdatedAt = remote.updated_at ?? null;
    if (remote.content) {
      tempState = normalizeTemplate(remote.content);
    }
  } catch {
    latestRemoteUpdatedAt = null;
  }

  tempState = cleanupCorruptedMediaItems(tempState);
  tempState = cleanupOrphanedCategoriesAndDuplicates(tempState);
  state = tempState;
  notifyStateChange();
}

// Publish mechanisms
export async function publishNow({ silent = false } = {}) {
  if (!isAuthorizedSession()) {
    throw new Error("Accedi come host per sincronizzare le modifiche live.");
  }

  try {
    state = await buildPublishedTemplate(state);
    saveTemplate(state);
    const published = await publishRemoteTemplate(state, supabase);
    latestRemoteUpdatedAt = published.updated_at ?? null;
    notifyStateChange();
  } catch (err) {
    throw new Error("Sincronizzazione live fallita. Verifica accesso host, setup Supabase o traduzione online.");
  }
}

export function queueAutoPublish() {
  if (!isAuthorizedSession()) return;
  window.clearTimeout(autoPublishTimer);
  autoPublishTimer = window.setTimeout(async () => {
    try {
      await publishNow({ silent: true });
    } catch (err) {
      console.error("[host-state] Auto publish failed:", err);
    }
  }, AUTO_PUBLISH_DELAY);
}

export function getAutoPublishTimer() {
  return autoPublishTimer;
}

export function clearAutoPublishTimer() {
  if (autoPublishTimer) {
    window.clearTimeout(autoPublishTimer);
    autoPublishTimer = null;
  }
}

// Authentication handlers
export async function login(password) {
  if (!password) {
    throw new Error("Inserisci la password host.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: HOST_EMAIL,
    password,
  });

  if (error) {
    throw new Error("Accesso fallito. Verifica la password host in Supabase Auth.");
  }

  session = data.session;
  notifyStateChange();
  return data.session;
}

export async function logout() {
  clearAutoPublishTimer();
  await supabase.auth.signOut();
  session = null;
  editorReady = false;
  notifyStateChange();
}

// State mutations
function buildCtaPreset(kind = "web") {
  const ctaDefaultIcon = (k = "web") => {
    const fallbackMap = {
      web: "link", maps: "map", whatsapp: "whatsapp", telegram: "telegram",
      email: "gmail", gmail: "gmail", tel: "phone", airbnb: "airbnb",
      booking: "booking", vrbo: "vrbo",
    };
    return fallbackMap[k] ?? "link";
  };

  const ctaDefaultLabel = (k = "web") => {
    const fallbackMap = {
      web: "Apri link", maps: "Apri mappa", whatsapp: "Scrivi su WhatsApp",
      telegram: "Scrivi su Telegram", email: "Invia email", gmail: "Invia email",
      tel: "Chiama", airbnb: "Airbnb", booking: "Booking", vrbo: "Vrbo",
    };
    return fallbackMap[k] ?? "Apri link";
  };

  const ctaDefaultHref = (k = "web") => {
    const fallbackMap = {
      web: "https://example.com", maps: "https://maps.google.com/", whatsapp: "+39",
      telegram: "username", email: "email@example.com", gmail: "email@example.com",
      tel: "+39", airbnb: "https://www.airbnb.it/", booking: "https://www.booking.com/",
      vrbo: "https://www.vrbo.com/",
    };
    return fallbackMap[k] ?? "https://example.com";
  };

  return {
    type: CTA_ITEM_TYPE,
    kind,
    label: ctaDefaultLabel(kind),
    href: ctaDefaultHref(kind),
    icon: ctaDefaultIcon(kind),
    iconColor: "",
  };
}

export function addCategory(collected) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Aggiungi nuovi gruppi solo mentre modifichi la lingua italiana.");
  }

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
    placement: "homepage",
  };
  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  localeState.categories = localeState.categories || [];
  localeState.categories.push(newCat);
  expandedCategoryIds.add(newId);
  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
  return { message: "Nuovo gruppo aggiunto.", variant: "success" };
}

export function removeCategory(collected, categoryId) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Rimuovi i gruppi solo mentre modifichi la lingua italiana.");
  }

  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];

  // Remove all sections belonging to this category (except 'host')
  if (localeState.sections) {
    localeState.sections.forEach(sec => {
      if (sec.category === categoryId && sec.id !== "host") {
        expandedSectionIds.delete(sec.id);
      }
    });
    localeState.sections = localeState.sections.filter(sec => sec.category !== categoryId || sec.id === "host");
  }

  // Remove the category
  localeState.categories = (localeState.categories || []).filter((cat) => cat.id !== categoryId);
  expandedCategoryIds.delete(categoryId);
  
  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
  return { message: "Gruppo e sezioni collegate rimossi.", variant: "success" };
}

export function toggleCategoryVisibility(collected, categoryId) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Modifica la visibilità dei gruppi solo mentre modifichi la lingua italiana.");
  }

  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  const cat = (localeState.categories || []).find((c) => c.id === categoryId);
  if (cat) {
    cat.hidden = !cat.hidden;
    state = saveTemplate(collected);
    queueAutoPublish();
    notifyStateChange();
  }
}

export function addSection(collected) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Aggiungi nuovi pulsanti solo mentre modifichi la lingua italiana.");
  }

  const newId = `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  localeState.sections.push({
    id: newId,
    icon: "spark",
    iconColor: "",
    hidden: false,
    menuTitle: "Nuovo pulsante",
    sectionTitle: "Nuova sezione",
    lead: "",
    items: [],
  });
  expandedSectionIds.add(newId);
  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
  return { message: "Nuovo pulsante aggiunto. Ora compila i campi della nuova sezione.", variant: "success" };
}

export function duplicateSection(collected, sectionId) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Duplica sezioni solo mentre modifichi la lingua italiana.");
  }

  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  const sections = localeState.sections;
  const sectionIndex = sections.findIndex((section) => section.id === sectionId);
  if (sectionIndex < 0) return { message: "Sezione non trovata.", variant: "error" };

  const sourceSection = sections[sectionIndex];
  if (sourceSection.id === "host") return { message: "Non puoi duplicare la sezione Host.", variant: "error" };

  const duplicated = JSON.parse(JSON.stringify(sourceSection));
  duplicated.id = `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  duplicated.hidden = false;
  duplicated.menuTitle = `${sourceSection.menuTitle} copia`;
  duplicated.sectionTitle = `${sourceSection.sectionTitle} copia`;

  sections.splice(sectionIndex + 1, 0, duplicated);
  expandedSectionIds.add(duplicated.id);
  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
  return { message: `Sezione "${sourceSection.menuTitle}" duplicata.`, variant: "success" };
}

export function toggleSectionVisibility(collected, sectionId) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Gestisci la visibilità solo mentre modifichi la lingua italiana.");
  }

  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  const section = localeState.sections.find((item) => item.id === sectionId);
  if (!section || section.id === "host") return null;

  section.hidden = !section.hidden;
  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
  return {
    message: section.hidden
      ? `La sezione "${section.menuTitle}" è stata nascosta nell'app ospiti.`
      : `La sezione "${section.menuTitle}" è di nuovo visibile nell'app ospiti.`,
    variant: "success",
  };
}

export function removeSection(collected, sectionId) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Rimuovi sezioni solo mentre modifichi la lingua italiana.");
  }

  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  const sections = localeState.sections;
  const target = sections.find((section) => section.id === sectionId);
  if (!target) return null;
  if (target.id === "host") {
    throw new Error("La sezione Host resta sempre presente per mantenere l'accesso rapido.");
  }

  localeState.sections = sections.filter((section) => section.id !== sectionId);
  expandedSectionIds.delete(sectionId);
  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
  return { message: `Pulsante "${target.menuTitle}" rimosso.`, variant: "success" };
}

export function reorderSection(collected, sectionId, targetSectionId, position = "before") {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Riordina i pulsanti solo mentre modifichi la lingua italiana.");
  }

  if (!sectionId || !targetSectionId || sectionId === targetSectionId) return null;

  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  const sections = localeState.sections;
  const sourceIndex = sections.findIndex((section) => section.id === sectionId);
  const targetIndex = sections.findIndex((section) => section.id === targetSectionId);
  if (sourceIndex < 0 || targetIndex < 0) return null;

  const [movedSection] = sections.splice(sourceIndex, 1);
  let insertIndex = sections.findIndex((section) => section.id === targetSectionId);
  if (insertIndex < 0) {
    sections.push(movedSection);
  } else {
    if (position === "after") insertIndex += 1;
    sections.splice(insertIndex, 0, movedSection);
  }

  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
  return { message: `Ordine aggiornato: "${movedSection.menuTitle}" riposizionato.`, variant: "success" };
}

export function updateSectionCtas(collected, sectionId, updater) {
  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  const section = localeState.sections.find((item) => item.id === sectionId);
  if (!section) return;

  const textItems = section.items.filter((item) => !isImageItem(item) && !isCtaItem(item) && !isMediaItem(item));
  const imageItems = section.items.filter(isImageItem);
  const mediaItems = section.items.filter(isMediaItem);
  const ctaItems = section.items.filter(isCtaItem);
  const nextCtas = updater([...ctaItems]) ?? ctaItems;

  section.items = [...textItems, ...nextCtas, ...imageItems, ...mediaItems];
  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
}

export function updateCategoryCtas(collected, categoryId, updater) {
  const autoSecId = `section-${categoryId}`;
  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  let section = (localeState.sections || []).find((item) => item.id === autoSecId);

  if (!section) {
    section = {
      id: autoSecId,
      icon: "spark",
      iconColor: "#dfc39c",
      hidden: false,
      category: categoryId,
      menuTitle: "Contatti",
      sectionTitle: "Contatti",
      lead: "",
      items: [],
    };
    localeState.sections = localeState.sections || [];
    localeState.sections.push(section);
  }

  const textItems = section.items.filter((item) => !isImageItem(item) && !isCtaItem(item) && !isMediaItem(item));
  const imageItems = section.items.filter(isImageItem);
  const mediaItems = section.items.filter(isMediaItem);
  const ctaItems = section.items.filter(isCtaItem);
  const nextCtas = updater([...ctaItems]) ?? ctaItems;

  section.items = [...textItems, ...nextCtas, ...imageItems, ...mediaItems];
  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
}

export function addCategoryCta(collected, categoryId, kind = "web") {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Aggiungi pulsanti grafici solo mentre modifichi la lingua italiana.");
  }

  updateCategoryCtas(collected, categoryId, (ctaItems) => {
    ctaItems.push(buildCtaPreset(kind));
    return ctaItems;
  });
  return { message: "Nuovo pulsante grafico aggiunto. Compila etichetta, destinazione e icona.", variant: "success" };
}

export function removeCategoryCta(collected, categoryId, ctaIndex) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Rimuovi pulsanti grafici solo mentre modifichi la lingua italiana.");
  }
  updateCategoryCtas(collected, categoryId, (ctaItems) => ctaItems.filter((_, index) => index !== ctaIndex));
}

export function moveCategoryCta(collected, categoryId, ctaIndex, direction) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Sposta pulsanti grafici solo mentre modifichi la lingua italiana.");
  }
  updateCategoryCtas(collected, categoryId, (ctaItems) => {
    const nextIndex = ctaIndex + direction;
    if (nextIndex < 0 || nextIndex >= ctaItems.length) return ctaItems;
    [ctaItems[ctaIndex], ctaItems[nextIndex]] = [ctaItems[nextIndex], ctaItems[ctaIndex]];
    return ctaItems;
  });
}

export function addCta(collected, sectionId, kind = "web") {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Aggiungi pulsanti grafici solo mentre modifichi la lingua italiana.");
  }

  updateSectionCtas(collected, sectionId, (ctaItems) => {
    ctaItems.push(buildCtaPreset(kind));
    return ctaItems;
  });
  return { message: "Nuovo pulsante grafico aggiunto. Compila etichetta, destinazione e icona.", variant: "success" };
}

export function removeCta(collected, sectionId, ctaIndex) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Rimuovi pulsanti grafici solo mentre modifichi la lingua italiana.");
  }
  updateSectionCtas(collected, sectionId, (ctaItems) => ctaItems.filter((_, index) => index !== ctaIndex));
}

export function moveCta(collected, sectionId, ctaIndex, direction) {
  if (selectedEditorLocale !== FIXED_LOCALE) {
    throw new Error("Riordina i pulsanti grafici solo mentre modifichi la lingua italiana.");
  }
  updateSectionCtas(collected, sectionId, (ctaItems) => {
    const nextIndex = ctaIndex + direction;
    if (nextIndex < 0 || nextIndex >= ctaItems.length) return ctaItems;
    [ctaItems[ctaIndex], ctaItems[nextIndex]] = [ctaItems[nextIndex], ctaItems[ctaIndex]];
    return ctaItems;
  });
}

export async function handleImageUpload(collected, sectionId, file) {
  if (!file) return null;
  if (!isAuthorizedSession()) {
    throw new Error("Accedi come host per caricare immagini.");
  }

  const uploaded = await uploadSectionImage(file, sectionId, supabase);
  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  const section = localeState.sections.find((item) => item.id === sectionId);
  if (!section) return null;

  section.items.push({
    type: "image",
    path: uploaded.path,
    src: uploaded.src,
    alt: file.name.replace(/\.[^.]+$/, ""),
    caption: "",
  });

  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
  return { message: "Immagine caricata. La sincronizzazione live parte ora.", variant: "success" };
}

function countImagePathUsage(templateState, imagePath) {
  if (!imagePath || !templateState?.locales?.[FIXED_LOCALE]) return 0;
  return templateState.locales[FIXED_LOCALE].sections.reduce((count, section) => {
    const items = Array.isArray(section?.items) ? section.items : [];
    return count + items.filter((item) => isImageItem(item) && item.path === imagePath).length;
  }, 0);
}

export async function removeImage(collected, sectionId, imageIndex) {
  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  const section = localeState.sections.find((item) => item.id === sectionId);
  if (!section) return;
  const imageItems = section.items.filter(isImageItem);
  const target = imageItems[imageIndex];
  if (!target) return;

  const pathUsageCount = countImagePathUsage(collected, target.path);
  if (target.path && pathUsageCount <= 1 && isAuthorizedSession()) {
    await deleteSectionImage(target.path, supabase);
  }

  section.items = section.items.filter((item) => item !== target);
  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
}

export async function handleMediaUpload(collected, sectionId, file) {
  if (!file) return null;
  if (!isAuthorizedSession()) {
    throw new Error("Accedi come host per caricare file.");
  }

  const uploaded = await uploadSectionMedia(file, sectionId, supabase);
  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  const section = localeState.sections.find((item) => item.id === sectionId);
  if (!section) return null;

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

  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
  return { message: "File caricato. La sincronizzazione live parte ora.", variant: "success" };
}

function countMediaPathUsage(templateState, mediaPath) {
  if (!mediaPath || !templateState?.locales?.[FIXED_LOCALE]) return 0;
  return templateState.locales[FIXED_LOCALE].sections.reduce((count, section) => {
    const items = Array.isArray(section?.items) ? section.items : [];
    return count + items.filter((item) => isMediaItem(item) && item.path === mediaPath).length;
  }, 0);
}

export async function removeMedia(collected, sectionId, mediaIndex) {
  const localeState = collected.locales[selectedEditorLocale] ?? collected.locales[FIXED_LOCALE];
  const section = localeState.sections.find((item) => item.id === sectionId);
  if (!section) return;
  const mediaItems = section.items.filter(isMediaItem);
  const target = mediaItems[mediaIndex];
  if (!target) return;

  const pathUsageCount = countMediaPathUsage(collected, target.path);
  if (target.path && pathUsageCount <= 1 && isAuthorizedSession()) {
    await deleteSectionMedia(target.path, supabase);
  }

  section.items = section.items.filter((item) => item !== target);
  state = saveTemplate(collected);
  queueAutoPublish();
  notifyStateChange();
}

export async function restoreDefaultTemplate() {
  clearTemplate();
  shouldSeedExpandedSection = true;
  state = normalizeTemplate(defaultTemplate);
  notifyStateChange();
  await publishNow({ silent: true });
}

export async function importTemplate(parsed) {
  shouldSeedExpandedSection = true;
  state = saveTemplate(parsed);
  notifyStateChange();
  await publishNow({ silent: true });
}
