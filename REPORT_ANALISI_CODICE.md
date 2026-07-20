# Report di analisi tecnica — Stampace Charming Essential

**Data analisi:** 20 luglio 2026

**Commit analizzato:** `244f6d4` (`main`)

**Ambito:** codice applicativo, configurazione Supabase, PWA/service worker, sicurezza, privacy, accessibilità, prestazioni, test, CI e deploy.

**Tipo di revisione:** analisi statica e verifiche locali; nessun file applicativo è stato modificato.

## Sintesi esecutiva

L'applicazione è una PWA vanilla HTML/CSS/JavaScript con un editor host, Supabase come sorgente live e traduzione automatica dei contenuti. La base è funzionale e presenta diverse buone difese contro XSS, una configurazione RLS che limita le scritture all'account host, controlli client sui file e una suite di 42 test attualmente verde.

Le criticità principali non sono però cosmetiche: riguardano la riservatezza dei dati operativi e l'integrità delle modifiche effettuate dall'host.

1. Il repository GitHub è pubblico e contiene due snapshot live versionati sotto `scratch/`, per circa 1,5 MB complessivi. I file includono tipologie di dati operativi che non dovrebbero restare nella cronologia pubblica.
2. La riga Supabase `live` è leggibile pubblicamente. Qualunque dato inserito nel template — inclusi eventuali codici di accesso, password Wi-Fi e contatti — è quindi interrogabile senza aprire l'interfaccia grafica.
3. La pubblicazione invia gran parte dei testi italiani a un endpoint Google Translate non ufficiale tramite query string. La protezione copre il nome della rete Wi-Fi, ma non la password Wi-Fi né, in generale, codici di accesso e altri valori sensibili presenti come testo libero.
4. L'autosalvataggio non serializza le pubblicazioni e non usa un controllo di versione. Una pubblicazione lenta può terminare dopo una modifica più recente e riassegnare uno snapshot vecchio, causando perdita di dati. La chiusura della scheda entro 2,5 secondi può inoltre lasciare modifiche solo locali, che al successivo accesso vengono scavalcate dalla copia remota.
5. Le modifiche manuali alle lingue non italiane vengono rigenerate dalla traduzione automatica al publish e possono quindi scomparire.

La priorità consigliata è: mettere in sicurezza dati e cronologia, bloccare l'invio dei campi sensibili alla traduzione, rendere atomico/versionato il flusso di pubblicazione e introdurre backup/rollback del template.

## Architettura rilevata

```text
Ospite
  index.html -> app.js -> content.js -> Supabase app_templates/live
                                  \-> Realtime -> nuovo rendering completo
  service worker -> cache degli asset locali e fallback template.json

Host
  host.html -> host.js <-> host-events.js / host-rendering.js
                         \-> host-state.js -> localStorage
                                           -> Google Translate
                                           -> Supabase app_templates/live
                                           -> Storage images/media
```

Componenti principali:

| Area | File principali | Responsabilità |
|---|---|---|
| App ospiti | `index.html`, `app.js`, `styles.css` | Rendering, navigazione, copia dati, temi, realtime |
| Modello contenuti | `content.js`, `template.json` | Default multilingua, normalizzazione, migrazioni compatibili, fallback |
| Editor host | `host.js`, `host-events.js`, `host-state.js`, `host-rendering.js`, `host.html`, `host.css` | Autenticazione, modifica, traduzione e pubblicazione |
| Backend | `supabase.js`, `supabase-setup.sql` | Database, RLS, Realtime e Storage |
| PWA | `sw.js`, `manifest.json` | Cache, installazione e comportamento standalone |
| Sicurezza output | `security.js`, `theme-utils.js` | Escape HTML, URL e colori CSS |
| Qualità | `tests/`, `eslint.config.mjs`, workflow `Check` | Test, lint e controlli sintattici |

Il nucleo applicativo supera 12.600 righe tra JavaScript, CSS e test. I moduli più grandi sono `content.js` (2.257 righe), `app.js` (1.850), `host-rendering.js` (1.757), `host.css` (1.500) e `host-state.js` (1.281). Questa concentrazione aumenta il costo di modifica e il rischio di regressioni trasversali.

