import { fetchRemoteTemplateEnvelope, loadTemplate, normalizeTemplate } from "./content.js";
import { subscribeToRemoteTemplate } from "./supabase.js";

const iconPaths = {
  shield:
    '<path d="M12 3l6 2.7v5.7c0 3.7-2.3 6.9-6 8.6-3.7-1.7-6-4.9-6-8.6V5.7L12 3z"/><path d="M9.4 11.8 11 13.4l3.7-3.8"/>',
  wifi:
    '<path d="M3.5 8.8a13.5 13.5 0 0 1 17 0"/><path d="M6.5 12.1a9.3 9.3 0 0 1 11 0"/><path d="M9.8 15.3a4.7 4.7 0 0 1 4.4 0"/><circle cx="12" cy="18.5" r="1" fill="currentColor" stroke="none"/>',
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
};

const dom = {
  appName: document.querySelector("#app-name"),
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

function renderIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] ?? iconPaths.spark}</svg>`;
}

function renderMenu(sections) {
  return sections
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

function renderSectionItems(items) {
  return items
    .map((item, index) => {
      if (typeof item === "string") {
        return `
          <article class="sheet-card">
            <span class="sheet-card-index">${String(index + 1).padStart(2, "0")}</span>
            <p>${item}</p>
          </article>
        `;
      }

      return `
        <article class="sheet-card sheet-card-link">
          <span class="sheet-card-index">${String(index + 1).padStart(2, "0")}</span>
          <div class="sheet-card-copy">
            <strong>${item.title ?? ""}</strong>
            <p>${item.body ?? ""}</p>
            ${item.href ? `<a class="sheet-link" href="${item.href}">${item.label || item.href}</a>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function openSection(sectionId) {
  const section = template.sections.find((item) => item.id === sectionId);
  if (!section) return;

  activeSectionId = section.id;
  dom.sheetIcon.innerHTML = renderIcon(section.icon);
  dom.sheetBrand.textContent = template.appName;
  dom.sheetTitle.textContent = section.sectionTitle;
  dom.sheetLead.textContent = section.lead;
  dom.sheetContent.innerHTML = renderSectionItems(section.items);

  dom.sheet.classList.remove("hidden");
  dom.sheet.setAttribute("aria-hidden", "false");
  document.body.classList.add("sheet-open");
}

function closeSection() {
  activeSectionId = null;
  dom.sheet.classList.add("hidden");
  dom.sheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("sheet-open");
}

function bindMenu() {
  dom.mainMenu.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-section-id]");
    if (!trigger) return;
    openSection(trigger.dataset.sectionId);
  });
}

function bindSheet() {
  dom.sheetBackdrop.addEventListener("click", closeSection);
  dom.sheetClose.addEventListener("click", closeSection);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeSectionId) {
      closeSection();
    }
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
  dom.appName.textContent = template.appName;
  dom.subtitle.textContent = template.subtitle;
  dom.address.textContent = template.address;
  dom.license.textContent = template.license;
  dom.mainMenu.innerHTML = renderMenu(template.sections);

  if (activeSectionId) {
    openSection(activeSectionId);
  }
}

async function syncRemoteTemplate() {
  try {
    const remote = await fetchRemoteTemplateEnvelope();
    if (remote.updatedAt && remote.updatedAt === remoteTemplateUpdatedAt) return;
    remoteTemplateUpdatedAt = remote.updatedAt ?? null;
    template = remote.template;
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
      render();
    }
  });
}

async function init() {
  template = await loadTemplate();
  try {
    const remote = await fetchRemoteTemplateEnvelope();
    remoteTemplateUpdatedAt = remote.updatedAt ?? null;
    template = remote.template;
  } catch {
    remoteTemplateUpdatedAt = null;
  }
  render();
  bindMenu();
  bindSheet();
  preventCopy();
  startLiveSync();
}

init();
