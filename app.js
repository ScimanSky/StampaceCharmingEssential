import {
  FIXED_LOCALE,
  fetchRemoteTemplateEnvelope,
  getLocaleContent,
  getVisibleLocales,
  isImageItem,
  loadTemplate,
  normalizeTemplate,
} from "./content.js?v=20260528f";
import { subscribeToRemoteTemplate } from "./supabase.js";

const iconPaths = {
  shield:
    '<path d="M12 3l6 2.7v5.7c0 3.7-2.3 6.9-6 8.6-3.7-1.7-6-4.9-6-8.6V5.7L12 3z"/><path d="M9.4 11.8 11 13.4l3.7-3.8"/>',
  clock:
    '<circle cx="12" cy="12" r="8"/><path d="M12 7.8v4.6l3 1.8"/>',
  calendar:
    '<rect x="5" y="6" width="14" height="13" rx="2"/><path d="M8 4.8v2.4"/><path d="M16 4.8v2.4"/><path d="M5 9.5h14"/>',
  wifi:
    '<path d="M1 8 A 15.5 15.5 0 0 1 23 8"/><path d="M4.5 11.5 A 10.6 10.6 0 0 1 19.5 11.5"/><path d="M8 15 A 5.6 5.6 0 0 1 16 15"/><circle cx="12" cy="19.5" r="1.5" style="fill: currentColor; stroke: none;"/>',
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
  phone:
    '<path d="M7.2 5.8c.5-.5 1.2-.5 1.7 0l1.5 1.5c.5.5.5 1.2 0 1.7l-1 1c1 1.9 2.6 3.5 4.5 4.5l1-1c.5-.5 1.2-.5 1.7 0l1.5 1.5c.5.5.5 1.2 0 1.7l-.9.9c-.8.8-2 1.1-3.1.8-2.6-.7-5.2-2.2-7.2-4.2s-3.5-4.6-4.2-7.2c-.3-1.1 0-2.3.8-3.1z"/>',
  mail:
    '<rect x="4" y="6.2" width="16" height="11.6" rx="2"/><path d="m5.3 7.7 6.7 5 6.7-5"/>',
  card:
    '<rect x="4.5" y="6.2" width="15" height="11.6" rx="2"/><path d="M4.5 10h15"/><path d="M8 14.2h2.8"/>',
  door:
    '<path d="M7 20V6.5c0-.6.4-1.1 1-1.2l6-1.3c.7-.1 1.3.4 1.3 1.2V20"/><path d="M7 20h10"/><circle cx="12.2" cy="12.3" r="0.7" fill="currentColor" stroke="none"/>',
  home:
    '<path d="M4.5 10.2 12 4l7.5 6.2"/><path d="M6.5 9.4V19h11V9.4"/>',
  bag:
    '<path d="M7 18V8.5c0-.8.7-1.5 1.5-1.5h7c.8 0 1.5.7 1.5 1.5V18"/><path d="M10 7V5.8A2 2 0 0 1 12 4a2 2 0 0 1 2 1.8V7"/>',
  luggage:
    '<rect x="6.4" y="7.2" width="11.2" height="11.4" rx="2"/><path d="M9.7 7.2V5.8c0-.8.7-1.4 1.5-1.4h1.6c.8 0 1.5.6 1.5 1.4v1.4"/><path d="M12 10v5"/>',
  moon:
    '<path d="M15.8 4.8a6.7 6.7 0 1 0 3.4 11.9 7.4 7.4 0 1 1-3.4-11.9z"/>',
  ban:
    '<circle cx="12" cy="12" r="7.5"/><path d="M8.7 15.3 15.3 8.7"/>',
  trash:
    '<path d="M8.2 7.4h7.6"/><path d="M9.3 7.4V6.3c0-.5.4-.9.9-.9h3.6c.5 0 .9.4.9.9v1.1"/><path d="m7.6 8.3.7 9c0 .7.6 1.2 1.3 1.2h4.8c.7 0 1.2-.5 1.3-1.2l.7-9"/>',
  car:
    '<path d="M5.2 14.8h13.6"/><path d="m7 14.8 1-4.2c.2-.7.8-1.2 1.5-1.2h5c.7 0 1.3.5 1.5 1.2l1 4.2"/><circle cx="8.3" cy="16.8" r="1.3"/><circle cx="15.7" cy="16.8" r="1.3"/>',
  bus:
    '<rect x="6.3" y="4.8" width="11.4" height="12" rx="2"/><path d="M8.5 8h2.6"/><path d="M13 8h2.5"/><path d="M8 18.2 6.9 20"/><path d="M17.1 18.2 16 20"/><circle cx="9" cy="15.2" r="0.7" fill="currentColor" stroke="none"/><circle cx="15" cy="15.2" r="0.7" fill="currentColor" stroke="none"/>',
  cart:
    '<circle cx="10" cy="17.5" r="1.2"/><circle cx="16" cy="17.5" r="1.2"/><path d="M5 6h1.6l1.2 7h8.2l1.6-5.2H8.3"/>',
  cross:
    '<path d="M12 5.4v13.2"/><path d="M5.4 12h13.2"/>',
  train:
    '<rect x="7" y="5.2" width="10" height="11.6" rx="2"/><path d="M9.5 8.2h5"/><path d="M9.5 11.2h5"/><path d="M9.2 18.2 8 20"/><path d="M14.8 18.2 16 20"/>',
  wave:
    '<path d="M3.8 15.2c1.2 0 1.2-1 2.4-1s1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.4 1"/><path d="M4 10.5c1 0 1-.8 2-.8s1 .8 2 .8 1-.8 2-.8 1 .8 2 .8 1-.8 2-.8 1 .8 2 .8"/>',
  id:
    '<rect x="4.8" y="6" width="14.4" height="12" rx="2"/><circle cx="9.3" cy="11" r="1.6"/><path d="M7.2 14.4c.7-1.1 1.5-1.6 2.1-1.6s1.4.5 2.1 1.6"/><path d="M13.6 10h3.1"/><path d="M13.6 13h3.1"/>',
  receipt:
    '<path d="M7 4.8h10v14.4l-1.4-.8-1.6.8-1.6-.8-1.6.8-1.6-.8-1.2.8z"/><path d="M9.3 8h5.4"/><path d="M9.3 11h5.4"/><path d="M9.3 14h3.2"/>',
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

const dom = {
  appName: document.querySelector("#app-name"),
  hostAvatarButton: document.querySelector("#host-avatar-button"),
  hostAvatarLabel: document.querySelector("#host-avatar-label"),
  localeBar: document.querySelector("#locale-bar"),
  subtitle: document.querySelector("#hero-subtitle"),
  address: document.querySelector("#footer-address"),
  license: document.querySelector("#footer-license"),
  mainMenu: document.querySelector("#main-menu"),
  sheet: document.querySelector("#section-sheet"),
  sheetBackdrop: document.querySelector("#sheet-backdrop"),
  sheetClose: document.querySelector("#sheet-close"),
  sheetIcon: document.querySelector("#sheet-icon"),
  sheetBrand: document.querySelector("#sheet-brand"),
  sheetTitle: document.querySelector("#sheet-title"),
  sheetLead: document.querySelector("#sheet-lead"),
  sheetContent: document.querySelector("#sheet-content"),
};

let template = null;
let activeSectionId = null;
let remoteTemplateUpdatedAt = null;
let unsubscribeRealtime = null;
const SHEET_HISTORY_KEY = "stampaceSectionId";
const LOCALE_STORAGE_KEY = "stampace_essential_guest_locale";
let currentLocale = FIXED_LOCALE;

function renderIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] ?? iconPaths.spark}</svg>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePhoneDigits(value) {
  const cleaned = String(value).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned.slice(1);
  if (cleaned.startsWith("00")) return cleaned.slice(2);
  return cleaned;
}

