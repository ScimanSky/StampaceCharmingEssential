import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  escapeHtml,
  sanitizeCssColor,
  sanitizeHref,
  sanitizeWebHref,
  normalizeCtaHref,
  normalizeCtaKind
} from '../security.js';

describe('Security module', () => {
  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      assert.strictEqual(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      assert.strictEqual(escapeHtml('foo & bar'), 'foo &amp; bar');
      assert.strictEqual(escapeHtml("john's book"), 'john&#39;s book');
    });

    it('should handle empty or null values', () => {
      assert.strictEqual(escapeHtml(null), '');
      assert.strictEqual(escapeHtml(undefined), '');
    });
  });

  describe('sanitizeCssColor', () => {
    it('should allow valid hex colors', () => {
      assert.strictEqual(sanitizeCssColor('#fff'), '#fff');
      assert.strictEqual(sanitizeCssColor('#1a2b3c'), '#1a2b3c');
    });

    it('should allow valid rgb/rgba colors', () => {
      assert.strictEqual(sanitizeCssColor('rgb(255, 255, 255)'), 'rgb(255, 255, 255)');
      assert.strictEqual(sanitizeCssColor('rgba(0,0,0,0.5)'), 'rgba(0,0,0,0.5)');
    });

    it('should allow var(--variables)', () => {
      assert.strictEqual(sanitizeCssColor('var(--my-color)'), 'var(--my-color)');
    });

    it('should allow transparent and currentcolor', () => {
      assert.strictEqual(sanitizeCssColor('transparent'), 'transparent');
      assert.strictEqual(sanitizeCssColor('currentColor'), 'currentColor');
    });

    it('should return fallback for invalid colors', () => {
      assert.strictEqual(sanitizeCssColor('invalid-color', '#000'), '#000');
      assert.strictEqual(sanitizeCssColor('javascript:alert(1)', '#000'), '#000');
    });
  });

  describe('sanitizeHref', () => {
    it('should allow safe protocols', () => {
      assert.strictEqual(sanitizeHref('https://example.com'), 'https://example.com/');
      assert.strictEqual(sanitizeHref('http://example.com'), 'http://example.com/');
      assert.strictEqual(sanitizeHref('mailto:test@example.com'), 'mailto:test@example.com');
      assert.strictEqual(sanitizeHref('tel:+123456789'), 'tel:+123456789');
    });

    it('should block unsafe protocols', () => {
      assert.strictEqual(sanitizeHref('javascript:alert(1)', { fallback: 'safe' }), 'safe');
      assert.strictEqual(sanitizeHref('data:text/html,xss', { fallback: 'safe' }), 'safe');
    });
  });

  describe('normalizeCtaHref', () => {
    it('should normalize WhatsApp numbers', () => {
      assert.strictEqual(normalizeCtaHref('whatsapp', '39 347 123 4567'), 'https://wa.me/393471234567');
      assert.strictEqual(normalizeCtaHref('whatsapp', '+3900123'), 'https://wa.me/3900123');
    });

    it('should normalize emails', () => {
      assert.strictEqual(normalizeCtaHref('email', 'test@example.com'), 'mailto:test@example.com');
      assert.strictEqual(normalizeCtaHref('email', 'mailto:test@example.com'), 'mailto:test@example.com');
      assert.strictEqual(normalizeCtaHref('email', 'invalid'), '');
      assert.strictEqual(normalizeCtaHref('gmail', 'test@example.com'), 'mailto:test@example.com');
      assert.strictEqual(normalizeCtaHref('gmail', 'mailto:test@example.com'), 'mailto:test@example.com');
    });

    it('should normalize tel links', () => {
      assert.strictEqual(normalizeCtaHref('tel', '070 123456'), 'tel:070123456');
      assert.strictEqual(normalizeCtaHref('tel', 'tel:+39123'), 'tel:+39123');
    });

    it('should normalize Telegram links and usernames', () => {
      assert.strictEqual(normalizeCtaHref('telegram', 'myhost'), 'https://t.me/myhost');
      assert.strictEqual(normalizeCtaHref('telegram', '@myhost'), 'https://t.me/myhost');
      assert.strictEqual(normalizeCtaHref('telegram', 'https://t.me/myhost'), 'https://t.me/myhost');
      assert.strictEqual(normalizeCtaHref('telegram', 'https://telegram.me/myhost'), 'https://telegram.me/myhost');
      assert.strictEqual(normalizeCtaHref('telegram', 'http://t.me/myhost'), ''); // Only https is allowed
    });
  });
});
