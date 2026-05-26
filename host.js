import {
  AVAILABLE_LANGUAGES,
  clearTemplate,
  defaultTemplate,
  FIXED_LOCALE,
  getHostPrivateItem,
  HOST_PRIVATE_ITEM,
  MAX_OPTIONAL_LOCALES,
  REQUIRED_LOCALES,
  isImageItem,
  isHostPrivateItem,
  loadTemplate,
  normalizeTemplate,
  saveTemplate,
} from "./content.js?v=20260528f";
import {
  deleteSectionImage,
  fetchRemoteTemplateRow,
  getHostSupabase,
  HOST_EMAIL,
  IMAGE_MAX_BYTES,
  publishRemoteTemplate,
  uploadSectionImage,
} from "./supabase.js";

const iconPaths = {
  shield:
    '<path d="M12 3l6 2.7v5.7c0 3.7-2.3 6.9-6 8.6-3.7-1.7-6-4.9-6-8.6V5.7L12 3z"/><path d="M9.4 11.8 11 13.4l3.7-3.8"/>',
  wifi:
    '<path d="M1 8 A 15.5 15.5 0 0 1 23 8"/><path d="M4.5 11.5 A 10.6 10.6 0 0 1 19.5 11.5"/><path d="M8 15 A 5.6 5.6 0 0 1 16 15"/><circle cx="12" cy="19.5" r="1.5" style="fill: currentColor; stroke: none;"/>',
  spark:
    '<path d="M12 3.8 13.3 8 17.5 9.3 13.3 10.6 12 14.8 10.7 10.6 6.5 9.3 10.7 8 12 3.8z"/><path d="M18.2 14.5 19 16.6l2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1z"/>',
  key:
    '<circle cx="8.3" cy="14.2" r="3.2"/><path d="M11.2 14.2H20"/><path d="M16.4 14.2v-2.4"/><path d="M13.8 14.2v2.4"/>',
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
};

const AUTO_PUBLISH_DELAY = 900;
const EDITOR_HASH = "#editor";

