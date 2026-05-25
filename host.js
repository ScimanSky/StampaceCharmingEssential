import {
  clearTemplate,
  defaultTemplate,
  HOST_PRIVATE_ITEM,
  isImageItem,
  isHostPrivateItem,
  loadTemplate,
  normalizeTemplate,
  saveTemplate,
} from "./content.js";
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
  image:
    '<rect x="4.8" y="6.2" width="14.4" height="11.6" rx="2"/><circle cx="9.1" cy="10" r="1.3"/><path d="m6.7 15.6 3.2-3.3 2.4 2.4 2.2-2.1 2.8 3"/>',
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

function renderIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] ?? iconPaths.spark}</svg>`;
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
              ? `<p class="host-lock-note">La voce "${HOST_PRIVATE_ITEM.title}" viene reinserita automaticamente e non può essere eliminata.</p>`
              : ""
          }
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
  renderSectionEditors();
}

function collectTemplate() {
  const sectionCards = [...dom.sections.querySelectorAll("[data-section-id]")];
  const sections = sectionCards.map((card) => {
    const id = card.dataset.sectionId;
    const base = state.sections.find((section) => section.id === id);
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

  return normalizeTemplate({
    appName: dom.appName.value,
    subtitle: dom.subtitle.value,
    address: dom.address.value,
    license: dom.license.value,
    sections,
  });
}

function isAuthorizedSession(nextSession) {
  const email = nextSession?.user?.email?.toLowerCase();
  return Boolean(nextSession && email === HOST_EMAIL.toLowerCase());
}

function updateAccessState() {
  const allowed = isAuthorizedSession(session);
  const showEditor = allowed && window.location.hash === EDITOR_HASH;
  dom.gate.classList.toggle("hidden", showEditor);
  dom.app.classList.toggle("hidden", !showEditor);
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
    setStatus("Pubblicazione live in corso...", "");
  }

  try {
    const published = await publishRemoteTemplate(state, supabase);
    latestRemoteUpdatedAt = published.updated_at ?? null;
    if (!silent) {
      setStatus("Template pubblicato live. L'app ospiti si aggiorna in remoto.", "success");
    } else {
      setStatus("Modifiche sincronizzate live.", "success");
    }
  } catch {
    setStatus("Pubblicazione live fallita. Verifica accesso host e setup Supabase.", "error");
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
    const section = state.sections.find((item) => item.id === sectionId);
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
  const section = state.sections.find((item) => item.id === sectionId);
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
  window.location.replace(`./host.html${EDITOR_HASH}`);
}

async function logout() {
  window.clearTimeout(autoPublishTimer);
  await supabase.auth.signOut();
  session = null;
  window.location.replace("./host.html");
  updateAccessState();
  setStatus("Sessione host chiusa.", "success");
}

function bindEditorEvents() {
  dom.save.addEventListener("click", saveCurrentTemplate);
  dom.export.addEventListener("click", downloadTemplate);
  dom.reset.addEventListener("click", restoreDefaultTemplate);
  dom.publish.addEventListener("click", () => publishNow({ silent: false }));
  dom.logout.addEventListener("click", logout);
  dom.import.addEventListener("change", (event) => {
    importTemplate(event.target.files?.[0]);
    event.target.value = "";
  });

  dom.app.addEventListener("input", (event) => {
    if (!event.target.matches("input, textarea")) return;
    queueAutoPublish();
  });

  dom.sections.addEventListener("change", (event) => {
    const uploader = event.target.closest("[data-image-upload]");
    if (!uploader) return;
    const sectionCard = event.target.closest("[data-section-id]");
    handleImageUpload(sectionCard?.dataset.sectionId, event.target.files?.[0]);
    event.target.value = "";
  });

  dom.sections.addEventListener("click", (event) => {
    const removeTrigger = event.target.closest('[data-action="remove-image"]');
    if (!removeTrigger) return;
    const imageItem = event.target.closest("[data-image-item]");
    const sectionCard = event.target.closest("[data-section-id]");
    removeImage(sectionCard?.dataset.sectionId, Number.parseInt(imageItem?.dataset.imageIndex ?? "-1", 10));
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
    updateAccessState();
    if (isAuthorizedSession(session)) {
      if (window.location.hash !== EDITOR_HASH) {
        window.location.replace(`./host.html${EDITOR_HASH}`);
        return;
      }
      setStatus("Accesso host attivo. Le modifiche si sincronizzano live.", "success");
    }
  });
}

async function init() {
  dom.email.value = HOST_EMAIL;

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

  const { data } = await supabase.auth.getSession();
  session = data.session;
  updateAccessState();
  syncFields();
  bindAuthEvents();
  bindEditorEvents();

  if (isAuthorizedSession(session) && window.location.hash !== EDITOR_HASH) {
    window.location.replace(`./host.html${EDITOR_HASH}`);
    return;
  }

  if (isAuthorizedSession(session) && window.location.hash === EDITOR_HASH) {
    setStatus("Accesso host attivo. Le modifiche si sincronizzano live.", "success");
  }
}

init();
