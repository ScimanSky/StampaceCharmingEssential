import { fetchRemoteTemplateRow } from "./supabase.js";

export const STORAGE_KEY = "stampace_essential_template_v1";
export const IMAGE_ITEM_TYPE = "image";
export const CTA_ITEM_TYPE = "cta";
export const FIXED_LOCALE = "it";
export const REQUIRED_LOCALES = [FIXED_LOCALE, "en"];
export const MAX_VISIBLE_LOCALES = 3;
export const MAX_OPTIONAL_LOCALES = MAX_VISIBLE_LOCALES - REQUIRED_LOCALES.length;
const FLAG_ASSET_VERSION = "20260528c";

export const AVAILABLE_LANGUAGES = [
  { code: "it", label: "Italiano", nativeLabel: "Italiano", flag: "🇮🇹", flagSrc: `./img/flags/it.svg?v=${FLAG_ASSET_VERSION}`, mandatory: true },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧", flagSrc: `./img/flags/gb.svg?v=${FLAG_ASSET_VERSION}`, mandatory: true },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷", flagSrc: `./img/flags/fr.svg?v=${FLAG_ASSET_VERSION}` },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸", flagSrc: `./img/flags/es.svg?v=${FLAG_ASSET_VERSION}` },
  { code: "de", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪", flagSrc: `./img/flags/de.svg?v=${FLAG_ASSET_VERSION}` },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🇵🇹", flagSrc: `./img/flags/pt.svg?v=${FLAG_ASSET_VERSION}` },
  { code: "pl", label: "Polish", nativeLabel: "Polski", flag: "🇵🇱", flagSrc: `./img/flags/pl.svg?v=${FLAG_ASSET_VERSION}` },
  { code: "cs", label: "Czech", nativeLabel: "Čeština", flag: "🇨🇿", flagSrc: `./img/flags/cs.svg?v=${FLAG_ASSET_VERSION}` },
  { code: "ru", label: "Russian", nativeLabel: "Русский", flag: "🇷🇺", flagSrc: `./img/flags/ru.svg?v=${FLAG_ASSET_VERSION}` },
  { code: "zh", label: "Chinese", nativeLabel: "中文", flag: "🇨🇳", flagSrc: `./img/flags/zh.svg?v=${FLAG_ASSET_VERSION}` },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳", flagSrc: `./img/flags/hi.svg?v=${FLAG_ASSET_VERSION}` },
  { code: "ja", label: "Japanese", nativeLabel: "日本語", flag: "🇯🇵", flagSrc: `./img/flags/ja.svg?v=${FLAG_ASSET_VERSION}` },
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
  sc: {
    title: "Àrea Host",
    body: "Aberi s'àrea privada pro gestire su template live de s'app.",
    label: "Aberi s'Àrea Host",
    href: "./host.html",
  },
  pl: {
    title: "Strefa hosta",
    body: "Otwórz prywatną strefę, aby zarządzać szablonem aplikacji na żywo.",
    label: "Otwórz strefę hosta",
    href: "./host.html",
  },
  cs: {
    title: "Zóna hostitele",
    body: "Otevřete soukromou zónu pro správu živé šablony aplikace.",
    label: "Otevřít zónu hostitele",
    href: "./host.html",
  },
  ru: {
    title: "Зона хоста",
    body: "Откройте приватную зону для управления живым шаблоном приложения.",
    label: "Открыть зону хоста",
    href: "./host.html",
  },
  zh: {
    title: "房东区域",
    body: "打开私密区域以管理应用的实时模板。",
    label: "打开房东区域",
    href: "./host.html",
  },
  hi: {
    title: "होस्ट क्षेत्र",
    body: "ऐप के लाइव टेम्पलेट को प्रबंधित करने के लिए निजी क्षेत्र खोलें।",
    label: "होस्ट क्षेत्र खोलें",
    href: "./host.html",
  },
  ja: {
    title: "ホストエリア",
    body: "アプリのライブテンプレートを管理するための非公開エリアを開きます。",
    label: "ホストエリアを開く",
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
        icon: "checkin",
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
        icon: "notepad",
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
        icon: "keypad",
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
        icon: "vault",
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
        icon: "binoculars",
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
        icon: "avatar",
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
        icon: "checkin",
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
        icon: "notepad",
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
        icon: "keypad",
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
        icon: "vault",
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
        icon: "binoculars",
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
        icon: "avatar",
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
        icon: "checkin",
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
        icon: "notepad",
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
        icon: "keypad",
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
        icon: "vault",
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
        icon: "binoculars",
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
        icon: "avatar",
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
        icon: "checkin",
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
        icon: "notepad",
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
        icon: "keypad",
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
        icon: "vault",
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
        icon: "binoculars",
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
        icon: "avatar",
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
        icon: "checkin",
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
        icon: "notepad",
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
        icon: "keypad",
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
        icon: "vault",
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
        icon: "binoculars",
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
        icon: "avatar",
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
        icon: "checkin",
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
        icon: "notepad",
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
        icon: "keypad",
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
        icon: "vault",
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
        icon: "binoculars",
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
        icon: "avatar",
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
  sc: {
    subtitle: "Luxury apartment",
    sections: [
      {
        id: "checkin",
        icon: "checkin",
        menuTitle: "Check-in e Check-out",
        sectionTitle: "Check-in e Check-out",
        lead: "Totas is informatziones essentziales pro arribare, intrare in appartamentu e lassare sa domu in manera simpre.",
        items: [
          "Check-in: inseri inoghe s'oràriu de arribada cunsentidu e sas istrutziones pro su self check-in o s'atòbiu cun s'host.",
          "In antis de arribare: pregai a s'òspite de comunicare cun pagu antìtzipu s'oràriu indicativu de arribada, pro organizare menzus s'acollida.",
          "Atzessu a sa domu: inseri inoghe su percursu curretu, sos riferimentos utiles e in ue recuperare craes o còdighes.",
          "Check-out: inseri inoghe s'oràriu intro su cale lassare s'appartamentu e inditare si sas craes depent abarrare in domu, in cassetta o essire cunsignadas a s'host.",
          "In antis de partire: ammenta a sos òspites de istudare sas luces e sa climatizatzione, serrare portas e ventanas e controllare de non aver ismentigadu cosas personales.",
        ],
      },
      {
        id: "rules",
        icon: "notepad",
        menuTitle: "Regulas de sa domu",
        sectionTitle: "Regulas de sa domu",
        lead: "Pagas regulas claras pro rendere su soggiornu prus simpre e agradèssiu.",
        items: [
          "Agiunghe inoghe sas regulas printzipales de sa struttura.",
          "Ispetzìfica si est cunsentidu fumar o no.",
          "Inseri eventuales indicatziones subra rumorosidade, rifiutos e impreu de is ispàtzios.",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "Rete, password e suggerimentos lestru pro si connètere.",
        items: [
          "Nòmine rete: de inserire",
          "Password: de inserire",
          "Si tenes problemas de connessione, cuntata s'host.",
        ],
      },
      {
        id: "access",
        icon: "keypad",
        menuTitle: "Porta e còdighes",
        sectionTitle: "Porta e còdighes",
        lead: "Còdighes, abertura de sa porta e atzessos utiles durante su soggiornu.",
        items: [
          "Inseri su còdighe de su portone o de sa cassetta de sas craes.",
          "Agiunghe eventuales istrutziones pro serraturas smart o tastierinos.",
          "Ispetzìfica ite faghere in casu de ismarrimentu o blocu.",
        ],
      },
      {
        id: "safe",
        icon: "vault",
        menuTitle: "Cassaforte",
        sectionTitle: "Cassaforte",
        lead: "Istrutziones simples pro impreu, abertura e serradura de sa cassaforte.",
        items: [
          "Inseri in ue si agat sa cassaforte intro s'appartamentu.",
          "Agiunghe inoghe sa procedura curreta pro abertura e serradura.",
          "Ispetzìfica ite faghere in casu de blocu o dificultade.",
        ],
      },
      {
        id: "around",
        icon: "binoculars",
        menuTitle: "In su contornu",
        sectionTitle: "In su contornu",
        lead: "Logos utiles e riferimentos acanta a sa struttura.",
        items: [
          "Agiunghe supermercadu, farmatzia e parchegiu prus bixinus.",
          "Inseri 2 o 3 cussìgios affidàbiles subra bar o ristorantes.",
          "Agiunghe eventuales indicatziones pro ispiàggias o mesus pùblicos.",
        ],
      },
      {
        id: "host",
        icon: "avatar",
        menuTitle: "Host",
        sectionTitle: "Host",
        lead: "Cuntatos lestru e riferimentos utiles de s'host.",
        items: [
          "Nòmine host: de inserire",
          "Telefone / WhatsApp: de inserire",
          "Email: de inserire",
          HOST_PRIVATE_ITEMS.sc,
        ],
      },
    ],
  },
  pl: {
    subtitle: "Luksusowy apartament",
    sections: [
      {
        id: "checkin",
        icon: "checkin",
        menuTitle: "Check-in i Check-out",
        sectionTitle: "Check-in i Check-out",
        lead: "Wszystkie najważniejsze informacje potrzebne do przyjazdu, wejścia do apartamentu i wyjazdu.",
        items: [
          "Check-in: wpisz tutaj dozwoloną godzinę przyjazdu oraz instrukcje dotyczące samodzielnego zameldowania lub spotkania z gospodarzem.",
          "Przed przyjazdem: poproś gościa o wcześniejsze podanie przybliżonej godziny przyjazdu, aby lepiej zorganizować powitanie.",
          "Dostęp do obiektu: dodaj właściwą trasę, przydatne punkty orientacyjne oraz miejsce odbioru kluczy lub kodów.",
          "Check-out: wpisz godzinę wyjazdu i wyjaśnij, czy klucze należy zostawić w apartamencie, w skrytce czy przekazać gospodarzowi.",
          "Przed wyjazdem: przypomnij gościom o wyłączeniu świateł i klimatyzacji, zamknięciu drzwi i okien oraz sprawdzeniu, czy nie zostawili rzeczy osobistych.",
        ],
      },
      {
        id: "rules",
        icon: "notepad",
        menuTitle: "Zasady domu",
        sectionTitle: "Zasady domu",
        lead: "Kilka jasnych zasad, aby pobyt był prosty i przyjemny.",
        items: [
          "Dodaj tutaj główne zasady obowiązujące w obiekcie.",
          "Określ, czy palenie jest dozwolone.",
          "Dodaj informacje dotyczące hałasu, odpadów i korzystania z przestrzeni.",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "Nazwa sieci, hasło i szybkie wskazówki dotyczące połączenia.",
        items: [
          "Nazwa sieci: wpisz tutaj",
          "Hasło: wpisz tutaj",
          "Jeśli masz problemy z połączeniem, skontaktuj się z gospodarzem.",
        ],
      },
      {
        id: "access",
        icon: "keypad",
        menuTitle: "Drzwi i kody",
        sectionTitle: "Drzwi i kody",
        lead: "Kody, otwieranie drzwi i przydatne informacje o dostępie podczas pobytu.",
        items: [
          "Wpisz kod do głównych drzwi lub skrzynki na klucze.",
          "Dodaj instrukcje dotyczące inteligentnych zamków lub klawiatur, jeśli są potrzebne.",
          "Wyjaśnij, co zrobić w przypadku zgubienia klucza lub zablokowania dostępu.",
        ],
      },
      {
        id: "safe",
        icon: "vault",
        menuTitle: "Sejf",
        sectionTitle: "Sejf",
        lead: "Proste instrukcje dotyczące używania, otwierania i zamykania sejfu.",
        items: [
          "Wskaż, gdzie w apartamencie znajduje się sejf.",
          "Dodaj tutaj prawidłową procedurę otwierania i zamykania.",
          "Wyjaśnij, co zrobić w razie zablokowania lub problemu.",
        ],
      },
      {
        id: "around",
        icon: "binoculars",
        menuTitle: "Okolica",
        sectionTitle: "Okolica",
        lead: "Przydatne miejsca i punkty orientacyjne w pobliżu obiektu.",
        items: [
          "Dodaj najbliższy supermarket, aptekę i parking.",
          "Dodaj 2 lub 3 sprawdzone rekomendacje barów lub restauracji.",
          "Dodaj wskazówki dotyczące plaż lub transportu publicznego, jeśli są potrzebne.",
        ],
      },
      {
        id: "host",
        icon: "avatar",
        menuTitle: "Host",
        sectionTitle: "Host",
        lead: "Szybkie kontakty do gospodarza i przydatne informacje.",
        items: [
          "Imię gospodarza: wpisz tutaj",
          "Telefon / WhatsApp: wpisz tutaj",
          "E-mail: wpisz tutaj",
          HOST_PRIVATE_ITEMS.pl,
        ],
      },
    ],
  },
  cs: {
    subtitle: "Luxusní apartmán",
    sections: [
      {
        id: "checkin",
        icon: "checkin",
        menuTitle: "Check-in a Check-out",
        sectionTitle: "Check-in a Check-out",
        lead: "Všechny důležité informace pro příjezd, vstup do apartmánu a odjezd.",
        items: [
          "Check-in: zde uveďte povolený čas příjezdu a případné pokyny pro samoobslužné odbavení nebo setkání s hostitelem.",
          "Před příjezdem: požádejte hosta, aby s předstihem sdělil přibližný čas příjezdu, aby bylo možné lépe zorganizovat uvítání.",
          "Přístup k ubytování: přidejte správnou trasu, užitečné orientační body a místo, kde si vyzvednout klíče nebo kódy.",
          "Check-out: uveďte čas odjezdu a vysvětlete, zda mají být klíče ponechány v apartmánu, v schránce nebo předány hostiteli.",
          "Před odjezdem: připomeňte hostům, aby vypnuli světla a klimatizaci, zavřeli dveře a okna a zkontrolovali své osobní věci.",
        ],
      },
      {
        id: "rules",
        icon: "notepad",
        menuTitle: "Pravidla domu",
        sectionTitle: "Pravidla domu",
        lead: "Několik jasných pravidel, aby byl pobyt jednoduchý a příjemný.",
        items: [
          "Sem přidejte hlavní pravidla ubytování.",
          "Uveďte, zda je kouření povoleno či nikoli.",
          "Přidejte případné pokyny týkající se hluku, odpadu a používání prostor.",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "Název sítě, heslo a rychlé tipy pro připojení.",
        items: [
          "Název sítě: doplňte zde",
          "Heslo: doplňte zde",
          "Pokud máte problémy s připojením, kontaktujte hostitele.",
        ],
      },
      {
        id: "access",
        icon: "keypad",
        menuTitle: "Dveře a kódy",
        sectionTitle: "Dveře a kódy",
        lead: "Kódy, otevírání dveří a užitečné informace o přístupu během pobytu.",
        items: [
          "Zadejte kód ke vstupním dveřím nebo ke schránce na klíče.",
          "Přidejte pokyny pro chytré zámky nebo klávesnice, pokud jsou potřeba.",
          "Vysvětlete, co dělat v případě ztráty nebo zablokování.",
        ],
      },
      {
        id: "safe",
        icon: "vault",
        menuTitle: "Trezor",
        sectionTitle: "Trezor",
        lead: "Jednoduché pokyny pro používání, otevření a zavření trezoru.",
        items: [
          "Uveďte, kde se trezor v apartmánu nachází.",
          "Sem přidejte správný postup otevření a zavření.",
          "Vysvětlete, co dělat v případě zaseknutí nebo potíží.",
        ],
      },
      {
        id: "around",
        icon: "binoculars",
        menuTitle: "V okolí",
        sectionTitle: "V okolí",
        lead: "Užitečná místa a body v blízkosti ubytování.",
        items: [
          "Přidejte nejbližší supermarket, lékárnu a parkoviště.",
          "Přidejte 2 nebo 3 spolehlivá doporučení na bary nebo restaurace.",
          "Přidejte tipy na pláže nebo veřejnou dopravu, pokud jsou potřeba.",
        ],
      },
      {
        id: "host",
        icon: "avatar",
        menuTitle: "Hostitel",
        sectionTitle: "Hostitel",
        lead: "Rychlé kontakty na hostitele a užitečné informace.",
        items: [
          "Jméno hostitele: doplňte zde",
          "Telefon / WhatsApp: doplňte zde",
          "E-mail: doplňte zde",
          HOST_PRIVATE_ITEMS.cs,
        ],
      },
    ],
  },
  ru: {
    subtitle: "Роскошные апартаменты",
    sections: [
      {
        id: "checkin",
        icon: "checkin",
        menuTitle: "Заезд и выезд",
        sectionTitle: "Заезд и выезд",
        lead: "Вся важная информация для прибытия, входа в апартаменты и выезда.",
        items: [
          "Заезд: укажите здесь допустимое время прибытия и инструкции по самостоятельному заселению или встрече с хозяином.",
          "До приезда: попросите гостя заранее сообщить примерное время прибытия, чтобы лучше организовать встречу.",
          "Доступ к жилью: добавьте правильный маршрут, полезные ориентиры и место получения ключей или кодов.",
          "Выезд: укажите время выезда и объясните, нужно ли оставить ключи в апартаментах, в ящике или передать хозяину.",
          "Перед отъездом: напомните гостям выключить свет и кондиционер, закрыть двери и окна и проверить личные вещи.",
        ],
      },
      {
        id: "rules",
        icon: "notepad",
        menuTitle: "Правила дома",
        sectionTitle: "Правила дома",
        lead: "Несколько понятных правил, чтобы проживание было простым и приятным.",
        items: [
          "Добавьте здесь основные правила проживания.",
          "Укажите, разрешено ли курение.",
          "Добавьте информацию о шуме, мусоре и пользовании помещениями.",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "Название сети, пароль и быстрые советы по подключению.",
        items: [
          "Имя сети: добавьте здесь",
          "Пароль: добавьте здесь",
          "Если у вас возникли проблемы с подключением, свяжитесь с хозяином.",
        ],
      },
      {
        id: "access",
        icon: "keypad",
        menuTitle: "Дверь и коды",
        sectionTitle: "Дверь и коды",
        lead: "Коды, открытие двери и полезная информация о доступе во время проживания.",
        items: [
          "Укажите код входной двери или ящика с ключами.",
          "Добавьте инструкции для умных замков или клавиатур, если это необходимо.",
          "Объясните, что делать в случае потери или блокировки доступа.",
        ],
      },
      {
        id: "safe",
        icon: "vault",
        menuTitle: "Сейф",
        sectionTitle: "Сейф",
        lead: "Простые инструкции по использованию, открытию и закрытию сейфа.",
        items: [
          "Укажите, где находится сейф в апартаментах.",
          "Добавьте сюда правильную процедуру открытия и закрытия.",
          "Объясните, что делать в случае блокировки или трудностей.",
        ],
      },
      {
        id: "around",
        icon: "binoculars",
        menuTitle: "Рядом",
        sectionTitle: "Рядом",
        lead: "Полезные места и ориентиры рядом с объектом.",
        items: [
          "Добавьте ближайший супермаркет, аптеку и парковку.",
          "Добавьте 2 или 3 надежные рекомендации по барам или ресторанам.",
          "Добавьте подсказки по пляжам или общественному транспорту, если нужно.",
        ],
      },
      {
        id: "host",
        icon: "avatar",
        menuTitle: "Хозяин",
        sectionTitle: "Хозяин",
        lead: "Быстрые контакты хозяина и полезная информация.",
        items: [
          "Имя хозяина: добавьте здесь",
          "Телефон / WhatsApp: добавьте здесь",
          "Электронная почта: добавьте здесь",
          HOST_PRIVATE_ITEMS.ru,
        ],
      },
    ],
  },
  zh: {
    subtitle: "豪华公寓",
    sections: [
      {
        id: "checkin",
        icon: "checkin",
        menuTitle: "入住与退房",
        sectionTitle: "入住与退房",
        lead: "关于到达、进入公寓和离开的所有重要信息。",
        items: [
          "入住：请在此填写允许的到达时间，以及自助入住或与房东见面的说明。",
          "到达前：请提前让客人告知预计到达时间，以便更好地安排接待。",
          "进入住宿：请添加正确路线、实用地标以及领取钥匙或代码的位置。",
          "退房：请填写离开时间，并说明钥匙应留在公寓内、钥匙盒中，还是交给房东。",
          "离开前：请提醒客人关闭灯光和空调，关好门窗，并检查是否遗留个人物品。",
        ],
      },
      {
        id: "rules",
        icon: "notepad",
        menuTitle: "房屋规则",
        sectionTitle: "房屋规则",
        lead: "几条清晰的规则，让住宿更简单舒适。",
        items: [
          "请在此添加住宿的主要规则。",
          "请说明是否允许吸烟。",
          "请添加有关噪音、垃圾和空间使用的说明。",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "网络名称、密码和快速连接提示。",
        items: [
          "网络名称：请填写",
          "密码：请填写",
          "如果连接有问题，请联系房东。",
        ],
      },
      {
        id: "access",
        icon: "keypad",
        menuTitle: "门禁与代码",
        sectionTitle: "门禁与代码",
        lead: "入住期间所需的代码、开门说明和有用的出入信息。",
        items: [
          "请输入大门或钥匙盒的代码。",
          "如有需要，请添加智能锁或键盘的使用说明。",
          "请说明丢失钥匙或无法进入时该怎么办。",
        ],
      },
      {
        id: "safe",
        icon: "vault",
        menuTitle: "保险箱",
        sectionTitle: "保险箱",
        lead: "关于保险箱使用、开启和关闭的简单说明。",
        items: [
          "请说明保险箱在公寓中的位置。",
          "请在此添加正确的开启和关闭步骤。",
          "请说明卡住或出现问题时该怎么办。",
        ],
      },
      {
        id: "around",
        icon: "binoculars",
        menuTitle: "周边",
        sectionTitle: "周边",
        lead: "住宿附近的实用地点和参考信息。",
        items: [
          "请添加最近的超市、药店和停车场。",
          "请添加 2 到 3 个可靠的酒吧或餐厅推荐。",
          "如有需要，请添加海滩或公共交通提示。",
        ],
      },
      {
        id: "host",
        icon: "avatar",
        menuTitle: "房东",
        sectionTitle: "房东",
        lead: "房东的快速联系方式和有用信息。",
        items: [
          "房东姓名：请填写",
          "电话 / WhatsApp：请填写",
          "电子邮箱：请填写",
          HOST_PRIVATE_ITEMS.zh,
        ],
      },
    ],
  },
  hi: {
    subtitle: "लक्ज़री अपार्टमेंट",
    sections: [
      {
        id: "checkin",
        icon: "checkin",
        menuTitle: "चेक-इन और चेक-आउट",
        sectionTitle: "चेक-इन और चेक-आउट",
        lead: "आगमन, अपार्टमेंट में प्रवेश और प्रस्थान के लिए सभी आवश्यक जानकारी।",
        items: [
          "चेक-इन: यहाँ अनुमत आगमन समय और सेल्फ चेक-इन या होस्ट से मिलने के निर्देश दर्ज करें।",
          "आगमन से पहले: अतिथि से पहले से अनुमानित आगमन समय साझा करने के लिए कहें, ताकि स्वागत बेहतर ढंग से व्यवस्थित किया जा सके।",
          "प्रवेश: सही रास्ता, उपयोगी पहचान बिंदु और चाबी या कोड प्राप्त करने का स्थान यहाँ जोड़ें।",
          "चेक-आउट: यहाँ प्रस्थान का समय लिखें और बताएं कि चाबी अपार्टमेंट में, लॉकबॉक्स में या होस्ट को देनी है।",
          "जाने से पहले: अतिथियों को लाइट और एयर कंडीशनिंग बंद करने, दरवाज़े और खिड़कियाँ बंद करने और अपनी व्यक्तिगत वस्तुएँ जाँचने की याद दिलाएँ।",
        ],
      },
      {
        id: "rules",
        icon: "notepad",
        menuTitle: "घर के नियम",
        sectionTitle: "घर के नियम",
        lead: "कुछ स्पष्ट नियम ताकि ठहरना सरल और सुखद रहे।",
        items: [
          "यहाँ आवास के मुख्य नियम जोड़ें।",
          "बताएँ कि धूम्रपान की अनुमति है या नहीं।",
          "शोर, कचरे और स्थान के उपयोग के बारे में कोई निर्देश जोड़ें।",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "नेटवर्क नाम, पासवर्ड और कनेक्शन के लिए त्वरित सुझाव।",
        items: [
          "नेटवर्क नाम: यहाँ जोड़ें",
          "पासवर्ड: यहाँ जोड़ें",
          "यदि कनेक्शन में समस्या हो तो होस्ट से संपर्क करें।",
        ],
      },
      {
        id: "access",
        icon: "keypad",
        menuTitle: "दरवाज़ा और कोड",
        sectionTitle: "दरवाज़ा और कोड",
        lead: "कोड, दरवाज़ा खोलने के निर्देश और ठहरने के दौरान उपयोगी प्रवेश जानकारी।",
        items: [
          "मुख्य दरवाज़े या की बॉक्स का कोड दर्ज करें।",
          "ज़रूरत होने पर स्मार्ट लॉक या कीपैड के निर्देश जोड़ें।",
          "खो जाने या लॉक होने की स्थिति में क्या करना है, यह समझाएँ।",
        ],
      },
      {
        id: "safe",
        icon: "vault",
        menuTitle: "तिजोरी",
        sectionTitle: "तिजोरी",
        lead: "तिजोरी के उपयोग, खोलने और बंद करने के लिए सरल निर्देश।",
        items: [
          "बताएँ कि अपार्टमेंट के अंदर तिजोरी कहाँ स्थित है।",
          "यहाँ सही खोलने और बंद करने की प्रक्रिया जोड़ें।",
          "अटकने या किसी समस्या की स्थिति में क्या करना है, यह समझाएँ।",
        ],
      },
      {
        id: "around",
        icon: "binoculars",
        menuTitle: "आस-पास",
        sectionTitle: "आस-पास",
        lead: "आवास के पास उपयोगी स्थान और संदर्भ बिंदु।",
        items: [
          "निकटतम सुपरमार्केट, फ़ार्मेसी और पार्किंग जोड़ें।",
          "2 या 3 भरोसेमंद बार या रेस्तरां सुझाव जोड़ें।",
          "ज़रूरत होने पर समुद्र तट या सार्वजनिक परिवहन के बारे में सुझाव जोड़ें।",
        ],
      },
      {
        id: "host",
        icon: "avatar",
        menuTitle: "होस्ट",
        sectionTitle: "होस्ट",
        lead: "होस्ट के त्वरित संपर्क और उपयोगी जानकारी।",
        items: [
          "होस्ट का नाम: यहाँ जोड़ें",
          "फ़ोन / WhatsApp: यहाँ जोड़ें",
          "ईमेल: यहाँ जोड़ें",
          HOST_PRIVATE_ITEMS.hi,
        ],
      },
    ],
  },
  ja: {
    subtitle: "ラグジュアリーアパートメント",
    sections: [
      {
        id: "checkin",
        icon: "checkin",
        menuTitle: "チェックインとチェックアウト",
        sectionTitle: "チェックインとチェックアウト",
        lead: "到着、入室、出発に必要なすべての基本情報です。",
        items: [
          "チェックイン：許可された到着時間と、セルフチェックインまたはホストとの待ち合わせに関する案内をここに入力してください。",
          "到着前：スムーズにお迎えできるよう、ゲストに事前におおよその到着時間を知らせてもらってください。",
          "宿泊施設へのアクセス：正しいルート、目印、鍵やコードの受け取り場所をここに追加してください。",
          "チェックアウト：退室時間と、鍵を室内・キーボックス・ホストのいずれに返却するかを記載してください。",
          "出発前：照明とエアコンを消し、ドアと窓を閉め、私物の忘れ物がないか確認するよう案内してください。",
        ],
      },
      {
        id: "rules",
        icon: "notepad",
        menuTitle: "ハウスルール",
        sectionTitle: "ハウスルール",
        lead: "滞在を快適でシンプルにするための、わかりやすいルールです。",
        items: [
          "宿泊施設の主なルールをここに追加してください。",
          "喫煙が可能かどうかを明記してください。",
          "騒音、ごみ、共有スペースの利用に関する案内を追加してください。",
        ],
      },
      {
        id: "wifi",
        icon: "wifi",
        menuTitle: "Wi‑Fi",
        sectionTitle: "Wi‑Fi",
        lead: "ネットワーク名、パスワード、接続のための簡単な案内です。",
        items: [
          "ネットワーク名：ここに入力",
          "パスワード：ここに入力",
          "接続に問題がある場合はホストに連絡してください。",
        ],
      },
      {
        id: "access",
        icon: "keypad",
        menuTitle: "ドアとコード",
        sectionTitle: "ドアとコード",
        lead: "滞在中に必要なコード、ドアの開け方、アクセス情報です。",
        items: [
          "建物の入口またはキーボックスのコードを入力してください。",
          "必要であれば、スマートロックやキーパッドの案内を追加してください。",
          "紛失やロックアウトが発生した場合の対処方法を説明してください。",
        ],
      },
      {
        id: "safe",
        icon: "vault",
        menuTitle: "金庫",
        sectionTitle: "金庫",
        lead: "金庫の使用、開閉方法に関する簡単な案内です。",
        items: [
          "アパート内で金庫がある場所を記載してください。",
          "正しい開閉手順をここに追加してください。",
          "開かない場合や問題が発生した場合の対応を説明してください。",
        ],
      },
      {
        id: "around",
        icon: "binoculars",
        menuTitle: "周辺情報",
        sectionTitle: "周辺情報",
        lead: "宿泊施設の近くにある便利な場所や参考情報です。",
        items: [
          "最寄りのスーパー、薬局、駐車場を追加してください。",
          "信頼できるバーやレストランを 2〜3 件追加してください。",
          "必要であれば、ビーチや公共交通機関の案内を追加してください。",
        ],
      },
      {
        id: "host",
        icon: "avatar",
        menuTitle: "ホスト",
        sectionTitle: "ホスト",
        lead: "ホストの連絡先と役立つ情報です。",
        items: [
          "ホスト名：ここに入力",
          "電話 / WhatsApp：ここに入力",
          "メール：ここに入力",
          HOST_PRIVATE_ITEMS.ja,
        ],
      },
    ],
  },
});

export const defaultTemplate = {
  appName: "Stampace Charming",
  address: "Via Domenico Alberto Azuni, 2, 09124 Cagliari, Italia",
  license: "CIN: IT092009C2000R8066",
  footer: {
    name: "Stampace Charming",
    subtitle: "Luxury apartment",
    lines: ["Via Domenico Alberto Azuni, 2, 09124 Cagliari, Italia", "CIN: IT092009C2000R8066"],
  },
  enabledLocales: ["it", "en", "de"],
  locales: DEFAULT_LOCALE_CONTENT,
};

const ITALIAN_TEMPLATE_BASE = DEFAULT_LOCALE_CONTENT[FIXED_LOCALE];
const SARDINIAN_TEMPLATE_BASE = DEFAULT_LOCALE_CONTENT.sc;

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
        if (item.type === CTA_ITEM_TYPE) {
          return {
            type: CTA_ITEM_TYPE,
            kind: cleanString(item.kind, "web"),
            label: cleanString(item.label),
            href: cleanString(item.href),
            icon: cleanString(item.icon),
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
      if (item.type === CTA_ITEM_TYPE) return Boolean(item.label && item.href);
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

export function isCtaItem(item) {
  return Boolean(item && typeof item === "object" && item.type === CTA_ITEM_TYPE && item.label && item.href);
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
    hidden: Boolean(section?.hidden),
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
    icon: baseSection.id.startsWith("custom-") ? cleanString(section?.icon, baseSection.icon) : baseSection.icon,
    hidden: Boolean(section?.hidden ?? baseSection.hidden),
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
  const structureSections =
    localeCode === FIXED_LOCALE && rawSections.length
      ? rawSections.map(
          (section, index) =>
            baseLocale.sections.find((baseSection) => baseSection.id === cleanString(section?.id)) ??
            buildFallbackSection(section, index),
        )
      : baseLocale.sections;

  return {
    subtitle:
      localeCode === FIXED_LOCALE
        ? cleanString(localeData?.subtitle, baseLocale.subtitle)
        : cleanString(DEFAULT_LOCALE_CONTENT[FIXED_LOCALE]?.subtitle, baseLocale.subtitle),
    sections: normalizeLocaleSections(rawSections, structureSections, localeCode),
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

      if (language.code === "sc") {
        return [
          language.code,
          {
            subtitle: italian.subtitle,
            sections: italian.sections.map((section, sectionIndex) => {
              const itBaseSection = ITALIAN_TEMPLATE_BASE.sections[sectionIndex] ?? {};
              const scBaseSection = SARDINIAN_TEMPLATE_BASE.sections[sectionIndex] ?? section;
              const pickSectionValue = (currentValue, italianBaseValue, sardinianBaseValue) =>
                currentValue !== italianBaseValue ? currentValue : sardinianBaseValue;

              const items = section.items.map((item, itemIndex) => {
                if (isImageItem(item)) return cloneItem(item);
                if (isHostPrivateItem(item)) return { ...getHostPrivateItem(language.code) };

                const itBaseItem = itBaseSection.items?.[itemIndex];
                const scBaseItem = scBaseSection.items?.[itemIndex];

                if (typeof item === "string") {
                  return item !== itBaseItem ? item : scBaseItem ?? item;
                }

                return {
                  ...cloneItem(item),
                  title: item.title !== itBaseItem?.title ? item.title : scBaseItem?.title ?? item.title,
                  body: item.body !== itBaseItem?.body ? item.body : scBaseItem?.body ?? item.body,
                  label: item.label !== itBaseItem?.label ? item.label : scBaseItem?.label ?? item.label,
                };
              });

              return {
                id: section.id,
                icon: section.icon,
                hidden: Boolean(section.hidden),
                menuTitle: pickSectionValue(section.menuTitle, itBaseSection.menuTitle, scBaseSection.menuTitle ?? section.menuTitle),
                sectionTitle: pickSectionValue(section.sectionTitle, itBaseSection.sectionTitle, scBaseSection.sectionTitle ?? section.sectionTitle),
                lead: pickSectionValue(section.lead, itBaseSection.lead, scBaseSection.lead ?? section.lead),
                items: section.id === "host" ? ensureHostPrivateItem(items, language.code) : items,
              };
            }),
          },
        ];
      }

      const localized = localeMap[language.code];
      const localizedDefaults = DEFAULT_LOCALE_CONTENT[language.code];
      const pickLocalizedValue = (value, italianValue, fallbackValue) =>
        !value || value === italianValue ? fallbackValue : value;

      return [
        language.code,
        {
          subtitle: italian.subtitle,
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
              hidden: Boolean(section.hidden),
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
  const footerSource = rawTemplate.footer && typeof rawTemplate.footer === "object" ? rawTemplate.footer : {};
  const fallbackFooter = defaultTemplate.footer;
  const resolvedAppName = cleanString(rawTemplate.appName, defaultTemplate.appName);
  const resolvedAddress = cleanString(rawTemplate.address, defaultTemplate.address);
  const resolvedLicense = cleanString(rawTemplate.license, defaultTemplate.license);
  const footerLines = Array.isArray(footerSource.lines)
    ? footerSource.lines.map((line) => cleanString(line)).filter(Boolean)
    : [cleanString(footerSource.address, resolvedAddress), cleanString(footerSource.license, resolvedLicense)].filter(Boolean);
  return {
    appName: resolvedAppName,
    address: resolvedAddress,
    license: resolvedLicense,
    footer: {
      name: cleanString(footerSource.name, resolvedAppName || fallbackFooter.name),
      subtitle: cleanString(footerSource.subtitle, fallbackFooter.subtitle),
      lines: footerLines.length ? footerLines : fallbackFooter.lines,
    },
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
