import { sanitizeCssColor, escapeAttribute } from "./security.js?v=20260618a";

export function themeValue(group, key, fallback) {
  const value = group?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function iconColorValue(value) {
  return sanitizeCssColor(value);
}

export function iconColorStyle(value) {
  const color = iconColorValue(value);
  return color ? ` style="--icon-custom-color: ${escapeAttribute(color)};"` : "";
}