## Aspetti positivi

- I valori inseriti nell'HTML dinamico vengono quasi sempre trattati con `escapeHtml`/`escapeAttribute`; URL, immagini e colori hanno sanitizzatori dedicati (`security.js`).
- I link aperti in una nuova scheda usano sistematicamente `rel="noopener noreferrer"`.
- Le policy RLS impediscono scritture anonime sul template e sui bucket; l'anon key presente nel frontend è una chiave pubblica per definizione e non va confusa con una service-role key.
- Il bucket immagini impone lato database formati e limite di 5 MB; il client applica limiti anche a documenti e video.
- L'interfaccia include focus visibile e supporto a `prefers-reduced-motion`.
- Il service worker separa navigazioni e asset statici e rimuove le vecchie cache all'attivazione.
- `npm run check` passa; i 42 test passano; `npm audit` non segnala vulnerabilità nei pacchetti installati.
- Le GitHub Actions sul commit analizzato risultano verdi.

## Registro delle criticità

| ID | Severità | Area | Sintesi |
|---|---|---|---|
| SEC-01 | **Critica** | Repository | Snapshot del template live nella cronologia di un repository pubblico |
| SEC-02 | **Critica condizionale** | Supabase/privacy | Tutto il template live è leggibile anonimamente |
| SEC-03 | **Alta/Critica** | Privacy/traduzioni | Testi e possibili segreti operativi inviati a un endpoint di traduzione esterno |
| DAT-01 | **Alta** | Autosave | Race condition tra pubblicazioni e possibile sovrascrittura di modifiche recenti |
| DAT-02 | **Alta** | Autosave | Chiusura pagina e riapertura possono perdere una bozza non pubblicata |
| DAT-03 | **Alta** | Concorrenza | Nessun optimistic locking tra schede, dispositivi o sessioni |
| I18N-01 | **Alta** | Traduzioni | Le modifiche manuali alle lingue non italiane vengono rigenerate al publish |
| DAT-04 | **Alta** | Migrazioni/media | Cleanup automatici e cancellazioni Storage non sono transazionali |
| DAT-05 | **Alta** | Recovery | Nessuna cronologia del template, backup applicativo o rollback |
| OPS-01 | **Alta** | Editor | Errori di autosalvataggio visibili solo in console; stato “Attivo” potenzialmente ingannevole |
| SEC-04 | **Media/Alta** | Supply chain | SDK Supabase caricato da CDN con versione non fissata e non coperto da `npm audit` |
| SEC-05 | **Media** | Hardening web | Mancano CSP e header di sicurezza espliciti |
| SEC-06 | **Media** | Storage/auth | MIME del bucket media non limitati lato server e sessione guest non separata da quella host |
| PERF-01 | **Alta** | Rendering | Normalizzazione completa ripetuta molte volte durante un singolo render |
| PERF-02 | **Media/Alta** | Media | Contenuti chiusi già renderizzati; immagini impostate `eager` |
| PWA-01 | **Media/Alta** | Offline/cache | Offline incompleto per dipendenze cross-origin e cache busting manuale |
| A11Y-01 | **Alta** | Accessibilità | Copia, selezione, menu contestuale e trascinamento bloccati globalmente |
| A11Y-02 | **Media/Alta** | Accessibilità | Lingua documento, accordion, dialog e tab host incompleti semanticamente |
| A11Y-03 | **Media** | Leggibilità | L'IBAN può scendere fino a 6 px per restare su una riga |
| MOD-01 | **Media/Alta** | Modello dati | Normalizzazione molto complessa, fallback per indice e campi non svuotabili |
| MOD-02 | **Media** | Manutenibilità | Moduli grandi, dipendenze circolari e cache versionata manualmente |
| QA-01 | **Media** | Test | Mancano test DOM/E2E, autosave, concorrenza, traduzione, Supabase e service worker |
| OPS-02 | **Media** | Deploy/documentazione | GitHub Pages, Cloudflare/dist e README non descrivono una pipeline univoca |
| UX-01 | **Bassa/Media** | Localizzazione | Etichette e messaggi hardcoded; dati linguistici incoerenti o non raggiungibili |

