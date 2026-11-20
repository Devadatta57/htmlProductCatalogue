/*
  Product Index panel: one row per HSN code (461). A code listed in two families is still one
  row, with both families linked. Filter by group and type; sort with "Sort by" or by clicking
  a column heading (again to reverse). The eye beside a family opens it in the viewer with
  that HSN code highlighted. Drawn the first time the tab is opened.
*/
(function (FeedCatalogue) {
  'use strict';

  const { utils, format, catalogue, compare } = FeedCatalogue;
  const components = (FeedCatalogue.components = FeedCatalogue.components || {});
  const { $, $$, escapeHtml, icon, highlight } = utils;
  const { formatCr, formatRupees, sheetNumber } = format;

  const NUMERIC = new Set(['exp', 'imp', 'net']);

  const comparators = {
    hsn: (a, b) => (a.hsn < b.hsn ? -1 : 1),
    name: (a, b) => a.name.localeCompare(b.name),
    type: (a, b) => a.type.localeCompare(b.type),
    // Family number, then HSN code inside each family
    sheet: (a, b) => a.main - b.main || (a.hsn < b.hsn ? -1 : 1),
    exp: (a, b) => a.exp - b.exp,
    imp: (a, b) => a.imp - b.imp,
    net: (a, b) => a.net - b.net,
  };

  const state = { group: 'all', type: 'all', sortId: 'sheet', dir: 1 };
  let el = {};
  let drawn = false;

  function rowHtml(row, parsed) {
    const families = row.sheets.map((n) => ({ n, label: `${sheetNumber(n)} ${catalogue.sheetsByN[n].name}`, name: catalogue.sheetsByN[n].name }));

    return `
      <tr data-compare-row="${row.sheets.join(' ')}">
        <td class="product-index__hsn">${highlight(row.hsn, parsed)}</td>
        <td class="product-index__product" title="${escapeHtml(row.name)}">${highlight(row.name, parsed)}</td>
        <td class="product-index__type-cell"><span class="type-pill" data-type="${escapeHtml(row.type)}">${escapeHtml(row.type)}</span></td>
        <td class="product-index__num product-index__exp" data-label="Export ₹ Cr">${formatCr(row.exp)}</td>
        <td class="product-index__num product-index__imp" data-label="Import ₹ Cr">${formatCr(row.imp)}</td>
        <td class="product-index__num product-index__net-col" data-label="Net ₹ Cr">
          <span class="product-index__net" data-negative="${row.net < 0}">${formatCr(row.net)}</span>
        </td>
        <td class="product-index__sheet-col" data-label="Product family">
          <span class="product-index__sheets">
            ${families
              .map(
                (f) => `
              <span class="product-index__sheet-row">
                <button type="button" class="product-index__view" data-open="${f.n}" data-hsn="${escapeHtml(row.hsn)}"
                  title="View ${escapeHtml(f.name)}" aria-label="View ${escapeHtml(f.name)}">${icon('eye', { size: 15 })}</button>
                <span class="product-index__sheet-name" title="${escapeHtml(f.label)}">${escapeHtml(f.label)}</span>
              </span>`,
              )
              .join('')}
          </span>
        </td>
        <td class="product-index__compare-col" data-label="Compare">
          <span class="product-index__compare-stack">
            ${families
              .map(
                (f) => `
              <span class="product-index__compare-cell">
                <input type="checkbox" class="product-index__check" data-compare-n="${f.n}" aria-label="Compare ${escapeHtml(f.label)}" />
              </span>`,
              )
              .join('')}
          </span>
        </td>
      </tr>`;
  }

  function render() {
    drawn = true;
    const parsed = null; // The Product Index lists every product; the search box filters the family cards
    const rows = catalogue.products.filter((p) => {
      if (state.group !== 'all' && !p.sheets.some((n) => catalogue.sheetsByN[n].group === state.group)) return false;
      if (state.type !== 'all' && p.type !== state.type) return false;
      return true;
    });
    const byKey = comparators[state.sortId];
    rows.sort((a, b) => byKey(a, b) * state.dir);

    el.rows.innerHTML = rows.length
      ? rows.map((row) => rowHtml(row, parsed)).join('')
      : `<tr><td colspan="8" class="product-index__empty"><b>No product found</b>Try a different name or the first digits of an HSN code.</td></tr>`;
    compare.syncInputs(el.rows);

    // Summary line
    const totals = rows.reduce((sum, p) => ({ exp: sum.exp + p.exp, imp: sum.imp + p.imp }), { exp: 0, imp: 0 });
    const groupName = state.group === 'all' ? null : catalogue.groupsById[state.group].name;
    el.info.innerHTML =
      `Showing <b>${rows.length}</b> of ${catalogue.products.length} HSN products` +
      (groupName ? ` in <b>${escapeHtml(groupName)}</b>` : '') +
      ` · export <b>${formatRupees(totals.exp)} Cr</b> · import <b>${formatRupees(totals.imp)} Cr</b>`;

    // Sorted column: aria-sort and its ▲ / ▼
    $$('[data-sort-col]', el.root).forEach((th) => {
      const active = th.dataset.sortCol === state.sortId;
      th.setAttribute('aria-sort', active ? (state.dir === 1 ? 'ascending' : 'descending') : 'none');
      const button = $('button', th);
      const arrow = $('.product-index__arrow', button);
      if (arrow) arrow.remove();
      if (active) button.insertAdjacentHTML('beforeend', `<span class="product-index__arrow" aria-hidden="true">${state.dir === 1 ? '▲' : '▼'}</span>`);
    });
    el.sort.value = `${state.sortId}:${state.dir}`;
  }

  /** Draws the index the first time its tab is opened */
  function activate() {
    if (!drawn) render();
  }

  function init() {
    el = {
      root: $('#panel-index'),
      group: $('[data-index-group]'),
      type: $('[data-index-type]'),
      sort: $('[data-index-sort]'),
      info: $('[data-index-info]'),
      rows: $('[data-index-rows]'),
    };
    if (!el.root) return;

    el.group.insertAdjacentHTML(
      'beforeend',
      catalogue.groups.map((g) => `<option value="${escapeHtml(g.id)}">${escapeHtml(g.name)}</option>`).join(''),
    );

    el.group.addEventListener('change', () => {
      state.group = el.group.value;
      render();
    });
    el.type.addEventListener('change', () => {
      state.type = el.type.value;
      render();
    });
    el.sort.addEventListener('change', () => {
      const [id, dir] = el.sort.value.split(':');
      state.sortId = id;
      state.dir = Number(dir);
      render();
    });

    // Column headings sort too: again to reverse. Numbers start high → low, everything else A → Z.
    $$('[data-sort]', el.root).forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.sort;
        if (state.sortId === id) state.dir = -state.dir;
        else {
          state.sortId = id;
          state.dir = NUMERIC.has(id) ? -1 : 1;
        }
        render();
      });
    });

    el.rows.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-open]');
      if (opener) components.sheetViewer.open({ n: Number(opener.dataset.open), hsn: opener.dataset.hsn });
    });
  }

  components.productIndex = { init, activate };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
