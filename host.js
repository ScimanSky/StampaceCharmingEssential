import { getHostSupabase, HOST_EMAIL } from "./supabase.js";
import {
  onStateChange,
  getSession,
  isAuthorizedSession,
  isEditorReady,
  isEditorLoading,
  setEditorReady,
  setEditorLoading,
  hydrateEditorState,
  setSession,
} from "./host-state.js?v=20260615g";
import { syncFields, setStatus } from "./host-rendering.js?v=20260615g";
import { bindEditorEvents, bindAuthEvents } from "./host-events.js?v=20260615g";

// Unregister any active service worker on the host panel to avoid caching stale code
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((unregistered) => {
        if (unregistered) {
          console.log("Service Worker unregistered successfully for Host Panel.");
        }
      });
    }
  });
}

export const dom = {
  gate: document.querySelector("#host-gate"),
  app: document.querySelector("#host-app"),
  email: document.querySelector("#host-email"),
  password: document.querySelector("#host-password"),
  login: document.querySelector("#host-login"),
  logout: document.querySelector("#host-logout"),
  shareGuest: document.querySelector("#host-share-guest"),
  status: document.querySelector("#host-status"),
  save: document.querySelector("#host-save"),
  reset: document.querySelector("#host-reset"),
  export: document.querySelector("#host-export"),
  import: document.querySelector("#host-import"),
  addSection: document.querySelector("#host-add-section"),
  addCategory: document.querySelector("#host-add-category"),
  categories: document.querySelector("#host-categories"),
  editorLocale: document.querySelector("#field-editor-locale"),
  optionalLocale: document.querySelector("#field-optional-locale"),
  appName: document.querySelector("#field-app-name"),
  subtitle: document.querySelector("#field-subtitle"),
  introLines: document.querySelector("#field-intro-lines"),
  fontPrimary: document.querySelector("#field-font-primary"),
  fontSecondary: document.querySelector("#field-font-secondary"),
  menuFont: document.querySelector("#field-menu-font"),
  ctaFont: document.querySelector("#field-cta-font"),
  sectionTitleFont: document.querySelector("#field-section-title-font"),
  titleSize: document.querySelector("#field-title-size"),
  subtitleSize: document.querySelector("#field-subtitle-size"),
  menuSize: document.querySelector("#field-menu-size"),
  menuWeight: document.querySelector("#field-menu-weight"),
  sectionTitleSize: document.querySelector("#field-section-title-size"),
  bodySize: document.querySelector("#field-body-size"),
  bodyWeight: document.querySelector("#field-body-weight"),
  introSize: document.querySelector("#field-intro-size"),
  introWeight: document.querySelector("#field-intro-weight"),
  introAlign: document.querySelector("#field-intro-align"),
  introFont: document.querySelector("#field-intro-font"),
  introColor: document.querySelector("#field-intro-color"),
  sectionLeadSize: document.querySelector("#field-section-lead-size"),
  sectionLeadWeight: document.querySelector("#field-section-lead-weight"),
  sectionLeadFont: document.querySelector("#field-section-lead-font"),
  sectionLeadColor: document.querySelector("#field-section-lead-color"),
  sectionBodySize: document.querySelector("#field-section-body-size"),
  sectionBodyWeight: document.querySelector("#field-section-body-weight"),
  sectionBodyFont: document.querySelector("#field-section-body-font"),
  sectionBodyColor: document.querySelector("#field-section-body-color"),
  colorBackground: document.querySelector("#field-color-background"),
  colorText: document.querySelector("#field-color-text"),
  colorMuted: document.querySelector("#field-color-muted"),
  colorIcon: document.querySelector("#field-color-icon"),
  colorLine: document.querySelector("#field-color-line"),
  colorRow: document.querySelector("#field-color-row"),
  colorRowHover: document.querySelector("#field-color-row-hover"),
  colorSheet: document.querySelector("#field-color-sheet"),
  appWidth: document.querySelector("#field-app-width"),
  pagePadding: document.querySelector("#field-page-padding"),
  heroHeight: document.querySelector("#field-hero-height"),
  buttonHeight: document.querySelector("#field-button-height"),
  buttonRadius: document.querySelector("#field-button-radius"),
  buttonGap: document.querySelector("#field-button-gap"),
  iconSize: document.querySelector("#field-icon-size"),
  showChevron: document.querySelector("#field-show-chevron"),
  sheetWidth: document.querySelector("#field-sheet-width"),
  sheetRadius: document.querySelector("#field-sheet-radius"),
  contentGap: document.querySelector("#field-content-gap"),
  sheetAnimation: document.querySelector("#field-sheet-animation"),
  footerName: document.querySelector("#field-footer-name"),
  footerSubtitle: document.querySelector("#field-footer-subtitle"),
  footerLines: document.querySelector("#field-footer-lines"),
  sections: document.querySelector("#host-sections"),
  resetColorsButton: document.querySelector("#btn-reset-colors"),
};

function updateAccessState() {
  const allowed = isAuthorizedSession();
  const showEditor = allowed && window.location.hash === "#editor" && isEditorReady();
  dom.gate.classList.toggle("hidden", showEditor);
  dom.app.classList.toggle("hidden", !showEditor);
}

async function openEditor() {
  if (!isAuthorizedSession() || isEditorLoading()) return;

  setEditorLoading(true);
  setStatus("Caricamento editor...", "");
  setEditorReady(false);
  if (window.location.hash !== "#editor") {
    window.location.hash = "#editor";
  }
  updateAccessState();
  try {
    await hydrateEditorState();
    bindEditorEvents();
    setEditorReady(true);
    updateAccessState();
    setStatus("Accesso host attivo. Le modifiche si sincronizzano live.", "success");
  } catch (err) {
    setStatus("Caricamento editor fallito.", "error");
  } finally {
    setEditorLoading(false);
  }
}

// Subscriptions
onStateChange(() => {
  syncFields();
  updateAccessState();
});

window.addEventListener("hostAuthChange", () => {
  updateAccessState();
});

async function init() {
  dom.email.value = HOST_EMAIL;
  bindAuthEvents(openEditor);

  const supabase = getHostSupabase();
  const { data } = await supabase.auth.getSession();
  
  setSession(data.session);
  updateAccessState();

  if (isAuthorizedSession() && window.location.hash === "#editor") {
    await openEditor();
  } else {
    setStatus("", "");
  }
}

init();