## Analisi dettagliata e soluzioni suggerite

### SEC-01 — Snapshot live in un repository pubblico

**Evidenza al commit analizzato:** `scratch/live_template.json` (circa 765 KB) e `scratch/cleaned_live_template.json` (circa 748 KB) erano tracciati da Git, nonostante `scratch/` fosse in `.gitignore`. Sono entrati nella cronologia con il commit `4ba1344`. L'analisi dei pattern ha rilevato dati di contatto e altri valori operativi; questo report evita intenzionalmente di riprodurli. I due snapshot sono stati successivamente rimossi dal branch corrente, ma restano recuperabili dai commit precedenti finché la cronologia non viene riscritta.

**Impatto:** aggiungere una cartella a `.gitignore` non rimuove file già tracciati e non cancella le revisioni passate. Dati eliminati nel commit corrente resterebbero recuperabili dalla cronologia GitHub.

**Soluzione:** prima salvare una copia sicura se necessaria, poi:

1. valutare di rendere temporaneamente privato il repository;
2. inventariare e ruotare i codici/password operativi presenti negli snapshot;
3. rimuovere gli snapshot dall'indice;
4. riscrivere la cronologia con `git filter-repo` o BFG e coordinare il force-push;
5. invalidare eventuali fork/cache e attivare secret scanning/push protection;
6. mantenere nel repository solo fixture sintetiche e anonimizzate.

La riscrittura della cronologia è distruttiva e va eseguita come intervento separato, dopo un backup e una conferma esplicita.

### SEC-02 — Il template live è un dataset pubblico

**Evidenza:** `supabase-setup.sql:53-58` concede `select` sulla riga `live` ai ruoli `anon` e `authenticated`. Realtime pubblica gli aggiornamenti della stessa tabella. Il frontend contiene URL e anon key necessari per effettuare direttamente la query.

**Impatto:** l'URL dell'interfaccia non costituisce controllo di accesso. Chiunque può leggere e indicizzare il JSON senza usare la UI. Se il template include password Wi-Fi, codici keybox/porta, istruzioni di accesso o dati personali, questi sono pubblici.

**Soluzione:** scegliere esplicitamente uno dei due modelli:

- **Guida pubblica:** non inserire mai segreti nel template; separare i contenuti sensibili e comunicarli con un canale autenticato.
- **Guida riservata per soggiorno:** usare token casuali per prenotazione con scadenza, Edge Function/RPC e RLS per singolo soggiorno; separare `public_content` da `stay_private_content`.

È consigliabile documentare il threat model: oggi il comportamento è tecnicamente coerente con una guida pubblica, ma non con una guida che contiene credenziali di accesso.

### SEC-03 — Traduzione esterna di dati operativi

**Evidenza:** `host-state.js:62`, `183-235` e `247-279` usano `https://translate.googleapis.com/translate_a/single?client=gtx` con il testo nel parametro GET `q`. `buildTranslatedLocale` accoda quasi tutti i testi di sezioni e oggetti (`host-state.js:474-599`). `preserveWifiValue` protegge le etichette relative al nome rete, ma non la voce password. Nemmeno codici porta/keybox o contatti presenti come stringhe sono classificati come sensibili.

**Impatto:** contenuti potenzialmente riservati vengono trasmessi a un servizio terzo e possono comparire in URL, log di rete e cache di traduzione locale. L'endpoint `client=gtx` non rappresenta un'integrazione contrattuale stabile.

**Soluzione:** introdurre tipi strutturati non traducibili (`wifi.ssid`, `wifi.password`, `access.code`, `iban`, telefono, email, URL), escluderli per costruzione dal payload e non basarsi su euristiche testuali. Per gli altri campi, usare un servizio ufficiale tramite backend, con chiave non esposta, timeout/retry e valutazione privacy. La cache locale deve conservare solo testo non sensibile e avere limite/TTL.

