import {
  clearTemplate,
  defaultTemplate,
  fetchRemoteTemplateEnvelope,
  GITHUB_REPO_NAME,
  GITHUB_REPO_OWNER,
  loadGithubToken,
  loadTemplate,
  normalizeTemplate,
  publishTemplateToGithub,
  saveGithubToken,
  saveTemplate,
} from "./content.js";

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
  status: document.querySelector("#host-status"),
  save: document.querySelector("#host-save"),
  reset: document.querySelector("#host-reset"),
  export: document.querySelector("#host-export"),
  import: document.querySelector("#host-import"),
  publish: document.querySelector("#host-publish"),
  tokenSave: document.querySelector("#host-token-save"),
  appName: document.querySelector("#field-app-name"),
  subtitle: document.querySelector("#field-subtitle"),
  address: document.querySelector("#field-address"),
  license: document.querySelector("#field-license"),
  githubToken: document.querySelector("#field-github-token"),
  sections: document.querySelector("#host-sections"),
};

let state = null;
let remoteSha = null;

function renderIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] ?? iconPaths.spark}</svg>`;
}

function setStatus(message, variant = "") {
  dom.status.textContent = message;
  dom.status.className = `host-status${variant ? ` is-${variant}` : ""}`;
}

function serializeItems(items) {
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      return JSON.stringify(item);
    })
    .join("\n");
}

function parseItems(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
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

function renderSectionEditors() {
  dom.sections.innerHTML = state.sections
    .map(
      (section) => `
        <section class="host-section-card" data-section-id="${section.id}">
          <div class="host-section-meta">
            <div class="host-section-icon">${renderIcon(section.icon)}</div>
            <div>
              <p class="host-kicker">${section.id}</p>
              <h2>${section.menuTitle}</h2>
            </div>
          </div>
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
              <span>Contenuti, una riga per voce</span>
              <textarea data-field="items">${serializeItems(section.items)}</textarea>
            </label>
          </div>
        </section>
      `,
    )
    .join("");
}

function syncFields() {
  dom.appName.value = state.appName;
  dom.subtitle.value = state.subtitle;
  dom.address.value = state.address;
  dom.license.value = state.license;
  dom.githubToken.value = loadGithubToken();
  renderSectionEditors();
}

function collectTemplate() {
  const sectionCards = [...dom.sections.querySelectorAll("[data-section-id]")];
  const sections = sectionCards.map((card) => {
    const id = card.dataset.sectionId;
    const base = state.sections.find((section) => section.id === id);
    return {
      id,
      icon: base.icon,
      menuTitle: card.querySelector('[data-field="menuTitle"]').value,
      sectionTitle: card.querySelector('[data-field="sectionTitle"]').value,
      lead: card.querySelector('[data-field="lead"]').value,
      items: parseItems(card.querySelector('[data-field="items"]').value),
    };
  });

  return normalizeTemplate({
    appName: dom.appName.value,
    subtitle: dom.subtitle.value,
    address: dom.address.value,
    license: dom.license.value,
    sections,
  });
}

function saveCurrentTemplate() {
  state = saveTemplate(collectTemplate());
  syncFields();
  setStatus("Template locale salvato su questo browser.", "success");
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

function restoreDefaultTemplate() {
  clearTemplate();
  state = normalizeTemplate(defaultTemplate);
  syncFields();
  setStatus("Template locale ripristinato ai valori di default.", "success");
}

function importTemplate(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = saveTemplate(parsed);
      syncFields();
      setStatus("Template importato correttamente.", "success");
    } catch {
      setStatus("Il file JSON non è valido.", "error");
    }
  };
  reader.readAsText(file);
}

function saveTokenLocally() {
  saveGithubToken(dom.githubToken.value);
  dom.githubToken.value = loadGithubToken();
  setStatus("Token GitHub memorizzato solo su questo browser host.", "success");
}

async function publishLiveTemplate() {
  const token = saveGithubToken(dom.githubToken.value);
  if (!token) {
    setStatus("Inserisci prima un GitHub token valido.", "error");
    return;
  }

  state = saveTemplate(collectTemplate());
  setStatus(`Pubblicazione live in corso su ${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}...`);

  try {
    if (!remoteSha) {
      const remote = await fetchRemoteTemplateEnvelope();
      remoteSha = remote.sha;
    }

    const published = await publishTemplateToGithub(state, token, remoteSha);
    remoteSha = published.sha;
    state = published.template;
    syncFields();
    setStatus(
      "Template pubblicato live. L'app ospiti si aggiorna in remoto entro pochi secondi o al prossimo refresh.",
      "success",
    );
  } catch (error) {
    setStatus(
      "Pubblicazione live fallita. Verifica token, permessi sul repo e presenza di modifiche concorrenti.",
      "error",
    );
  }
}

function bindEvents() {
  dom.save.addEventListener("click", saveCurrentTemplate);
  dom.export.addEventListener("click", downloadTemplate);
  dom.reset.addEventListener("click", restoreDefaultTemplate);
  dom.publish.addEventListener("click", publishLiveTemplate);
  dom.tokenSave.addEventListener("click", saveTokenLocally);
  dom.import.addEventListener("change", (event) => {
    importTemplate(event.target.files?.[0]);
    event.target.value = "";
  });
}

async function init() {
  state = await loadTemplate({ preferLocal: true });
  try {
    const remote = await fetchRemoteTemplateEnvelope();
    remoteSha = remote.sha;
  } catch {
    remoteSha = null;
  }
  syncFields();
  bindEvents();
}

init();
