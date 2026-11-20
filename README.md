# FEED Export Product Catalogue – static HTML / CSS / JS

Plain HTML, CSS and JavaScript version of the FEED Export Product Catalogue React (Vite) app. No build step, no framework and no `npm install`. It looks and behaves like the React app at every screen size, from a 320px phone to a 4K screen.

## Run it

- **Quick look:** double-click `index.html`. Everything works from `file://`, because the scripts are classic deferred scripts (not ES modules) and the data is JavaScript (not fetched JSON).
- **Local server**, from this folder:

  ```bash
  npx serve .
  ```

  then open http://localhost:3000.
- **Deploy:** upload the whole folder to any static host (Netlify, Vercel, GitHub Pages, S3, Nginx, Apache). No rewrite rules are needed.
- **Every screen size at once:** double-click `dev/screens.html`. It shows the live page at 14 sizes, from a 320px phone to a 4K monitor (including a landscape phone), each one scrollable and clickable. The chips at the top jump to a size. It's a helper for checking layouts; leave the `dev/` folder out when deploying.

## What's on the page

| Area | What it shows | Behaviour |
| --- | --- | --- |
| Hero | title, the society's name, 56 families · 10 groups · 461 HSN products, total export and import FY26, food-spread picture | one screen tall on desktops, but never taller than the picture, so there is no empty band above it on any screen. On tablets and phones the text sits above the picture and the hero is exactly as tall as both (24–40px margin above the title) |
| Pinned bar | Product Families · Product Index · Compare tabs with counts, and the search box | stays at the top while the page scrolls (gets a shadow once pinned) |
| **Product Families** | "All 10 groups" + 10 group tiles, then one card per family: number, group, HS line, infographic, Compare tick, Export / Import / Net | search by product, family or HSN code (digits only = HSN search, matching products listed on the card); group tiles filter; **Sort by** (family number, export, import, net, product count, name); **View as** Grid or Table. Clicking a picture (or a row's eye) opens the viewer |
| **Product Index** | all 461 HSN products: code, name, type, export, import, net, family, Compare | filter by group and type; **Sort by** or click a column heading (again to reverse); the eye opens the family with that HSN code highlighted. Tablets and phones show each product as a card |
| **Compare** | up to 6 ticked families side by side: picture, group, products, export and import with bars, net, export as a multiple of imports | ticks anywhere on the page stay in step; kept in this browser (survives a reload); × removes one, **Clear all** empties it |
| Viewer | full-screen family picture with its products panel | wheel / pinch to zoom, drag to move, double-click to zoom in; − + Fit 100% buttons; keys `+` `-` `0`, `←` `→` for the previous / next family, `Esc` closes. Panel: totals, a note when HSN codes also sit in other families (with links), a filter, copy HSN, **Compare** and **Download image** |

## Screen sizes

All layouts are in CSS media queries and container queries; the breakpoints are listed at the top of `css/base/variables.css`.

| Width | Layout |
| --- | --- |
| ≥ 2000px | 4 family cards per row |
| 1001 – 1999px | 3 cards per row, 5 group tiles per row, full Product Index table with Group, Type and Sort by on one row |
| ≤ 1100px | 3 group tiles per row |
| ≤ 1000px | Product Index rows become cards (2 per row); Group, Type and Sort by in three equal columns |
| ≤ 999px | 2 family cards per row |
| 641 – 900px, upright | hero text uses the full width: title on one line, the five figures in one row (from 700px), picture below |
| 600 – 900px, on its side | hero text on the left, picture on the right |
| ≤ 900px | Compare rows stack; viewer tool labels hidden |
| ≤ 760px | viewer: products panel under the picture |
| ≤ 720px | section tabs show the icon above the label, count in the corner |
| ≤ 640px | hero text above the picture; 2 group tiles per row; navy panels run edge to edge; Product Index dropdowns one per row |
| ≤ 560px | 1 family card per row; Sort by and View as side by side |
| ≤ 420px | hero rupee figures get a full row each |
| landscape phones (height ≤ 500px) | viewer: picture and panel side by side, slim top bar |

Cards that sit side by side always line up: the family cards share their heading / picture / figures rows with their neighbours, and the Product Index cards share their HSN / name / figures / family rows (CSS subgrid), so pictures, Compare ticks, eye buttons and figures sit at the same height across a row.

Also: 16px search fields (no iOS zoom on tap), safe-area padding for notched phones, no hover lifts on touch screens, and no motion for people who ask for reduced motion.

## Project structure

```
htmlProductCatalogue/
├── index.html                    # the page: hero, explorer (3 panels), viewer <dialog>, inline icon sprite
├── README.md
├── .editorconfig
├── .gitignore
├── dev/screens.html              # helper: the page at 14 screen sizes side by side (not part of the site)
├── assets/
│   ├── icons/favicon.svg
│   └── images/
│       ├── hero/hero-produce.png         # food spread in the hero
│       └── sheets/sheet-01.jpg … 56.jpg  # one infographic per product family (800 × 875)
├── css/
│   ├── base/
│   │   ├── variables.css         # design tokens (colours, font, radii, gradients) + breakpoint list
│   │   ├── reset.css             # small modern reset, [hidden] always wins
│   │   └── base.css              # body, .icon, .sr-only, skip link, <mark>, reduced motion
│   ├── layout/
│   │   └── explorer.css          # explorer shell, pinned bar, navy panel frame
│   ├── components/
│   │   ├── section-heading.css   # icon + title + description
│   │   ├── toolbar.css           # section tabs + search
│   │   ├── group-panel.css       # "All groups" + group tiles
│   │   ├── sheet-card.css        # family card + animated trade icons
│   │   ├── sheet-table.css       # families table view
│   │   └── sheet-viewer.css      # full-screen viewer
│   └── sections/
│       ├── hero.css
│       ├── product-families.css  # Sort by / View as, card grid, empty state
│       ├── product-index.css
│       └── compare.css
└── js/
    ├── utils/
    │   ├── dom.js                # $, $$, escapeHtml, icon(), highlight(), debounce, safe storage
    │   └── formatters.js         # ₹ formatting (Indian grouping), family numbers, picture paths
    ├── data/
    │   ├── catalogue-sheets.js   # the 56 families and their products (FY 2025-26)
    │   └── catalogue-content.js  # totals, Compare limit, the 10 groups
    ├── services/
    │   ├── catalogue-index.js    # lookups: families by number, groups by id, the 461 HSN products
    │   ├── sheet-search.js       # search + sort of families
    │   └── compare-store.js      # the Compare selection (localStorage) and every Compare tick
    ├── components/
    │   ├── sticky-bar.js         # pinned-bar shadow
    │   ├── sheet-viewer.js       # full-screen viewer
    │   ├── toolbar.js            # tabs + search
    │   ├── group-panel.js        # group tiles
    │   ├── product-families.js   # cards / table
    │   ├── product-index.js      # Product Index table
    │   ├── compare-view.js       # Compare panel
    │   └── explorer.js           # wires the toolbar, groups and panels together
    └── main.js                   # starts everything
```

Scripts share one global, `window.FeedCatalogue`, and load in the order listed in `index.html` (utils → data → services → components → main).

## Changing the content

- **Figures and products:** edit `js/data/catalogue-sheets.js`. Each family is `{ n, name, group, hs, exp, imp, products: [{ hsn, name, type, exp, imp }] }`, figures in ₹ crore. A family's picture is `assets/images/sheets/sheet-NN.jpg`.
- **Groups:** edit `js/data/catalogue-content.js` (name, icon, colour, counts). Icons are the `<symbol>` ids in the sprite at the top of `index.html`, without `i-`.
- **Hero figures:** they're plain text in `index.html`.
- **Colours and font:** `css/base/variables.css`.

## Browser support

Current Chrome, Edge, Firefox and Safari (desktop and mobile). The page uses `<dialog>`, container queries, `:has()`, `color-mix()` and `svh` units, which all of them support.

## Notes

- The search box filters the **Product Families** panel; the Product Index lists every product and has its own Group / Type filters (as in the React app).
- **Download image** saves the picture straight away when the page is served over http(s). Opened from `file://`, the browser may open the picture in a new tab instead, where it can be saved.
- The Ubuntu font comes from Google Fonts; offline, the page falls back to the system font.