### DAT-01/DAT-02/DAT-03 — Autosave e concorrenza

**Evidenza:** ogni input salva localmente e avvia un timer da 2,5 secondi (`host-events.js:202-230`). `publishNow` traduce lo stato e poi esegue `state = await buildPublishedTemplate(state)` (`host-state.js:745-755`). Non esiste mutex, coda delle revisioni o abort della pubblicazione già avviata. `latestRemoteUpdatedAt` viene memorizzato ma non è usato nella query di update (`supabase.js:92-101`). In hydration, la copia remota prevale sempre sulla bozza locale (`host-state.js:723-740`). Non c'è gestione `beforeunload/pagehide`.

**Scenario di perdita dati:**

1. parte la pubblicazione della revisione A;
2. l'host continua a scrivere e produce B;
3. la traduzione/pubblicazione di A termina dopo B;
4. `state` viene riassegnato ad A e B può scomparire.

Un secondo scenario avviene chiudendo la pagina prima del timer: la bozza resta in `localStorage`, ma alla riapertura viene sostituita dal remoto precedente.

**Stato successivo all'analisi:** la race condition nella singola sessione è stata corretta introducendo una coda single-flight, richieste coalescenti e una revisione locale che impedisce a uno snapshot obsoleto di rimpiazzare lo stato più recente. È stata inoltre aggiunta una scrittura condizionale basata su `updated_at`: se un altro dispositivo ha già pubblicato, la copia locale non sovrascrive quella online e l'editor offre la scelta esplicita tra pubblicare la versione locale o caricare quella remota. Ritardo, traduzione e pubblicazione atomica delle lingue sono rimasti invariati. Resta da affrontare separatamente il recupero della bozza dopo una chiusura anticipata.

**Soluzione raccomandata:**

- aggiungere un contatore locale monotono `draftRevision`;
- pubblicare snapshot immutabili e usare una sola promise/coda in flight;
- al termine non riassegnare lo snapshot pubblicato se lo stato locale è avanzato;
- coalescere le modifiche arrivate durante il publish e avviare subito il publish successivo;
- aggiungere `version bigint` o usare `updated_at` per compare-and-swap (`update ... where version = expected`);
- conservare un envelope locale con `content`, `dirtyAt`, `baseRemoteVersion` e offrire il recupero della bozza;
- mostrare “Modifiche locali”, “Salvataggio…”, “Salvato” ed “Errore — Riprova”; aggiungere un pulsante “Salva ora”;
- avvisare prima di chiudere se esistono modifiche non sincronizzate.

### I18N-01 — Le traduzioni manuali vengono sovrascritte

**Evidenza:** l'editor permette di selezionare e modificare tutte le lingue (`host-rendering.js:1404-1407`), ma `buildPublishedTemplate` ricostruisce ogni lingua abilitata diversa dall'italiano chiamando `buildTranslatedLocale(italianLocale, code)` (`host-state.js:610-634`). Lo stato manuale della lingua target non viene passato alla funzione.

**Impatto:** correzioni professionali o manuali in inglese/terza lingua possono sparire dopo l'autosalvataggio. L'interfaccia promette una possibilità che il modello di pubblicazione non preserva.

**Soluzione:** decidere un comportamento univoco:

- modalità solo automatica: rendere le lingue tradotte non modificabili e fornire “Rigenera traduzioni”; oppure
- modalità ibrida consigliata: memorizzare per campo `sourceHash`, valore automatico e override manuale; rigenerare solo i campi senza override o quelli la cui sorgente italiana è cambiata.

### DAT-04/DAT-05 — Migrazioni implicite, Storage e assenza di rollback

**Evidenza:** aprire l'editor esegue cleanup hardcoded su ID specifici e programma automaticamente una pubblicazione (`host-state.js:637-740`). Un cleanup può anche cancellare file Storage. Le rimozioni di immagini/media eliminano prima l'oggetto e pubblicano il template solo in seguito (`host-state.js:1193-1265`). Il database conserva una sola riga senza storico.

