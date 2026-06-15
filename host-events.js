import {
  AVAILABLE_LANGUAGES,
  FIXED_LOCALE,
  REQUIRED_LOCALES,
  isCtaItem,
  isImageItem,
  isMediaItem,
  saveTemplate,
} from "./content.js?v=20260615d";
import { getHostSupabase, HOST_EMAIL } from "./supabase.js";
import {
  escapeAttribute,
  escapeHtml,
  sanitizeCssColor,
} from "./security.js?v=20260615d";
import { iconColorStyle } from "./theme-utils.js?v=20260615d";
import {
  setState,
  getState,
  getSelectedEditorLocale,
  setSelectedEditorLocale,
  setShouldSeedExpandedSection,
  login,
  logout,
  togglePanel,
  toggleCategory,
  toggleCategoryVisibility,
  removeCategory,
  addCategory,
  toggleSection,
  removeSection,
  duplicateSection,
  toggleSectionVisibility,
  addSection,
  reorderSection,
  addCta,
  removeCta,
  moveCta,
  addCategoryCta,
  removeCategoryCta,
  moveCategoryCta,
  handleImageUpload,
  removeImage,
  handleMediaUpload,
  removeMedia,
  currentLocaleState,
  queueAutoPublish,
} from "./host-state.js?v=20260615d";
import {
  collectTemplate,
  syncFields,
  setStatus,
  updateSectionIconPreview,
  updateCtaIconPreview,
  updateCategoryIconPreview,
  syncPanelState,
} from "./host-rendering.js?v=20260615d";
import { dom } from "./host.js?v=20260615d";

let draggingSectionId = null;
let authBound = false;
let editorBound = false;

const supabase = getHostSupabase();

function switchEditorLocale(nextLocale) {
  if (!AVAILABLE_LANGUAGES.some((language) => language.code === nextLocale)) return;

  const collected = collectTemplate();
  const saved = saveTemplate(collected);
  setState(saved);
  setSelectedEditorLocale(nextLocale);
  setShouldSeedExpandedSection(true);
  setStatus(`Ora stai modificando la lingua ${nextLocale.toUpperCase()}.`, "success");
}

function updateEnabledLocales() {
  const collected = collectTemplate();
  const saved = saveTemplate(collected);
  setState(saved);
  setStatus("Lingue visibili aggiornate. L'app ospiti si sincronizza automaticamente.", "success");
  queueAutoPublish();
}

function appendLinkTemplate(sectionId) {
  const sectionCard = dom.sections.querySelector(`[data-section-id="${CSS.escape(String(sectionId ?? ""))}"]`);
  const textarea = sectionCard?.querySelector('[data-field="items"]');
  if (!textarea) return;

  const scaffold = "+ LINK | https://example.com | Titolo link | Descrizione del link | Apri link";
  const currentValue = textarea.value.trimEnd();
  textarea.value = currentValue ? `${currentValue}\n\n${scaffold}` : scaffold;
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  setStatus("Scaffold link aggiunto. Compila URL, titolo, descrizione ed etichetta.", "success");
}

function clearSectionDropState() {
  dom.sections.querySelectorAll("[data-section-id]").forEach((card) => {
    card.classList.remove("is-dragging");
    delete card.dataset.dropPosition;
  });
}

function guestAppUrl() {
  return "https://stampacecharming.pages.dev/";
}

function guestSharePayload() {
  const url = guestAppUrl();
  return {
    title: "Guest Book - Stampace Charming",
    text: "Guest Book - Stampace Charming",
    url,
  };
}

