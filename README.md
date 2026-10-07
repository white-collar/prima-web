# PRIMA Web — spheroidal geodesy in the browser

[![Test and deploy](https://github.com/white-collar/prima-web/actions/workflows/pages.yml/badge.svg)](https://github.com/white-collar/prima-web/actions/workflows/pages.yml)

**English** | [Українська](README.uk.md)

**Open the app: https://white-collar.github.io/prima-web/**

A web version of `PRIMA.EXE`, the DOS program *«Решение задач сфероидической геодезии»*
(Solving problems of spheroidal geodesy, Borland Pascal 7, 1992). It solves the classical
problems of spheroidal geodesy on the **Krasovsky 1940** ellipsoid. The calculation engine is a
port of [prima-go](https://github.com/white-collar/prima-go), whose formulas were recovered from
the original executable and verified against it.

## Features

- All 13 screens of the original, in the same menu tree:
  - **Ellipsoid elements:** radii N, M, R, rB and RA; meridian and parallel arcs; survey trapezoid frames and area.
  - **Main geodetic problems:** direct problem (Schreiber, Runge–Kutta–Merson) and inverse problem (mid-latitude formulas).
  - **Coordinate conversion:** Gauss–Krüger in both directions, meridian convergence, ellipsoid → plane corrections.
- A **?** next to each title shows a short explanation of the method and its formulas.
- Editable tables, as in the original: results appear as soon as a row is complete. <kbd>Enter</kbd> moves to the next cell.
- Angles can be typed as `55 45 10.5`, `55°45'10.5"` or `55.7529`.
- English, Russian and Ukrainian interface; light and dark theme; works on phones.
- Tables are saved in your browser. CSV import/export (opens in Excel) and print.
- Plain HTML, CSS and JavaScript: no build step, no dependencies, no server.

## Original authors

| Role | Author |
|---|---|
| Author of the interface and most of the routines | **Бартенева А.В.** (A.V. Barteneva), group ПГ-90 |
| Author of individual routines | **Воронова В.И.** (V.I. Voronova), group ПГ-88 |
| Author of individual routines | **Котолуп Т.Ф.** (T.F. Kotolup), group ПГ-88 |
| Project supervisor | **Гавриленко Ю.Н.** (Yu.N. Gavrilenko), Doctor of Science, professor of the Department of Geoinformatics and Geodesy, [Donetsk National Technical University (DonNTU)](https://donntu.edu.ua) |

The algorithms and the structure of the program are theirs; this is a port made for learning.

## Layout

| Path | Contents |
|---|---|
| `index.html`, `css/style.css` | page and styles |
| `js/geodesy.js` | calculation engine (port of `prima-go/geodesy`) |
| `js/screens.js` | menu tree, table columns, example rows, what each screen computes |
| `js/help.js` | short theory and formulas for the "?" popover of each screen |
| `js/i18n.js` | interface texts in EN / RU / UA |
| `js/app.js` | tree menu, table editor, language and theme switching |
| `tests/` | engine tests and their reference data |

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Tests

The engine is checked two ways:

- against **350 reference results from the Go port**, to 10⁻¹¹ relative precision;
- against **47 results displayed by the original PRIMA.EXE** (run in DOSBox-X), within its display rounding.

```bash
node --test tests/*.test.js
```

Every push to `main` runs the tests and, if they pass, publishes the site to GitHub Pages.

## Differences from the original

- **Plane → geodetic keeps the sign of y.** The original used `|Y − Y0|`, so it always gave a positive `l`. This version also takes `L0` and shows `L = L0 + l`.
- **No data files.** Instead of the original's `*.LB1`…`*.LBB` files, tables are kept in the browser and can be exported to CSV.