function renderHostStringItem(item, marker) {
  const text = String(item).trim();
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+|00)?\d[\d\s().-]{6,}\d/);
  const lower = text.toLowerCase();
  const isWhatsapp = /whatsapp|wa\b/.test(lower);

  if (emailMatch) {
    const email = emailMatch[0];
    const label = text.slice(0, emailMatch.index).replace(/[:：]\s*$/, "").trim();
    return `
      <article class="sheet-card">
        ${marker}
        <div class="sheet-card-copy">
          ${label ? `<strong>${escapeHtml(label)}</strong>` : ""}
          <a class="sheet-link" href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
        </div>
      </article>
    `;
  }

  if (phoneMatch && isWhatsapp) {
    const rawNumber = phoneMatch[0].trim();
    const waNumber = normalizePhoneDigits(rawNumber);
    const label = text.slice(0, phoneMatch.index).replace(/[:：]\s*$/, "").trim();
    return `
      <article class="sheet-card">
        ${marker}
        <div class="sheet-card-copy">
          ${label ? `<strong>${escapeHtml(label)}</strong>` : ""}
          <a class="sheet-link" href="https://wa.me/${escapeHtml(waNumber)}" target="_blank" rel="noopener noreferrer">${escapeHtml(rawNumber)}</a>
        </div>
      </article>
    `;
  }

  return `
    <article class="sheet-card">
      ${marker}
      <p>${escapeHtml(text)}</p>
    </article>
  `;
}

