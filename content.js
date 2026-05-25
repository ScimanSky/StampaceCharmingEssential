import { fetchRemoteTemplateRow } from "./supabase.js";

export const STORAGE_KEY = "stampace_essential_template_v1";
export const IMAGE_ITEM_TYPE = "image";
export const FIXED_LOCALE = "it";
export const REQUIRED_LOCALES = [FIXED_LOCALE, "en"];
export const MAX_VISIBLE_LOCALES = 3;
export const MAX_OPTIONAL_LOCALES = MAX_VISIBLE_LOCALES - REQUIRED_LOCALES.length;

export const AVAILABLE_LANGUAGES = [
  { code: "it", label: "Italiano", nativeLabel: "Italiano", flag: "🇮🇹", flagSrc: "./img/flags/it.svg", mandatory: true },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧", flagSrc: "./img/flags/gb.svg", mandatory: true },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷", flagSrc: "./img/flags/fr.svg" },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸", flagSrc: "./img/flags/es.svg" },
  { code: "de", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪", flagSrc: "./img/flags/de.svg" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🇵🇹", flagSrc: "./img/flags/pt.svg" },
];

const LANGUAGE_INDEX = Object.fromEntries(
  AVAILABLE_LANGUAGES.map((language) => [language.code, language]),
);

export const HOST_PRIVATE_ITEMS = Object.freeze({
  it: {
    title: "Area Host",
    body: "Accedi all'area riservata per gestire il template live dell'app.",
    label: "Apri Area Host",
    href: "./host.html",
  },
  en: {
    title: "Host Area",
    body: "Open the private area to manage the live app template.",
    label: "Open Host Area",
    href: "./host.html",
  },
  fr: {
    title: "Espace Hôte",
    body: "Ouvrez l'espace privé pour gérer le template live de l'application.",
    label: "Ouvrir l'espace hôte",
    href: "./host.html",
  },
  es: {
    title: "Área Host",
    body: "Abre el área privada para gestionar la plantilla en vivo de la app.",
    label: "Abrir Área Host",
    href: "./host.html",
  },
  de: {
    title: "Host-Bereich",
    body: "Öffnen Sie den privaten Bereich, um die Live-Vorlage der App zu verwalten.",
    label: "Host-Bereich öffnen",
    href: "./host.html",
  },
  pt: {
    title: "Área do Host",
    body: "Abra a área privada para gerir o modelo ao vivo da aplicação.",
    label: "Abrir Área do Host",
    href: "./host.html",
  },
});

export const HOST_PRIVATE_ITEM = Object.freeze(HOST_PRIVATE_ITEMS[FIXED_LOCALE]);

