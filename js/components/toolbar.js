/*
  Toolbar in the pinned bar: the three section tabs (with their counts) and the search box.
  It only reports what the visitor does; js/components/explorer.js decides what happens.
*/
(function (FeedCatalogue) {
  'use strict';

  const { $, $$, debounce } = FeedCatalogue.utils;

  let tabs = [];

  /**
   * onTabChange(tabId)  a tab was chosen
   * onQuery(text)       the search text changed (a moment after typing stops)
   * onSubmit(text)      Enter or the arrow button
   */
  function init({ onTabChange, onQuery, onSubmit }) {
    tabs = $$('.toolbar__tab');
    const form = $('[data-search-form]');
    const input = $('[data-search-input]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => onTabChange(tab.dataset.tab));
    });

    // Typing stays snappy; the cards catch up a moment later
    const report = debounce(() => onQuery(input.value), 120);
    input.addEventListener('input', report);
    // The "×" in the search box (and Esc) clears straight away
    input.addEventListener('search', () => onQuery(input.value));

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      onQuery(input.value);
      onSubmit(input.value.trim());
      // Phones: close the keyboard so the results show
      if (window.matchMedia('(pointer: coarse)').matches) input.blur();
    });
  }

  function setActiveTab(tabId) {
    tabs.forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.tab === tabId)));
  }

  function setCount(key, value) {
    const badge = $(`[data-count="${key}"]`);
    if (badge) badge.textContent = String(value);
  }

  FeedCatalogue.components = FeedCatalogue.components || {};
  FeedCatalogue.components.toolbar = { init, setActiveTab, setCount };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
