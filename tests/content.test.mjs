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
  defaultTemplate,
  defaultCategoryForSection
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
      assert.strictEqual(isCtaItem({ type: 'cta', href: 'tel:123' }), true);
      assert.strictEqual(isCtaItem({ type: 'cta', label: 'Call' }), true);
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

    it('should preserve custom styling fields on media items', () => {
      const template = {
        enabledLocales: ['it'],
        locales: {
          it: {
            sections: [
              {
                id: 'sec-doc',
                items: [
                  {
                    type: 'media',
                    mediaKind: 'document',
                    src: 'doc.pdf',
                    icon: 'book',
                    iconColor: '#ff0000',
                    bgColor: '#00ff00',
                    textColor: '#0000ff',
                    fontFamily: 'Roboto'
                  }
                ]
              }
            ]
          }
        }
      };
      const normalized = normalizeTemplate(template);
      const mediaItem = normalized.locales.it.sections[0].items[0];
      assert.strictEqual(mediaItem.icon, 'book');
      assert.strictEqual(mediaItem.iconColor, '#ff0000');
      assert.strictEqual(mediaItem.bgColor, '#00ff00');
      assert.strictEqual(mediaItem.textColor, '#0000ff');
      assert.strictEqual(mediaItem.fontFamily, 'Roboto');
    });



    it('should preserve placement for custom categories and default to homepage', () => {
      const custom = {
        locales: {
          it: {
            categories: [
              { id: 'casa', menuTitle: 'La Casa', placement: 'homepage' },
              { id: 'custom-cat-1', menuTitle: 'Custom Cat 1', placement: 'host' },
              { id: 'custom-cat-2', menuTitle: 'Custom Cat 2' } // Defaults to homepage
            ]
          }
        }
      };
      const normalized = normalizeTemplate(custom);
      const itCategories = normalized.locales.it.categories;
      
      const custom1 = itCategories.find(cat => cat.id === 'custom-cat-1');
      assert.ok(custom1);
      assert.strictEqual(custom1.placement, 'host');

      const custom2 = itCategories.find(cat => cat.id === 'custom-cat-2');
      assert.ok(custom2);
      assert.strictEqual(custom2.placement, 'homepage');
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

  describe('defaultCategoryForSection', () => {
    it('should assign host to top', () => {
      assert.strictEqual(defaultCategoryForSection('host'), 'top');
    });

    it('should assign standard house sections to casa', () => {
      assert.strictEqual(defaultCategoryForSection('wifi'), 'casa');
      assert.strictEqual(defaultCategoryForSection('rules'), 'casa');
      assert.strictEqual(defaultCategoryForSection('checkin'), 'casa');
    });

    it('should assign keybox and contatore luce to casa based on ID or menuTitle', () => {
      // By ID (lowercase, substring match)
      assert.strictEqual(defaultCategoryForSection('custom-keybox'), 'casa');
      assert.strictEqual(defaultCategoryForSection('custom-contatore'), 'casa');
      
      // By menuTitle
      assert.strictEqual(defaultCategoryForSection('custom-123', 'Keybox'), 'casa');
      assert.strictEqual(defaultCategoryForSection('custom-123', 'Contatore Luce'), 'casa');
      assert.strictEqual(defaultCategoryForSection('custom-123', 'contatore luce'), 'casa');
    });

    it('should assign other sections to citta', () => {
      assert.strictEqual(defaultCategoryForSection('around'), 'citta');
      assert.strictEqual(defaultCategoryForSection('custom-123', 'Dintorni'), 'citta');
      assert.strictEqual(defaultCategoryForSection('custom-456', 'My Custom Section'), 'citta');
    });
  });

  describe('custom category translation and section title sync', () => {
    it('should preserve manual custom category translations in non-Italian locales', () => {
      const template = {
        enabledLocales: ['it', 'en'],
        locales: {
          it: {
            categories: [
              { id: 'cat-custom-1', menuTitle: 'Contatti', placement: 'host' }
            ],
            sections: [
              { id: 'section-cat-custom-1', category: 'cat-custom-1', menuTitle: 'Contatti', sectionTitle: 'Contatti', items: [] }
            ]
          },
          en: {
            categories: [
              { id: 'cat-custom-1', menuTitle: 'Contacts' }
            ],
            sections: [
              { id: 'section-cat-custom-1', category: 'cat-custom-1', menuTitle: 'Contacts', sectionTitle: 'Contacts', items: [] }
            ]
          }
        }
      };

      const normalized = normalizeTemplate(template);
      const enCat = normalized.locales.en.categories.find(c => c.id === 'cat-custom-1');
      assert.ok(enCat);
      assert.strictEqual(enCat.menuTitle, 'Contacts');

      const enSection = normalized.locales.en.sections.find(s => s.id === 'section-cat-custom-1');
      assert.ok(enSection);
      assert.strictEqual(enSection.menuTitle, 'Contacts');
      assert.strictEqual(enSection.sectionTitle, 'Contacts');
    });

    it('should synchronize auto-generated category section titles even if they were not manually translated', () => {
      const template = {
        enabledLocales: ['it', 'en'],
        locales: {
          it: {
            categories: [
              { id: 'cat-custom-2', menuTitle: 'Contatti', placement: 'host' }
            ],
            sections: [
              { id: 'section-cat-custom-2', category: 'cat-custom-2', menuTitle: 'Contatti', sectionTitle: 'Contatti', items: [] }
            ]
          },
          en: {
            categories: [], // No manual category translation provided
            sections: []    // No manual section translation provided
          }
        }
      };

      const normalized = normalizeTemplate(template);
      const enCat = normalized.locales.en.categories.find(c => c.id === 'cat-custom-2');
      assert.ok(enCat);
      // fallback translation for Contatti key in SUBMENU_TRANSLATIONS should be 'Contacts'
      assert.strictEqual(enCat.menuTitle, 'Contacts');

      const enSection = normalized.locales.en.sections.find(s => s.id === 'section-cat-custom-2');
      assert.ok(enSection);
      assert.strictEqual(enSection.menuTitle, 'Contacts');
      assert.strictEqual(enSection.sectionTitle, 'Contacts');
    });
  });
});
