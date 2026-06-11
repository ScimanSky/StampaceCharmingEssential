import {
  FIXED_LOCALE,
  fetchRemoteTemplateEnvelope,
  getLocaleContent,
  getVisibleLocales,
  isCtaItem,
  isHostPrivateItem,
  isImageItem,
  isMediaItem,
  loadTemplate,
  normalizeTemplate,
} from "./content.js?v=20260610h";
import {
  escapeAttribute,
  escapeHtml,
  normalizeCtaHref,
  normalizeCtaKind,
  sanitizeHref,
  sanitizeImageSrc,
} from "./security.js?v=20260610h";
import { subscribeToRemoteTemplate } from "./supabase.js";
import { renderIcon, iconPaths } from "./icons.js?v=20260610h";
import { themeValue, iconColorStyle, iconColorValue } from "./theme-utils.js?v=20260610h";


const HOST_AVATAR_SRC = "./img/host-avatar.jpg?v=20260528a";

const dom = {
  appName: document.querySelector("#app-name"),
  topbarSubtitle: document.querySelector("#topbar-subtitle"),
  hostAvatarButton: document.querySelector("#host-avatar-button"),
  hostAvatarLabel: document.querySelector("#host-avatar-label"),
  guestShareButton: document.querySelector("#guest-share-button"),
  localeBar: document.querySelector("#locale-bar"),
  subtitle: document.querySelector("#hero-subtitle"),
  heroMeta: document.querySelector("#hero-meta"),
  footerName: document.querySelector("#app-footer-name"),
  footerSubtitle: document.querySelector("#app-footer-subtitle"),
  footerMeta: document.querySelector("#app-footer-meta"),
  syncStatus: document.querySelector("#sync-status"),
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
let lastFocusedElement = null;
let sheetCloseTimer = null;
let lastInteractionWasKeyboard = false;
const SHEET_HISTORY_KEY = "stampaceSectionId";
const GUEST_SHARE_URL = "https://stampacecharming.pages.dev/";
const GUEST_SHARE_TITLE = "Guest Book- Stampace Charming";
const LOCALE_STORAGE_KEY = "stampace_essential_guest_locale";
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");
let currentLocale = FIXED_LOCALE;

function sectionClassToken(sectionId) {
  return String(sectionId).replace(/[^a-z0-9_-]/gi, "-");
}


function sectionIconColor(section) {
  const italianSection = template?.locales?.[FIXED_LOCALE]?.sections?.find((item) => item.id === section?.id);
  return iconColorValue(italianSection?.iconColor || section?.iconColor);
}

function normalizePhoneDigits(value) {
  const cleaned = String(value).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned.slice(1);
  if (cleaned.startsWith("00")) return cleaned.slice(2);
  return cleaned;
}

function renderWhatsAppBrandIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="whatsapp-green" cx="64%" cy="22%" r="82%">
          <stop offset="0%" stop-color="#7fff5b"/>
          <stop offset="48%" stop-color="#19d119"/>
          <stop offset="100%" stop-color="#007a05"/>
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11.4" fill="url(#whatsapp-green)" stroke="none"/>
      <path d="M5.55 19.3 6.75 15.7a6.95 6.95 0 1 1 2.25 2.05z" fill="none" stroke="#fff" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9.05 8.35c.28-.55.48-.6.83-.6h.45c.22 0 .42.15.52.42l.72 1.72c.1.28.06.48-.15.72l-.48.55c.72 1.24 1.68 2.16 2.95 2.82l.6-.67c.2-.22.42-.26.72-.12l1.62.78c.28.14.42.34.42.65v.45c0 .35-.2.66-.56.82-.75.34-1.78.28-3.05-.3-2.18-.96-4.34-3.1-5.2-5.28-.46-1.17-.33-1.84-.05-2.48z" fill="#fff" stroke="none"/>
    </svg>
  `;
}

function renderGmailBrandIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths.gmail}</svg>`;
}

function renderAirbnbBrandIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths.airbnb}</svg>`;
}

function renderBookingBrandIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths.booking}</svg>`;
}

function renderVrboBrandIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths.vrbo}</svg>`;
}

function gmailComposeHref(email) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
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
      <article class="sheet-card sheet-contact-card">
        ${marker}
        <div class="sheet-card-copy">
          <strong>${escapeHtml(label || "Email")}</strong>
          <div class="sheet-contact-actions">
            <a class="sheet-contact-button sheet-contact-button--gmail" href="${escapeAttribute(gmailComposeHref(email))}" target="_blank" rel="noopener noreferrer" aria-label="Apri Gmail per ${escapeAttribute(email)}">
              ${renderGmailBrandIcon()}
            </a>
          </div>
        </div>
      </article>
    `;
  }

  if (phoneMatch && isWhatsapp) {
    const rawNumber = phoneMatch[0].trim();
    const waNumber = normalizePhoneDigits(rawNumber);
    const label = text.slice(0, phoneMatch.index).replace(/[:：]\s*$/, "").trim();
    return `
      <article class="sheet-card sheet-contact-card">
        ${marker}
        <div class="sheet-card-copy">
          <strong>${escapeHtml(label || "WhatsApp")}</strong>
          <div class="sheet-contact-actions">
            <a class="sheet-contact-button sheet-contact-button--whatsapp" href="https://wa.me/${escapeAttribute(waNumber)}" target="_blank" rel="noopener noreferrer" aria-label="Apri WhatsApp ${escapeAttribute(rawNumber)}">
              ${renderWhatsAppBrandIcon()}
            </a>
          </div>
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

function hostActionFromStringItem(item) {
  const text = String(item).trim();
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+|00)?\d[\d\s().-]{6,}\d/);
  const lower = text.toLowerCase();
  const isWhatsapp = /whatsapp|wa\b/.test(lower);

  if (emailMatch) {
    const email = emailMatch[0];
    const label = text.slice(0, emailMatch.index).replace(/[:：]\s*$/, "").trim() || "Gmail";
    return {
      kind: "gmail",
      label,
      href: gmailComposeHref(email),
      icon: "mail",
    };
  }

  if (phoneMatch && isWhatsapp) {
    const rawNumber = phoneMatch[0].trim();
    return {
      kind: "whatsapp",
      label: text.slice(0, phoneMatch.index).replace(/[:：]\s*$/, "").trim() || "WhatsApp",
      href: `https://wa.me/${normalizePhoneDigits(rawNumber)}`,
      icon: "chat",
    };
  }

  return null;
}

function hostActionFromCtaItem(item) {
  if (item.hidden) return null;
  const kind = normalizeCtaKind(item.kind);
  const href = normalizeCtaHref(kind, item.href);
  if (!href) return null;

  const email = kind === "email" && href.startsWith("mailto:") ? href.replace(/^mailto:/i, "") : "";
  return {
    kind: kind === "email" ? "gmail" : kind,
    label: item.label || ctaIcon(item),
    href: email ? gmailComposeHref(email) : href,
    icon: ctaIcon(item),
    iconColor: item.iconColor,
  };
}

function renderHostActionIcon(action) {
  if (action.kind === "whatsapp") return renderWhatsAppBrandIcon();
  if (action.kind === "gmail") return renderGmailBrandIcon();
  if (action.kind === "airbnb") return renderAirbnbBrandIcon();
  if (action.kind === "booking") return renderBookingBrandIcon();
  if (action.kind === "vrbo") return renderVrboBrandIcon();
  return renderIcon(action.icon || "link");
}

