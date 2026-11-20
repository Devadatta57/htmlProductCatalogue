/*
  The explorer's pinned bar (position: sticky):
  - publishes its live height as --bar-h on the explorer, for anything that needs to sit under it;
  - sets data-stuck="true" once it is pinned to the top of the window (it then gets a shadow),
    watched through the zero-height sentinel placed right above it.
*/
(function (FeedCatalogue) {
  'use strict';

  const { $ } = FeedCatalogue.utils;

  function init() {
    const container = $('#explorer');
    const bar = $('.explorer__bar', container);
    const sentinel = $('.explorer__sentinel', container);
    if (!container || !bar || !sentinel) return;

    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        container.style.setProperty('--bar-h', `${Math.ceil(bar.getBoundingClientRect().height)}px`);
      }).observe(bar);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        bar.dataset.stuck = String(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      }).observe(sentinel);
    }
  }

  FeedCatalogue.components = FeedCatalogue.components || {};
  FeedCatalogue.components.stickyBar = { init };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