function localeState() {
  return getLocaleContent(template, currentLocale);
}

function getItemText(item) {
  if (typeof item === "string") return item.toLowerCase();
  return `${item?.title ?? ""} ${item?.body ?? ""} ${item?.label ?? ""}`.toLowerCase();
}

function iconForItem(item, sectionId) {
  if (isImageItem(item)) return "image";
  const text = getItemText(item);

  if (sectionId === "rules") {
    if (/fum|divieto|vietat|proibit/.test(text)) return "ban";
    if (/rifiut|spazzatura|raccolta/.test(text)) return "trash";
    if (/rumore|silenzio|notte|orario/.test(text)) return "clock";
    if (/chiave|chiavi|codic|serratur|porta|accesso/.test(text)) return "lock";
    if (/animali|pet/.test(text)) return "home";
    if (/wifi|rete|password|connession/.test(text)) return "spark";
    return "spark";
  }

  if (/wifi|rete|password|connession/.test(text)) return "wifi";
  if (/tassa|soggiorn|€|euro|contanti|pagamento/.test(text)) return "receipt";
  if (/documento|identit|passaport|patente|questura/.test(text)) return "id";
  if (/check-?out|partenza/.test(text)) return "calendar";
  if (/check-?in|orario|arrivo|prima dell'arrivo|late check|early check/.test(text)) return "clock";
  if (/chiave|codic|serratur|porton|porta|accesso|cassetta/.test(text)) return "lock";
  if (/cassafort|safe/.test(text)) return "safe";
  if (/host|whatsapp|telefono|contatt|chiama/.test(text)) return "phone";
  if (/email|mail/.test(text)) return "mail";
  if (/privato|editor/.test(text)) return "user";
  if (/fum|divieto|vietat|rumore|regol|regole/.test(text)) return "ban";
  if (/rifiut|spazzatura|raccolta/.test(text)) return "trash";
  if (/parcheg|auto|noleggio/.test(text)) return "car";
  if (/bus|navetta/.test(text)) return "bus";
  if (/ristorant|bar|spesa|supermercat/.test(text)) return "cart";
  if (/farmacia|emergenz|medic/.test(text)) return "cross";
  if (/spiagg|mare/.test(text)) return "wave";
  if (/treno|stazione|metro/.test(text)) return "train";
  if (/aeroport|transfer/.test(text)) return "bus";
  if (/bagagli|valigi/.test(text)) return "luggage";
  if (/casa|struttura|appartament/.test(text)) return "home";
  if (/mappa|dintorn|mezzi|quartiere|vicin/.test(text)) return "pin";

  const sectionFallbacks = {
    checkin: "calendar",
    rules: "spark",
    wifi: "wifi",
    access: "lock",
    safe: "safe",
    around: "pin",
    host: "user",
  };

  return sectionFallbacks[sectionId] ?? "spark";
}

function renderMenu(sections) {
  return sections
    .filter((section) => section.id !== "host")
    .map(
      (section) => `
        <button class="menu-row" type="button" data-section-id="${section.id}">
          <span class="menu-icon">${renderIcon(section.icon)}</span>
          <span class="menu-copy">
            <strong>${section.menuTitle}</strong>
          </span>
          <span class="menu-chevron" aria-hidden="true">›</span>
        </button>
      `,
    )
    .join("");
}

function renderLocaleBar() {
  const visibleLocales = getVisibleLocales(template);
  dom.localeBar.innerHTML = visibleLocales
    .map(
      (language) => `
        <button
          class="locale-chip${language.code === currentLocale ? " is-active" : ""}"
          type="button"
          data-locale-code="${language.code}"
          aria-label="${language.label}"
          title="${language.label}"
        >
          <img src="${language.flagSrc}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
        </button>
      `,
    )
    .join("");
}

function renderHostShortcut() {
  const hostSection = localeState().sections.find((section) => section.id === "host");
  if (!hostSection) {
    dom.hostAvatarButton.classList.add("hidden");
    dom.hostAvatarButton.setAttribute("aria-hidden", "true");
    return;
  }

  dom.hostAvatarButton.classList.remove("hidden");
  dom.hostAvatarButton.removeAttribute("aria-hidden");
  dom.hostAvatarButton.setAttribute("aria-label", hostSection.menuTitle);
  dom.hostAvatarButton.setAttribute("title", hostSection.menuTitle);
  dom.hostAvatarLabel.textContent = "Host";
}

function renderSectionItems(items, sectionId) {
  let safeItemIndex = 0;

  // For Wi-Fi section, identify the network name and password by colon presence order
  let wifiColonStrings = [];
  let italianWifiValues = {};
  if (sectionId === "wifi") {
    wifiColonStrings = items.filter(item => typeof item === "string" && /[:：]/.test(item));
    if (template && template.locales && template.locales["it"]) {
      const itWifi = template.locales["it"].sections.find(s => s.id === "wifi");
      if (itWifi) {
        const itColonStrings = itWifi.items.filter(item => typeof item === "string" && /[:：]/.test(item));
        itColonStrings.forEach((itItem, idx) => {
          const parts = itItem.split(/[:：]/);
          const val = parts.length > 1 ? parts.slice(1).join(":").trim() : itItem.trim();
          if (idx === 0) italianWifiValues.rete = val;
          if (idx === 1) italianWifiValues.password = val;
        });
      }
    }
  }

  return items
    .map((item) => {
      const itemIcon = renderIcon(iconForItem(item, sectionId));
      const useSafeNumbers = sectionId === "safe" && !isImageItem(item);
      const marker = useSafeNumbers
        ? `<span class="sheet-card-index sheet-card-number" aria-hidden="true">${++safeItemIndex}</span>`
        : `<span class="sheet-card-index sheet-card-icon" aria-hidden="true">${itemIcon}</span>`;

      if (isImageItem(item)) {
        return `
          <article class="sheet-card sheet-card-media">
            <div class="sheet-card-media-body">
              <img class="sheet-image" src="${item.src}" alt="${item.alt ?? ""}" loading="lazy" />
              ${
                item.caption
                  ? `<p class="sheet-image-caption">${item.caption}</p>`
                  : ""
              }
            </div>
          </article>
        `;
      }

      if (typeof item === "string") {
        if (sectionId === "wifi" && wifiColonStrings.includes(item)) {
          const index = wifiColonStrings.indexOf(item);
          const parts = item.split(/[:：]/);
          
          const type = index === 0 ? "rete" : "password";
          const label = index === 0 ? "Rete" : "Password";
          
          // Use the Italian value if available to prevent translation of network name/password!
          const value = (type === "rete" ? italianWifiValues.rete : italianWifiValues.password) || 
                        (parts.length > 1 ? parts.slice(1).join(":").trim() : item.trim());

          return `
            <article class="sheet-card">
              ${marker}
              <div class="sheet-wifi-field">
                <div class="sheet-wifi-label-value">
                  <span class="sheet-wifi-label">${label}</span>
                  <span class="sheet-wifi-value" id="wifi-value-${type}">${value}</span>
                </div>
                <button class="copy-btn" data-copy-id="wifi-value-${type}" title="Copia" type="button">
                  <svg class="copy-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </article>
          `;
        }

        if (sectionId === "host") {
          return renderHostStringItem(item, marker);
        }

        return `
          <article class="sheet-card">
            ${marker}
            <p>${escapeHtml(item)}</p>
          </article>
        `;
      }

      return `
        <article class="sheet-card sheet-card-link">
          ${marker}
          <div class="sheet-card-copy">
            <strong>${item.title ?? ""}</strong>
            <p>${item.body ?? ""}</p>
            ${
              item.href
                ? `<a class="sheet-link" href="${item.href}"${
                    sectionId === "host" ? ' target="_blank" rel="noopener noreferrer"' : ""
                  }>${item.label || item.href}</a>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function renderOpenSection(sectionId) {
  const section = localeState().sections.find((item) => item.id === sectionId);
  if (!section) return;

  activeSectionId = section.id;
  dom.sheetIcon.innerHTML = renderIcon(section.icon);
  dom.sheetBrand.textContent = template.appName;
  dom.sheetTitle.textContent = section.sectionTitle;
  dom.sheetLead.textContent = section.lead;
  dom.sheetContent.innerHTML = renderSectionItems(section.items, section.id);

  dom.sheet.classList.remove("hidden");
  dom.sheet.setAttribute("aria-hidden", "false");
  document.body.classList.add("sheet-open");
}

function openSection(sectionId, { pushHistory = true } = {}) {
  if (pushHistory) {
    window.history.pushState(
      {
        ...(window.history.state ?? {}),
        [SHEET_HISTORY_KEY]: sectionId,
      },
      "",
    );
  }

  renderOpenSection(sectionId);
}

function closeSection({ fromHistory = false } = {}) {
  activeSectionId = null;
  dom.sheet.classList.add("hidden");
  dom.sheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("sheet-open");

  if (!fromHistory && window.history.state?.[SHEET_HISTORY_KEY]) {
    window.history.back();
  }
}

function bindMenu() {
  dom.mainMenu.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-section-id]");
    if (!trigger) return;
    trigger.blur();
    openSection(trigger.dataset.sectionId);
  });
}

function bindHostShortcut() {
  dom.hostAvatarButton.addEventListener("click", () => {
    dom.hostAvatarButton.blur();
    openSection("host");
  });
}

function bindLocaleBar() {
  const handleLocaleChange = (event) => {
    const trigger = event.target.closest("[data-locale-code]");
    if (!trigger) return;
    currentLocale = trigger.dataset.localeCode;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
    render();
  };

  dom.localeBar.addEventListener("click", handleLocaleChange);
  dom.localeBar.addEventListener(
    "touchend",
    (event) => {
      event.preventDefault();
      handleLocaleChange(event);
    },
    { passive: false },
  );
}

function bindSheet() {
  dom.sheetBackdrop.addEventListener("click", () => closeSection());
  dom.sheetClose.addEventListener("click", () => closeSection());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeSectionId) {
      closeSection();
    }
  });

  window.addEventListener("popstate", (event) => {
    const nextSectionId = event.state?.[SHEET_HISTORY_KEY];
    if (nextSectionId) {
      renderOpenSection(nextSectionId);
      return;
    }

    if (activeSectionId) {
      closeSection({ fromHistory: true });
    }
  });
}

