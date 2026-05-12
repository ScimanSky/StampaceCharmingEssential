const appContent = {
  hero: {
    kicker: "Guest app",
    title: "Stampace Charming",
    subtitle:
      "Una guida essenziale per gli ospiti, pensata per smartphone e curata nei dettagli.",
    address: "Via del Demo 12, Cagliari",
    license: "CIN: IT000000B000000000",
  },
  essentials: {
    kicker: "Accessi rapidi",
    title: "Tutto il necessario",
    items: [
      {
        icon: "⌂",
        title: "Check-in",
        description: "Indicazioni chiare per ingresso, orari e accesso all'appartamento.",
      },
      {
        icon: "◌",
        title: "Wi-Fi",
        description: "Rete e password sempre a portata di mano, senza passaggi inutili.",
      },
      {
        icon: "⌘",
        title: "Regole",
        description: "Poche regole importanti, scritte in modo semplice e leggibile.",
      },
      {
        icon: "✦",
        title: "Dintorni",
        description: "Una selezione essenziale di luoghi utili e consigli affidabili.",
      },
    ],
  },
  house: {
    kicker: "Per il soggiorno",
    title: "Informazioni della casa",
    items: [
      "Check-in dalle 15:00, check-out entro le 10:30.",
      "Silenzio e rispetto degli spazi comuni nelle ore serali.",
      "Aria condizionata e luci da spegnere quando si esce.",
      "Contatti host sempre disponibili per necessità o chiarimenti.",
    ],
  },
  area: {
    kicker: "In zona",
    title: "Punti utili nelle vicinanze",
    places: [
      {
        name: "Caffetteria consigliata",
        note: "Perfetta per colazione e pause veloci, a pochi minuti a piedi.",
      },
      {
        name: "Market di quartiere",
        note: "Comodo per acqua, frutta, snack e piccole necessità quotidiane.",
      },
      {
        name: "Fermata bus principale",
        note: "Collegamento pratico con centro, stazione e aree balneari.",
      },
    ],
  },
  host: {
    kicker: "Host",
    title: "Sempre raggiungibile",
    copy:
      "Qui inseriremo i contatti finali dell'host, in un formato semplice e ordinato. Per ora questa sezione resta in mockup.",
    links: [
      { label: "Email", value: "hello@example.com", href: "mailto:hello@example.com" },
      { label: "WhatsApp", value: "+39 340 000 0000", href: "https://wa.me/393400000000" },
      { label: "Instagram", value: "@stampacecharming", href: "https://instagram.com/" },
    ],
  },
};

function renderActions(items) {
  return items
    .map(
      (item) => `
        <article class="action-card">
          <em aria-hidden="true">${item.icon}</em>
          <div>
            <strong>${item.title}</strong>
            <span>${item.description}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderPlaces(items) {
  return items
    .map(
      (item) => `
        <article class="place-card">
          <strong>${item.name}</strong>
          <span>${item.note}</span>
        </article>
      `,
    )
    .join("");
}

function renderHostLinks(items) {
  return items
    .map(
      (item) => `
        <a class="host-link" href="${item.href}" target="_blank" rel="noreferrer">
          <strong>${item.label}</strong>
          <span>${item.value}</span>
        </a>
      `,
    )
    .join("");
}

document.querySelector("#hero-kicker").textContent = appContent.hero.kicker;
document.querySelector("#hero-title").textContent = appContent.hero.title;
document.querySelector("#hero-subtitle").textContent = appContent.hero.subtitle;
document.querySelector("#hero-address").textContent = appContent.hero.address;
document.querySelector("#hero-license").textContent = appContent.hero.license;

document.querySelector("#essentials-kicker").textContent = appContent.essentials.kicker;
document.querySelector("#essentials-title").textContent = appContent.essentials.title;
document.querySelector("#actions-grid").innerHTML = renderActions(appContent.essentials.items);

document.querySelector("#house-kicker").textContent = appContent.house.kicker;
document.querySelector("#house-title").textContent = appContent.house.title;
document.querySelector("#house-list").innerHTML = appContent.house.items.map((item) => `<li>${item}</li>`).join("");

document.querySelector("#area-kicker").textContent = appContent.area.kicker;
document.querySelector("#area-title").textContent = appContent.area.title;
document.querySelector("#place-list").innerHTML = renderPlaces(appContent.area.places);

document.querySelector("#host-kicker").textContent = appContent.host.kicker;
document.querySelector("#host-title").textContent = appContent.host.title;
document.querySelector("#host-copy").textContent = appContent.host.copy;
document.querySelector("#host-actions").innerHTML = renderHostLinks(appContent.host.links);
