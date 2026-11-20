/*
  Compare panel: the families ticked for Compare, one row each: thumbnail (opens the viewer)
  and name, group, products, export and import with bars on one scale, net, and export as a
  multiple of imports. "Clear all" empties it; the × on a row removes that family.
*/
(function (FeedCatalogue) {
  'use strict';

  const { utils, format, catalogue, compare } = FeedCatalogue;
  const components = (FeedCatalogue.components = FeedCatalogue.components || {});
  const { $, escapeHtml, icon, safeColor } = utils;
  const { formatCr, sheetImage } = format;

  let el = {};
  let onGoToFamilies = () => {};

  function emptyHtml() {
    return `
      <div class="compare__empty">
        <span class="compare__empty-icon">${icon('compare', { size: 26, stroke: 2.2 })}</span>
        <b>Nothing selected yet</b>
        <p>
          Go to the Product Families tab and tick “Compare” on 2 to ${compare.limit} families. They will appear here side by
          side with export, import and net values.
        </p>
        <button type="button" class="compare__primary" data-go-families>
          Go to Product Families
          ${icon('arrow-right', { size: 16, stroke: 2.4 })}
        </button>
      </div>`;
  }

  function rowHtml(s, max) {
    const group = catalogue.groupsById[s.group];
    const net = s.exp - s.imp;
    const name = escapeHtml(s.name);
    const barWidth = (value) => `${Math.max(0.6, (value / max) * 100).toFixed(2)}%`;

    return `
      <div class="compare__row" role="row" style="--group-color: ${safeColor(group.color)}">
        <div class="compare__sheet-cell" role="cell">
          <button type="button" class="compare__thumb" data-open="${s.n}" title="Open ${name}" aria-label="Open ${name}">
            <img src="${sheetImage(s.n)}" alt="" width="800" height="875" decoding="async" />
          </button>
          <span class="compare__name">${name}</span>
        </div>

        <div class="compare__group-cell" role="cell">
          <span class="compare__mobile-label">Group</span>
          <span class="compare__group-name">
            <span class="compare__group-icon" style="color: ${safeColor(group.color)}">${icon(group.icon, { size: 14, stroke: 2.3 })}</span>
            ${escapeHtml(group.name)}
          </span>
        </div>

        <div class="compare__center compare__figure compare__products" role="cell">
          <span class="compare__mobile-label">Products</span>
          ${s.products.length}
        </div>

        <div class="compare__money compare__export" role="cell">
          <span class="compare__mobile-label">Export ₹ Cr</span>
          <span class="compare__money-value">₹${formatCr(s.exp)}</span>
          <span class="compare__track"><span class="compare__bar--export" style="width: ${barWidth(s.exp)}"></span></span>
        </div>

        <div class="compare__money compare__import" role="cell">
          <span class="compare__mobile-label">Import ₹ Cr</span>
          <span class="compare__money-value">₹${formatCr(s.imp)}</span>
          <span class="compare__track"><span class="compare__bar--import" style="width: ${barWidth(s.imp)}"></span></span>
        </div>

        <div class="compare__num compare__figure compare__net${net < 0 ? ' compare__negative' : ''}" role="cell">
          <span class="compare__mobile-label">Net ₹ Cr</span>
          ${formatCr(net)}
        </div>

        <div class="compare__num compare__figure compare__share" role="cell">
          <span class="compare__mobile-label">Export share of imports</span>
          ${s.imp > 0 ? `${(s.exp / s.imp).toFixed(2)}×` : 'no imports'}
        </div>

        <div class="compare__remove-cell" role="cell">
          <button type="button" class="compare__remove" data-remove="${s.n}" title="Remove" aria-label="Remove ${name} from compare">
            ${icon('close', { size: 14, stroke: 2.6 })}
          </button>
        </div>
      </div>`;
  }

  function boxHtml(sheets) {
    const max = Math.max(...sheets.map((s) => Math.max(s.exp, s.imp)), 1);
    return `
      <div class="compare__box">
        <div class="compare__box-head">
          <div>
            <h3>Selected product families</h3>
            <p class="compare__box-sub">Export vs Import (₹ crore, FY 2025–26)</p>
          </div>
          <div class="compare__head-actions">
            <div class="compare__legend" aria-hidden="true">
              <span><i class="compare__swatch--export"></i>Export</span>
              <span><i class="compare__swatch--import"></i>Import</span>
            </div>
            <button type="button" class="compare__secondary" data-clear>Clear all</button>
          </div>
        </div>

        <div class="compare__grid" role="table" aria-label="Selected product families compared">
          <div class="compare__head-row" role="row">
            <span role="columnheader">Product family</span>
            <span role="columnheader">Group</span>
            <span role="columnheader" class="compare__center">Products</span>
            <span role="columnheader">Export ₹ Cr</span>
            <span role="columnheader">Import ₹ Cr</span>
            <span role="columnheader" class="compare__num">Net ₹ Cr</span>
            <span role="columnheader" class="compare__num">Export share of imports</span>
            <span role="columnheader" class="sr-only">Remove</span>
          </div>
          ${sheets.map((s) => rowHtml(s, max)).join('')}
        </div>
      </div>`;
  }

  function render() {
    const sheets = compare.ids().map((n) => catalogue.sheetsByN[n]).filter(Boolean);
    el.selected.textContent = String(sheets.length);
    el.body.innerHTML = sheets.length ? boxHtml(sheets) : emptyHtml();
  }

  /** goToFamilies(): the empty state's "Go to Product Families" */
  function init({ goToFamilies }) {
    el = {
      root: $('#panel-compare'),
      body: $('[data-compare-body]'),
      selected: $('[data-compare-selected]'),
    };
    if (!el.root) return;
    onGoToFamilies = goToFamilies;

    el.body.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      if (target.matches('[data-open]')) components.sheetViewer.open({ n: Number(target.dataset.open) });
      else if (target.matches('[data-remove]')) {
        // Keep keyboard focus in the panel once the row is gone
        compare.toggle(Number(target.dataset.remove));
        const next = $('[data-remove], [data-go-families]', el.body);
        if (next) next.focus();
      } else if (target.matches('[data-clear]')) {
        compare.clear();
        const next = $('[data-go-families]', el.body);
        if (next) next.focus();
      } else if (target.matches('[data-go-families]')) onGoToFamilies();
    });

    compare.subscribe(render);
    render();
  }

  components.compareView = { init };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
