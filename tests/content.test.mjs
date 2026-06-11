import { mock, describe, it } from 'node:test';
import assert from 'node:assert';

// Mock supabase.js before importing content.js to avoid CDN network imports in Node.js
mock.module('../supabase.js', {
  namedExports: {
    fetchRemoteTemplateRow: () => Promise.resolve({ content: {} })
  }
});

const {
  normalizeTemplate,
  isImageItem,
  isMediaItem,
  isCtaItem,
  isHostPrivateItem,
  getLocaleContent,
  defaultTemplate
} = await import('../content.js');

describe('Content module', () => {
  describe('Type checking functions', () => {
    it('isImageItem should identify valid image items', () => {
      assert.strictEqual(isImageItem(null), false);
      assert.strictEqual(isImageItem({ type: 'image', src: 'img.png' }), true);
      assert.strictEqual(isImageItem({ type: 'image' }), false);
      assert.strictEqual(isImageItem({ type: 'cta', src: 'img.png' }), false);
    });

    it('isMediaItem should identify valid media items', () => {
      assert.strictEqual(isMediaItem(null), false);
      assert.strictEqual(isMediaItem({ type: 'media', src: 'video.mp4' }), true);
      assert.strictEqual(isMediaItem({ type: 'media' }), false);
    });

    it('isCtaItem should identify valid CTA items', () => {
      assert.strictEqual(isCtaItem(null), false);
      assert.strictEqual(isCtaItem({ type: 'cta', label: 'Call', href: 'tel:123' }), true);
      assert.strictEqual(isCtaItem({ type: 'cta', href: 'tel:123' }), false);
      assert.strictEqual(isCtaItem({ type: 'cta', label: 'Call' }), false);
    });

    it('isHostPrivateItem should identify host private item', () => {
      const privateItem = {
        title: 'Area Host',
        label: 'Apri Area Host',
        href: './host.html'
      };
      assert.strictEqual(isHostPrivateItem(privateItem), true);
      assert.strictEqual(isHostPrivateItem({ title: 'Area Host', href: './other.html' }), false);
    });
  });

  describe('normalizeTemplate', () => {
    it('should normalize an empty object with default template values', () => {
      const normalized = normalizeTemplate({});
      assert.strictEqual(normalized.appName, defaultTemplate.appName);
      assert.strictEqual(normalized.address, defaultTemplate.address);
      assert.ok(Array.isArray(normalized.enabledLocales));
      assert.ok(normalized.theme);
      assert.ok(normalized.footer);
    });

    it('should preserve valid custom values', () => {
      const custom = {
        appName: 'Custom App Name',
        address: 'Custom Address 123',
        enabledLocales: ['it', 'en', 'fr']
      };
      const normalized = normalizeTemplate(custom);
      assert.strictEqual(normalized.appName, 'Custom App Name');
      assert.strictEqual(normalized.address, 'Custom Address 123');
      assert.deepStrictEqual(normalized.enabledLocales, ['it', 'en', 'fr']);
    });
  });

  describe('getLocaleContent', () => {
    it('should return FIXED_LOCALE content if selected locale is disabled/invalid', () => {
      const template = {
        appName: 'Test',
        enabledLocales: ['it', 'en'], // 'fr' is not in enabledLocales
        locales: {
          it: { introLines: ['Ciao'], subtitle: 'Benvenuto', sections: [] },
          en: { introLines: ['Hello'], subtitle: 'Welcome', sections: [] },
          fr: { introLines: ['Bonjour'], subtitle: 'Bienvenue', sections: [] }
        }
      };
      // Requesting French, which is disabled. Should fall back to Italian.
      const content = getLocaleContent(template, 'fr');
      assert.deepStrictEqual(content.introLines, ['Ciao']);
    });

    it('should return requested locale content if enabled', () => {
      const template = {
        appName: 'Test',
        enabledLocales: ['it', 'en'],
        locales: {
          it: { introLines: ['Ciao'], subtitle: 'Benvenuto', sections: [] },
          en: { introLines: ['Hello'], subtitle: 'Welcome', sections: [] }
        }
      };
      const content = getLocaleContent(template, 'en');
      assert.deepStrictEqual(content.introLines, ['Hello']);
    });
  });
});
