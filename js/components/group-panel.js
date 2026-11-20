/*
  Product groups block above the family cards: "All 10 groups" and one tile per group with
  how many families it holds. Choosing one filters the cards (js/components/explorer.js).
*/
(function (FeedCatalogue) {
  'use strict';

  const { utils, catalogue, data } = FeedCatalogue;
  const { $, $$, escapeHtml, icon, safeColor } = utils;

  let root;

  function render() {
    const { groups } = catalogue;
    const total = data.totals.sheets;

    root.innerHTML = `
      <div class="group-panel__head">
        <button type="button" class="group-panel__all" data-group="all" aria-pressed="true"
          title="${groups.length} groups · ${total} product families">
          ${icon('all-groups', { size: 16, stroke: 2.2 })}
          All ${groups.length} groups
          <span class="group-panel__count">${total}</span>
        </button>
      </div>
      <ul class="group-panel__grid">
        ${groups
          .map(
            (group) => `
          <li>
            <button type="button" class="group-panel__tile" data-group="${escapeHtml(group.id)}" aria-pressed="false"
              style="--group-color: ${safeColor(group.color)}"
              title="${group.sheets} product families · ${group.products} products">
              <span class="group-panel__icon">${icon(group.icon, { size: 18, stroke: 2.3 })}</span>
              <span class="group-panel__label">${escapeHtml(group.name)}</span>
              <span class="group-panel__count" aria-label="${group.sheets} product families">${group.sheets}</span>
            </button>
          </li>`,
          )
          .join('')}
      </ul>`;
  }

  /** onChange(groupId): 'all' or a group id */
  function init({ onChange }) {
    root = $('[data-group-panel]');
    if (!root) return;
    render();
    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-group]');
      if (button) onChange(button.dataset.group);
    });
  }

  function setActive(groupId) {
    $$('[data-group]', root).forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.group === groupId));
    });
  }

  FeedCatalogue.components = FeedCatalogue.components || {};
  FeedCatalogue.components.groupPanel = { init, setActive };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
