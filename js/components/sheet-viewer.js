/*
  Full-screen family viewer: the <dialog data-viewer> in index.html.
  - Picture: wheel / pinch to zoom, drag to move, double-click to zoom in (again to fit);
    − / + / Fit / 100% buttons; keys + − 0, ← → for the previous / next family.
  - ◀ ▶ step through the families the viewer was opened from (the cards or table rows shown).
  - Products panel: the family's totals, a note when some HSN codes also sit in other families
    (with links to them), a filter and the full HSN table with copy buttons.
  - Compare toggle and "Download image".
  Open it with FeedCatalogue.components.sheetViewer.open({ n, list, hsn }).
*/
(function (FeedCatalogue) {
  'use strict';

  const { utils, format, catalogue, compare } = FeedCatalogue;
  const { $, $$, escapeHtml, icon } = utils;
  const { formatRupees, formatCr, sheetNumber, sheetImage } = format;

  const MAX_ZOOM = 8;
  const TOAST_MS = 2200;

  let dialog;
  let el = {};
  const state = { list: [], n: null, hsn: null, filter: '', hasImage: true };
  // Live zoom / pan, applied straight to the picture so dragging stays smooth
  const view = { sc: 1, x: 0, y: 0, iw: 1, ih: 1, fit: 1, ptr: new Map(), pd: 0 };
  let toastTimer;
  let bodyOverflow = '';
  let isOpen = false;
  let opener = null;

  const fileName = (sheet) => `FEED_Product_Family_${sheetNumber(sheet.n)}_${sheet.name.replace(/[^A-Za-z0-9]+/g, '_')}.jpg`;

  /* ---------- toast ---------- */
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.hidden = true;
    }, TOAST_MS);
  }

  /* ---------- zoom + pan ---------- */
  function apply() {
    el.image.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.sc})`;
    el.zoomLevel.textContent = `${Math.round(view.sc * 100)}%`;
  }

  // Keeps the picture centred when smaller than the stage, and inside it when bigger
  function clamp() {
    const sw = el.stage.clientWidth;
    const sh = el.stage.clientHeight;
    const w = view.iw * view.sc;
    const h = view.ih * view.sc;
    view.x = w <= sw ? (sw - w) / 2 : Math.min(0, Math.max(sw - w, view.x));
    view.y = h <= sh ? (sh - h) / 2 : Math.min(0, Math.max(sh - h, view.y));
  }

  function fitView() {
    if (!el.stage.clientWidth || !el.stage.clientHeight) return;
    view.fit = Math.min(el.stage.clientWidth / view.iw, el.stage.clientHeight / view.ih);
    view.sc = view.fit;
    view.x = 0;
    view.y = 0;
    clamp();
    apply();
  }

  function zoomAt(factor, cx, cy) {
    const next = Math.min(Math.max(view.sc * factor, view.fit * 0.9), MAX_ZOOM);
    const ratio = next / view.sc;
    view.x = cx - (cx - view.x) * ratio;
    view.y = cy - (cy - view.y) * ratio;
    view.sc = next;
    clamp();
    apply();
  }

  const zoomCenter = (factor) => zoomAt(factor, el.stage.clientWidth / 2, el.stage.clientHeight / 2);

  function actualSize() {
    view.sc = 1;
    view.x = 0;
    view.y = 0;
    clamp();
    apply();
  }

  function onWheel(event) {
    event.preventDefault();
    const r = el.stage.getBoundingClientRect();
    zoomAt(event.deltaY < 0 ? 1.18 : 1 / 1.18, event.clientX - r.left, event.clientY - r.top);
  }

  function onPointerDown(event) {
    // The ◀ ▶ arrows sit on the stage: let them be clicked
    if (event.target.closest('button')) return;
    el.stage.setPointerCapture(event.pointerId);
    view.ptr.set(event.pointerId, { x: event.clientX, y: event.clientY });
    el.stage.dataset.dragging = 'true';
    if (view.ptr.size === 2) {
      const [a, b] = [...view.ptr.values()];
      view.pd = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }

  function onPointerMove(event) {
    if (!view.ptr.has(event.pointerId)) return;
    const prev = view.ptr.get(event.pointerId);
    view.ptr.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (view.ptr.size === 1) {
      view.x += event.clientX - prev.x;
      view.y += event.clientY - prev.y;
      clamp();
      apply();
    } else if (view.ptr.size === 2) {
      // Pinch zoom
      const [a, b] = [...view.ptr.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const r = el.stage.getBoundingClientRect();
      if (view.pd > 0) zoomAt(d / view.pd, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      view.pd = d;
    }
  }

  function onPointerUp(event) {
    view.ptr.delete(event.pointerId);
    view.pd = 0;
    if (!view.ptr.size) el.stage.dataset.dragging = 'false';
  }

  function onDoubleClick(event) {
    if (event.target.closest('button')) return;
    const r = el.stage.getBoundingClientRect();
    if (view.sc > view.fit * 1.05) fitView();
    else zoomAt(2.6 / (view.sc / view.fit), event.clientX - r.left, event.clientY - r.top);
  }

  /* ---------- families ---------- */
  function step(dir) {
    if (state.list.length < 2) return;
    const i = state.list.indexOf(state.n);
    state.n = state.list[(i + dir + state.list.length) % state.list.length];
    state.filter = '';
    render();
  }

  function goToSheet(target) {
    if (!state.list.includes(target)) state.list = [target, ...state.list];
    state.hsn = null;
    state.filter = '';
    state.n = target;
    render();
  }

  function toggleCompare() {
    const inCompare = compare.has(state.n);
    if (!inCompare && compare.isFull()) {
      showToast(compare.fullMessage);
      return;
    }
    compare.toggle(state.n);
    showToast(inCompare ? 'Removed from Compare' : 'Added to Compare');
  }

  function renderCompareButton() {
    if (state.n === null) return;
    const inCompare = compare.has(state.n);
    el.compareBtn.setAttribute('aria-pressed', String(inCompare));
    el.compareBtn.title = inCompare ? 'Remove from compare' : 'Add to compare';
    el.compareIcon.setAttribute('href', inCompare ? '#i-check' : '#i-compare');
    el.compareText.textContent = inCompare ? 'In compare' : 'Compare';
  }

  async function downloadImage() {
    const sheet = catalogue.sheetsByN[state.n];
    const src = sheetImage(sheet.n);
    const save = (href) => {
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName(sheet);
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    };
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(String(response.status));
      const url = URL.createObjectURL(await response.blob());
      save(url);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Image downloaded');
    } catch {
      // Opened straight from disk (file://), where fetch isn't allowed: let the browser save the file
      save(src);
      showToast('Saving image…');
    }
  }

  function copyHsn(code) {
    const done = () => showToast(`HSN ${code} copied`);
    const fallback = () => {
      const area = document.createElement('textarea');
      area.value = code;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      dialog.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      area.remove();
      if (ok) done();
      else showToast('Copy not allowed');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code).then(done, fallback);
    else fallback();
  }

  /* ---------- drawing ---------- */
  function renderRows() {
    const sheet = catalogue.sheetsByN[state.n];
    const f = state.filter.toLowerCase().trim();
    const rows = sheet.products.filter((p) => !f || `${p.hsn} ${p.name} ${p.type}`.toLowerCase().includes(f));

    if (!rows.length) {
      el.rows.innerHTML = `<tr><td colspan="4" class="viewer__empty-row">No product matches “${escapeHtml(state.filter)}”</td></tr>`;
      return;
    }

    el.rows.innerHTML = rows
      .map((p) => {
        const others = catalogue.sheetsOfHsn[p.hsn].filter((x) => x !== sheet.n);
        const also = others.length
          ? `<span class="viewer__also">↗ also in ${others
              .map(
                (other) =>
                  `<button type="button" data-goto="${other}" title="${escapeHtml(`${sheetNumber(other)} ${catalogue.sheetsByN[other].name}`)}">${sheetNumber(other)}</button>`,
              )
              .join('')}</span>`
          : '';
        return `<tr data-marked="${p.hsn === state.hsn}">
          <td class="viewer__hsn">
            <code>${escapeHtml(p.hsn)}</code><button type="button" class="viewer__copy" data-copy="${escapeHtml(p.hsn)}" title="Copy HSN" aria-label="Copy HSN ${escapeHtml(p.hsn)}">${icon('copy', { size: 13, stroke: 2.2 })}</button>
          </td>
          <td>
            <span class="viewer__product-name">${escapeHtml(p.name)}</span>
            <span class="viewer__meta"><span class="viewer__type" data-type="${escapeHtml(p.type)}">${escapeHtml(p.type)}</span>${also}</span>
          </td>
          <td class="viewer__num">${formatCr(p.exp)}</td>
          <td class="viewer__num">${formatCr(p.imp)}</td>
        </tr>`;
      })
      .join('');
  }

  // Brings the marked HSN into view inside the products list only (not the whole dialog).
  // Wide screens: the table scrolls on its own. Phones: the whole panel scrolls.
  function scrollToMarked() {
    const row = $('tr[data-marked="true"]', el.rows);
    const wrap = el.tableWrap;
    if (!row) return;
    const box = wrap.scrollHeight > wrap.clientHeight ? wrap : wrap.parentElement;
    const rowTop = row.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    box.scrollTop = rowTop - box.clientHeight / 2 + row.offsetHeight / 2;
  }

  function render() {
    const sheet = catalogue.sheetsByN[state.n];
    const group = catalogue.groupsById[sheet.group];
    const net = sheet.exp - sheet.imp;
    const number = sheetNumber(sheet.n);
    const multiple = state.list.length > 1;

    // Top bar
    el.num.textContent = number;
    el.num.style.background = utils.safeColor(group.color);
    el.name.textContent = sheet.name;
    el.group.textContent = `Group ${sheet.group} · ${group.name}`;
    el.position.textContent = `${state.list.indexOf(state.n) + 1} of ${state.list.length}`;
    $$('[data-viewer-step]', dialog).forEach((button) => {
      if (button.classList.contains('viewer__nav')) button.hidden = !multiple;
      else button.disabled = !multiple;
    });
    renderCompareButton();

    // Picture (shown once loaded and fitted, so it never flashes at full size)
    const src = sheetImage(sheet.n);
    if (el.image.getAttribute('src') !== src) {
      el.image.style.opacity = '0';
      state.hasImage = true;
      el.image.hidden = false;
      el.noImage.hidden = true;
      el.download.disabled = false;
      el.image.src = src;
    }
    el.image.alt = `${sheet.name} infographic`;

    // Products panel
    el.panel.setAttribute('aria-label', `Products in ${sheet.name}`);
    el.panelTitle.textContent = `${number} · ${sheet.name}`;
    el.panelSub.textContent = `${sheet.hs} · Group ${sheet.group}: ${group.name}`;
    el.exp.textContent = `${formatRupees(sheet.exp)} Cr`;
    el.imp.textContent = `${formatRupees(sheet.imp)} Cr`;
    el.net.textContent = `${formatRupees(net)} Cr`;
    el.netBox.className = net < 0 ? 'viewer__kpi--negative' : 'viewer__kpi--net';

    const overlap = sheet.products.filter((p) => catalogue.sheetsOfHsn[p.hsn].some((x) => x !== sheet.n)).length;
    el.note.hidden = overlap === 0;
    el.noteText.textContent = `${overlap} HSN code${overlap > 1 ? 's' : ''} in this family also appear in other families (marked ↗). Do not add the family totals together.`;

    el.filter.value = state.filter;
    el.filter.placeholder = `Filter these ${sheet.products.length} products or HSN…`;

    renderRows();
    el.tableWrap.scrollTop = 0;
    el.panel.scrollTop = 0;
    if (state.hsn) requestAnimationFrame(scrollToMarked);
  }

  /* ---------- open / close ---------- */
  function open({ n, list, hsn = null } = {}) {
    if (!catalogue.sheetsByN[n]) return;
    state.list = Array.isArray(list) && list.includes(n) ? list.slice() : [n];
    state.n = n;
    state.hsn = hsn;
    state.filter = '';
    opener = document.activeElement;

    if (!isOpen) {
      isOpen = true;
      bodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    if (!dialog.open) dialog.showModal();
    render();
    // The stage only has a size once the dialog is showing
    if (el.image.complete && el.image.naturalWidth) fitView();
  }

  function close() {
    if (dialog.open) dialog.close();
    onClosed();
  }

  // Runs once per opening: from close(), or from the dialog's own "close" event
  function onClosed() {
    if (!isOpen) return;
    isOpen = false;
    document.body.style.overflow = bodyOverflow;
    clearTimeout(toastTimer);
    el.toast.hidden = true;
    view.ptr.clear();
    el.stage.dataset.dragging = 'false';
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    opener = null;
  }

  function onKeyDown(event) {
    if (event.target.tagName === 'INPUT' || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'ArrowRight') step(1);
    else if (event.key === '+' || event.key === '=') zoomCenter(1.4);
    else if (event.key === '-') zoomCenter(1 / 1.4);
    else if (event.key === '0') fitView();
    else return;
    event.preventDefault();
  }

  function init() {
    dialog = $('[data-viewer]');
    if (!dialog) return;
    const q = (name) => $(`[data-viewer-${name}]`, dialog);
    el = {
      num: q('num'),
      name: q('name'),
      group: q('group'),
      position: q('position'),
      zoomLevel: q('zoom-level'),
      compareBtn: q('compare'),
      compareIcon: q('compare-icon'),
      compareText: q('compare-text'),
      download: q('download'),
      stage: q('stage'),
      image: q('image'),
      noImage: q('no-image'),
      panel: q('panel'),
      panelTitle: q('panel-title'),
      panelSub: q('panel-sub'),
      exp: q('exp'),
      imp: q('imp'),
      net: q('net'),
      netBox: q('net-box'),
      note: q('note'),
      noteText: q('note-text'),
      filter: q('filter'),
      tableWrap: q('table-wrap'),
      rows: q('rows'),
      toast: q('toast'),
    };

    q('close').addEventListener('click', close);
    // Esc: close straight away (and tidy up in onClosed)
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    });
    dialog.addEventListener('close', onClosed);
    dialog.addEventListener('keydown', onKeyDown);

    $$('[data-viewer-step]', dialog).forEach((button) => {
      button.addEventListener('click', () => step(Number(button.dataset.viewerStep)));
    });

    const zoomActions = { in: () => zoomCenter(1.4), out: () => zoomCenter(1 / 1.4), fit: fitView, actual: actualSize };
    $$('[data-viewer-zoom]', dialog).forEach((button) => {
      button.addEventListener('click', () => zoomActions[button.dataset.viewerZoom]());
    });

    el.compareBtn.addEventListener('click', toggleCompare);
    el.download.addEventListener('click', downloadImage);

    // Picture stage
    el.stage.addEventListener('wheel', onWheel, { passive: false });
    el.stage.addEventListener('pointerdown', onPointerDown);
    el.stage.addEventListener('pointermove', onPointerMove);
    el.stage.addEventListener('pointerup', onPointerUp);
    el.stage.addEventListener('pointercancel', onPointerUp);
    el.stage.addEventListener('dblclick', onDoubleClick);

    el.image.addEventListener('load', () => {
      view.iw = el.image.naturalWidth;
      view.ih = el.image.naturalHeight;
      fitView();
      el.image.style.opacity = '1';
    });
    el.image.addEventListener('error', () => {
      state.hasImage = false;
      el.image.hidden = true;
      el.noImage.hidden = false;
      el.download.disabled = true;
    });

    // Re-fit when the stage changes size (window resized, phone turned)
    if ('ResizeObserver' in window) new ResizeObserver(() => dialog.open && fitView()).observe(el.stage);

    // Products panel: filter, copy, "also in" links
    el.filter.addEventListener('input', () => {
      state.filter = el.filter.value;
      renderRows();
    });
    el.rows.addEventListener('click', (event) => {
      const copy = event.target.closest('[data-copy]');
      if (copy) copyHsn(copy.dataset.copy);
      const goto = event.target.closest('[data-goto]');
      if (goto) goToSheet(Number(goto.dataset.goto));
    });

    compare.subscribe(() => dialog.open && renderCompareButton());
  }

  FeedCatalogue.components = FeedCatalogue.components || {};
  FeedCatalogue.components.sheetViewer = { init, open, close };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