**Impatto:** una semplice apertura dell'editor può produrre mutazioni. Se la pubblicazione fallisce dopo una cancellazione Storage, il template remoto può puntare a un file ormai inesistente. Un upload fallito a metà può lasciare un orfano. Non esiste un rollback rapido dopo un errore editoriale o una migrazione difettosa.

**Soluzione:** aggiungere `schemaVersion`, migrazioni pure/idempotenti e una conferma esplicita prima di applicarle. Creare `app_template_versions` o snapshot versionati con autore, data e contenuto. Per i file usare cancellazione differita/mark-and-sweep: prima pubblicare il template, poi eliminare gli oggetti non più referenziati; prevedere un job di pulizia degli orfani.

### OPS-01 — Stato di sincronizzazione non affidabile

**Evidenza:** `queueAutoPublish` cattura l'errore e lo stampa solo in console (`host-state.js:761-770`). Il parametro `silent` di `publishNow` non viene usato. Il pill dell'editor può continuare a mostrare “Attivo” mentre una modifica è in attesa, in corso o fallita.

**Impatto:** l'host può chiudere la pagina credendo che il dato sia live. Questo amplifica tutti i rischi di autosave.

**Soluzione:** modellare lo stato di sync (`clean`, `dirty`, `publishing`, `saved`, `error`, `conflict`) e renderlo in un elemento `role="status"`/`aria-live`. Gli errori devono restare visibili finché non vengono risolti; aggiungere retry con backoff e azione manuale.

### SEC-04/SEC-05/SEC-06 — Hardening e dipendenze

**SDK runtime.** `supabase.js:1` importa `@supabase/supabase-js@2/+esm` da jsDelivr senza versione esatta. Il contenuto può cambiare nel tempo, non è incluso nel lockfile e non viene analizzato da `npm audit`. Pinning e bundling locale renderebbero build e cache riproducibili.

**Header.** Non risultano `_headers` o configurazioni equivalenti per CSP, `frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options` e `Permissions-Policy`. Una CSP è particolarmente utile perché la sessione host persiste nel browser e l'editor è una superficie sensibile. Va costruita tenendo conto di Supabase, Google Fonts e dell'eventuale servizio di traduzione.

**Auth.** Le policy autorizzano in base all'email nel JWT. Funziona, ma un claim di ruolo in `app_metadata`, MFA obbligatoria per l'host e signup pubblico disabilitato sono più robusti. `getGuestSupabase` dovrebbe usare auth senza persistenza/rilevamento URL e uno storage key separato; solo il client host dovrebbe mantenere la sessione.

**Storage.** Il bucket `media` ha `allowed_mime_types = null` (`supabase-setup.sql:16-27`): i controlli JavaScript possono essere aggirati chiamando direttamente l'API con una sessione valida. Imporre MIME lato bucket, oppure separare documenti e video. In upload, non accettare un'estensione quando il MIME reale è generico senza una verifica server-side.

**CTA e CSS.** I tipi grafici Airbnb/Booking/Vrbo/PayPal/Revolut accettano qualunque URL HTTPS, permettendo un pulsante con brand legittimo e destinazione diversa. Applicare allowlist del dominio o mostrare chiaramente il dominio. `fontSize` e `padding` delle categorie sono testo CSS libero: validare unità e range con allowlist/CSS.supports.

### PERF-01/PERF-02 — Rendering e media

**Normalizzazione ripetuta.** `getLocaleContent` chiama sempre `normalizeTemplate` (`content.js:2193-2196`); `localeState()` viene richiamata ripetutamente da funzioni e cicli di rendering. Ogni normalizzazione ricostruisce tutte le lingue disponibili e riallinea sezioni/elementi. `getVisibleLocales` normalizza di nuovo. Inoltre `init` interroga il remoto dentro `loadTemplate` e subito dopo una seconda volta (`app.js:1807-1814`).

