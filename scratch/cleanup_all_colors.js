const fs = require('fs');

// Read the template we fetched earlier
const template = JSON.parse(fs.readFileSync('scratch/live_template.json', 'utf8'));
const content = template.content;
const locales = content.locales || {};

let cleanCount = 0;

Object.keys(locales).forEach(locale => {
  const localeData = locales[locale];
  if (!localeData) return;

  // 1. Clean categories
  if (Array.isArray(localeData.categories)) {
    localeData.categories.forEach(cat => {
      // Clean bg colors matching defaults/fallbacks
      if (cat.bgColor === "#dfc39c" || cat.bgColor === "#1f1d19" || cat.bgColor === "#17120e") {
        cat.bgColor = "";
        cleanCount++;
      }
      // Clean text colors matching defaults/fallbacks
      if (cat.textColor === "#dfc39c" || cat.textColor === "#e7d8c1") {
        cat.textColor = "";
        cleanCount++;
      }
      // Clean icon colors matching defaults/fallbacks
      if (cat.iconColor === "#dfc39c") {
        cat.iconColor = "";
        cleanCount++;
      }
    });
  }

  // 2. Clean sections and items
  if (Array.isArray(localeData.sections)) {
    localeData.sections.forEach(sec => {
      // Clean section header icon color if it matches default fallback
      if (sec.iconColor === "#dfc39c") {
        sec.iconColor = "";
        cleanCount++;
      }
      if (Array.isArray(sec.items)) {
        sec.items.forEach(item => {
          if (item && typeof item === "object") {
            if (item.type === "cta") {
              // Clean CTA bg colors
              if (item.bgColor === "#dfc39c" || item.bgColor === "#1f1d19" || item.bgColor === "#17120e") {
                item.bgColor = "";
                cleanCount++;
              }
              // Clean CTA text colors
              if (item.textColor === "#dfc39c" || item.textColor === "#e7d8c1") {
                item.textColor = "";
                cleanCount++;
              }
              // Clean CTA icon colors
              if (item.iconColor === "#dfc39c") {
                item.iconColor = "";
                cleanCount++;
              }
            } else if (item.type === "media") {
              // Clean Media item colors matching defaults
              if (item.bgColor === "#2d2319" || item.bgColor === "#dfc39c" || item.bgColor === "#1f1d19" || item.bgColor === "#17120e") {
                item.bgColor = "";
                cleanCount++;
              }
              if (item.textColor === "#e7d8c1" || item.textColor === "#dfc39c") {
                item.textColor = "";
                cleanCount++;
              }
              if (item.iconColor === "#dfc39c") {
                item.iconColor = "";
                cleanCount++;
              }
            }
          }
        });
      }
    });
  }
});

console.log(`Reset ${cleanCount} fallback color instances back to inherited defaults.`);

// Write cleaned template back
fs.writeFileSync('scratch/cleaned_live_template.json', JSON.stringify(template, null, 2));
console.log("Saved cleaned template to scratch/cleaned_live_template.json");

// Publish to Supabase
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtYnllYWdqa3dpdGJseHlqYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NDI0MjQsImV4cCI6MjA5NTIxODQyNH0.gwCJ-IhpTd-9Qy5bk1Rfp3rqq6msfKpuPRfcU6w1D2U";
const url = "https://embyeagjkwitblxyjbsr.supabase.co/rest/v1/app_templates?id=eq.live";

async function publish() {
  console.log("Publishing cleaned template to Supabase...");
  const body = {
    content: content,
    updated_at: new Date().toISOString()
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      "apikey": anonKey,
      "Authorization": `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(body)
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response text length:", text.length);
  console.log("Migration complete!");
}

publish().catch(err => {
  console.error("Publish failed:", err);
  process.exit(1);
});
