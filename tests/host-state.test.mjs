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

const {
  cleanupOrphanedCategoriesAndDuplicates,
  createSingleFlightPublishQueue,
} = await import("../host-state.js");

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

describe("Host publish queue", () => {
  it("never runs publishes in parallel and coalesces pending requests", async () => {
    let releaseFirstPublish;
    const firstPublishGate = new Promise((resolve) => {
      releaseFirstPublish = resolve;
    });
    let startedPublishes = 0;
    let activePublishes = 0;
    let maxActivePublishes = 0;

    const queue = createSingleFlightPublishQueue(async () => {
      startedPublishes += 1;
      activePublishes += 1;
      maxActivePublishes = Math.max(maxActivePublishes, activePublishes);
      if (startedPublishes === 1) {
        await firstPublishGate;
      }
      activePublishes -= 1;
    });

    const completed = queue.request();
    queue.request();
    queue.request();

    assert.strictEqual(startedPublishes, 1);
    assert.strictEqual(queue.isActive(), true);

    releaseFirstPublish();
    await completed;

    assert.strictEqual(startedPublishes, 2);
    assert.strictEqual(maxActivePublishes, 1);
    assert.strictEqual(queue.isActive(), false);
  });

  it("accepts a new publish after a failed one", async () => {
    let attempts = 0;
    const queue = createSingleFlightPublishQueue(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary failure");
    });

    await assert.rejects(queue.request(), /temporary failure/);
    await queue.request();

    assert.strictEqual(attempts, 2);
    assert.strictEqual(queue.isActive(), false);
  });
});