function renderHostActions(actions) {
  if (!actions.length) return "";
  return `
    <div class="sheet-host-actions" aria-label="Contatti e link host">
      ${actions
        .map(
          (action) => `
            <a class="sheet-host-action sheet-host-action--${escapeAttribute(action.kind)}" href="${escapeAttribute(action.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttribute(action.label)}"${iconColorStyle(action.iconColor)}>
              ${renderHostActionIcon(action)}
            </a>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderGenericLinkItem(item, marker, sectionId) {
  const title = item.title ? `<strong>${escapeHtml(item.title)}</strong>` : "";
  const body = item.body ? `<p>${escapeHtml(item.body)}</p>` : "";
  const label = item.label || item.href;
  const href = sanitizeHref(item.href);

  if (sectionId === "host" && isHostPrivateItem(item)) {
    return `
      <article class="sheet-card sheet-card-link sheet-card-host-template">
        ${marker}
        <div class="sheet-card-copy">
          ${title}
          ${body}
          ${
            href
              ? `<a class="sheet-cta sheet-host-template-cta" href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">
                  <span class="sheet-cta-icon" aria-hidden="true">${renderIcon("user")}</span>
                  <span class="sheet-cta-label">${escapeHtml(label)}</span>
                </a>`
              : ""
          }
        </div>
      </article>
    `;
  }

  return `
    <article class="sheet-card sheet-card-link">
      ${marker}
      <div class="sheet-card-copy">
        ${title}
        ${body}
        ${
          href
            ? `<a class="sheet-link" href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
            : ""
        }
      </div>
    </article>
  `;
}

function ctaIcon(item) {
  const kindFallback = {
    web: "link",
    maps: "map",
    whatsapp: "whatsapp",
    email: "gmail",
    tel: "phone",
    airbnb: "airbnb",
    booking: "booking",
    vrbo: "vrbo",
  };
  return item.icon || kindFallback[item.kind] || "link";
}

function renderCtaItem(item) {
  if (item.hidden) return "";
  const kind = normalizeCtaKind(item.kind);
  const href = normalizeCtaHref(kind, item.href);
  if (!href) return "";

  return `
    <article class="sheet-card sheet-card-cta">
      <a class="sheet-cta sheet-cta--${escapeAttribute(kind)}" href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">
        <span class="sheet-cta-icon" aria-hidden="true"${iconColorStyle(item.iconColor)}>${renderIcon(ctaIcon(item))}</span>
        <span class="sheet-cta-label">${escapeHtml(item.label)}</span>
      </a>
    </article>
  `;
}

function renderImageItem(item, { plain = false, hostQr = false } = {}) {
  const src = sanitizeImageSrc(item.src);
  if (!src) return "";
  const hostQrClass = hostQr ? " sheet-card-media--host-qr" : "";
  return `
    <article class="sheet-card sheet-card-media${plain ? " sheet-card-media--plain" : ""}${hostQrClass}">
      <div class="sheet-card-media-body">
        <img class="sheet-image sheet-image--${escapeAttribute(item.size || "grande")}${plain ? " sheet-image--plain" : ""}" src="${escapeAttribute(src)}" alt="${escapeAttribute(item.alt ?? "")}" loading="lazy" />
        ${
          item.caption
            ? `<p class="sheet-image-caption">${escapeHtml(item.caption)}</p>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderMediaItem(item) {
  const src = sanitizeImageSrc(item.src);
  if (!src) return "";
  const title = item.title || item.fileName || (item.mediaKind === "video" ? "Video" : "Documento");
  const caption = item.caption ? `<p class="sheet-media-caption">${escapeHtml(item.caption)}</p>` : "";

  if (item.mediaKind === "video") {
    return `
      <article class="sheet-card sheet-card-media sheet-card-file">
        <video class="sheet-video" controls preload="metadata" src="${escapeAttribute(src)}"></video>
        <div class="sheet-card-copy">
          <strong>${escapeHtml(title)}</strong>
          ${caption}
        </div>
      </article>
    `;
  }

  return `
    <article class="sheet-card sheet-card-file">
      <span class="sheet-card-index sheet-card-icon" aria-hidden="true">${renderIcon("book")}</span>
      <div class="sheet-card-copy">
        <strong>${escapeHtml(title)}</strong>
        ${caption}
        <a class="sheet-link" href="${escapeAttribute(src)}" target="_blank" rel="noopener noreferrer" download>Apri documento</a>
      </div>
    </article>
  `;
}

function iconFromSectionContent(section) {
  if (!section) return "spark";

  const explicitIcon = section.icon && section.icon !== "spark" && iconPaths[section.icon] ? section.icon : "";
  if (explicitIcon) return explicitIcon;

  const text = `${section.menuTitle ?? ""} ${section.sectionTitle ?? ""} ${section.lead ?? ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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
  if (/mobilit|transfer|navetta|aeroport|bus|taxi|trasport/.test(text)) return "skyline";
  if (/noleggio|rent|auto|car rental|vehicle|parchegg/.test(text)) return "car";
  if (/farmacia|emergenz|medic|ospedal/.test(text)) return "cross";
  if (/spiagg|mare|poetto/.test(text)) return "wave";
  if (/mappa|quartiere|dintorn|local|posizion|indirizz|come arrivare/.test(text)) return "pin";

  return iconPaths[section.icon] ? section.icon : "spark";
}

function iconForSection(section) {
  if (!section) return "spark";

  const italianSection = template?.locales?.[FIXED_LOCALE]?.sections?.find((item) => item.id === section.id);
  return iconFromSectionContent(italianSection ?? section);
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
  if (isMediaItem(item)) return item.mediaKind === "video" ? "camera" : "book";
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
  if (/spiagg|beach|poetto/.test(text)) return "beach";
  if (/barca|boat|sail|vela|gommon|yacht/.test(text)) return "boat";
  if (/sup|kayak|canoa|paddle/.test(text)) return "paddle";
  if (/guru walk|walk|walking|passeggiat|cammin/.test(text)) return "walk";
  if (/visita guid|guided tour|tour|foto|photo|camera/.test(text)) return "camera";
  if (/muse|cultur|arte|storia/.test(text)) return "museum";
  if (/parcheg|parking/.test(text)) return "parking";
  if (/taxi/.test(text)) return "taxi";
  if (/aeroport|airport|volo|flight/.test(text)) return "airplane";
  if (/traghett|ferry|porto/.test(text)) return "ferry";
  if (/auto|noleggio/.test(text)) return "car";
  if (/bici|biciclett|bike|cycling|ciclab/.test(text)) return "bicycle";
  if (/a piedi|pedon|pedestrian/.test(text)) return "pedestrian";
  if (/bus|navetta/.test(text)) return "bus";
  if (/ristorant|trattoria|food|cibo/.test(text)) return "utensils";
  if (/bar|caffe|colazione/.test(text)) return "coffee";
  if (/vino|wine|aperitiv|drink/.test(text)) return "wine";
  if (/shopping|negoz/.test(text)) return "shopping";
  if (/spesa|supermercat|market/.test(text)) return "cart";
  if (/farmacia|emergenz|medic|ospedal/.test(text)) return "hospital";
  if (/mare/.test(text)) return "wave";
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
    .filter((section) => section.id !== "host" && !section.hidden)
    .map(
      (section) => `
        <button class="menu-row menu-row--${escapeAttribute(sectionClassToken(section.id))} menu-row--icon-${escapeAttribute(sectionClassToken(iconForSection(section)))}" type="button" data-section-id="${escapeAttribute(section.id)}"${iconColorStyle(sectionIconColor(section))}>
          <span class="menu-icon">${renderIcon(iconForSection(section))}</span>
          <span class="menu-copy">
            <strong>${escapeHtml(section.menuTitle)}</strong>
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
          data-locale-code="${escapeAttribute(language.code)}"
          aria-label="${escapeAttribute(language.label)}"
          title="${escapeAttribute(language.label)}"
        >
          <img src="${escapeAttribute(sanitizeImageSrc(language.flagSrc))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
        </button>
      `,
    )
    .join("");
}

function renderHostShortcut() {
  const hostSection = localeState().sections.find((section) => section.id === "host" && !section.hidden);
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

function renderHostAvatarMedia(className = "sheet-host-avatar-media", { linked = false } = {}) {
  const media = `
    <span class="${escapeAttribute(className)}">
      <img src="${escapeAttribute(sanitizeImageSrc(HOST_AVATAR_SRC))}" alt="" loading="lazy" decoding="async" />
    </span>
  `;
  if (!linked) return media;
  return `
    <a class="sheet-host-avatar-link" href="./host.html" target="_blank" rel="noopener noreferrer" aria-label="Apri area host">
      ${media}
    </a>
  `;
}

function renderSectionItems(items, sectionId) {
  if (sectionId === "host") {
    const section = localeState().sections.find((item) => item.id === sectionId);
    const markerColorStyle = iconColorStyle(sectionIconColor(section));
    const actions = [];
    const cards = [];
    const mediaCards = [];

    items.forEach((item) => {
      const action =
        typeof item === "string"
          ? hostActionFromStringItem(item)
          : isCtaItem(item)
            ? hostActionFromCtaItem(item)
            : null;

      if (isHostPrivateItem(item)) return;

      if (isCtaItem(item)) {
        if (action) {
          actions.push(action);
        }
        return;
      }

      if (action) {
        actions.push(action);
        return;
      }

      if (isImageItem(item)) {
        mediaCards.push(renderImageItem(item, { plain: true, hostQr: true }));
        return;
      }

      if (isMediaItem(item)) {
        mediaCards.push(renderMediaItem(item));
        return;
      }

      const itemIcon = renderIcon(iconForItem(item, sectionId));
      const marker = `<span class="sheet-card-index sheet-card-icon" aria-hidden="true"${markerColorStyle}>${itemIcon}</span>`;

      if (typeof item === "string") {
        cards.push(`
          <article class="sheet-card">
            ${marker}
            <p>${escapeHtml(item)}</p>
          </article>
        `);
        return;
      }

      cards.push(renderGenericLinkItem(item, marker, sectionId));
    });

    return `${cards.join("")}${renderHostActions(actions)}${mediaCards.join("")}`;
  }

  let safeItemIndex = 0;
  const section = localeState().sections.find((item) => item.id === sectionId);
  const markerColorStyle = iconColorStyle(sectionIconColor(section));

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
        ? `<span class="sheet-card-index sheet-card-number" aria-hidden="true"${markerColorStyle}>${++safeItemIndex}</span>`
        : `<span class="sheet-card-index sheet-card-icon" aria-hidden="true"${markerColorStyle}>${itemIcon}</span>`;

      if (isImageItem(item)) {
        return renderImageItem(item);
      }

      if (isMediaItem(item)) {
        return renderMediaItem(item);
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
                  <span class="sheet-wifi-value" id="wifi-value-${type}">${escapeHtml(value)}</span>
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

      if (isCtaItem(item)) {
        return renderCtaItem(item);
      }

      return renderGenericLinkItem(item, marker, sectionId);
    })
    .join("");
}

function renderOpenSection(sectionId) {
  const section = localeState().sections.find((item) => item.id === sectionId);
  if (!section || section.hidden) return;

  if (sheetCloseTimer) {
    window.clearTimeout(sheetCloseTimer);
    sheetCloseTimer = null;
  }

  activeSectionId = section.id;
  if (section.id === "host") {
    dom.sheetIcon.innerHTML = renderHostAvatarMedia("sheet-host-avatar-media", { linked: true });
    dom.sheetIcon.className = "sheet-icon sheet-icon--host sheet-icon--host-avatar";
    dom.sheetIcon.removeAttribute("aria-hidden");
    dom.sheetIcon.style.removeProperty("--icon-custom-color");
  } else {
    const sectionIcon = iconForSection(section);
    dom.sheetIcon.innerHTML = renderIcon(sectionIcon);
    dom.sheetIcon.className = `sheet-icon sheet-icon--${sectionClassToken(section.id)} sheet-icon--icon-${sectionClassToken(sectionIcon)}`;
    dom.sheetIcon.setAttribute("aria-hidden", "true");
  }
  const iconColor = section.id === "host" ? "" : sectionIconColor(section);
  if (iconColor) {
    dom.sheetIcon.style.setProperty("--icon-custom-color", iconColor);
  } else {
    dom.sheetIcon.style.removeProperty("--icon-custom-color");
  }
  dom.sheetBrand.textContent = template.appName;
  dom.sheetTitle.textContent = section.sectionTitle;
  dom.sheetLead.textContent = section.lead;
  dom.sheetContent.innerHTML = renderSectionItems(section.items, section.id);

  dom.sheet.classList.remove("hidden");
  dom.sheet.classList.remove("is-closing");
  window.requestAnimationFrame(() => {
    dom.sheet.classList.add("is-visible");
  });
  dom.sheet.setAttribute("aria-hidden", "false");
  document.body.classList.add("sheet-open");
}

function setSyncStatus(message = "") {
  if (!dom.syncStatus) return;
  dom.syncStatus.textContent = message;
  dom.syncStatus.classList.toggle("is-visible", Boolean(message));
}

function setTransientStatus(message) {
  setSyncStatus(message);
  window.setTimeout(() => {
    if (dom.syncStatus?.textContent === message) {
      setSyncStatus("");
    }
  }, 2400);
}

function focusSheet() {
  window.requestAnimationFrame(() => {
    dom.sheetClose.focus({ preventScroll: true });
  });
}

function openSection(sectionId, { pushHistory = true } = {}) {
  const focusSource = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  lastFocusedElement = lastInteractionWasKeyboard ? focusSource : null;
  if (!lastInteractionWasKeyboard) {
    focusSource?.blur();
  }

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
  focusSheet();
}

function closeSection({ fromHistory = false } = {}) {
  const focusTarget = lastFocusedElement;
  activeSectionId = null;
  dom.sheet.classList.remove("is-visible");
  dom.sheet.classList.add("is-closing");
  dom.sheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("sheet-open");
  lastFocusedElement = null;

  if (sheetCloseTimer) {
    window.clearTimeout(sheetCloseTimer);
  }

  sheetCloseTimer = window.setTimeout(() => {
    dom.sheet.classList.add("hidden");
    dom.sheet.classList.remove("is-closing");
    sheetCloseTimer = null;
  }, 320);

  if (focusTarget && document.contains(focusTarget)) {
    window.requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
  }

  if (!fromHistory && window.history.state?.[SHEET_HISTORY_KEY]) {
    window.history.back();
  }
}

function bindMenu() {
  dom.mainMenu.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-section-id]");
    if (!trigger) return;
    openSection(trigger.dataset.sectionId);
  });
}

