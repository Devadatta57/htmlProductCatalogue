/*
  Product Families panel: the family cards ("View as: Grid") or the table ("View as: Table"),
  filtered by the search box and the chosen group, in the "Sort by" order.

  The 56 cards are built once and then only re-ordered, shown or hidden, so their pictures are
  never downloaded twice. Clicking a picture (or a table row's eye) opens the viewer, whose
  ◀ ▶ then step through the families listed here.
*/
(function (FeedCatalogue) {
  'use strict';

  const { utils, format, catalogue, search, compare } = FeedCatalogue;
  const components = (FeedCatalogue.components = FeedCatalogue.components || {});
  const { $, escapeHtml, icon, highlight, safeColor } = utils;
  const { formatRupees, formatCr, sheetNumber, sheetImage } = format;

  const MAX_HITS_SHOWN = 3;

  // Search text is built once per family, not on every keystroke
  const indexedSheets = catalogue.sheets.map((sheet) => ({
    sheet,
    text: search.sheetSearchText(sheet, catalogue.groupsById[sheet.group].name),
  }));

  let el = {};
  const cards = new Map(); // family number → { card, hits }
  let listed = []; // family numbers shown, in order (for the viewer's ◀ ▶)

  /* ---------- Trade icons: drawn inline (not from the sprite) so their parts can animate ---------- */
  const TRADE_ICONS = {
    // Export: cargo ship loaded with containers, on a wave line
    export: `
      <g data-part="ship">
        <g fill="currentColor" stroke="none">
          <rect x="3.5" y="8.3" width="4.6" height="3.7" rx="0.5" />
          <rect x="8.8" y="8.3" width="4.6" height="3.7" rx="0.5" />
          <rect x="6.1" y="4" width="4.6" height="3.7" rx="0.5" />
          <rect x="14.6" y="5.6" width="4.4" height="6.4" rx="0.6" />
          <rect x="16.1" y="2" width="1.4" height="3.6" />
          <path d="M1.5 13h21l-2.7 5.4a1.4 1.4 0 0 1-1.25.8H5.45a1.4 1.4 0 0 1-1.25-.8z" />
        </g>
        <g fill="#fff" stroke="none">
          <circle cx="16.8" cy="15.6" r="0.9" />
          <circle cx="19.4" cy="15.6" r="0.9" />
          <rect x="15.6" y="7" width="2.4" height="1.6" rx="0.3" />
        </g>
      </g>
      <path data-part="waves" stroke-width="1.5" d="M-4 22c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2" />`,
    // Import: container hanging from a crane hook
    import: `
      <path data-part="rope" d="M12 1v3.6" stroke-width="1.6" />
      <g data-part="load">
        <path d="M12 4.6 4.5 8.6M12 4.6l7.5 4" stroke-width="1.6" />
        <rect x="3.2" y="8.6" width="17.6" height="11" rx="1.2" stroke-width="2" />
        <path d="M7 11.6v5M10.3 11.6v5M13.7 11.6v5M17 11.6v5" stroke-width="1.8" />
      </g>`,
    // Net: balance scale; the beam (with strings and pans) tips about its pivot
    net: `
      <g data-part="beam">
        <path d="M5.2 7.6 2.4 13.6M5.2 7.6 8 13.6M18.8 7.6l-2.8 6M18.8 7.6l2.8 6" stroke-width="1.3" />
        <g fill="currentColor" stroke="none">
          <rect x="3.6" y="6.4" width="16.8" height="1.8" rx="0.9" />
          <path d="M1.4 13.4h7.6a3.8 3.8 0 0 1-7.6 0zM15 13.4h7.6a3.8 3.8 0 0 1-7.6 0z" />
        </g>
      </g>
      <g fill="currentColor" stroke="none">
        <circle cx="12" cy="4" r="1.8" />
        <rect x="11" y="4" width="2" height="15.5" />
        <path d="M7 19.2h10a1 1 0 0 1 1 1v1.3H6v-1.3a1 1 0 0 1 1-1z" />
      </g>`,
  };

  const tradeIcon = (name) =>
    `<svg class="icon trade-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${TRADE_ICONS[name]}</svg>`;

  /* ---------- Cards ---------- */
  function cardHtml(sheet) {
    const group = catalogue.groupsById[sheet.group];
    const net = sheet.exp - sheet.imp;
    const number = sheetNumber(sheet.n);
    const name = escapeHtml(sheet.name);
    const netNegative = net < 0;

    return `
      <article class="sheet-card" style="--group-color: ${safeColor(group.color)}" aria-labelledby="sheet-${sheet.n}-title" data-n="${sheet.n}">
        <span class="sheet-card__count">${sheet.products.length} products</span>

        <header class="sheet-card__head">
          <div class="sheet-card__group-row">
            <span class="sheet-card__number" aria-hidden="true">${number}</span>
            <p class="sheet-card__group">Group ${escapeHtml(sheet.group)} - ${escapeHtml(group.name)}</p>
          </div>
          <h3 id="sheet-${sheet.n}-title" class="sheet-card__title"><span>Product family ${number}: </span>${name}</h3>
          <p class="sheet-card__meta">${escapeHtml(sheet.hs)}</p>
        </header>

        <div class="sheet-card__panel">
          <div class="sheet-card__thumb">
            <img src="${sheetImage(sheet.n)}" alt="${name} infographic" width="800" height="875" loading="lazy" decoding="async" />
            <button type="button" class="sheet-card__open" data-open="${sheet.n}" aria-label="Open ${name}" title="Open ${name}"></button>
          </div>
        </div>

        <div class="sheet-card__info">
          <label class="sheet-card__compare">
            <input type="checkbox" data-compare-n="${sheet.n}" />
            Compare
          </label>

          <ul class="sheet-card__hits" aria-label="Matching products" data-hits hidden></ul>

          <div class="sheet-card__stats-wrap">
            <dl class="sheet-card__stats">
              <div class="sheet-card__stat sheet-card__stat--export">
                <dt>${tradeIcon('export')}Export</dt>
                <dd class="sheet-card__value--export">${formatRupees(sheet.exp)}</dd>
              </div>
              <div class="sheet-card__stat sheet-card__stat--import">
                <dt>${tradeIcon('import')}Import</dt>
                <dd class="sheet-card__value--import">${formatRupees(sheet.imp)}</dd>
              </div>
              <div class="sheet-card__stat ${netNegative ? 'sheet-card__stat--import' : 'sheet-card__stat--net'}">
                <dt>${tradeIcon('net')}Net</dt>
                <dd class="${netNegative ? 'sheet-card__value--import' : 'sheet-card__value--net'}">${formatRupees(net)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </article>`;
  }

  function buildCards() {
    const template = document.createElement('template');
    template.innerHTML = catalogue.sheets.map(cardHtml).join('');
    Array.from(template.content.children).forEach((card) => {
      cards.set(Number(card.dataset.n), { card, hits: $('[data-hits]', card) });
    });
  }

  function setCardHits(hitsList, hits) {
    hitsList.hidden = hits.length === 0;
    if (!hits.length) {
      hitsList.innerHTML = '';
      return;
    }
    hitsList.innerHTML =
      hits
        .slice(0, MAX_HITS_SHOWN)
        .map((p) => `<li><code>${escapeHtml(p.hsn)}</code> ${escapeHtml(p.name)}</li>`)
        .join('') + (hits.length > MAX_HITS_SHOWN ? `<li>+${hits.length - MAX_HITS_SHOWN} more in this family</li>` : '');
  }

  /* ---------- Table ---------- */
  function rowHtml({ sheet, hits }, parsed) {
    const group = catalogue.groupsById[sheet.group];
    const net = sheet.exp - sheet.imp;
    const max = Math.max(sheet.exp, sheet.imp, 1);
    const name = escapeHtml(sheet.name);
    const hitsHtml = hits.length
      ? `<p class="sheet-table__hits">${hits
          .slice(0, MAX_HITS_SHOWN)
          .map((p, i) => `${i > 0 ? ' · ' : ''}<span><code>${highlight(p.hsn, parsed)}</code> ${highlight(p.name, parsed)}</span>`)
          .join('')}${hits.length > MAX_HITS_SHOWN ? ` +${hits.length - MAX_HITS_SHOWN} more` : ''}</p>`
      : '';

    return `
      <tr data-compare-row="${sheet.n}">
        <td class="sheet-table__number">${sheetNumber(sheet.n)}</td>
        <td class="sheet-table__name">
          <span class="sheet-table__name-row">
            <button type="button" class="sheet-table__view" data-open="${sheet.n}" title="View ${name}" aria-label="View ${name}">
              ${icon('eye', { size: 16 })}
            </button>
            <span class="sheet-table__name-text">${highlight(sheet.name, parsed)}</span>
          </span>
          ${hitsHtml}
        </td>
        <td>
          <span class="sheet-table__group">
            <span class="sheet-table__group-icon" style="color: ${safeColor(group.color)}">${icon(group.icon, { size: 13, stroke: 2.3 })}</span>
            ${escapeHtml(group.name)}
          </span>
        </td>
        <td class="sheet-table__hs">${escapeHtml(sheet.hs)}</td>
        <td class="sheet-table__num">${sheet.products.length}</td>
        <td class="sheet-table__num sheet-table__export">${formatCr(sheet.exp)}</td>
        <td class="sheet-table__num sheet-table__import">${formatCr(sheet.imp)}</td>
        <td class="sheet-table__num${net < 0 ? ' sheet-table__negative' : ''}">${formatCr(net)}</td>
        <td>
          <span class="sheet-table__bars" aria-hidden="true">
            <span class="sheet-table__bar sheet-table__bar--export" style="width: ${((sheet.exp / max) * 100).toFixed(2)}%"></span>
            <span class="sheet-table__bar sheet-table__bar--import" style="width: ${((sheet.imp / max) * 100).toFixed(2)}%"></span>
          </span>
        </td>
        <td class="sheet-table__center">
          <input type="checkbox" class="sheet-table__check" data-compare-n="${sheet.n}" aria-label="Compare ${name}" />
        </td>
      </tr>`;
  }

  /* ---------- Drawing ---------- */
  function findResults({ query, group, sort }) {
    const parsed = search.parseQuery(query);
    const list = [];
    for (const { sheet, text } of indexedSheets) {
      if (group !== 'all' && sheet.group !== group) continue;
      const { ok, hits } = search.matchSheet(sheet, text, parsed);
      if (ok) list.push({ sheet, hits });
    }
    const byKey = search.compareSheets(sort);
    return { parsed, results: list.sort((a, b) => byKey(a.sheet, b.sheet)) };
  }

  /** state: { query, group, sort, view } */
  function render(state) {
    const { parsed, results } = findResults(state);
    listed = results.map(({ sheet }) => sheet.n);
    const empty = results.length === 0;
    const asTable = state.view === 'list';

    el.empty.hidden = !empty;
    el.grid.hidden = empty || asTable;
    el.tableWrap.hidden = empty || !asTable;

    if (!empty && asTable) {
      el.rows.innerHTML = results.map((result) => rowHtml(result, parsed)).join('');
    } else if (!empty) {
      results.forEach(({ sheet, hits }) => setCardHits(cards.get(sheet.n).hits, hits));
      el.grid.replaceChildren(...results.map(({ sheet }) => cards.get(sheet.n).card));
    }

    compare.syncInputs(el.root);
    el.status.textContent = empty
      ? 'No product family found'
      : `${results.length} product ${results.length === 1 ? 'family' : 'families'} shown`;
  }

  /** onSortChange(value), onViewChange(value) */
  function init({ onSortChange, onViewChange }) {
    el = {
      root: $('#panel-families'),
      grid: $('[data-family-grid]'),
      tableWrap: $('[data-family-table]'),
      rows: $('[data-family-rows]'),
      empty: $('[data-family-empty]'),
      status: $('[data-family-status]'),
      sort: $('[data-family-sort]'),
      view: $('[data-family-view]'),
      viewIcon: $('[data-view-icon]'),
    };
    buildCards();

    el.sort.addEventListener('change', () => onSortChange(el.sort.value));
    el.view.addEventListener('change', () => {
      el.viewIcon.setAttribute('href', el.view.value === 'list' ? '#i-table' : '#i-grid');
      onViewChange(el.view.value);
    });

    // A card's picture or a table row's eye opens the viewer
    el.root.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-open]');
      if (opener) components.sheetViewer.open({ n: Number(opener.dataset.open), list: listed });
    });
  }

  components.productFamilies = { init, render };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
