/*
  Product families ticked for Compare (up to 6), kept in this browser (localStorage "feedCmp",
  the same key as the FEED Export Catalogue Explorer) so the selection survives a reload.

  Every Compare tick on the page is <input type="checkbox" data-compare-n="12">: one listener
  here toggles it, and after each change all of them are brought in step (ticked, or disabled
  once Compare is full). Components that show the selection subscribe().
*/
(function (FeedCatalogue) {
  'use strict';

  const { utils, data, catalogue } = FeedCatalogue;
  const STORAGE_KEY = 'feedCmp';
  const LIMIT = data.compareLimit;
  const FULL_MESSAGE = `Compare holds up to ${LIMIT} product families`;

  const listeners = new Set();
  let ids = load();

  function load() {
    try {
      const saved = JSON.parse(utils.storage.get(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter((n) => catalogue.sheetsByN[n]).slice(0, LIMIT) : [];
    } catch {
      return [];
    }
  }

  function commit(next) {
    ids = next;
    utils.storage.set(STORAGE_KEY, JSON.stringify(ids));
    syncInputs();
    listeners.forEach((fn) => fn(ids.slice()));
  }

  const has = (n) => ids.includes(n);
  const isFull = () => ids.length >= LIMIT;

  /** Adds or removes a family; returns false when Compare is already full */
  function toggle(n) {
    if (has(n)) {
      commit(ids.filter((id) => id !== n));
      return true;
    }
    if (isFull()) return false;
    commit([...ids, n]);
    return true;
  }

  const clear = () => commit([]);

  /** Ticks, disables and titles every Compare checkbox (and marks rows) inside root */
  function syncInputs(root = document) {
    const full = isFull();
    utils.$$('input[data-compare-n]', root).forEach((input) => {
      const n = Number(input.dataset.compareN);
      const checked = has(n);
      const disabled = !checked && full;
      input.checked = checked;
      input.disabled = disabled;
      const holder = input.closest('label') || input;
      if (disabled) holder.title = FULL_MESSAGE;
      else holder.removeAttribute('title');
    });
    // Rows listing one or more families: data-compare-row="3 41"
    utils.$$('[data-compare-row]', root).forEach((row) => {
      const listed = row.dataset.compareRow.split(' ').map(Number);
      row.dataset.compared = String(listed.some(has));
    });
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function init() {
    // One listener for every Compare tick on the page, wherever it is drawn
    document.addEventListener('change', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.matches('input[data-compare-n]')) return;
      if (!toggle(Number(input.dataset.compareN))) syncInputs();
    });

    // Another tab of the catalogue changed the selection
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        ids = load();
        syncInputs();
        listeners.forEach((fn) => fn(ids.slice()));
      }
    });
  }

  FeedCatalogue.compare = {
    limit: LIMIT,
    fullMessage: FULL_MESSAGE,
    ids: () => ids.slice(),
    has,
    isFull,
    toggle,
    clear,
    syncInputs,
    subscribe,
    init,
  };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
