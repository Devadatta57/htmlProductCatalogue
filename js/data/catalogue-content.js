/*
  Catalogue totals and the 10 product groups, from the FEED Export Catalogue Explorer
  (FY 2025-26, FEED KYJ product master list). The families themselves are in catalogue-sheets.js.
  Group icons are symbol ids in the sprite at the top of index.html, without the "i-" prefix.
*/
(function (FeedCatalogue) {
  'use strict';

  FeedCatalogue.data = Object.assign(FeedCatalogue.data || {}, {
    totals: {
      sheets: 56, // product families
      products: 461, // unique HSN codes across all product families
    },

    /* How many families Compare holds at once */
    compareLimit: 6,

    /* `sheets` = product families in the group, `products` = unique HSN codes */
    groups: [
      { id: '1', name: 'Seafood & Animal Products', icon: 'fish', color: '#1B9AAA', sheets: 3, products: 20 },
      { id: '2', name: 'Vegetables, Tubers & Pulses', icon: 'leaf', color: '#5BAA2C', sheets: 8, products: 57 },
      { id: '3', name: 'Fruits & Nuts', icon: 'apple', color: '#F08A24', sheets: 10, products: 81 },
      { id: '4', name: 'Spices', icon: 'chili', color: '#C73E3A', sheets: 11, products: 68 },
      { id: '5', name: 'Cereals & Flour Products', icon: 'wheat', color: '#B8921B', sheets: 5, products: 58 },
      { id: '6', name: 'Oilseeds & Edible Oils', icon: 'drop', color: '#8A6A12', sheets: 7, products: 42 },
      { id: '7', name: 'Plantation Crops', icon: 'sprout', color: '#7A4B2A', sheets: 4, products: 65 },
      { id: '8', name: 'Medicinal Plants, Gums, Extracts & Oils', icon: 'medical', color: '#2F7D6B', sheets: 5, products: 48 },
      { id: '9', name: 'Prepared Foods & Beverages', icon: 'cup', color: '#7A4EA3', sheets: 1, products: 4 },
      { id: '10', name: 'Seeds & Flowers', icon: 'flower', color: '#D1457F', sheets: 2, products: 19 },
    ],
  });
})((window.FeedCatalogue = window.FeedCatalogue || {}));
