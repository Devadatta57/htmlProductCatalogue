/* Number formatting in the Indian style (lakh / crore grouping). */
(function (FeedCatalogue) {
  'use strict';

  const inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /** 48482.38 → "48,482.38" (table figures, ₹ crore) */
  const formatCr = (value) => inr.format(value);

  /** 48482.38 → "₹48,482.38"; negatives get a real minus sign: "−₹23,632.24" */
  const formatRupees = (value) => `${value < 0 ? '−' : ''}₹${inr.format(Math.abs(value))}`;

  /** 1 → "01" */
  const sheetNumber = (n) => String(n).padStart(2, '0');

  /** Picture of a family: assets/images/sheets/sheet-01.jpg */
  const sheetImage = (n) => `assets/images/sheets/sheet-${sheetNumber(n)}.jpg`;

  FeedCatalogue.format = { formatCr, formatRupees, sheetNumber, sheetImage };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
