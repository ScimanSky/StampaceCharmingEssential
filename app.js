import {
  FIXED_LOCALE,
  fetchRemoteTemplateEnvelope,
  getLocaleContent,
  getVisibleLocales,
  isCtaItem,
  isHostPrivateItem,
  isImageItem,
  loadTemplate,
  normalizeTemplate,
} from "./content.js?v=20260609b";
import {
  escapeAttribute,
  escapeHtml,
  normalizeCtaHref,
  normalizeCtaKind,
  sanitizeHref,
  sanitizeImageSrc,
} from "./security.js?v=20260528b";
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
  bolt:
    '<path d="M14 2 5 13.5h5.5l-1 8.5L20 10.5h-5.8z"/>',
  spark:
    '<path d="M12 3.8 13.3 8 17.5 9.3 13.3 10.6 12 14.8 10.7 10.6 6.5 9.3 10.7 8 12 3.8z"/><path d="M18.2 14.5 19 16.6l2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1z"/>',
  key:
    '<circle cx="8.3" cy="14.2" r="3.2"/><path d="M11.2 14.2H20"/><path d="M16.4 14.2v-2.4"/><path d="M13.8 14.2v2.4"/>',
  lock:
    '<rect x="6.2" y="10.2" width="11.6" height="9" rx="2"/><path d="M8.7 10.2V8.3a3.3 3.3 0 0 1 6.6 0v1.9"/>',
  safe:
    '<rect x="5" y="4.5" width="14" height="15" rx="2.2"/><circle cx="12" cy="12" r="2.5"/><path d="M12 9.5v5"/><path d="M9.5 12H14.5"/>',
  pin:
    '<path d="M12 21.5s6.5-5.5 6.5-11a6.5 6.5 0 1 0-13 0c0 5.5 6.5 11 6.5 11z"/><circle cx="12" cy="10.5" r="2.2"/>',
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
    '<rect x="5" y="6.5" width="14" height="13" rx="2.2"/><path d="M9 6.5V4.8c0-.9.8-1.6 1.7-1.6h2.6c.9 0 1.7.7 1.7 1.6v1.7"/><path d="M12 9.5v6"/>',
  moon:
    '<path d="M15.8 4.8a6.7 6.7 0 1 0 3.4 11.9 7.4 7.4 0 1 1-3.4-11.9z"/>',
  ban:
    '<circle cx="12" cy="12" r="7.5"/><path d="M8.7 15.3 15.3 8.7"/>',
  trash:
    '<path d="M8.2 7.4h7.6"/><path d="M9.3 7.4V6.3c0-.5.4-.9.9-.9h3.6c.5 0 .9.4.9.9v1.1"/><path d="m7.6 8.3.7 9c0 .7.6 1.2 1.3 1.2h4.8c.7 0 1.2-.5 1.3-1.2l.7-9"/>',
  car:
    '<path d="M3.5 14.5h17"/><path d="m5.5 14.5 1.2-5c.2-.8.9-1.4 1.7-1.4h7.2c.8 0 1.5.6 1.7 1.4l1.2 5"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/><path d="M3.5 14.5v3c0 .6.4 1 1 1h1.5M17.5 18.5h1.5c.6 0 1-.4 1-1v-3"/>',
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
  compass:
    '<circle cx="12" cy="12" r="8"/><path d="M14.8 9.2 13 13l-3.8 1.8L11 11z"/><circle cx="12" cy="12" r="1"/>',
  chat:
    '<path d="M5.2 18.5 6 15.8a6.9 6.9 0 1 1 2.7 1.6z"/><path d="M8.4 11.4h7.2"/><path d="M8.4 8.8h4.6"/>',
  link:
    '<path d="M10.7 13.3 13.3 10.7"/><path d="M8.1 15.9 6.6 17.4a3 3 0 0 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0"/><path d="M15.9 8.1l1.5-1.5a3 3 0 1 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0"/>',
  map:
    '<path d="M3.2 6.1 8.6 4l6.8 2.1 5.4-2.1v13.9l-5.4 2.1-6.8-2.1-5.4 2.1z"/><path d="M8.6 4v13.9"/><path d="M15.4 6.1V20"/>',
  ticket:
    '<path d="M4.2 8.2A2.2 2.2 0 0 0 6.4 6h11.2a2.2 2.2 0 0 0 2.2 2.2v2.2a2.2 2.2 0 0 0-2.2 2.2H6.4a2.2 2.2 0 0 0-2.2-2.2z"/><path d="M12 6v8.8"/><path d="M12 8.2v1.2"/><path d="M12 11.4v1.2"/>',
  skyline:
    '<path d="M2.5 19h19"/><path d="M4 19V11.5h4V19"/><path d="M9 19V7h5V19"/><path d="M15 19V9.5h4V19"/><path d="M11.5 7V4h1.2v3"/><path d="M3.5 21a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/><path d="M19.5 21a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/><path d="M5.5 19h12"/><path d="M16.5 16.5h1.8l1.2 2.5h-3"/><path d="M2.5 19h2.5l1-2h2.5"/>',
  rental:
    '<path d="M3.5 12 9 6.5a3 3 0 0 1 4.2 0 3 3 0 0 1 0 4.2L7.5 16.5"/><circle cx="8.5" cy="7" r="1.4"/><path d="M13.5 15h3l2 3.5"/><path d="M10 15h2.8"/><circle cx="9.8" cy="19.5" r="1.6"/><circle cx="18.8" cy="19.5" r="1.6"/><path d="M12.5 19.5h4.5"/><path d="M14.5 11.5 12 19.5"/>',
  trail:
    '<path d="M2.5 8.5 6.5 4 9.5 7.5 13 3.5l3.5 4 2.5-2.8L21 7"/><path d="M12.5 20.5c.3-2 .7-3.5 1.5-4.8l1.3-2"/><circle cx="10.5" cy="12" r="1.4"/><path d="M10.5 13.4 8.5 16"/><path d="M10 14.8 12.8 16.5"/><path d="M8.5 16 6.8 20.5"/><path d="M13 16.5l2.2 3.8"/><path d="M15.5 20.5h4"/>',
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

function renderIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] ?? iconPaths.spark}</svg>`;
}

function sectionClassToken(sectionId) {
  return String(sectionId).replace(/[^a-z0-9_-]/gi, "-");
}

function themeValue(group, key, fallback) {
  const value = group?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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
      <path d="M5.1 19.1 6 15.8a7.2 7.2 0 1 1 2.7 2.6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M8.8 8.9c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.6 1.4c.1.3.1.5-.1.7l-.4.5c.7 1.2 1.6 2.1 2.9 2.8l.6-.6c.2-.2.4-.2.7-.1l1.4.7c.3.1.4.3.4.6v.4c0 .3-.2.6-.5.7-.6.3-1.6.3-2.8-.2-2.1-.8-4.4-3.1-5.2-5.2-.5-1.1-.4-1.8-.1-2.2z" fill="currentColor" stroke="none"/>
    </svg>
  `;
}

function renderGmailBrandIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="6.2" width="16" height="11.6" rx="2.2" fill="#fff"/>
      <path d="M5.8 8.2 12 13.1l6.2-4.9" fill="none" stroke="#ea4335" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5.6 16.3V8.6l6.4 5.1 6.4-5.1v7.7" fill="none" stroke="#c5221f" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
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
    whatsapp: "chat",
    email: "mail",
    tel: "phone",
  };
  return item.icon || kindFallback[item.kind] || "link";
}

function renderCtaItem(item) {
  const kind = normalizeCtaKind(item.kind);
  const href = normalizeCtaHref(kind, item.href);
  if (!href) return "";

  return `
    <article class="sheet-card sheet-card-cta">
      <a class="sheet-cta sheet-cta--${escapeAttribute(kind)}" href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">
        <span class="sheet-cta-icon" aria-hidden="true">${renderIcon(ctaIcon(item))}</span>
        <span class="sheet-cta-label">${escapeHtml(item.label)}</span>
      </a>
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
    .filter((section) => section.id !== "host" && !section.hidden)
    .map(
      (section) => `
        <button class="menu-row menu-row--${escapeAttribute(sectionClassToken(section.id))} menu-row--icon-${escapeAttribute(sectionClassToken(iconForSection(section)))}" type="button" data-section-id="${escapeAttribute(section.id)}">
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
        const src = sanitizeImageSrc(item.src);
        if (!src) return "";
        return `
          <article class="sheet-card sheet-card-media">
            <div class="sheet-card-media-body">
              <img class="sheet-image sheet-image--${escapeAttribute(item.size || "grande")}" src="${escapeAttribute(src)}" alt="${escapeAttribute(item.alt ?? "")}" loading="lazy" />
              ${
                item.caption
                  ? `<p class="sheet-image-caption">${escapeHtml(item.caption)}</p>`
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
  dom.sheetIcon.innerHTML = renderIcon(iconForSection(section));
  dom.sheetIcon.className = `sheet-icon sheet-icon--${sectionClassToken(section.id)} sheet-icon--icon-${sectionClassToken(iconForSection(section))}`;
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

function applyTheme(theme) {
  const primaryFont = theme?.fontPrimary || "Roboto";
  const secondaryFont = theme?.fontSecondary || "Roboto";
  const colors = theme?.colors || {};
  const typography = theme?.typography || {};
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
  document.documentElement.style.setProperty("--sheet-bg", themeValue(colors, "sheet", "rgba(10, 8, 6, 0.92)"));
  document.documentElement.style.setProperty("--title-size", themeValue(typography, "titleSize", "1.18rem"));
  document.documentElement.style.setProperty("--subtitle-size", themeValue(typography, "subtitleSize", "0.98rem"));
  document.documentElement.style.setProperty("--menu-size", themeValue(typography, "menuSize", "1.04rem"));
  document.documentElement.style.setProperty("--section-title-size", themeValue(typography, "sectionTitleSize", "1.32rem"));
  document.documentElement.style.setProperty("--body-size", themeValue(typography, "bodySize", "0.96rem"));
  document.documentElement.style.setProperty("--menu-weight", themeValue(typography, "menuWeight", "400"));
  document.documentElement.style.setProperty("--body-weight", themeValue(typography, "bodyWeight", "400"));
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

function render() {
  applyTheme(template.theme);
  const localeTemplate = localeState();
  dom.appName.textContent = template.appName;
  renderHostShortcut();
  renderLocaleBar();
  dom.subtitle.textContent = localeTemplate.subtitle;
  dom.heroMeta.innerHTML = (template.heroMeta || [])
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
  } catch {
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
  } catch {
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