**Soluzione:** normalizzare una sola volta ai confini (fetch/import/save), trattare lo stato interno come canonico e calcolare una sola `localeTemplate` per render. Precalcolare mappe `sectionById`/`categoryById`, evitare fetch iniziale doppio e deduplicare fetch focus/visibility.

**Contenuto chiuso.** `renderMenu` genera il contenuto completo di ogni accordion anche quando chiuso; `renderImageItem` usa `loading="eager"` (`app.js:416-429`). Di conseguenza immagini e metadata video possono essere richiesti prima dell'apertura.

**Soluzione:** renderizzare il dettaglio al primo expand oppure usare `<template>`/lazy hydration; impostare `loading="lazy"`, dimensioni/aspect-ratio e poster per i video. Applicare un limite a numero/peso dei media per sezione.

### PWA-01 — Offline e cache

**Evidenze:**

- il service worker ignora le richieste cross-origin; Supabase SDK e Google Fonts non entrano nella cache applicativa;
- se la CDN Supabase non è raggiungibile al cold start, il grafo dei moduli può fallire prima che il fallback del template venga eseguito;
- il template remoto Supabase non viene salvato come ultima copia valida per i guest;
- `cache.addAll` rende l'installazione atomica: un solo asset mancante fa fallire tutto;
- `skipWaiting` + `clients.claim` può combinare una pagina già aperta con asset nuovi;
- versioni query e nome cache sono replicati manualmente in HTML, import JS e `sw.js`;
- l'SVG dichiarato anche `maskable` non garantisce safe-zone e compatibilità pari a icone raster 192/512.

**Soluzione:** bundlare l'SDK; generare automaticamente manifest asset/hash; usare precache tollerante agli errori e strategie per rotta con scadenza/limite; salvare l'ultima configurazione valida; gestire l'update con messaggio “Nuova versione disponibile”; aggiungere PNG 192/512 e un'icona maskable dedicata. Valutare se il vincolo `orientation: portrait` sia realmente necessario.

### A11Y-01/A11Y-02/A11Y-03 — Accessibilità

**Blocco globale.** `preventCopy` annulla `copy`, `cut`, `contextmenu`, `dragstart` e `selectstart` su tutto il documento (`app.js:1555-1561`), mentre il CSS disabilita la selezione. Non impedisce realmente l'estrazione dei dati, ma ostacola utenti con disabilità, traduttori, funzioni di sistema e normale selezione del testo. Va rimosso; i soli pulsanti copia possono restare.

**Lingua e localizzazione.** `<html lang="it">` non viene aggiornato quando cambia lingua. Etichette come “Rete”, “Password”, “Host”, “Close”, messaggi copia e stato sono hardcoded in lingue diverse. Aggiornare `document.documentElement.lang` e centralizzare tutte le stringhe UI.

**Accordion/dialog.** I pulsanti sezione non hanno `aria-expanded` iniziale né `aria-controls`. Il dialog host intrappola il focus, ma il contenuto sottostante non viene reso `inert`. Le tab dell'editor sono una `nav` con classe `active`, senza pattern `tablist/tab/tabpanel` e `aria-selected`. Lo stato host non è `aria-live`.

**IBAN.** La funzione di fit può ridurre il numero fino a 6 px (`app.js:168-180`). Conservare una sola riga è comprensibile, ma sotto una soglia leggibile è preferibile uno scroll orizzontale controllato, una dimensione minima accessibile o un layout più compatto del pulsante.

**Altri controlli:** aggiungere validazione automatica contrasto per colori personalizzati, test a zoom 200/400%, VoiceOver/TalkBack/NVDA, target touch e navigazione solo tastiera.

### MOD-01/MOD-02 — Modello e manutenibilità

**Fallback distruttivi.** `normalizeItems` sostituisce un array intenzionalmente vuoto con gli elementi di fallback (`content.js:1473-1539`); `cleanString` sostituisce stringhe vuote con default. Per alcune sezioni/campi l'host non può quindi cancellare davvero tutto. Definire la differenza tra “campo assente” e “campo presente ma vuoto”.

