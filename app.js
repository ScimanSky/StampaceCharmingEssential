const appContent = {
  appName: "Stampace Charming",
  hero: {
    subtitle: "Luxury apartment",
    address: "Via Domenico Alberto Azuni, 2, 09124 Cagliari, Italia",
    license: "CIN: IT000000B0000000000",
  },
  menu: [
    {
      icon: "shield",
      title: "Check-in",
      description: "Ingresso, orari e accesso alla struttura.",
    },
    {
      icon: "wifi",
      title: "Wi-Fi",
      description: "Rete e password subito disponibili.",
    },
    {
      icon: "spark",
      title: "Regole della casa",
      description: "Poche indicazioni, chiare e leggibili.",
    },
    {
      icon: "key",
      title: "Porta e codici",
      description: "Istruzioni essenziali per l'accesso.",
    },
    {
      icon: "pin",
      title: "Dintorni",
      description: "Mappa, servizi utili e suggerimenti vicini.",
    },
    {
      icon: "user",
      title: "Host",
      description: "Contatti rapidi e informazioni utili.",
    },
  ],
};

const iconPaths = {
  shield:
    '<path d="M12 3l6 2.7v5.7c0 3.7-2.3 6.9-6 8.6-3.7-1.7-6-4.9-6-8.6V5.7L12 3z"/><path d="M9.4 11.8 11 13.4l3.7-3.8"/>',
  wifi:
    '<path d="M3.5 8.8a13.5 13.5 0 0 1 17 0"/><path d="M6.5 12.1a9.3 9.3 0 0 1 11 0"/><path d="M9.8 15.3a4.7 4.7 0 0 1 4.4 0"/><circle cx="12" cy="18.5" r="1" fill="currentColor" stroke="none"/>',
  spark:
    '<path d="M12 3.8 13.3 8 17.5 9.3 13.3 10.6 12 14.8 10.7 10.6 6.5 9.3 10.7 8 12 3.8z"/><path d="M18.2 14.5 19 16.6l2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1z"/>',
  key:
    '<circle cx="8.3" cy="14.2" r="3.2"/><path d="M11.2 14.2H20"/><path d="M16.4 14.2v-2.4"/><path d="M13.8 14.2v2.4"/>',
  pin:
    '<path d="M12 20s5-4.7 5-9a5 5 0 1 0-10 0c0 4.3 5 9 5 9z"/><circle cx="12" cy="11" r="1.8"/>',
  user:
    '<circle cx="12" cy="8.7" r="3.2"/><path d="M6.4 19.2a6.5 6.5 0 0 1 11.2 0"/>',
};

function renderIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] ?? iconPaths.spark}</svg>`;
}

function renderMenu(items) {
  return items
    .map(
      (item) => `
        <article class="menu-row is-static">
          <div class="menu-icon">${renderIcon(item.icon)}</div>
          <div class="menu-copy">
            <strong>${item.title}</strong>
          </div>
          <span class="menu-chevron" aria-hidden="true">›</span>
        </article>
      `,
    )
    .join("");
}

document.querySelector("#app-name").textContent = appContent.appName;
document.querySelector("#hero-subtitle").textContent = appContent.hero.subtitle;
document.querySelector("#footer-address").textContent = appContent.hero.address;
document.querySelector("#footer-license").textContent = appContent.hero.license;
document.querySelector("#main-menu").innerHTML = renderMenu(appContent.menu);
