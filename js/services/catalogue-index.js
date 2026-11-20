/*
  Lookups built once from the data files, shared by every component:
    sheetsByN    family number → family
    groupsById   group id → group
    products     one entry per HSN code (a code listed in two families is one entry with both)
    sheetsOfHsn  HSN code → every family it is listed in
*/
(function (FeedCatalogue) {
  'use strict';

  const { sheets, groups } = FeedCatalogue.data;

  const sheetsByN = Object.fromEntries(sheets.map((sheet) => [sheet.n, sheet]));
  const groupsById = Object.fromEntries(groups.map((group) => [group.id, group]));

  const products = (() => {
    const byHsn = {};
    for (const sheet of sheets) {
      for (const p of sheet.products) {
        if (!byHsn[p.hsn]) byHsn[p.hsn] = { hsn: p.hsn, name: p.name, type: p.type, exp: p.exp, imp: p.imp, sheets: [] };
        byHsn[p.hsn].sheets.push(sheet.n);
      }
    }
    return Object.values(byHsn).map((row) => {
      // Main family (used for sorting) is never the pickles family
      const notPickles = row.sheets.filter((n) => sheetsByN[n].name !== 'Pickles & Chutneys');
      const main = row.sheets.length > 1 ? (notPickles[0] ?? row.sheets[0]) : row.sheets[0];
      return {
        ...row,
        net: +(row.exp - row.imp).toFixed(2),
        main,
        search: `${row.name} ${row.type} ${row.hsn} ${row.sheets.map((n) => sheetsByN[n].name).join(' ')}`.toLowerCase(),
      };
    });
  })();

  const sheetsOfHsn = Object.fromEntries(products.map((p) => [p.hsn, p.sheets]));

  FeedCatalogue.catalogue = { sheets, groups, sheetsByN, groupsById, products, sheetsOfHsn };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