**Allineamento per indice.** Se un ID non coincide, diverse funzioni ripiegano sull'indice (`content.js:1628-1642`, `1762-1765` e logica successiva). Dopo riordini o corruzioni, testo di una sezione può essere associato alla sezione sbagliata. Ogni entità e ogni item traducibile dovrebbe avere un ID stabile; in caso di mismatch, segnalare conflitto invece di indovinare.

**Normalizzazione non deterministica.** Una categoria senza ID riceve un ID basato su `Date.now()` durante la normalizzazione (`content.js:1707-1721`); normalizzazioni successive possono generare identità diverse. Usare una migrazione una tantum o un hash deterministico.

**Strutture euristiche.** Wi-Fi è interpretato come le prime due stringhe con `:` e contatti/icone sono dedotti con regex. Passare a item tipizzati (`wifi`, `contact`, `access`, `payment`) riduce errori, traduzioni accidentali e codice speciale.

**Duplicazione delle sorgenti.** Default completi in `content.js`, `template.json`, seed SQL e snapshot possono divergere. Definire una sorgente canonica e generare i fallback in build. Il codice contiene inoltre supporto sardo (`sc`) e relativo asset, ma la lingua non è in `AVAILABLE_LANGUAGES`: è codice morto o una feature incompleta.

**Cicli e dimensioni.** `host.js` importa `host-events.js`/`host-rendering.js`, che reimportano `host.js` per accedere a `dom`. Il ciclo funziona solo grazie all'ordine di valutazione corrente ed è fragile, soprattutto con versioni query manuali. Estrarre `dom.js`, separare store, servizi e view, e suddividere i file oltre 1.000 righe.

### QA-01 — Copertura test insufficiente sui rischi principali

I test coprono sanitizzazione, normalizzazione e la regressione keybox, ma non coprono:

- pubblicazioni simultanee e modifica durante la traduzione;
- chiusura/riapertura con bozza sporca;
- conflitto tra due schede e optimistic locking;
- override manuali delle traduzioni;
- errori/timeout/rate limit del traduttore;
- query RLS e policy Storage su un progetto Supabase di test;
- DOM, dialog, accordion, clipboard e navigazione tastiera;
- install/update/offline del service worker;
- rendering su viewport e browser reali.

Introdurre test unitari con clock/fetch controllati per la coda di publish, test d'integrazione Supabase locale e Playwright per guest/host/PWA. Aggiungere coverage con soglie iniziali realistiche, concentrandosi prima sui flussi di salvataggio e sicurezza.

Il lint dei soli file tracciati termina con 24 warning, soprattutto import e variabili non usati. `npm run lint` può fallire localmente se nella cartella ignorata `scratch/` esistono script non validi, mentre la CI pulita resta verde. Rendere il comando deterministico limitandolo a source/test o ignorando esplicitamente `scratch/**`; valutare `--max-warnings=0` dopo la pulizia.

### OPS-02/UX-01 — Deploy, documentazione e localizzazione

- Il README dichiara GitHub Pages; il link condiviso usa Cloudflare Pages; `wrangler.toml` pubblica `dist`, mentre il workflow `Check` non esegue `npm run build`. La configurazione esterna può colmare il vuoto, ma non è documentata nel repository.
- Lo script build è una lista manuale di file copiati: aggiungere un nuovo asset e dimenticare la lista produce deploy incompleti.
- URL di condivisione, email host, ID tabella/riga e stringhe brand sono hardcoded in più file.
- Il set predefinito multilingua contiene stringhe di qualità non uniforme/miste tra alfabeti; serve revisione linguistica professionale almeno per le lingue attive.
- I messaggi di errore spesso eliminano l'errore originale, rendendo difficile distinguere autenticazione, rete, RLS e traduzione.
- `package.json` non dichiara `"type": "module"`, perciò i test Node producono warning e reparsing ESM.