async function shareGuestApp() {
  const payload = guestSharePayload();
  const mobileShare = navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobileShare) {
    try {
      await navigator.share(payload);
      setStatus("Condivisione app guest avviata.", "success");
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  const message = `${payload.text}\n${payload.url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  setStatus("WhatsApp aperto. Scegli il contatto a cui inviare la Guest App.", "success");
}

export function bindEditorEvents() {
  if (editorBound) return;
  editorBound = true;

  const tabsContainer = document.querySelector(".host-tabs");
  if (tabsContainer) {
    tabsContainer.addEventListener("click", (event) => {
      const btn = event.target.closest(".host-tab-btn");
      if (!btn) return;
      const tabId = btn.dataset.tab;
      if (tabId) {
        window.localStorage.setItem("stampace-host-active-tab", tabId);
        syncFields();
        window.scrollTo(0, 0);
      }
    });
  }

  dom.addSection.addEventListener("click", () => {
    const collected = collectTemplate();
    try {
      const res = addSection(collected);
      if (res) setStatus(res.message, res.variant);
    } catch (err) {
      setStatus(err.message, "error");
    }
  });

  if (dom.addCategory) {
    dom.addCategory.addEventListener("click", () => {
      const collected = collectTemplate();
      try {
        const res = addCategory(collected);
        if (res) setStatus(res.message, res.variant);
      } catch (err) {
        setStatus(err.message, "error");
      }
    });
  }

  dom.logout.addEventListener("click", logout);
  dom.shareGuest.addEventListener("click", shareGuestApp);

  if (dom.resetColorsButton) {
    dom.resetColorsButton.addEventListener("click", () => {
      if (confirm("Sei sicuro di voler ripristinare i colori di default?")) {
        dom.colorBackground.value = "#070605";
        dom.colorText.value = "#e7d8c1";
        dom.colorMuted.value = "#cbb99d";
        dom.colorIcon.value = "#dfc39c";
        dom.colorLine.value = "#504536";
        dom.colorRow.value = "#17120e";
        dom.colorRowHover.value = "#241d17";
        dom.colorSheet.value = "#0f0c09";
        dom.introColor.value = "#e7d8c1";
        dom.sectionLeadColor.value = "#cbb99d";
        dom.sectionBodyColor.value = "#e7d8c1";

        const collected = collectTemplate();
        setState(saveTemplate(collected));
        queueAutoPublish();
      }
    });
  }

  dom.app.addEventListener("input", (event) => {
    if (!event.target.matches("input, textarea")) return;
    if (event.target.closest("[data-section-id]") && event.target.matches('[data-field="menuTitle"], [data-field="sectionTitle"], [data-field="lead"]')) {
      updateSectionIconPreview(event.target.closest("[data-section-id]"));
    }
    if (event.target.closest("[data-category-id]") && event.target.matches('[data-field="menuTitle"]')) {
      const card = event.target.closest("[data-category-id]");
      const h2 = card.querySelector(".host-section-heading h2");
      if (h2) {
        h2.textContent = event.target.value.trim() || "Nuovo Gruppo";
      }
    }
    if (event.target.matches('[data-cta-field="label"]')) {
      const ctaCard = event.target.closest("[data-cta-item]");
      if (ctaCard) {
        const isHidden = ctaCard.querySelector('[data-cta-field="hidden"]')?.value === "true";
        const labelText = event.target.value.trim();
        const strong = ctaCard.querySelector(".host-cta-heading strong");
        if (strong) {
          strong.textContent = isHidden
            ? `${labelText || "Nuovo pulsante grafico"} (Nascosto)`
            : (labelText || "Nuovo pulsante grafico");
        }
      }
    }
    const collected = collectTemplate();
    setState(saveTemplate(collected));
    queueAutoPublish();
  });

  dom.editorLocale.addEventListener("change", (event) => {
    switchEditorLocale(event.target.value);
  });

  dom.optionalLocale.addEventListener("change", () => {
    updateEnabledLocales();
  });

  dom.fontPrimary.addEventListener("change", () => {
    const collected = collectTemplate();
    setState(saveTemplate(collected));
    queueAutoPublish();
  });

  dom.fontSecondary.addEventListener("change", () => {
    const collected = collectTemplate();
    setState(saveTemplate(collected));
    queueAutoPublish();
  });

  dom.app.addEventListener("change", (event) => {
    if (!event.target.matches("select, [data-theme-field], [data-field], [data-cta-field]")) return;
    const collected = collectTemplate();
    setState(saveTemplate(collected));
    queueAutoPublish();
  });

  dom.sections.addEventListener("change", async (event) => {
    const imageUploader = event.target.closest("[data-image-upload]");
    if (imageUploader) {
      const sectionCard = event.target.closest("[data-section-id]");
      const collected = collectTemplate();
      try {
        const res = await handleImageUpload(collected, sectionCard?.dataset.sectionId, event.target.files?.[0]);
        if (res) setStatus(res.message, res.variant);
      } catch (err) {
        setStatus(err.message, "error");
      }
      event.target.value = "";
      return;
    }
    const mediaUploader = event.target.closest("[data-media-upload]");
    if (mediaUploader) {
      const sectionCard = event.target.closest("[data-section-id]");
      const collected = collectTemplate();
      try {
        const res = await handleMediaUpload(collected, sectionCard?.dataset.sectionId, event.target.files?.[0]);
        if (res) setStatus(res.message, res.variant);
      } catch (err) {
        setStatus(err.message, "error");
      }
      event.target.value = "";
      return;
    }

    if (event.target.matches('[data-cta-field="hidden"]')) {
      const ctaCard = event.target.closest("[data-cta-item]");
      if (ctaCard) {
        const isHidden = event.target.value === "true";
        ctaCard.classList.toggle("is-hidden-cta", isHidden);
        const labelInput = ctaCard.querySelector('[data-cta-field="label"]');
        const labelText = labelInput ? labelInput.value.trim() : "";
        const strong = ctaCard.querySelector(".host-cta-heading strong");
        if (strong) {
          strong.textContent = isHidden
            ? `${labelText || "Nuovo pulsante grafico"} (Nascosto)`
            : (labelText || "Nuovo pulsante grafico");
        }
      }
    }

    if (event.target.matches('[data-field="icon"], [data-field="iconColor"]')) {
      updateSectionIconPreview(event.target.closest("[data-section-id]"));
    } else if (event.target.matches('[data-cta-field="icon"], [data-cta-field="iconColor"]')) {
      updateCtaIconPreview(event.target.closest("[data-cta-item]"));
    }

    if (event.target.matches('[data-cta-field], [data-image-field], [data-media-field], [data-field]')) {
      const activeFocusedElement = document.activeElement;
      const sectionCard = activeFocusedElement?.closest('[data-section-id]');
      const activeFocusedSectionId = sectionCard?.dataset.sectionId;
      const activeFocusedField = activeFocusedElement?.dataset.field;
      const activeFocusedCtaId = activeFocusedElement?.closest('[data-cta-item]')?.dataset.ctaId;
      const activeFocusedCtaField = activeFocusedElement?.dataset.ctaField;
      const hasSelection = activeFocusedElement && ('selectionStart' in activeFocusedElement);
      const selectionStart = hasSelection ? activeFocusedElement.selectionStart : null;
      const selectionEnd = hasSelection ? activeFocusedElement.selectionEnd : null;

      const collected = collectTemplate();
      setState(saveTemplate(collected));

      // Restore focus for sections
      if (activeFocusedSectionId) {
        const card = dom.sections.querySelector(`[data-section-id="${activeFocusedSectionId}"]`);
        let input = null;
        if (activeFocusedCtaId && activeFocusedCtaField) {
          const ctaCard = card?.querySelector(`[data-cta-item="${activeFocusedCtaId}"]`);
          input = ctaCard?.querySelector(`[data-cta-field="${activeFocusedCtaField}"]`);
        } else if (activeFocusedField) {
          input = card?.querySelector(`[data-field="${activeFocusedField}"]`);
        }
        if (input) {
          input.focus();
          if (hasSelection && typeof selectionStart === "number" && selectionStart !== null && selectionEnd !== null) {
            input.setSelectionRange(selectionStart, selectionEnd);
          }
        }
      }

      queueAutoPublish();
    }
  });

  dom.sections.addEventListener("click", async (event) => {
    const toggleTrigger = event.target.closest('[data-action="toggle-section"]');
    if (toggleTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      toggleSection(sectionCard?.dataset.sectionId);
      return;
    }

    const moveSectionUpTrigger = event.target.closest('[data-action="move-section-up"]');
    if (moveSectionUpTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      const sectionId = sectionCard?.dataset.sectionId;
      if (sectionId) {
        const collected = collectTemplate();
        const localeState = collected.locales[getSelectedEditorLocale()] ?? collected.locales[FIXED_LOCALE];
        const categories = localeState.categories || [];
        const catIds = categories.map(c => c.id);
        const visibleSections = localeState.sections.filter(s => s && s.id && !s.id.startsWith("section-cat-") && !catIds.some(catId => s.id === `section-${catId}`));
        const visibleIndex = visibleSections.findIndex(s => s.id === sectionId);
        if (visibleIndex > 0) {
          const targetSectionId = visibleSections[visibleIndex - 1].id;
          try {
            const res = reorderSection(collected, sectionId, targetSectionId, "before");
            if (res) setStatus(res.message, res.variant);
          } catch (err) {
            setStatus(err.message, "error");
          }
        }
      }
      return;
    }

    const moveSectionDownTrigger = event.target.closest('[data-action="move-section-down"]');
    if (moveSectionDownTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      const sectionId = sectionCard?.dataset.sectionId;
      if (sectionId) {
        const collected = collectTemplate();
        const localeState = collected.locales[getSelectedEditorLocale()] ?? collected.locales[FIXED_LOCALE];
        const categories = localeState.categories || [];
        const catIds = categories.map(c => c.id);
        const visibleSections = localeState.sections.filter(s => s && s.id && !s.id.startsWith("section-cat-") && !catIds.some(catId => s.id === `section-${catId}`));
        const visibleIndex = visibleSections.findIndex(s => s.id === sectionId);
        if (visibleIndex >= 0 && visibleIndex < visibleSections.length - 1) {
          const targetSectionId = visibleSections[visibleIndex + 1].id;
          try {
            const res = reorderSection(collected, sectionId, targetSectionId, "after");
            if (res) setStatus(res.message, res.variant);
          } catch (err) {
            setStatus(err.message, "error");
          }
        }
      }
      return;
    }

    const removeSectionTrigger = event.target.closest('[data-action="remove-section"]');
    if (removeSectionTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      const id = sectionCard?.dataset.sectionId;
      const localeState = currentLocaleState();
      const target = localeState?.sections?.find((s) => s.id === id);
      if (target && confirm(`Vuoi rimuovere il pulsante "${target.menuTitle}"?`)) {
        const collected = collectTemplate();
        try {
          const res = removeSection(collected, id);
          if (res) setStatus(res.message, res.variant);
        } catch (err) {
          setStatus(err.message, "error");
        }
      }
      return;
    }

    const duplicateSectionTrigger = event.target.closest('[data-action="duplicate-section"]');
    if (duplicateSectionTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      const collected = collectTemplate();
      try {
        const res = duplicateSection(collected, sectionCard?.dataset.sectionId);
        if (res) setStatus(res.message, res.variant);
      } catch (err) {
        setStatus(err.message, "error");
      }
      return;
    }

    const toggleVisibilityTrigger = event.target.closest('[data-action="toggle-section-visibility"]');
    if (toggleVisibilityTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      const collected = collectTemplate();
      try {
        const res = toggleSectionVisibility(collected, sectionCard?.dataset.sectionId);
        if (res) setStatus(res.message, res.variant);
      } catch (err) {
        setStatus(err.message, "error");
      }
      return;
    }

    const addLinkTrigger = event.target.closest('[data-action="add-link"]');
    if (addLinkTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      appendLinkTemplate(sectionCard?.dataset.sectionId);
      return;
    }

    const addCtaTrigger = event.target.closest('[data-action="add-cta"]');
    if (addCtaTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      const collected = collectTemplate();
      try {
        const res = addCta(collected, sectionCard?.dataset.sectionId);
        if (res) setStatus(res.message, res.variant);
      } catch (err) {
        setStatus(err.message, "error");
      }
      return;
    }

    const addCtaPresetTrigger = event.target.closest('[data-action="add-cta-preset"]');
    if (addCtaPresetTrigger) {
      const sectionCard = event.target.closest("[data-section-id]");
      const collected = collectTemplate();
      try {
        const res = addCta(collected, sectionCard?.dataset.sectionId, addCtaPresetTrigger.dataset.ctaKind || "web");
        if (res) setStatus(res.message, res.variant);
      } catch (err) {
        setStatus(err.message, "error");
      }
      return;
    }

    const removeCtaTrigger = event.target.closest('[data-action="remove-cta"]');
    if (removeCtaTrigger) {
      const ctaCard = event.target.closest("[data-cta-item]");
      const sectionCard = event.target.closest("[data-section-id]");
      const collected = collectTemplate();
      try {
        if (sectionCard) {
          removeCta(collected, sectionCard?.dataset.sectionId, Number.parseInt(ctaCard?.dataset.ctaIndex ?? "-1", 10));
          setStatus("Pulsante grafico rimosso.", "success");
        }
      } catch (err) {
        setStatus(err.message, "error");
      }
      return;
    }

    const moveCtaUpTrigger = event.target.closest('[data-action="move-cta-up"]');
    if (moveCtaUpTrigger) {
      const ctaCard = event.target.closest("[data-cta-item]");
      const sectionCard = event.target.closest("[data-section-id]");
      const ctaIndex = Number.parseInt(ctaCard?.dataset.ctaIndex ?? "-1", 10);
      const collected = collectTemplate();
      try {
        if (sectionCard) {
          moveCta(collected, sectionCard?.dataset.sectionId, ctaIndex, -1);
          setStatus("Ordine dei pulsanti grafici aggiornato.", "success");
        }
      } catch (err) {
        setStatus(err.message, "error");
      }
      return;
    }

    const moveCtaDownTrigger = event.target.closest('[data-action="move-cta-down"]');
    if (moveCtaDownTrigger) {
      const ctaCard = event.target.closest("[data-cta-item]");
      const sectionCard = event.target.closest("[data-section-id]");
      const ctaIndex = Number.parseInt(ctaCard?.dataset.ctaIndex ?? "-1", 10);
      const collected = collectTemplate();
      try {
        if (sectionCard) {
          moveCta(collected, sectionCard?.dataset.sectionId, ctaIndex, 1);
          setStatus("Ordine dei pulsanti grafici aggiornato.", "success");
        }
      } catch (err) {
        setStatus(err.message, "error");
      }
      return;
    }

    const removeTrigger = event.target.closest('[data-action="remove-image"]');
    if (removeTrigger) {
      const imageItem = event.target.closest("[data-image-item]");
      const sectionCard = event.target.closest("[data-section-id]");
      const collected = collectTemplate();
      try {
        await removeImage(collected, sectionCard?.dataset.sectionId, Number.parseInt(imageItem?.dataset.imageIndex ?? "-1", 10));
        setStatus("Immagine rimossa dalla sezione.", "success");
      } catch (err) {
        setStatus(err.message || "Rimozione immagine fallita.", "error");
      }
      return;
    }

    const removeMediaTrigger = event.target.closest('[data-action="remove-media"]');
    if (!removeMediaTrigger) return;
    const mediaItem = event.target.closest("[data-media-item]");
    const mediaSectionCard = event.target.closest("[data-section-id]");
    const collected = collectTemplate();
    try {
      await removeMedia(collected, mediaSectionCard?.dataset.sectionId, Number.parseInt(mediaItem?.dataset.mediaIndex ?? "-1", 10));
      setStatus("File rimosso dalla sezione.", "success");
    } catch (err) {
      setStatus(err.message || "Rimozione file fallita.", "error");
    }
  });

  dom.sections.addEventListener("dragstart", (event) => {
    const handle = event.target.closest('[data-action="drag-section"]');
    if (!handle || getSelectedEditorLocale() !== FIXED_LOCALE) {
      event.preventDefault();
      return;
    }

    const sectionCard = event.target.closest("[data-section-id]");
    draggingSectionId = sectionCard?.dataset.sectionId ?? null;
    if (!draggingSectionId) {
      event.preventDefault();
      return;
    }

    clearSectionDropState();
    sectionCard.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggingSectionId);
  });

  dom.sections.addEventListener("dragover", (event) => {
    if (!draggingSectionId) return;
    const sectionCard = event.target.closest("[data-section-id]");
    if (!sectionCard || sectionCard.dataset.sectionId === draggingSectionId) return;

    event.preventDefault();
    const rect = sectionCard.getBoundingClientRect();
    const position = event.clientY > rect.top + rect.height / 2 ? "after" : "before";
    dom.sections.querySelectorAll("[data-section-id]").forEach((card) => {
      if (card !== sectionCard) delete card.dataset.dropPosition;
    });
    sectionCard.dataset.dropPosition = position;
  });

  dom.sections.addEventListener("drop", (event) => {
    const sectionCard = event.target.closest("[data-section-id]");
    if (!draggingSectionId || !sectionCard) return;

    event.preventDefault();
    const targetSectionId = sectionCard.dataset.sectionId;
    const position = sectionCard.dataset.dropPosition || "before";
    clearSectionDropState();

    const collected = collectTemplate();
    try {
      const res = reorderSection(collected, draggingSectionId, targetSectionId, position);
      if (res) setStatus(res.message, res.variant);
    } catch (err) {
      setStatus(err.message, "error");
    }
    draggingSectionId = null;
  });

  dom.sections.addEventListener("dragend", () => {
    draggingSectionId = null;
    clearSectionDropState();
  });

  dom.app.addEventListener("click", (event) => {
    const panelTrigger = event.target.closest('[data-action="toggle-panel"]');
    if (!panelTrigger) return;
    const panel = event.target.closest("[data-panel-id]");
    togglePanel(panel?.dataset.panelId);
  });

  if (dom.categories) {
    dom.categories.addEventListener("click", (event) => {
      const toggleTrigger = event.target.closest('[data-action="toggle-category"]');
      if (toggleTrigger) {
        toggleCategory(toggleTrigger.dataset.categoryId);
        return;
      }

      const removeTrigger = event.target.closest('[data-action="remove-category"]');
      if (removeTrigger) {
        const categoryCard = event.target.closest("[data-category-id]");
        const collected = collectTemplate();
        try {
          const res = removeCategory(collected, categoryCard?.dataset.categoryId);
          if (res) setStatus(res.message, res.variant);
        } catch (err) {
          setStatus(err.message, "error");
        }
        return;
      }

      const toggleVisibilityTrigger = event.target.closest('[data-action="toggle-category-visibility"]');
      if (toggleVisibilityTrigger) {
        const categoryCard = event.target.closest("[data-category-id]");
        const collected = collectTemplate();
        try {
          toggleCategoryVisibility(collected, categoryCard?.dataset.categoryId);
        } catch (err) {
          setStatus(err.message, "error");
        }
        return;
      }

      const disconnectTrigger = event.target.closest('[data-action="disconnect-section"]');
      if (disconnectTrigger) {
        const sectionId = disconnectTrigger.dataset.sectionId;
        const localeState = currentLocaleState();
        const section = (localeState?.sections || []).find((s) => s.id === sectionId);
        if (section) {
          section.category = "top";
          const sectionCard = dom.sections.querySelector(`[data-section-id="${sectionId}"]`);
          if (sectionCard) {
            const select = sectionCard.querySelector('[data-field="category"]');
            if (select) {
              select.value = "top";
            }
          }
        }
        const collected = collectTemplate();
        setState(saveTemplate(collected));
        queueAutoPublish();
        return;
      }

      const categoryAddCtaTrigger = event.target.closest('[data-action="category-add-cta"]');
      if (categoryAddCtaTrigger) {
        const categoryCard = event.target.closest("[data-category-id]");
        const collected = collectTemplate();
        try {
          const res = addCategoryCta(collected, categoryCard?.dataset.categoryId);
          if (res) setStatus(res.message, res.variant);
        } catch (err) {
          setStatus(err.message, "error");
        }
        return;
      }

      const categoryAddCtaPresetTrigger = event.target.closest('[data-action="category-add-cta-preset"]');
      if (categoryAddCtaPresetTrigger) {
        const categoryCard = event.target.closest("[data-category-id]");
        const collected = collectTemplate();
        try {
          const res = addCategoryCta(collected, categoryCard?.dataset.categoryId, categoryAddCtaPresetTrigger.dataset.ctaKind || "web");
          if (res) setStatus(res.message, res.variant);
        } catch (err) {
          setStatus(err.message, "error");
        }
        return;
      }

      const removeCtaTrigger = event.target.closest('[data-action="remove-cta"]');
      if (removeCtaTrigger) {
        const ctaCard = event.target.closest("[data-cta-item]");
        const categoryCard = event.target.closest("[data-category-id]");
        const collected = collectTemplate();
        try {
          if (categoryCard) {
            removeCategoryCta(collected, categoryCard.dataset.categoryId, Number.parseInt(ctaCard?.dataset.ctaIndex ?? "-1", 10));
            setStatus("Pulsante grafico rimosso.", "success");
          }
        } catch (err) {
          setStatus(err.message, "error");
        }
        return;
      }

      const moveCtaUpTrigger = event.target.closest('[data-action="move-cta-up"]');
      if (moveCtaUpTrigger) {
        const ctaCard = event.target.closest("[data-cta-item]");
        const categoryCard = event.target.closest("[data-category-id]");
        const ctaIndex = Number.parseInt(ctaCard?.dataset.ctaIndex ?? "-1", 10);
        const collected = collectTemplate();
        try {
          if (categoryCard) {
            moveCategoryCta(collected, categoryCard.dataset.categoryId, ctaIndex, -1);
            setStatus("Ordine dei pulsanti grafici aggiornato.", "success");
          }
        } catch (err) {
          setStatus(err.message, "error");
        }
        return;
      }

      const moveCtaDownTrigger = event.target.closest('[data-action="move-cta-down"]');
      if (moveCtaDownTrigger) {
        const ctaCard = event.target.closest("[data-cta-item]");
        const categoryCard = event.target.closest("[data-category-id]");
        const ctaIndex = Number.parseInt(ctaCard?.dataset.ctaIndex ?? "-1", 10);
        const collected = collectTemplate();
        try {
          if (categoryCard) {
            moveCategoryCta(collected, categoryCard.dataset.categoryId, ctaIndex, 1);
            setStatus("Ordine dei pulsanti grafici aggiornato.", "success");
          }
        } catch (err) {
          setStatus(err.message, "error");
        }
        return;
      }
    });

    dom.categories.addEventListener("change", (event) => {
      const connectSelect = event.target.closest('[data-action="connect-section"]');
      if (connectSelect) {
        const sectionId = connectSelect.value;
        const categoryId = connectSelect.dataset.categoryId;
        if (sectionId) {
          const localeState = currentLocaleState();
          const section = (localeState?.sections || []).find((s) => s.id === sectionId);
          if (section) {
            section.category = categoryId;
            const sectionCard = dom.sections.querySelector(`[data-section-id="${sectionId}"]`);
            if (sectionCard) {
              const select = sectionCard.querySelector('[data-field="category"]');
              if (select) {
                select.value = categoryId;
              }
            }
          }
          const collected = collectTemplate();
          setState(saveTemplate(collected));
          queueAutoPublish();
        }
        return;
      }

      if (event.target.matches('[data-field="icon"], [data-field="iconColor"]')) {
        updateCategoryIconPreview(event.target.closest("[data-category-id]"));
      }
      if (event.target.matches('[data-field]')) {
        const activeFocusedElement = document.activeElement;
        const activeFocusedId = activeFocusedElement?.closest('[data-category-id]')?.dataset.categoryId;
        const activeFocusedField = activeFocusedElement?.dataset.field;
        const selectionStart = activeFocusedElement?.selectionStart;
        const selectionEnd = activeFocusedElement?.selectionEnd;

        const collected = collectTemplate();
        setState(saveTemplate(collected));
        
        if (activeFocusedId && activeFocusedField) {
          const card = dom.categories.querySelector(`[data-category-id="${activeFocusedId}"]`);
          const input = card?.querySelector(`[data-field="${activeFocusedField}"]`);
          if (input) {
            input.focus();
            if (typeof selectionStart === "number") {
              input.setSelectionRange(selectionStart, selectionEnd);
            }
          }
        }
        
        queueAutoPublish();
      }
    });
  }
}

export function bindAuthEvents(onOpenEditor) {
  if (authBound) return;
  authBound = true;

  const handleLoginClick = async () => {
    const password = dom.password.value.trim();
    try {
      await login(password);
      dom.password.value = "";
      await onOpenEditor();
    } catch (err) {
      setStatus(err.message, "error");
    }
  };

  dom.login.addEventListener("click", handleLoginClick);
  dom.password.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLoginClick();
    }
  });

  supabase.auth.onAuthStateChange(async (_event, nextSession) => {
    const sessionAllowed = nextSession && nextSession.user?.email?.toLowerCase() === HOST_EMAIL.toLowerCase();
    
    // We update session state in the model
    const previousSession = getState();
    // We pass to host-state.js
    // Wait, let's call the exported state setter
    import("./host-state.js?v=20260615d").then((mod) => {
      mod.setSession(nextSession);
      const isAuth = mod.isAuthorizedSession();
      const editorReady = mod.isEditorReady();
      
      if (!isAuth) {
        mod.setEditorReady(false);
        mod.setEditorLoading(false);
        // Access state updating is in host.js, or we trigger it
        notifyAuthChange(isAuth, editorReady, onOpenEditor);
        return;
      }

      if (window.location.hash === "#editor" && !editorReady) {
        onOpenEditor().catch(() => {
          setStatus("Caricamento editor fallito.", "error");
        });
        return;
      }

      if (window.location.hash === "#editor" && editorReady) {
        setStatus("Accesso host attivo. Le modifiche si sincronizzano live.", "success");
      }
      notifyAuthChange(isAuth, editorReady, onOpenEditor);
    });
  });

  window.addEventListener("hashchange", () => {
    import("./host-state.js?v=20260615d").then((mod) => {
      const isAuth = mod.isAuthorizedSession();
      const editorReady = mod.isEditorReady();
      
      if (isAuth && window.location.hash === "#editor" && !editorReady) {
        onOpenEditor().catch(() => {
          setStatus("Caricamento editor fallito.", "error");
        });
        return;
      }

      if (window.location.hash !== "#editor") {
        mod.setEditorReady(false);
        mod.setEditorLoading(false);
      }
      notifyAuthChange(isAuth, mod.isEditorReady(), onOpenEditor);
    });
  });
}

function notifyAuthChange(isAuth, editorReady, onOpenEditor) {
  // Dispatches event or runs callback
  const event = new CustomEvent("hostAuthChange", {
    detail: { isAuth, editorReady }
  });
  window.dispatchEvent(event);
}
