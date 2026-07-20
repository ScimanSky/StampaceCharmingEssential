import { mock, describe, it, beforeEach } from "node:test";
import assert from "node:assert";

const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
  setTimeout,
  clearTimeout,
};

mock.module("../supabase.js", {
  namedExports: {
    deleteSectionImage: async () => {},
    deleteSectionMedia: async () => {},
    fetchRemoteTemplateRow: async () => ({ content: null, updated_at: null }),
    getHostSupabase: () => ({}),
    HOST_EMAIL: "host@example.com",
    publishRemoteTemplate: async (content) => ({ content, updated_at: null }),
    uploadSectionImage: async () => ({}),
    uploadSectionMedia: async () => ({}),
  },
});

const { cleanupOrphanedCategoriesAndDuplicates } = await import("../host-state.js");

function keyboxTemplate({ hidden, category }) {
  return {
    enabledLocales: ["it"],
    locales: {
      it: {
        subtitle: "Test",
        categories: [
          { id: "casa", menuTitle: "La Casa", placement: "homepage" },
        ],
        sections: [
          {
            id: "custom-mq6bdpmrcoj0",
            category,
            hidden,
            menuTitle: "Keybox",
            sectionTitle: "Keybox",
            items: ["Istruzioni"],
          },
        ],
      },
    },
  };
}

describe("Host template cleanup", () => {
  beforeEach(() => storage.clear());

  it("keeps an intentionally hidden keybox hidden", () => {
    const template = keyboxTemplate({ hidden: true, category: "casa" });

    const cleaned = cleanupOrphanedCategoriesAndDuplicates(template);
    const keybox = cleaned.locales.it.sections.find(
      (section) => section.id === "custom-mq6bdpmrcoj0",
    );

    assert.strictEqual(keybox.hidden, true);
    assert.strictEqual(keybox.category, "casa");
  });

  it("repairs the legacy category without changing keybox visibility", () => {
    const template = keyboxTemplate({ hidden: true, category: "top" });

    const cleaned = cleanupOrphanedCategoriesAndDuplicates(template);
    const keybox = cleaned.locales.it.sections.find(
      (section) => section.id === "custom-mq6bdpmrcoj0",
    );

    assert.strictEqual(keybox.hidden, true);
    assert.strictEqual(keybox.category, "casa");
  });
});