const dom = {
  gate: document.querySelector("#host-gate"),
  app: document.querySelector("#host-app"),
  email: document.querySelector("#host-email"),
  password: document.querySelector("#host-password"),
  login: document.querySelector("#host-login"),
  logout: document.querySelector("#host-logout"),
  status: document.querySelector("#host-status"),
  save: document.querySelector("#host-save"),
  reset: document.querySelector("#host-reset"),
  export: document.querySelector("#host-export"),
  import: document.querySelector("#host-import"),
  publish: document.querySelector("#host-publish"),
  addSection: document.querySelector("#host-add-section"),
  editorLocale: document.querySelector("#field-editor-locale"),
  enabledLocales: document.querySelector("#field-enabled-locales"),
  appName: document.querySelector("#field-app-name"),
  subtitle: document.querySelector("#field-subtitle"),
  address: document.querySelector("#field-address"),
  license: document.querySelector("#field-license"),
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
const TRANSLATE_LOCALE_MAP = {
  sc: "ca",
};
const translationCache = new Map();
const expandedSectionIds = new Set();
let shouldSeedExpandedSection = true;
const expandedPanelIds = new Set(["general", "sections"]);
const ITALIAN_TEMPLATE_BASE = defaultTemplate.locales[FIXED_LOCALE];
const SARDINIAN_TEMPLATE_BASE = defaultTemplate.locales.sc;

function renderIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] ?? iconPaths.spark}</svg>`;
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
    const response = await fetch(`${TRANSLATE_ENDPOINT}?${params.toString()}`);
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
    const translated = await translateBatch(missingTexts, targetLocale);
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

  const protectedLabels = ["nome rete", "network name", "ssid", "nome da rede", "nom du réseau", "nombre de la red", "netzwerkname"];
  if (!protectedLabels.includes(label)) return null;

  const localizedLabels = {
    it: "Nome rete",
    en: "Network name",
    fr: "Nom du réseau",
    es: "Nombre de la red",
    de: "Netzwerkname",
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
      subtitle: italianLocale.subtitle,
      sections: italianLocale.sections.map((section, sectionIndex) => {
        const itBaseSection = ITALIAN_TEMPLATE_BASE.sections[sectionIndex] ?? {};
        const scBaseSection = SARDINIAN_TEMPLATE_BASE.sections[sectionIndex] ?? section;

        const pickSectionValue = (currentValue, italianBaseValue, sardinianBaseValue) =>
          currentValue !== italianBaseValue ? currentValue : sardinianBaseValue;

        const items = section.items.map((item, itemIndex) => {
          if (isImageItem(item)) return { ...item };
          if (isHostPrivateItem(item)) return { ...getHostPrivateItem(targetLocale) };

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

  for (const language of AVAILABLE_LANGUAGES) {
    if (language.code === FIXED_LOCALE) continue;
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
  return section.id.startsWith("custom-") ? "Sezione personalizzata" : section.id;
}

function renderLanguageOptions() {
  const activeSet = new Set(state.enabledLocales);
  const optionalCount = state.enabledLocales.filter((code) => !REQUIRED_LOCALES.includes(code)).length;

  dom.enabledLocales.innerHTML = AVAILABLE_LANGUAGES.map((language) => {
    const checked = activeSet.has(language.code);
    const disabled = language.mandatory || (!checked && optionalCount >= MAX_OPTIONAL_LOCALES);

    return `
      <label class="host-language-option${language.mandatory ? " is-fixed" : ""}">
        <input type="checkbox" data-locale-toggle value="${language.code}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
        <span class="host-language-flag" aria-hidden="true">
          <img src="${language.flagSrc}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
        </span>
        <span class="host-language-copy">
          <strong>${language.label}</strong>
          <span>${language.nativeLabel}</span>
        </span>
      </label>
    `;
  }).join("");
}

function setStatus(message, variant = "") {
  dom.status.textContent = message;
  dom.status.className = `host-status${variant ? ` is-${variant}` : ""}`;
}

function serializeItems(items) {
  return items
    .filter((item) => !isHostPrivateItem(item) && !isImageItem(item))
    .map((item) => {
      if (typeof item === "string") return item;
      return JSON.stringify(item);
    })
    .map((item) => `+ ${item}`)
    .join("\n\n");
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

function renderSectionImages(section) {
  const images = section.items.filter(isImageItem);
  if (!images.length) {
    return `<p class="host-image-empty">Nessuna immagine caricata.</p>`;
  }

  return images
    .map(
      (item, index) => `
        <article class="host-image-item" data-image-item data-image-index="${index}" data-image-path="${item.path ?? ""}" data-image-src="${item.src}">
          <img src="${item.src}" alt="${item.alt || ""}" loading="lazy" />
          <div class="host-image-fields">
            <label>
              <span>Alt text</span>
              <input data-image-field="alt" type="text" value="${item.alt ?? ""}" />
            </label>
            <label>
              <span>Didascalia</span>
              <input data-image-field="caption" type="text" value="${item.caption ?? ""}" />
            </label>
          </div>
          <button class="ghost-button host-image-remove" type="button" data-action="remove-image">Rimuovi</button>
        </article>
      `,
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
      (section) => `
        <section class="host-section-card${expandedSectionIds.has(section.id) ? "" : " is-collapsed"}" data-section-id="${section.id}">
          <div class="host-section-meta">
            <div class="host-section-meta-main">
              <button class="host-section-toggle" type="button" data-action="toggle-section" aria-expanded="${expandedSectionIds.has(section.id) ? "true" : "false"}">
                <span class="host-section-icon">${renderIcon(section.icon)}</span>
                <span class="host-section-heading">
                  <span>
                    <p class="host-kicker">${section.id}</p>
                    <h2>${section.menuTitle}</h2>
                    <p class="host-section-badge">${sectionBadge(section)}</p>
                  </span>
                  <span class="host-section-chevron" aria-hidden="true">⌄</span>
                </span>
              </button>
            </div>
            <button class="ghost-button host-remove-section" type="button" data-action="remove-section">Rimuovi pulsante</button>
          </div>
          <div class="host-section-body">
            <div class="host-section-grid">
              <label>
                <span>Titolo nel menu</span>
                <input data-field="menuTitle" type="text" value="${section.menuTitle}" />
              </label>
              <label>
                <span>Titolo sezione</span>
                <input data-field="sectionTitle" type="text" value="${section.sectionTitle}" />
              </label>
              <label>
                <span>Testo introduttivo</span>
                <textarea data-field="lead">${section.lead}</textarea>
              </label>
              <label>
                <span>Contenuti: usa "+" all'inizio di una riga per creare un nuovo paragrafo</span>
                <textarea data-field="items">${serializeItems(section.items)}</textarea>
              </label>
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
                ? `<p class="host-lock-note">La voce "${localeHostPrivateItem.title}" viene reinserita automaticamente e non può essere eliminata.</p>`
                : ""
            }
          </div>
        </section>
      `,
    )
    .join("");
}

function syncFields() {
  const localeState = currentLocaleState();
  dom.appName.value = state.appName;
  dom.address.value = state.address;
  dom.license.value = state.license;
  dom.subtitle.value = localeState.subtitle;
  dom.editorLocale.innerHTML = AVAILABLE_LANGUAGES.map(
    (language) => `<option value="${language.code}" ${language.code === selectedEditorLocale ? "selected" : ""}>${language.label} (${language.nativeLabel})</option>`,
  ).join("");
  syncPanelState();
  renderLanguageOptions();
  renderSectionEditors();
}

function collectTemplate() {
  const next = JSON.parse(JSON.stringify(state));
  const sectionCards = [...dom.sections.querySelectorAll("[data-section-id]")];
  const sections = sectionCards.map((card) => {
    const id = card.dataset.sectionId;
    const base = currentLocaleState().sections.find((section) => section.id === id);
    const imageItems = [...card.querySelectorAll("[data-image-item]")].map((item) => ({
      type: "image",
      path: item.dataset.imagePath || "",
      src: item.dataset.imageSrc || "",
      alt: item.querySelector('[data-image-field="alt"]').value,
      caption: item.querySelector('[data-image-field="caption"]').value,
    }));
    return {
      id,
      icon: base.icon,
      menuTitle: card.querySelector('[data-field="menuTitle"]').value,
      sectionTitle: card.querySelector('[data-field="sectionTitle"]').value,
      lead: card.querySelector('[data-field="lead"]').value,
      items: [...parseItems(card.querySelector('[data-field="items"]').value), ...imageItems],
    };
  });

  const optionalEnabled = [...dom.enabledLocales.querySelectorAll('[data-locale-toggle]:checked')]
    .map((input) => input.value)
    .filter((code) => !REQUIRED_LOCALES.includes(code))
    .slice(0, MAX_OPTIONAL_LOCALES);

  next.appName = dom.appName.value;
  next.address = dom.address.value;
  next.license = dom.license.value;
  next.enabledLocales = [...REQUIRED_LOCALES, ...optionalEnabled];
  next.locales[selectedEditorLocale] = {
    ...next.locales[selectedEditorLocale],
    subtitle: dom.subtitle.value,
    sections,
  };

  return normalizeTemplate(next);
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
  setStatus("Lingue visibili aggiornate. Pubblica per sincronizzare l'app ospiti.", "success");
}

function createSectionId() {
  return `custom-${Date.now().toString(36)}`;
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
    setStatus("Accedi come host per pubblicare live.", "error");
    return;
  }

  state = saveTemplate(collectTemplate());
  if (!silent) {
    setStatus("Traduzione e pubblicazione live in corso...", "");
  }

  try {
    state = await buildPublishedTemplate(state);
    saveTemplate(state);
    const published = await publishRemoteTemplate(state, supabase);
    latestRemoteUpdatedAt = published.updated_at ?? null;
    if (!silent) {
      setStatus("Template pubblicato live. L'app ospiti si aggiorna in remoto.", "success");
    } else {
      setStatus("Modifiche sincronizzate live.", "success");
    }
  } catch {
    setStatus("Pubblicazione live fallita. Verifica accesso host, setup Supabase o traduzione online.", "error");
  }
}

function queueAutoPublish() {
  if (!isAuthorizedSession(session)) return;
  window.clearTimeout(autoPublishTimer);
  setStatus("Modifica rilevata. Sincronizzazione live in corso...", "");
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

async function removeImage(sectionId, imageIndex) {
  state = collectTemplate();
  const section = currentLocaleState().sections.find((item) => item.id === sectionId);
  if (!section) return;
  const imageItems = section.items.filter(isImageItem);
  const target = imageItems[imageIndex];
  if (!target) return;

  try {
    if (target.path && isAuthorizedSession(session)) {
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

function bindEditorEvents() {
  if (editorBound) return;
  editorBound = true;

  dom.save.addEventListener("click", saveCurrentTemplate);
  dom.export.addEventListener("click", downloadTemplate);
  dom.reset.addEventListener("click", restoreDefaultTemplate);
  dom.publish.addEventListener("click", () => publishNow({ silent: false }));
  dom.addSection.addEventListener("click", addSection);
  dom.logout.addEventListener("click", logout);
  dom.import.addEventListener("change", (event) => {
    importTemplate(event.target.files?.[0]);
    event.target.value = "";
  });

  dom.app.addEventListener("input", (event) => {
    if (!event.target.matches("input, textarea")) return;
    queueAutoPublish();
  });

  dom.editorLocale.addEventListener("change", (event) => {
    switchEditorLocale(event.target.value);
  });

  dom.enabledLocales.addEventListener("change", (event) => {
    if (!event.target.matches('[data-locale-toggle]')) return;
    updateEnabledLocales();
  });

  dom.sections.addEventListener("change", (event) => {
    const uploader = event.target.closest("[data-image-upload]");
    if (!uploader) return;
    const sectionCard = event.target.closest("[data-section-id]");
    handleImageUpload(sectionCard?.dataset.sectionId, event.target.files?.[0]);
    event.target.value = "";
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

    const removeTrigger = event.target.closest('[data-action="remove-image"]');
    if (!removeTrigger) return;
    const imageItem = event.target.closest("[data-image-item]");
    const sectionCard = event.target.closest("[data-section-id]");
    removeImage(sectionCard?.dataset.sectionId, Number.parseInt(imageItem?.dataset.imageIndex ?? "-1", 10));
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
