export const STORAGE_KEY = "stampace_essential_template_v1";

export const defaultTemplate = {
  appName: "Stampace Charming",
  subtitle: "Luxury apartment",
  address: "Via Domenico Alberto Azuni, 2, 09124 Cagliari, Italia",
  license: "CIN: IT092009C2000R8066",
  sections: [
    {
      id: "checkin",
      icon: "shield",
      menuTitle: "Check-in & Check-out",
      sectionTitle: "Check-in & Check-out",
      lead: "Tutte le informazioni essenziali per arrivare, entrare in appartamento e lasciare la struttura in modo semplice.",
      items: [
        "Check-in: inserire qui l'orario di arrivo consentito e le eventuali istruzioni per il self check-in o per l'incontro con l'host.",
        "Prima dell'arrivo: chiedere all'ospite di comunicare l'orario indicativo di arrivo con un po' di anticipo, così da organizzare al meglio l'accoglienza.",
        "Accesso alla struttura: inserire qui il percorso corretto, eventuali riferimenti utili e dove recuperare chiavi o codici.",
        "Check-out: inserire qui l'orario entro cui lasciare l'appartamento e indicare se le chiavi devono essere lasciate in casa, in cassetta o consegnate all'host.",
        "Prima di partire: ricordare agli ospiti di spegnere luci e climatizzazione, chiudere porte e finestre e verificare di non aver dimenticato effetti personali.",
      ],
    },
    {
      id: "rules",
      icon: "spark",
      menuTitle: "Regole della casa",
      sectionTitle: "Regole della casa",
      lead: "Poche regole chiare per rendere il soggiorno semplice e piacevole.",
      items: [
        "Aggiungere qui le regole principali della struttura.",
        "Specificare se è consentito fumare o meno.",
        "Inserire eventuali indicazioni su rumore, rifiuti e uso degli spazi.",
      ],
    },
    {
      id: "wifi",
      icon: "wifi",
      menuTitle: "Wi-Fi",
      sectionTitle: "Wi-Fi",
      lead: "Rete, password e suggerimenti rapidi per connettersi.",
      items: [
        "Nome rete: da inserire",
        "Password: da inserire",
        "Se hai problemi di connessione, contatta l'host.",
      ],
    },
    {
      id: "access",
      icon: "key",
      menuTitle: "Porta e codici",
      sectionTitle: "Porta e codici",
      lead: "Codici, apertura porta e accessi utili durante il soggiorno.",
      items: [
        "Inserire il codice del portone o della cassetta chiavi.",
        "Aggiungere eventuali istruzioni per serrature smart o tastiere.",
        "Specificare cosa fare in caso di smarrimento o blocco.",
      ],
    },
    {
      id: "safe",
      icon: "safe",
      menuTitle: "Cassaforte",
      sectionTitle: "Cassaforte",
      lead: "Istruzioni semplici per uso, apertura e chiusura della cassaforte.",
      items: [
        "Inserire dove si trova la cassaforte all'interno dell'appartamento.",
        "Aggiungere qui la procedura corretta per apertura e chiusura.",
        "Specificare cosa fare in caso di blocco o difficoltà.",
      ],
    },
    {
      id: "around",
      icon: "pin",
      menuTitle: "Dintorni",
      sectionTitle: "Dintorni",
      lead: "Luoghi utili e riferimenti vicini alla struttura.",
      items: [
        "Aggiungere supermercato, farmacia e parcheggio più vicini.",
        "Inserire 2 o 3 consigli affidabili su bar o ristoranti.",
        "Aggiungere eventuali indicazioni per spiagge o mezzi pubblici.",
      ],
    },
    {
      id: "host",
      icon: "user",
      menuTitle: "Host",
      sectionTitle: "Host",
      lead: "Contatti rapidi e riferimenti utili dell'host.",
      items: [
        "Nome host: da inserire",
        "Telefono / WhatsApp: da inserire",
        "Email: da inserire",
        {
          title: "Privato",
          body: "Apri l'editor riservato all'host per modificare il template dell'app.",
          label: "Apri editor host",
          href: "./host.html",
        },
      ],
    },
  ],
};

function cleanString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeItems(items, fallbackItems) {
  if (!Array.isArray(items)) return fallbackItems;
  const next = items
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return {
          title: cleanString(item.title),
          body: cleanString(item.body),
          href: cleanString(item.href),
          label: cleanString(item.label),
        };
      }
      return "";
    })
    .filter((item) => {
      if (typeof item === "string") return Boolean(item);
      return Boolean(item.title || item.body || item.href || item.label);
    });

  return next.length ? next : fallbackItems;
}

function normalizeSection(section, baseSection) {
  return {
    id: baseSection.id,
    icon: cleanString(section?.icon, baseSection.icon),
    menuTitle: cleanString(section?.menuTitle, baseSection.menuTitle),
    sectionTitle: cleanString(section?.sectionTitle, baseSection.sectionTitle),
    lead: cleanString(section?.lead, baseSection.lead),
    items: normalizeItems(section?.items, baseSection.items),
  };
}

export function normalizeTemplate(rawTemplate = {}) {
  const rawSections = Array.isArray(rawTemplate.sections) ? rawTemplate.sections : [];

  return {
    appName: cleanString(rawTemplate.appName, defaultTemplate.appName),
    subtitle: cleanString(rawTemplate.subtitle, defaultTemplate.subtitle),
    address: cleanString(rawTemplate.address, defaultTemplate.address),
    license: cleanString(rawTemplate.license, defaultTemplate.license),
    sections: defaultTemplate.sections.map((baseSection) => {
      const matchingSection =
        rawSections.find((section) => section?.id === baseSection.id) ??
        rawSections[defaultTemplate.sections.indexOf(baseSection)] ??
        {};
      return normalizeSection(matchingSection, baseSection);
    }),
  };
}

export async function fetchTemplateFile() {
  const response = await fetch("./template.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Template file load failed: ${response.status}`);
  }
  return normalizeTemplate(await response.json());
}

export function loadLocalTemplate() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeTemplate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function loadTemplate({ preferLocal = false } = {}) {
  if (preferLocal) {
    return loadLocalTemplate() ?? normalizeTemplate(defaultTemplate);
  }

  try {
    return await fetchTemplateFile();
  } catch {
    return loadLocalTemplate() ?? normalizeTemplate(defaultTemplate);
  }
}

export function saveTemplate(template) {
  const normalized = normalizeTemplate(template);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearTemplate() {
  window.localStorage.removeItem(STORAGE_KEY);
}
