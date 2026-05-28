const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_WEB_PROTOCOLS = new Set(["http:", "https:"]);
const CTA_KINDS = new Set(["web", "maps", "whatsapp", "email", "tel"]);

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const escapeAttribute = escapeHtml;

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

export function normalizeCtaKind(kind) {
  return CTA_KINDS.has(kind) ? kind : "web";
}

export function normalizeCtaHref(kind, href) {
  const safeKind = normalizeCtaKind(kind);

  if (safeKind === "whatsapp") return normalizeWhatsappHref(href);
  if (safeKind === "email") return normalizeEmailHref(href);
  if (safeKind === "tel") return normalizeTelHref(href);
  if (safeKind === "maps") return sanitizeWebHref(href);
  return sanitizeWebHref(href);
}
