const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_WEB_PROTOCOLS = new Set(["http:", "https:"]);
const CTA_KINDS = new Set(["web", "maps", "whatsapp", "telegram", "email", "gmail", "tel", "airbnb", "booking", "vrbo"]);
const SAFE_CSS_NAMED_COLORS = new Set(["currentcolor", "transparent"]);

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const escapeAttribute = escapeHtml;

export function sanitizeCssColor(value, fallback = "") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(raw)) return raw;
  if (/^rgba?\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(raw)) return raw;
  if (/^var\(--[a-z0-9_-]+\)$/i.test(raw)) return raw;
  if (SAFE_CSS_NAMED_COLORS.has(raw.toLowerCase())) return raw;
  return fallback;
}

function isRelativeUrl(value) {
  return !/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith("//");
}

function isSafeRelativeUrl(value) {
  return /^(?:\.{0,2}\/|#|\?)/.test(value) && !/[\s"'<>]/.test(value);
}

function sanitizeUrl(value, { protocols = SAFE_WEB_PROTOCOLS, allowRelative = false, fallback = "" } = {}) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  if (isRelativeUrl(raw)) {
    return allowRelative && isSafeRelativeUrl(raw) ? raw : fallback;
  }

  try {
    const url = new URL(raw);
    return protocols.has(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
}

export function sanitizeHref(value, { allowRelative = true, fallback = "" } = {}) {
  return sanitizeUrl(value, {
    protocols: SAFE_LINK_PROTOCOLS,
    allowRelative,
    fallback,
  });
}

export function sanitizeWebHref(value, { fallback = "" } = {}) {
  return sanitizeUrl(value, {
    protocols: SAFE_WEB_PROTOCOLS,
    allowRelative: false,
    fallback,
  });
}

export function sanitizeImageSrc(value) {
  return sanitizeUrl(value, {
    protocols: SAFE_WEB_PROTOCOLS,
    allowRelative: true,
    fallback: "",
  });
}

function normalizePhoneDigits(value) {
  const cleaned = String(value ?? "").replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned.slice(1);
  if (cleaned.startsWith("00")) return cleaned.slice(2);
  return cleaned.replace(/[^\d]/g, "");
}

function normalizeEmailHref(value) {
  const raw = String(value ?? "").trim();
  const email = raw.replace(/^mailto:/i, "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return `mailto:${email}`;
}

function normalizeTelHref(value) {
  const raw = String(value ?? "").trim();
  if (/^tel:/i.test(raw)) {
    const digits = raw.replace(/^tel:/i, "").replace(/[^\d+]/g, "");
    return digits ? `tel:${digits}` : "";
  }
  const digits = raw.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function normalizeWhatsappHref(value) {
  const raw = String(value ?? "").trim();
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return url.protocol === "https:" && url.hostname === "wa.me" ? url.href : "";
    } catch {
      return "";
    }
  }

  const digits = normalizePhoneDigits(raw);
  return digits ? `https://wa.me/${digits}` : "";
}

function normalizeTelegramHref(value) {
  const raw = String(value ?? "").trim();
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return url.protocol === "https:" && (url.hostname === "t.me" || url.hostname === "telegram.me") ? url.href : "";
    } catch {
      return "";
    }
  }

  const username = raw.replace(/^@/, "").trim();
  return username ? `https://t.me/${username}` : "";
}

export function normalizeCtaKind(kind) {
  return CTA_KINDS.has(kind) ? kind : "web";
}

export function normalizeCtaHref(kind, href) {
  const safeKind = normalizeCtaKind(kind);

  if (safeKind === "whatsapp") return normalizeWhatsappHref(href);
  if (safeKind === "telegram") return normalizeTelegramHref(href);
  if (safeKind === "email" || safeKind === "gmail") return normalizeEmailHref(href);
  if (safeKind === "tel") return normalizeTelHref(href);
  if (safeKind === "maps") return sanitizeWebHref(href);
  if (safeKind === "airbnb" || safeKind === "booking" || safeKind === "vrbo") return sanitizeWebHref(href);
  return sanitizeWebHref(href);
}
