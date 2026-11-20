/* Entry point: starts every part of the page once it has been parsed. Loaded last. */
(function (FeedCatalogue) {
  'use strict';

  const { components, compare } = FeedCatalogue;

  [
    compare, // the Compare ticks, wherever they are drawn
    components.stickyBar,
    components.sheetViewer,
    // Last: the toolbar, group tiles and the three panels, wired together
    components.explorer,
  ].forEach((part) => {
    try {
      part.init();
    } catch (error) {
      console.error(error);
    }
  });
})((window.FeedCatalogue = window.FeedCatalogue || {}));
