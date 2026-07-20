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
    TEMPLATE_ROW_ID: "live",
    TEMPLATE_TABLE: "app_templates",
    uploadSectionImage: async () => ({}),
    uploadSectionMedia: async () => ({}),
  },
});

const {
  cleanupOrphanedCategoriesAndDuplicates,
  createSingleFlightPublishQueue,
  publishRemoteTemplateIfCurrent,
  TEMPLATE_CONFLICT_CODE,
} = await import("../host-state.js");

function createTemplateUpdateClient(result) {
  const calls = {
    table: null,
    update: null,
    filters: [],
    select: null,
  };
  const query = {
    update(value) {
      calls.update = value;
      return this;
    },
    eq(field, value) {
      calls.filters.push([field, value]);
      return this;
    },
    select(columns) {
      calls.select = columns;
      return this;
    },
    async maybeSingle() {
      return result;
    },
  };

  return {
    calls,
    client: {
      from(table) {
        calls.table = table;
        return query;
      },
    },
  };
}

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

describe("Host cross-device publish protection", () => {
  it("updates only the remote version originally loaded by the editor", async () => {
    const expectedUpdatedAt = "2026-07-20T10:00:00.000Z";
    const publishedRow = {
      content: { appName: "Versione locale" },
      updated_at: "2026-07-20T10:05:00.000Z",
    };
    const { client, calls } = createTemplateUpdateClient({
      data: publishedRow,
      error: null,
    });

    const result = await publishRemoteTemplateIfCurrent(
      publishedRow.content,
      expectedUpdatedAt,
      client,
    );

    assert.deepStrictEqual(result, publishedRow);
    assert.strictEqual(calls.table, "app_templates");
    assert.deepStrictEqual(calls.filters, [
      ["id", "live"],
      ["updated_at", expectedUpdatedAt],
    ]);
    assert.deepStrictEqual(calls.update.content, publishedRow.content);
    assert.strictEqual(calls.select, "content, updated_at");
  });

  it("reports a conflict instead of overwriting a newer remote version", async () => {
    const { client } = createTemplateUpdateClient({ data: null, error: null });

    await assert.rejects(
      publishRemoteTemplateIfCurrent(
        { appName: "Versione locale" },
        "2026-07-20T10:00:00.000Z",
        client,
      ),
      (error) => error.code === TEMPLATE_CONFLICT_CODE,
    );
  });
});
