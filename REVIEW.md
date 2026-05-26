# Code Review — StampaceCharmingEssential

> **Autore review**: Antigravity AI  
> **Data**: 25 maggio 2026  
> **Destinatario**: Codex (architetto principale)

---

## Contesto operativo

Prima di leggere le proposte, è importante il contesto reale di utilizzo:

- La **pagina Host** (`host.html`) è gestita da **una sola persona** (il proprietario dell'appartamento).
- La **pagina Ospiti** (`index.html`) viene condivisa tramite **link o QR code** ai singoli ospiti. **Non è indicizzata** né resa pubblica.
- L'app serve come guida pratica per il soggiorno: Wi-Fi, codici, regole, contatti.

Le priorità sotto sono calibrate su questo scenario.

---

## Architettura attuale

```
index.html          → App ospiti (menu → sheet dettaglio → selettore lingua)
host.html           → Editor riservato (login Supabase → modifica template → publish live)

app.js       (409 righe)  → Logica app ospiti
content.js   (913 righe)  → Modello dati, normalizzazione, i18n, fallback, default content 6 lingue
host.js      (987 righe)  → Editor host completo + traduzione automatica
supabase.js  (142 righe)  → Client Supabase, auth, storage, realtime

styles.css   (619 righe)  → Stili app ospiti
host.css     (613 righe)  → Stili editor host

template.json              → Template statico di fallback (formato legacy)
supabase-setup.sql         → Schema DB, RLS policies, storage bucket
```

**Flusso dati del template:**
```
Host editor → Supabase DB (table app_templates, row "live")
                    ↓ realtime subscription
              App ospiti (render da remoto, fallback su template.json → localStorage → default)
```

---

## Cosa funziona bene ✅

- **Design e identità visiva**: palette scura con accenti dorati, texture legno, layout mobile-first. Coerente, elegante, superiore alla media.
- **Sistema icone SVG inline**: leggero, zero dipendenze, scalabile.
- **Normalizzazione template multi-livello**: il fallback chain (remote → file → localStorage → default) è robusto e resiliente.
- **RLS Supabase**: le policy sono granulari e corrette — solo l'email autorizzata può scrivere.
- **Realtime sync**: aggiornamento live del template via Supabase Realtime.
- **I18n con mirroring italiano**: le modifiche in italiano si propagano automaticamente alle altre lingue.
- **Cache traduzione locale**: `translationCache` in `host.js` evita chiamate API ridondanti.
- **Accessibilità ARIA parziale**: `aria-label`, `aria-hidden`, `aria-modal`, `role="dialog"` presenti dove serve.
- **Struttura CSS pulita**: variabili custom coerenti, media queries ben organizzate, responsive solido.

---

## Proposte di miglioramento



---

### 🟠 P2 — PWA + Service Worker per funzionamento offline

**Problema**: l'ospite apre il link in appartamento o in viaggio, spesso con rete instabile. Se la rete è assente al primo accesso, l'app non carica. Se è assente dopo il primo accesso, funziona solo se il browser ha ancora la pagina in cache.

**Azione**:
1. Creare un `manifest.json` con nome, icone, colori del tema
2. Creare un Service Worker minimale con strategia cache-first per gli asset statici (HTML, CSS, JS, immagini, font)
3. Il template live resta network-first (con fallback su ultima versione cached)
4. Aggiungere `<link rel="manifest">` in `index.html`

**Beneficio**: l'app diventa installabile su home screen e funziona offline dopo il primo caricamento.

**Effort**: ⬛⬛ Medio

---

### 🟠 P3 — Ottimizzare l'immagine di sfondo (3.8 MB)

**File**: `img/patternlegn.png` — 3,863,392 bytes

Caricata via CSS su `body::before` in entrambe le pagine. Su mobile con rete lenta, ritarda il rendering dell'intera pagina.

**Azione**:
1. Convertire in WebP (stima: ~200-400 KB, riduzione ~90%)
2. Opzionalmente ridurre la risoluzione se il pattern è tileable
3. Aggiornare i riferimenti CSS in `styles.css` e `host.css`

**Effort**: ⬛ Basso

---

### 🟡 P4 — Animazione apertura/chiusura sheet

**File**: `styles.css` (classe `.section-sheet`) + `app.js` (funzioni `openSection`, `closeSection`)

**Problema**: lo sheet si apre con un toggle `display:none` → visibile, senza transizioni. L'app ha un tono elegante ma l'interazione principale è brusca.

**Azione**: aggiungere transizione CSS su `transform` e `opacity` per un effetto slide-up o fade-in. Sostituire la classe `hidden` con un meccanismo basato su `transform: translateY(100%)` → `translateY(0)`.

**Effort**: ⬛ Basso

---

### 🟡 P5 — Estrarre moduli condivisi

#### 5a. Duplicazione `iconPaths`

La mappa SVG delle icone è duplicata tra `app.js` (righe 12-71, 25 icone) e `host.js` (righe 26-43, 8 icone, subset).

**Azione**: creare `icons.js` con export della mappa e della funzione `renderIcon()`. Importare da entrambi i file.

#### 5b. `content.js` monolite (913 righe)

Contiene modello dati, normalizzazione, default content per 6 lingue (~600 righe di testo), I/O.

**Azione suggerita**:
```
content.js         → costanti, modello, normalizzazione, I/O (~300 righe)
locales/it.js      → default content italiano
locales/en.js      → default content inglese
locales/fr.js      → ecc.
locales/index.js   → aggregatore
icons.js           → icone SVG condivise
```

**Effort**: ⬛⬛ Medio

---

### 🟡 P6 — Google Translate: endpoint non ufficiale

**File**: `host.js`, riga 82

```javascript
const TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
```

Questo è l'endpoint interno di Google Translate (usato dal browser). Non è una API ufficiale, non ha SLA e può essere bloccato o rate-limitato senza preavviso.

**Opzioni**:
| Opzione | Pro | Contro |
|---------|-----|--------|
| Google Cloud Translation API | Ufficiale, affidabile | Richiede billing Google Cloud |
| DeepL API Free | 500K char/mese gratis, qualità alta | Limite mensile |
| LibreTranslate self-hosted | Gratis, nessun limite | Serve un server |
| Mantenere attuale + fallback | Zero costi | Può rompersi |

**Consiglio**: per ora aggiungere almeno un fallback graceful (se la traduzione fallisce, mostrare il testo italiano anziché errore). Migrare a un servizio ufficiale quando il progetto si stabilizza.

**Effort**: ⬛ Basso (fallback) / ⬛⬛ Medio (migrazione API)

---

### 🟡 P7 — `normalizeTemplate()` richiamata ad ogni render

**File**: `content.js`, righe 851-854

```javascript
export function getLocaleContent(template, localeCode) {
  const normalized = normalizeTemplate(template);  // ricalcola tutto ogni volta
  const code = normalized.enabledLocales.includes(localeCode) ? localeCode : FIXED_LOCALE;
  return normalized.locales[code] ?? normalized.locales[FIXED_LOCALE];
}
```

`getLocaleContent()` viene chiamata durante ogni `render()` in `app.js`, e ricostruisce l'intero albero dati incluso `buildLocaleMap()` con `mirrorItalianContent()` per tutte le 6 lingue.

**Azione**: normalizzare una sola volta al momento del caricamento/aggiornamento del template (in `init()`, `syncRemoteTemplate()`, callback realtime). `getLocaleContent()` diventa un semplice accesso diretto.

**Effort**: ⬛ Basso

---

### 🟡 P8 — Nessun feedback errore per l'ospite

**File**: `app.js`, righe 360-362

```javascript
} catch {
  // Keep the current rendered template if remote sync fails.
}
```

Se Supabase è down o la rete è assente, l'ospite vede dati potenzialmente vecchi senza saperlo. Non è un problema grave per il caso d'uso, ma un piccolo indicatore ("Ultimo aggiornamento: …" o un toast discreto) migliorerebbe la fiducia.

**Effort**: ⬛ Basso

---

### 🟢 P9 — Raffinamenti minori

| Cosa | Dove | Azione |
|------|------|--------|
| **Favicon mancante** | `index.html`, `host.html` | Aggiungere `<link rel="icon">` |
| **Touch event duplicato** | `app.js:294-301` | Rimuovere listener `touchend` non-passive — il `click` basta sui browser moderni |
| **`template.json` formato legacy** | `template.json` | Allinearlo al formato normalizzato (con `locales`, `enabledLocales`) per chiarezza |
| **Cache-busting manuale** | `?v=20260527h` in HTML | Fragile; se si introduce un bundler, automatizzare con hash |
| **XSS via innerHTML** | `app.js`, `host.js` | Il rischio è basso dato che l'unico editor è il proprietario e le RLS sono corrette, ma sanitizzare i valori interpolati nei template string resta una buona pratica difensiva. Valutare se aggiungere un `escapeHtml()` leggero |
| **No build/lint/test** | root | Valutare se introdurre `package.json` con ESLint + Prettier per consistenza, specialmente se il progetto cresce |

---

## Riepilogo per priorità

| Prio | # | Cosa | Effort | Impatto utente |
|------|---|------|--------|----------------|

| 🟠 | P2 | PWA + Service Worker | Medio | Alto — funziona offline |
| 🟠 | P3 | Ottimizzare immagine 3.8 MB | Basso | Alto — caricamento rapido su mobile |
| 🟡 | P4 | Animazione sheet | Basso | Medio — qualità percepita |
| 🟡 | P5 | Estrarre moduli condivisi | Medio | Medio — manutenibilità |
| 🟡 | P6 | Fallback traduzione | Basso | Medio — resilienza |
| 🟡 | P7 | Ottimizzare normalizeTemplate | Basso | Basso — performance |
| 🟡 | P8 | Feedback errore ospite | Basso | Basso — trasparenza |
| 🟢 | P9 | Raffinamenti vari | Basso | Basso — pulizia |

---

## Nota finale

Il progetto è solido per il suo scopo. Il design è curato, il flusso funziona, l'architettura Supabase è corretta. Le proposte sopra sono miglioramenti incrementali — nessuna richiede riscritture. I tre interventi P1-P3 da soli alzerebbero sensibilmente la qualità dell'esperienza ospite con effort contenuto.