function bindCopyButtons() {
  document.addEventListener("click", (event) => {
    const copyBtn = event.target.closest(".copy-btn");
    if (!copyBtn) return;

    const targetId = copyBtn.dataset.copyId;
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    const textToCopy = targetEl.textContent;

    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="#4ade80" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
      }, 1500);
    }).catch(err => {
      console.error("Copy failed: ", err);
    });
  });
}

function preventCopy() {
  ["copy", "cut", "contextmenu", "dragstart", "selectstart"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      event.preventDefault();
    });
  });
}

function render() {
  const localeTemplate = localeState();
  dom.appName.textContent = template.appName;
  renderHostShortcut();
  renderLocaleBar();
  dom.subtitle.textContent = localeTemplate.subtitle;
  dom.address.textContent = template.address;
  dom.license.textContent = template.license;
  dom.mainMenu.innerHTML = renderMenu(localeTemplate.sections);

  if (activeSectionId) {
    renderOpenSection(activeSectionId);
  }
}

async function syncRemoteTemplate() {
  try {
    const remote = await fetchRemoteTemplateEnvelope();
    if (remote.updatedAt && remote.updatedAt === remoteTemplateUpdatedAt) return;
    remoteTemplateUpdatedAt = remote.updatedAt ?? null;
    template = remote.template;
    if (!template.enabledLocales.includes(currentLocale)) {
      currentLocale = FIXED_LOCALE;
      window.localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
    }
    render();
  } catch {
    // Keep the current rendered template if remote sync fails.
  }
}

function startLiveSync() {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncRemoteTemplate();
    }
  });

  window.addEventListener("focus", syncRemoteTemplate);

  unsubscribeRealtime = subscribeToRemoteTemplate((row) => {
    remoteTemplateUpdatedAt = row.updated_at ?? null;
    if (row.content) {
      template = normalizeTemplate(row.content);
      if (!template.enabledLocales.includes(currentLocale)) {
        currentLocale = FIXED_LOCALE;
        window.localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
      }
      render();
    }
  });
}

async function init() {
  currentLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY) || FIXED_LOCALE;
  template = await loadTemplate();
  try {
    const remote = await fetchRemoteTemplateEnvelope();
    remoteTemplateUpdatedAt = remote.updatedAt ?? null;
    template = remote.template;
  } catch {
    remoteTemplateUpdatedAt = null;
  }
  if (!template.enabledLocales.includes(currentLocale)) {
    currentLocale = FIXED_LOCALE;
  }
  render();
  bindMenu();
  bindHostShortcut();
  bindLocaleBar();
  bindSheet();
  bindCopyButtons();
  preventCopy();
  startLiveSync();
}

init();
