/* Small DOM helpers shared by the components. Loaded first on the page. */
(function (FeedCatalogue) {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  /** Makes text safe to put inside HTML markup or an attribute (always use it for data). */
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

  /** Only a colour like #1f9a35 gets into a style attribute. */
  const safeColor = (value) => (/^#[0-9a-f]{3,8}$/i.test(String(value)) ? value : 'transparent');

  /**
   * An icon from the sprite in index.html, e.g. icon('search', { size: 16, stroke: 2.4 }).
   * Icons are decorative (aria-hidden); give the control around them an accessible name.
   */
  function icon(name, { size = 18, stroke, className = '' } = {}) {
    const classes = ['icon', className].filter(Boolean).join(' ');
    const style = stroke ? ` style="--sw: ${Number(stroke)}"` : '';
    return (
      `<svg class="${classes}" width="${size}" height="${size}"${style} aria-hidden="true" focusable="false">` +
      `<use href="#i-${escapeHtml(name)}"></use></svg>`
    );
  }

  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /**
   * Escaped text with every search word wrapped in <mark>.
   * `query` is what FeedCatalogue.search.parseQuery() returns: { words } or { hsn } or null.
   */
  function highlight(text, query) {
    const safe = (part) => escapeHtml(part);
    if (!query) return safe(text);
    const words = (query.words || [query.hsn]).filter((word) => word && word.length >= 2);
    if (!words.length) return safe(text);
    const pattern = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'ig');
    return String(text)
      .split(pattern)
      .map((part, i) => (i % 2 ? `<mark>${safe(part)}</mark>` : safe(part)))
      .join('');
  }

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Runs fn at most once per `wait` ms after the last call (for typing in a search box). */
  function debounce(fn, wait) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  /** localStorage / sessionStorage that never throws (private mode, blocked storage). */
  const storage = {
    get(key, area = window.localStorage) {
      try {
        return area.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value, area = window.localStorage) {
      try {
        area.setItem(key, value);
      } catch {
        // Storage blocked: the page still works for this visit
      }
    },
  };

  FeedCatalogue.utils = Object.assign(FeedCatalogue.utils || {}, {
    $,
    $$,
    escapeHtml,
    safeColor,
    icon,
    highlight,
    prefersReducedMotion,
    debounce,
    storage,
  });
})((window.FeedCatalogue = window.FeedCatalogue || {}));