**Soluzione:** documentare una sola pipeline di deploy e gli ambienti; aggiungere build/deploy verificabile in CI, configurazione per ambiente, logging strutturato senza dati sensibili e runbook per ripristino. Generare gli asset/versioni in build anziché aggiornare stringhe manualmente.

## Roadmap raccomandata

### Fase 0 — Contenimento immediato

1. Fare backup cifrato del template live e della configurazione Supabase.
2. Verificare i due snapshot pubblici, ruotare i valori operativi esposti e pianificare la pulizia della cronologia.
3. Smettere subito di inviare password/codici/contatti al traduttore.
4. Decidere se la guida debba essere pubblica o protetta per soggiorno.

### Fase 1 — Integrità editor (priorità massima applicativa)

1. Implementare store revisionato, coda singola di publish e optimistic locking remoto.
2. Aggiungere dirty state, stato sync affidabile, retry e recupero bozza.
3. Preservare gli override manuali di traduzione.
4. Aggiungere version history e rollback prima di altre migrazioni automatiche.
5. Rendere upload/cancellazione media consistenti e recuperabili.

### Fase 2 — Sicurezza e modello dati

1. Separare contenuti pubblici e sensibili.
2. Tipizzare Wi-Fi, accessi, contatti e pagamenti.
3. Rafforzare RLS/ruolo host/MFA e policy MIME.
4. Bundlare e pinning delle dipendenze; introdurre CSP/header.
5. Aggiungere schema versionato e validazione JSON lato backend.

### Fase 3 — Prestazioni, PWA e accessibilità

1. Normalizzare una sola volta e fare rendering lazy dei dettagli.
2. Rendere realmente offline gli asset necessari e automatizzare il cache manifest.
3. Rimuovere il blocco copia/selezione e completare semantica ARIA/lingua.
4. Aggiungere icone PWA raster/maskable e test su dispositivi reali.

### Fase 4 — Manutenibilità e qualità continua

1. Spezzare i moduli grandi e rimuovere dipendenze circolari/dead code.
2. Definire una sorgente canonica del template e generare i fallback.
3. Ampliare test unitari, integrazione Supabase, E2E e PWA.
4. Rendere lint/build/deploy deterministici e documentati.

## Verifiche eseguite

| Verifica | Esito |
|---|---|
| `npm run check` | Passa |
| `npm test` | 42 test passati, 0 falliti |
| `npm audit --json` | 0 vulnerabilità nei pacchetti npm installati |
| ESLint sui soli file tracciati | 0 errori, 24 warning |
| GitHub Actions sul commit `244f6d4` | `Check` e deploy Pages verdi |
| Stato branch prima del report | `main` allineato a `origin/main` |
| Confronto source/dist presente | Nessuna differenza nei file copiati correnti |

Nota: il risultato di `npm audit` non copre lo SDK Supabase caricato direttamente da CDN.

## Limiti dell'analisi

- Non sono state ispezionate le impostazioni effettive del dashboard Supabase (MFA, signup, Auth rate limit, backup/PITR, log, configurazione CORS) né quelle Cloudflare/GitHub esterne al repository.
- Non sono stati eseguiti penetration test, Lighthouse, test assistivi o test dinamici multi-browser/dispositivo.
- Non è stato modificato né interrogato il contenuto live per evitare ulteriori esposizioni o mutazioni.
- Le severità relative ai dati pubblici dipendono dalla natura reale dei contenuti e dal threat model desiderato; diventano critiche quando nel template sono presenti credenziali o codici di accesso.

## Conclusione

La UI e le difese di output sono una buona base, ma il sistema oggi tratta un documento operativo sensibile come un singolo JSON pubblico e mutable, con pubblicazione asincrona non versionata. La migliore evoluzione non è una riscrittura totale: è mettere un confine netto tra dati pubblici e riservati, rendere il publish seriale e conflitto-safe, aggiungere versioni/rollback e sostituire le euristiche con campi tipizzati. Questi interventi riducono contemporaneamente i rischi di privacy, perdita dati, regressioni di traduzione e complessità del codice.
