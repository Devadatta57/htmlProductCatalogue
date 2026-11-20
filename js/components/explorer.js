/*
  Catalogue explorer: keeps what the visitor has chosen (section tab, search text, group, sort
  order, grid or table) and tells the panels to redraw. Tabs:
    families  Product Families: group tiles + family cards / table (search and groups apply here)
    index     Product Index: all 461 HSN products
    compare   Compare: the ticked families side by side
*/
(function (FeedCatalogue) {
  'use strict';

  const { utils, compare } = FeedCatalogue;
  const components = (FeedCatalogue.components = FeedCatalogue.components || {});
  const { $, $$, prefersReducedMotion } = utils;

  const state = { tab: 'families', query: '', group: 'all', sort: 'n', view: 'grid' };
  let section;

  // If the page is scrolled down into the panel, jump back to its top (right under the bar)
  function scrollToResults() {
    if (section && section.getBoundingClientRect().top < 0) {
      section.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }

  const renderFamilies = () => components.productFamilies.render(state);

  function setTab(tab) {
    state.tab = tab;
    components.toolbar.setActiveTab(tab);
    $$('[data-panel]', section).forEach((panel) => {
      panel.hidden = panel.dataset.panel !== tab;
    });
    if (tab === 'index') components.productIndex.activate();
    scrollToResults();
  }

  function init() {
    section = $('#explorer');
    if (!section) return;

    const steps = [
      () =>
        components.toolbar.init({
          onTabChange: setTab,
          onQuery: (text) => {
            if (text === state.query) return;
            state.query = text;
            renderFamilies();
          },
          onSubmit: scrollToResults,
        }),
      () =>
        components.groupPanel.init({
          onChange: (groupId) => {
            state.group = groupId;
            components.groupPanel.setActive(groupId);
            renderFamilies();
            scrollToResults();
          },
        }),
      () =>
        components.productFamilies.init({
          onSortChange: (sort) => {
            state.sort = sort;
            renderFamilies();
          },
          onViewChange: (view) => {
            state.view = view;
            renderFamilies();
            scrollToResults();
          },
        }),
      () => components.productIndex.init(),
      () => components.compareView.init({ goToFamilies: () => setTab('families') }),
      () => {
        // The Compare tab's badge follows the selection
        components.toolbar.setCount('compare', compare.ids().length);
        compare.subscribe((ids) => components.toolbar.setCount('compare', ids.length));
      },
      renderFamilies,
    ];

    steps.forEach((step) => {
      try {
        step();
      } catch (error) {
        // One broken part shouldn't take the rest of the catalogue down with it
        console.error(error);
      }
    });
  }

  components.explorer = { init, setTab };
})((window.FeedCatalogue = window.FeedCatalogue || {}));