const DEFAULT_LOCALE_CONTENT = Object.freeze({
  it: {
    subtitle: "Luxury apartment",
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
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
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
          HOST_PRIVATE_ITEMS.it,
        ],
      },
    ],
  },
  en: {
    subtitle: "Luxury apartment",
    sections: [
      {
        id: "checkin",
        icon: "shield",
        menuTitle: "Check-in & Check-out",
        sectionTitle: "Check-in & Check-out",
        lead: "All the essential information for arrival, access to the apartment and departure.",
        items: [
          "Check-in: enter the allowed arrival time and any self check-in instructions or host meeting details here.",
          "Before arrival: ask guests to share an approximate arrival time in advance so the welcome can be organised smoothly.",
          "Property access: add the correct route, useful landmarks and where to collect keys or codes.",
          "Check-out: enter the departure time and explain whether keys should be left inside, in a lockbox or handed to the host.",
          "Before leaving: remind guests to switch off lights and air conditioning, close doors and windows and check for personal belongings.",
        ],
      },
      {
        id: "rules",
        icon: "spark",
        menuTitle: "House rules",
        sectionTitle: "House rules",
        lead: "A few clear rules to keep the stay simple and pleasant.",
        items: [
          "Add the main house rules here.",
          "Specify whether smoking is allowed or not.",
          "Add any notes about noise, waste disposal and shared spaces.",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "Network name, password and quick connection tips.",
        items: [
          "Network name: add here",
          "Password: add here",
          "If you have connection problems, contact the host.",
        ],
      },
      {
        id: "access",
        icon: "key",
        menuTitle: "Door & codes",
        sectionTitle: "Door & codes",
        lead: "Door codes, opening instructions and useful access details during the stay.",
        items: [
          "Enter the main door or key box code.",
          "Add any instructions for smart locks or keypads.",
          "Explain what to do in case of loss or lockout.",
        ],
      },
      {
        id: "safe",
        icon: "safe",
        menuTitle: "Safe",
        sectionTitle: "Safe",
        lead: "Simple instructions for using, opening and closing the safe.",
        items: [
          "State where the safe is located inside the apartment.",
          "Add the correct opening and closing procedure here.",
          "Explain what to do in case of a jam or issue.",
        ],
      },
      {
        id: "around",
        icon: "pin",
        menuTitle: "Nearby",
        sectionTitle: "Nearby",
        lead: "Useful places and references close to the property.",
        items: [
          "Add the nearest supermarket, pharmacy and parking area.",
          "Include 2 or 3 reliable bar or restaurant suggestions.",
          "Add any tips for beaches or public transport.",
        ],
      },
      {
        id: "host",
        icon: "user",
        menuTitle: "Host",
        sectionTitle: "Host",
        lead: "Quick host contacts and useful references.",
        items: [
          "Host name: add here",
          "Phone / WhatsApp: add here",
          "Email: add here",
          HOST_PRIVATE_ITEMS.en,
        ],
      },
    ],
  },
  fr: {
    subtitle: "Appartement de charme",
    sections: [
      {
        id: "checkin",
        icon: "shield",
        menuTitle: "Check-in & Check-out",
        sectionTitle: "Check-in & Check-out",
        lead: "Toutes les informations essentielles pour arriver, entrer dans l'appartement et partir facilement.",
        items: [
          "Check-in : indiquez ici l'horaire d'arrivée autorisé ainsi que les éventuelles instructions d'auto check-in ou de rendez-vous avec l'hôte.",
          "Avant l'arrivée : demandez au client de communiquer une heure d'arrivée approximative à l'avance afin d'organiser l'accueil.",
          "Accès au logement : ajoutez ici l'itinéraire correct, les repères utiles et l'endroit où récupérer les clés ou les codes.",
          "Check-out : indiquez ici l'heure de départ et précisez si les clés doivent être laissées dans l'appartement, dans une boîte ou remises à l'hôte.",
          "Avant de partir : rappelez aux clients d'éteindre les lumières et la climatisation, de fermer portes et fenêtres et de vérifier qu'ils n'ont rien oublié.",
        ],
      },
      {
        id: "rules",
        icon: "spark",
        menuTitle: "Règles de la maison",
        sectionTitle: "Règles de la maison",
        lead: "Quelques règles claires pour rendre le séjour simple et agréable.",
        items: [
          "Ajoutez ici les principales règles du logement.",
          "Précisez si fumer est autorisé ou non.",
          "Ajoutez les indications éventuelles sur le bruit, les déchets et les espaces communs.",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "Nom du réseau, mot de passe et conseils rapides pour se connecter.",
        items: [
          "Nom du réseau : à compléter",
          "Mot de passe : à compléter",
          "En cas de problème de connexion, contactez l'hôte.",
        ],
      },
      {
        id: "access",
        icon: "key",
        menuTitle: "Porte et codes",
        sectionTitle: "Porte et codes",
        lead: "Codes, ouverture de la porte et informations utiles pendant le séjour.",
        items: [
          "Indiquez le code de la porte d'entrée ou de la boîte à clés.",
          "Ajoutez les éventuelles instructions pour serrure connectée ou clavier.",
          "Précisez quoi faire en cas de perte ou de blocage.",
        ],
      },
      {
        id: "safe",
        icon: "safe",
        menuTitle: "Coffre-fort",
        sectionTitle: "Coffre-fort",
        lead: "Instructions simples pour utiliser, ouvrir et fermer le coffre-fort.",
        items: [
          "Indiquez où se trouve le coffre-fort dans l'appartement.",
          "Ajoutez ici la bonne procédure d'ouverture et de fermeture.",
          "Expliquez quoi faire en cas de blocage ou de difficulté.",
        ],
      },
      {
        id: "around",
        icon: "pin",
        menuTitle: "À proximité",
        sectionTitle: "À proximité",
        lead: "Lieux utiles et repères proches du logement.",
        items: [
          "Ajoutez le supermarché, la pharmacie et le parking les plus proches.",
          "Ajoutez 2 ou 3 recommandations fiables de bars ou restaurants.",
          "Ajoutez des indications éventuelles pour les plages ou les transports publics.",
        ],
      },
      {
        id: "host",
        icon: "user",
        menuTitle: "Hôte",
        sectionTitle: "Hôte",
        lead: "Contacts rapides de l'hôte et informations utiles.",
        items: [
          "Nom de l'hôte : à compléter",
          "Téléphone / WhatsApp : à compléter",
          "Email : à compléter",
          HOST_PRIVATE_ITEMS.fr,
        ],
      },
    ],
  },
  es: {
    subtitle: "Apartamento de lujo",
    sections: [
      {
        id: "checkin",
        icon: "shield",
        menuTitle: "Check-in y Check-out",
        sectionTitle: "Check-in y Check-out",
        lead: "Toda la información esencial para llegar, entrar en el apartamento y salir de forma sencilla.",
        items: [
          "Check-in: introduce aquí la hora de llegada permitida y las instrucciones para el self check-in o el encuentro con el anfitrión.",
          "Antes de la llegada: pide al huésped que comunique una hora aproximada de llegada con antelación para organizar mejor la bienvenida.",
          "Acceso al alojamiento: añade aquí la ruta correcta, referencias útiles y dónde recoger llaves o códigos.",
          "Check-out: indica aquí la hora de salida y si las llaves deben dejarse dentro, en una caja o entregarse al anfitrión.",
          "Antes de salir: recuerda a los huéspedes apagar luces y aire acondicionado, cerrar puertas y ventanas y comprobar que no olvidan objetos personales.",
        ],
      },
      {
        id: "rules",
        icon: "spark",
        menuTitle: "Normas de la casa",
        sectionTitle: "Normas de la casa",
        lead: "Unas pocas normas claras para que la estancia sea sencilla y agradable.",
        items: [
          "Añade aquí las normas principales del alojamiento.",
          "Especifica si está permitido fumar o no.",
          "Añade indicaciones sobre ruido, residuos y uso de espacios.",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "Nombre de la red, contraseña y consejos rápidos para conectarse.",
        items: [
          "Nombre de la red: por añadir",
          "Contraseña: por añadir",
          "Si tienes problemas de conexión, contacta con el anfitrión.",
        ],
      },
      {
        id: "access",
        icon: "key",
        menuTitle: "Puerta y códigos",
        sectionTitle: "Puerta y códigos",
        lead: "Códigos, apertura de puerta e información útil durante la estancia.",
        items: [
          "Introduce el código del portal o de la caja de llaves.",
          "Añade instrucciones para cerraduras inteligentes o teclados si es necesario.",
          "Explica qué hacer en caso de pérdida o bloqueo.",
        ],
      },
      {
        id: "safe",
        icon: "safe",
        menuTitle: "Caja fuerte",
        sectionTitle: "Caja fuerte",
        lead: "Instrucciones sencillas para usar, abrir y cerrar la caja fuerte.",
        items: [
          "Indica dónde se encuentra la caja fuerte dentro del apartamento.",
          "Añade aquí el procedimiento correcto para abrirla y cerrarla.",
          "Explica qué hacer en caso de bloqueo o dificultad.",
        ],
      },
      {
        id: "around",
        icon: "pin",
        menuTitle: "Alrededores",
        sectionTitle: "Alrededores",
        lead: "Lugares útiles y referencias cercanas al alojamiento.",
        items: [
          "Añade el supermercado, la farmacia y el aparcamiento más cercanos.",
          "Incluye 2 o 3 recomendaciones fiables de bares o restaurantes.",
          "Añade indicaciones para playas o transporte público si es necesario.",
        ],
      },
      {
        id: "host",
        icon: "user",
        menuTitle: "Host",
        sectionTitle: "Host",
        lead: "Contactos rápidos del anfitrión e información útil.",
        items: [
          "Nombre del anfitrión: por añadir",
          "Teléfono / WhatsApp: por añadir",
          "Email: por añadir",
          HOST_PRIVATE_ITEMS.es,
        ],
      },
    ],
  },
  de: {
    subtitle: "Luxus-Apartment",
    sections: [
      {
        id: "checkin",
        icon: "shield",
        menuTitle: "Check-in & Check-out",
        sectionTitle: "Check-in & Check-out",
        lead: "Alle wichtigen Informationen für Anreise, Zugang zur Wohnung und Abreise.",
        items: [
          "Check-in: Tragen Sie hier die erlaubte Ankunftszeit und eventuelle Self-Check-in-Anweisungen oder Treffpunkte mit dem Gastgeber ein.",
          "Vor der Anreise: Bitten Sie den Gast, die ungefähre Ankunftszeit rechtzeitig mitzuteilen, damit der Empfang gut organisiert werden kann.",
          "Zugang zur Unterkunft: Fügen Sie hier den richtigen Weg, nützliche Hinweise und den Ort für Schlüssel oder Codes ein.",
          "Check-out: Geben Sie hier die Abreisezeit an und ob die Schlüssel in der Wohnung, in einer Box oder beim Gastgeber hinterlegt werden sollen.",
          "Vor der Abreise: Erinnern Sie die Gäste daran, Licht und Klimaanlage auszuschalten, Türen und Fenster zu schließen und persönliche Gegenstände zu prüfen.",
        ],
      },
      {
        id: "rules",
        icon: "spark",
        menuTitle: "Hausregeln",
        sectionTitle: "Hausregeln",
        lead: "Einige klare Regeln, damit der Aufenthalt angenehm und unkompliziert bleibt.",
        items: [
          "Fügen Sie hier die wichtigsten Hausregeln ein.",
          "Geben Sie an, ob Rauchen erlaubt ist oder nicht.",
          "Ergänzen Sie Hinweise zu Lärm, Müll und Nutzung der Räume.",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "WLAN",
        sectionTitle: "WLAN",
        lead: "Netzwerkname, Passwort und kurze Hinweise zur Verbindung.",
        items: [
          "Netzwerkname: hier eintragen",
          "Passwort: hier eintragen",
          "Bei Verbindungsproblemen wenden Sie sich bitte an den Gastgeber.",
        ],
      },
      {
        id: "access",
        icon: "key",
        menuTitle: "Tür & Codes",
        sectionTitle: "Tür & Codes",
        lead: "Codes, Türöffnung und nützliche Zugangsinformationen während des Aufenthalts.",
        items: [
          "Tragen Sie den Code für Haustür oder Schlüsselkasten ein.",
          "Fügen Sie ggf. Hinweise für smarte Schlösser oder Tastaturen hinzu.",
          "Erklären Sie, was bei Verlust oder Sperrung zu tun ist.",
        ],
      },
      {
        id: "safe",
        icon: "safe",
        menuTitle: "Safe",
        sectionTitle: "Safe",
        lead: "Einfache Anweisungen zur Nutzung sowie zum Öffnen und Schließen des Safes.",
        items: [
          "Geben Sie an, wo sich der Safe in der Wohnung befindet.",
          "Fügen Sie hier die richtige Öffnungs- und Schließprozedur ein.",
          "Erklären Sie, was bei einer Blockierung oder Schwierigkeit zu tun ist.",
        ],
      },
      {
        id: "around",
        icon: "pin",
        menuTitle: "In der Nähe",
        sectionTitle: "In der Nähe",
        lead: "Nützliche Orte und Bezugspunkte in der Umgebung der Unterkunft.",
        items: [
          "Fügen Sie den nächstgelegenen Supermarkt, die Apotheke und Parkmöglichkeiten hinzu.",
          "Ergänzen Sie 2 oder 3 verlässliche Tipps für Bars oder Restaurants.",
          "Fügen Sie bei Bedarf Hinweise zu Stränden oder öffentlichen Verkehrsmitteln hinzu.",
        ],
      },
      {
        id: "host",
        icon: "user",
        menuTitle: "Gastgeber",
        sectionTitle: "Gastgeber",
        lead: "Schnelle Gastgeberkontakte und nützliche Informationen.",
        items: [
          "Name des Gastgebers: hier eintragen",
          "Telefon / WhatsApp: hier eintragen",
          "E-Mail: hier eintragen",
          HOST_PRIVATE_ITEMS.de,
        ],
      },
    ],
  },
  pt: {
    subtitle: "Apartamento de luxo",
    sections: [
      {
        id: "checkin",
        icon: "shield",
        menuTitle: "Check-in & Check-out",
        sectionTitle: "Check-in & Check-out",
        lead: "Todas as informações essenciais para chegar, entrar no apartamento e sair sem complicações.",
        items: [
          "Check-in: insira aqui o horário permitido de chegada e eventuais instruções de self check-in ou de encontro com o anfitrião.",
          "Antes da chegada: peça ao hóspede para comunicar uma hora aproximada de chegada com alguma antecedência, para organizar melhor a receção.",
          "Acesso ao alojamento: adicione aqui o percurso correto, referências úteis e onde recolher chaves ou códigos.",
          "Check-out: indique aqui a hora de saída e se as chaves devem ficar no apartamento, numa caixa ou ser entregues ao anfitrião.",
          "Antes de sair: lembre os hóspedes de desligar luzes e ar condicionado, fechar portas e janelas e verificar se não esqueceram objetos pessoais.",
        ],
      },
      {
        id: "rules",
        icon: "spark",
        menuTitle: "Regras da casa",
        sectionTitle: "Regras da casa",
        lead: "Algumas regras claras para tornar a estadia simples e agradável.",
        items: [
          "Adicione aqui as principais regras do alojamento.",
          "Especifique se é permitido fumar ou não.",
          "Inclua eventuais indicações sobre ruído, lixo e uso dos espaços.",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "Nome da rede, palavra-passe e dicas rápidas para ligação.",
        items: [
          "Nome da rede: inserir aqui",
          "Palavra-passe: inserir aqui",
          "Se tiver problemas de ligação, contacte o anfitrião.",
        ],
      },
      {
        id: "access",
        icon: "key",
        menuTitle: "Porta e códigos",
        sectionTitle: "Porta e códigos",
        lead: "Códigos, abertura da porta e acessos úteis durante a estadia.",
        items: [
          "Insira o código do portão ou da caixa de chaves.",
          "Adicione eventuais instruções para fechaduras inteligentes ou teclados.",
          "Especifique o que fazer em caso de perda ou bloqueio.",
        ],
      },
      {
        id: "safe",
        icon: "safe",
        menuTitle: "Cofre",
        sectionTitle: "Cofre",
        lead: "Instruções simples para usar, abrir e fechar o cofre.",
        items: [
          "Indique onde se encontra o cofre dentro do apartamento.",
          "Adicione aqui o procedimento correto para abertura e fecho.",
          "Explique o que fazer em caso de bloqueio ou dificuldade.",
        ],
      },
      {
        id: "around",
        icon: "pin",
        menuTitle: "Arredores",
        sectionTitle: "Arredores",
        lead: "Locais úteis e referências próximas do alojamento.",
        items: [
          "Adicione o supermercado, a farmácia e o estacionamento mais próximos.",
          "Inclua 2 ou 3 sugestões fiáveis de bares ou restaurantes.",
          "Adicione eventuais indicações para praias ou transportes públicos.",
        ],
      },
      {
        id: "host",
        icon: "user",
        menuTitle: "Anfitrião",
        sectionTitle: "Anfitrião",
        lead: "Contactos rápidos do anfitrião e referências úteis.",
        items: [
          "Nome do anfitrião: inserir aqui",
          "Telefone / WhatsApp: inserir aqui",
          "Email: inserir aqui",
          HOST_PRIVATE_ITEMS.pt,
        ],
      },
    ],
  },
});

export const defaultTemplate = {
  appName: "Stampace Charming",
  address: "Via Domenico Alberto Azuni, 2, 09124 Cagliari, Italia",
  license: "CIN: IT092009C2000R8066",
  enabledLocales: ["it", "en", "de"],
  locales: DEFAULT_LOCALE_CONTENT,
};

function cleanString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function cleanLocaleCode(value) {
  return cleanString(value).toLowerCase();
}

export function getLanguageConfig(code) {
  return LANGUAGE_INDEX[cleanLocaleCode(code)] ?? LANGUAGE_INDEX[FIXED_LOCALE];
}

export function getHostPrivateItem(localeCode = FIXED_LOCALE) {
  return HOST_PRIVATE_ITEMS[cleanLocaleCode(localeCode)] ?? HOST_PRIVATE_ITEMS[FIXED_LOCALE];
}

function itemsAreEquivalent(left = [], right = []) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeEnabledLocales(values) {
  const requested = Array.isArray(values)
    ? values
        .map(cleanLocaleCode)
        .filter((code) => code && !REQUIRED_LOCALES.includes(code))
    : [];
  const unique = [...new Set(requested)].filter((code) => LANGUAGE_INDEX[code] && !REQUIRED_LOCALES.includes(code));
  return [...REQUIRED_LOCALES, ...unique.slice(0, MAX_OPTIONAL_LOCALES)];
}

function normalizeItems(items, fallbackItems) {
  if (!Array.isArray(items)) return fallbackItems;
  const next = items
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        if (item.type === IMAGE_ITEM_TYPE || item.src) {
          return {
            type: IMAGE_ITEM_TYPE,
            src: cleanString(item.src),
            path: cleanString(item.path),
            alt: cleanString(item.alt),
            caption: cleanString(item.caption),
          };
        }
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
      if (item.type === IMAGE_ITEM_TYPE) return Boolean(item.src);
      return Boolean(item.title || item.body || item.href || item.label);
    });

  return next.length ? next : fallbackItems;
}

export function isHostPrivateItem(item) {
  if (!item || typeof item !== "object") return false;
  const href = cleanString(item.href);
  const title = cleanString(item.title);
  const label = cleanString(item.label);
  const knownItems = Object.values(HOST_PRIVATE_ITEMS);
  return href === HOST_PRIVATE_ITEM.href && knownItems.some((known) => known.title === title || known.label === label);
}

export function isImageItem(item) {
  return Boolean(item && typeof item === "object" && item.type === IMAGE_ITEM_TYPE && item.src);
}

function ensureHostPrivateItem(items, localeCode) {
  const editableItems = items.filter((item) => !isHostPrivateItem(item));
  return [...editableItems, { ...getHostPrivateItem(localeCode) }];
}

function buildFallbackSection(section = {}, index = 0) {
  const fallbackTitle = cleanString(section?.menuTitle, `Nuovo pulsante ${index + 1}`);
  return {
    id: cleanString(section?.id, `custom-${index + 1}`),
    icon: cleanString(section?.icon, "spark"),
    menuTitle: fallbackTitle,
    sectionTitle: cleanString(section?.sectionTitle, fallbackTitle),
    lead: cleanString(section?.lead, ""),
    items: [],
  };
}

function normalizeSection(section, baseSection, localeCode) {
  const normalizedItems = normalizeItems(section?.items, baseSection.items);
  return {
    id: baseSection.id,
    icon: cleanString(section?.icon, baseSection.icon),
    menuTitle: cleanString(section?.menuTitle, baseSection.menuTitle),
    sectionTitle: cleanString(section?.sectionTitle, baseSection.sectionTitle),
    lead: cleanString(section?.lead, baseSection.lead),
    items: baseSection.id === "host" ? ensureHostPrivateItem(normalizedItems, localeCode) : normalizedItems,
  };
}

function normalizeLocaleSections(rawSections, baseSections, localeCode) {
  const normalizedBaseSections = baseSections.map((baseSection, index) => {
    const matchingSection = rawSections.find((section) => section?.id === baseSection.id) ?? rawSections[index] ?? {};
    return normalizeSection(matchingSection, baseSection, localeCode);
  });

  const knownIds = new Set(baseSections.map((section) => section.id));
  const extraSections = rawSections
    .filter((section) => {
      const id = cleanString(section?.id);
      return id && !knownIds.has(id);
    })
    .map((section, index) => normalizeSection(section, buildFallbackSection(section, index), localeCode));

  return [...normalizedBaseSections, ...extraSections];
}

function normalizeLocaleContent(localeData, baseLocale, localeCode) {
  const rawSections = Array.isArray(localeData?.sections) ? localeData.sections : [];
  return {
    subtitle: cleanString(localeData?.subtitle, baseLocale.subtitle),
    sections: normalizeLocaleSections(rawSections, baseLocale.sections, localeCode),
  };
}

function cloneItem(item) {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") return JSON.parse(JSON.stringify(item));
  return item;
}

function mirrorItalianContent(localeMap) {
  const italian = localeMap[FIXED_LOCALE];
  if (!italian) return localeMap;

  return Object.fromEntries(
    AVAILABLE_LANGUAGES.map((language) => {
      if (language.code === FIXED_LOCALE) {
        return [language.code, italian];
      }

      const localized = localeMap[language.code];
      const localizedDefaults = DEFAULT_LOCALE_CONTENT[language.code];
      const pickLocalizedValue = (value, italianValue, fallbackValue) =>
        !value || value === italianValue ? fallbackValue : value;

      return [
        language.code,
        {
          subtitle: pickLocalizedValue(localized?.subtitle, italian.subtitle, localizedDefaults.subtitle),
          sections: italian.sections.map((section, index) => {
            const localizedSection = localized?.sections?.[index];
            const localizedDefaultSection = localizedDefaults.sections[index] ?? section;
            const localizedItems = Array.isArray(localizedSection?.items) ? localizedSection.items : [];
            const fallbackItems = Array.isArray(localizedDefaultSection?.items)
              ? localizedDefaultSection.items
              : section.items;
            const resolvedItems = localizedItems.length
              ? itemsAreEquivalent(localizedItems, section.items)
                ? fallbackItems.map(cloneItem)
                : localizedItems.map(cloneItem)
              : fallbackItems.map(cloneItem);
            return {
              id: section.id,
              icon: section.icon,
              menuTitle: pickLocalizedValue(localizedSection?.menuTitle, section.menuTitle, localizedDefaultSection.menuTitle),
              sectionTitle: pickLocalizedValue(localizedSection?.sectionTitle, section.sectionTitle, localizedDefaultSection.sectionTitle),
              lead: pickLocalizedValue(localizedSection?.lead, section.lead, localizedDefaultSection.lead),
              items:
                section.id === "host"
                  ? ensureHostPrivateItem(resolvedItems, language.code)
                  : resolvedItems,
            };
          }),
        },
      ];
    }),
  );
}

function buildLocaleMap(rawTemplate = {}) {
  const rawLocales = rawTemplate.locales && typeof rawTemplate.locales === "object" ? rawTemplate.locales : {};
  const legacyItLocale = {
    subtitle: rawTemplate.subtitle,
    sections: rawTemplate.sections,
  };

  const localeMap = Object.fromEntries(
    AVAILABLE_LANGUAGES.map((language) => {
      const baseLocale = DEFAULT_LOCALE_CONTENT[language.code];
      const rawLocale =
        rawLocales[language.code] ??
        (language.code === FIXED_LOCALE ? legacyItLocale : {});
      return [language.code, normalizeLocaleContent(rawLocale, baseLocale, language.code)];
    }),
  );

  return mirrorItalianContent(localeMap);
}

export function normalizeTemplate(rawTemplate = {}) {
  return {
    appName: cleanString(rawTemplate.appName, defaultTemplate.appName),
    address: cleanString(rawTemplate.address, defaultTemplate.address),
    license: cleanString(rawTemplate.license, defaultTemplate.license),
    enabledLocales: normalizeEnabledLocales(rawTemplate.enabledLocales ?? rawTemplate.visibleLocales ?? defaultTemplate.enabledLocales),
    locales: buildLocaleMap(rawTemplate),
  };
}

export function getLocaleContent(template, localeCode) {
  const normalized = normalizeTemplate(template);
  const code = normalized.enabledLocales.includes(localeCode) ? localeCode : FIXED_LOCALE;
  return normalized.locales[code] ?? normalized.locales[FIXED_LOCALE];
}

export function getVisibleLocales(template) {
  return normalizeTemplate(template).enabledLocales.map((code) => getLanguageConfig(code));
}

export async function fetchTemplateFile() {
  const response = await fetch("./template.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Template file load failed: ${response.status}`);
  }
  return normalizeTemplate(await response.json());
}

export async function fetchRemoteTemplateEnvelope() {
  const row = await fetchRemoteTemplateRow();
  return {
    updatedAt: row.updated_at,
    template: normalizeTemplate(row.content),
  };
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
    const remote = await fetchRemoteTemplateEnvelope();
    return remote.template;
  } catch {
    try {
      return await fetchTemplateFile();
    } catch {
      return loadLocalTemplate() ?? normalizeTemplate(defaultTemplate);
    }
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
