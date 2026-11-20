/*
  Family search + sort.
  - Digits only ("0904", "09101100", "0703 20") → HSN code search.
  - Anything else → every word must appear in the family's name, HS line, group name or one
    of its products.
*/
(function (FeedCatalogue) {
  'use strict';

  function parseQuery(raw) {
    const q = String(raw || '').trim().toLowerCase();
    if (!q) return null;
    if (/^[\d\s.\-/]+$/.test(q)) {
      const digits = q.replace(/\D/g, '');
      return digits ? { hsn: digits } : null;
    }
    return { words: q.split(/\s+/).filter(Boolean) };
  }

  /** Lower-cased text a family can be found by */
  function sheetSearchText(sheet, groupName) {
    return [sheet.name, sheet.hs, groupName, ...sheet.products.map((p) => `${p.name} ${p.hsn}`)].join(' ').toLowerCase();
  }

  /** → { ok, hits }, where hits are the products that matched (shown on the card) */
  function matchSheet(sheet, searchText, query) {
    if (!query) return { ok: true, hits: [] };

    if (query.hsn) {
      const hits = sheet.products.filter((p) => p.hsn.includes(query.hsn));
      const inHsLine = query.hsn.length >= 4 && sheet.hs.replace(/\D/g, '').includes(query.hsn);
      return { ok: hits.length > 0 || inHsLine, hits };
    }

    const ok = query.words.every((word) => searchText.includes(word));
    const hits = ok
      ? sheet.products.filter((p) => query.words.some((word) => `${p.name} ${p.hsn}`.toLowerCase().includes(word)))
      : [];
    return { ok, hits };
  }

  const net = (sheet) => sheet.exp - sheet.imp;

  const comparators = {
    n: (a, b) => a.n - b.n,
    exp: (a, b) => b.exp - a.exp,
    imp: (a, b) => b.imp - a.imp,
    net: (a, b) => net(b) - net(a),
    netl: (a, b) => net(a) - net(b),
    cnt: (a, b) => b.products.length - a.products.length || a.n - b.n,
    name: (a, b) => a.name.localeCompare(b.name),
  };

  const compareSheets = (sortKey) => comparators[sortKey] || comparators.n;

  FeedCatalogue.search = { parseQuery, sheetSearchText, matchSheet, compareSheets };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