function bindHostShortcut() {
  dom.hostAvatarButton.addEventListener("click", () => {
    openSection("host");
  });
}

function bindInputModality() {
  window.addEventListener(
    "pointerdown",
    () => {
      lastInteractionWasKeyboard = false;
    },
    { capture: true },
  );

  window.addEventListener(
    "keydown",
    (event) => {
      if (["Tab", "Enter", " ", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        lastInteractionWasKeyboard = true;
      }
    },
    { capture: true },
  );
}

async function shareGuestApp() {
  const payload = {
    title: GUEST_SHARE_TITLE,
    text: GUEST_SHARE_TITLE,
    url: GUEST_SHARE_URL,
  };

  if (navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(GUEST_SHARE_URL);
    setTransientStatus("Link copied.");
  } catch {
    window.location.href = `mailto:?subject=${encodeURIComponent(GUEST_SHARE_TITLE)}&body=${encodeURIComponent(GUEST_SHARE_URL)}`;
  }
}

function bindGuestShare() {
  dom.guestShareButton.addEventListener("click", shareGuestApp);
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
    if (event.key === "Tab" && activeSectionId) {
      const focusable = [...dom.sheet.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
        (element) => element.offsetParent !== null,
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (event.key === "Escape" && activeSectionId) {
      closeSection();
    }
  });

  window.addEventListener("popstate", (event) => {
    const nextSectionId = event.state?.[SHEET_HISTORY_KEY];
    if (nextSectionId) {
      renderOpenSection(nextSectionId);
      focusSheet();
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

function makeColorTransparent(colorStr, alpha = 0.45) {
  if (!colorStr) return `rgba(10, 8, 6, ${alpha})`;
  colorStr = colorStr.trim();
  if (colorStr.startsWith("rgb")) {
    const matches = colorStr.match(/\d+(\.\d+)?/g);
    if (matches && matches.length >= 3) {
      return `rgba(${matches[0]}, ${matches[1]}, ${matches[2]}, ${alpha})`;
    }
  }
  if (colorStr.startsWith("#")) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return colorStr;
}

function applyTheme(theme) {
  const primaryFont = theme?.fontPrimary || "Roboto";
  const secondaryFont = theme?.fontSecondary || "Roboto";
  const colors = theme?.colors || {};
  const typography = theme?.typography || {};
  const textStyles = theme?.textStyles || {};
  const layout = theme?.layout || {};
  const buttons = theme?.buttons || {};
  const motion = theme?.motion || {};

  const serifFonts = ["Playfair Display", "Lora", "Cormorant Garamond"];
  const primaryFallback = serifFonts.includes(primaryFont) ? "serif" : "sans-serif";
  const secondaryFallback = serifFonts.includes(secondaryFont) ? "serif" : "sans-serif";

  document.documentElement.style.setProperty("--font-primary", `"${primaryFont}", ${primaryFallback}`);
  document.documentElement.style.setProperty("--font-secondary", `"${secondaryFont}", ${secondaryFallback}`);
  document.documentElement.style.setProperty("--bg", themeValue(colors, "background", "#070605"));
  document.documentElement.style.setProperty("--copy", themeValue(colors, "text", "#e7d8c1"));
  document.documentElement.style.setProperty("--text", "var(--copy)");
  document.documentElement.style.setProperty("--muted", themeValue(colors, "muted", "rgba(231, 216, 193, 0.72)"));
  document.documentElement.style.setProperty("--muted-strong", themeValue(colors, "muted", "rgba(231, 216, 193, 0.88)"));
  document.documentElement.style.setProperty("--icon", themeValue(colors, "icon", "#dfc39c"));
  document.documentElement.style.setProperty("--line", themeValue(colors, "line", "rgba(224, 205, 177, 0.12)"));
  document.documentElement.style.setProperty("--row", themeValue(colors, "row", "rgba(17, 14, 11, 0.34)"));
  document.documentElement.style.setProperty("--row-hover", themeValue(colors, "rowHover", "rgba(27, 22, 17, 0.48)"));
  document.documentElement.style.setProperty("--sheet-bg", makeColorTransparent(themeValue(colors, "sheet", "rgba(10, 8, 6, 0.3)"), 0.3));
  document.documentElement.style.setProperty("--title-size", themeValue(typography, "titleSize", "1.18rem"));
  document.documentElement.style.setProperty("--subtitle-size", themeValue(typography, "subtitleSize", "0.98rem"));
  document.documentElement.style.setProperty("--menu-size", themeValue(typography, "menuSize", "1.04rem"));
  document.documentElement.style.setProperty("--section-title-size", themeValue(typography, "sectionTitleSize", "1.32rem"));
  document.documentElement.style.setProperty("--body-size", themeValue(typography, "bodySize", "0.96rem"));
  document.documentElement.style.setProperty("--menu-weight", themeValue(typography, "menuWeight", "400"));
  document.documentElement.style.setProperty("--body-weight", themeValue(typography, "bodyWeight", "400"));
  document.documentElement.style.setProperty("--intro-size", themeValue(typography, "introSize", "0.9rem"));
  document.documentElement.style.setProperty("--intro-weight", themeValue(typography, "introWeight", "400"));
  document.documentElement.style.setProperty("--intro-align", themeValue(typography, "introAlign", "center"));
  document.documentElement.style.setProperty("--section-lead-size", themeValue(typography, "sectionLeadSize", "0.96rem"));
  document.documentElement.style.setProperty("--section-lead-weight", themeValue(typography, "sectionLeadWeight", "400"));
  document.documentElement.style.setProperty("--section-body-size", themeValue(typography, "sectionBodySize", "0.96rem"));
  document.documentElement.style.setProperty("--section-body-weight", themeValue(typography, "sectionBodyWeight", "400"));
  document.documentElement.style.setProperty("--intro-color", themeValue(textStyles, "introColor", "var(--muted)"));
  document.documentElement.style.setProperty("--section-lead-color", themeValue(textStyles, "sectionLeadColor", "var(--muted)"));
  document.documentElement.style.setProperty("--section-body-color", themeValue(textStyles, "sectionBodyColor", "var(--muted-strong)"));
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

  document.documentElement.style.setProperty("--intro-font", `"${introFont}", ${getFallback(introFont)}`);
  document.documentElement.style.setProperty("--section-lead-font", `"${sectionLeadFont}", ${getFallback(sectionLeadFont)}`);
  document.documentElement.style.setProperty("--section-body-font", `"${sectionBodyFont}", ${getFallback(sectionBodyFont)}`);
  document.documentElement.style.setProperty("--menu-font", `"${menuFont}", ${getFallback(menuFont)}`);
  document.documentElement.style.setProperty("--cta-font", `"${ctaFont}", ${getFallback(ctaFont)}`);
  document.documentElement.style.setProperty("--section-title-font", `"${sectionTitleFont}", ${getFallback(sectionTitleFont)}`);

  document.documentElement.style.setProperty("--app-max-width", themeValue(layout, "appWidth", "34rem"));
  document.documentElement.style.setProperty("--page-padding-x", themeValue(layout, "pagePadding", "1rem"));
  document.documentElement.style.setProperty("--hero-height", themeValue(layout, "heroHeight", "15.5rem"));
  document.documentElement.style.setProperty("--menu-height", themeValue(layout, "buttonHeight", "3.7rem"));
  document.documentElement.style.setProperty("--menu-radius", themeValue(layout, "buttonRadius", "0.72rem"));
  document.documentElement.style.setProperty("--menu-list-gap", themeValue(layout, "buttonGap", "0.55rem"));
  document.documentElement.style.setProperty("--sheet-max-width", themeValue(layout, "sheetWidth", "34rem"));
  document.documentElement.style.setProperty("--sheet-radius", themeValue(layout, "sheetRadius", "1.8rem"));
  document.documentElement.style.setProperty("--content-gap", themeValue(layout, "contentGap", "0.8rem"));
  document.documentElement.style.setProperty("--menu-icon-size", themeValue(buttons, "iconSize", "2.06rem"));
  document.documentElement.style.setProperty("--chevron-display", themeValue(buttons, "showChevron", "true") === "false" ? "none" : "block");
  const animation = themeValue(motion, "sheetAnimation", "slide");
  document.documentElement.style.setProperty("--sheet-enter-y", animation === "slide" ? "2.5rem" : "0");
  document.documentElement.style.setProperty("--sheet-enter-scale", animation === "scale" ? "0.96" : "1");
  document.documentElement.style.setProperty("--sheet-motion-duration", animation === "none" ? "1ms" : "300ms");

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

function render() {
  applyTheme(template.theme);
  const localeTemplate = localeState();
  dom.appName.textContent = template.appName;
  dom.topbarSubtitle.textContent = localeTemplate.subtitle;
  renderHostShortcut();
  renderLocaleBar();
  dom.subtitle.textContent = "";
  dom.heroMeta.innerHTML = (localeTemplate.introLines || [])
    .map((line) => `<span>${escapeHtml(line)}</span>`)
    .join("");
  dom.footerName.textContent = template.footer.name;
  dom.footerSubtitle.textContent = template.footer.subtitle;
  dom.footerMeta.innerHTML = template.footer.lines
    .map((line) => `<span>${escapeHtml(line)}</span>`)
    .join("");
  dom.mainMenu.innerHTML = renderMenu(localeTemplate.sections);

  if (activeSectionId) {
    const activeSection = localeTemplate.sections.find((section) => section.id === activeSectionId);
    if (!activeSection || activeSection.hidden) {
      activeSectionId = null;
      dom.sheet.classList.add("hidden");
      dom.sheet.classList.remove("is-visible", "is-closing");
      dom.sheet.setAttribute("aria-hidden", "true");
      document.body.classList.remove("sheet-open");
    } else {
      renderOpenSection(activeSectionId);
    }
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
    setSyncStatus("");
    render();
  } catch (error) {
    console.warn("[sync] Remote template fetch failed:", error);
    setSyncStatus("Offline: mostro l'ultima versione disponibile.");
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
      setSyncStatus("");
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
  } catch (error) {
    console.warn("[init] Remote template fetch failed:", error);
    remoteTemplateUpdatedAt = null;
    setSyncStatus("Offline: mostro l'ultima versione disponibile.");
  }
  if (!template.enabledLocales.includes(currentLocale)) {
    currentLocale = FIXED_LOCALE;
  }
  render();
  bindInputModality();
  bindMenu();
  bindHostShortcut();
  bindGuestShare();
  bindLocaleBar();
  bindSheet();
  bindCopyButtons();
  preventCopy();
  startLiveSync();
  registerServiceWorker();
}

init();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app keeps working as a normal GitHub Pages site if registration fails.
    });
  });
}
