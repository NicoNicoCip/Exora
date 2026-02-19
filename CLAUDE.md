# EXORA Bistro — Project Guide

## What this is
Static restaurant website for EXORA Bistro (Benicassim, Spain). No build step, no bundler.
4 pages: root (redirect), /home/, /menu/, /reserves/. Multi-language (en/es/ro).

## Folder structure
```
/
├── index.html              meta-refresh redirect to /home/
├── home/index.html         homepage (hero, carousels, about sections)
├── menu/index.html         full menu with allergen icons
├── reserves/
│   ├── index.html          reservation form
│   ├── send.php            server-side mailer (DO NOT TOUCH)
│   └── logs/
└── src/
    ├── scripts/            all JS modules (ES modules, type="module")
    ├── styles/             all CSS (general.css shared, others page-specific)
    ├── images/             all images (kebab-case names)
    │   ├── allergy-icons/  allergen icon webps
    │   └── splash/         food/venue photography
    ├── fonts/              Montserrat + Playfair Display (woff2)
    └── translations/       translations.{en,es,ro}.json
```

## Naming conventions

| What | Convention | Example |
|------|-----------|---------|
| Files & folders | kebab-case | `ex-main.js`, `allergy-icons/`, `olive-leaves.webp` |
| CSS classes | kebab-case | `.menu-item`, `.btn-action`, `.art-deco-diamond` |
| CSS variables | kebab-case with prefix | `--c-gold`, `--spacing-lg`, `--font-size-h1` |
| HTML ids | kebab-case | `#pop-contact`, `#loading-screen`, `#reserve-form` |
| Custom element tags | `ex-` prefix, kebab-case | `ex-main`, `ex-popup`, `ex-infcard-holder` |
| JS class names | PascalCase, `Ex` prefix matching tag | `ExMain`, `ExPopup`, `ExInfcardHolder` |
| JS public methods | camelCase, no prefix | `show()`, `hide()`, `close()`, `connectedCallback()` |
| JS private methods | camelCase, `_` prefix | `_render()`, `_measure()`, `_bindEvents()` |
| JS variables | camelCase | `cardCount`, `scrollOffset`, `currentIndex` |
| JS constants | UPPER_CASE | `FLING_THRESHOLD`, `SNAP_DURATION` |
| Semicolons | **None** — no semicolons in any JS file |
| Translation keys | camelCase with prefix | `menu_seaBass`, `alergy_celery` (note: "alergy" is one L, intentional) |

## Custom elements registry

| Tag | Class | File | Notes |
|-----|-------|------|-------|
| `ex-main` | `ExMain` | `ex-main.js` | Renders header, footer, nav, popups via `outerHTML` replacement |
| `ex-popup` | `ExPopup` | `ex-popup.js` | Modal popup system. `PopupManager` singleton also in this file |
| `ex-translate` | `ExTranslate` | `ex-translate.js` | Replaces `@T:key` patterns from JSON translation files |
| `ex-line` | `ExLine` | `line.js` | Decorative line, uses Shadow DOM |
| `ex-loading` | `ExLoading` | `loading.js` | Loading screen with readiness polling |
| `ex-menu` | `ExMenu` | `menu.js` | Processes `<item>/<name>/<price>/<allergens>` into styled cards |
| `ex-nav-button` | `ExNavButton` | `nav-button.js` | Smooth-scrolls to matching `ex-nav-header` |
| `ex-nav-header` | `ExNavHeader` | `nav-button.js` | Invisible scroll anchor target |
| `ex-infcard-holder` | `ExInfcardHolder` | `infini-cards.js` | Infinite carousel with virtual ring layout |
| `ex-infcard` | (none) | — | NOT a registered element — semantic tag styled by CSS only |

## CSS architecture
- Two-tier variable system: base values (`--base-*`) computed into semantic tokens (`--spacing-*`, `--c-*`, etc.)
- `general.css` is shared across all pages — contains variables, reset, header, footer, popups, shared components
- Page-specific files (`index.css`, `menu.css`, `reserves.css`) only add/override for that page
- Breakpoints: 480px (small phone), 768px (tablet), 1024px (desktop), 1600px (ultra-wide)
- Colors: `--c-green-aqua` (dark bg), `--c-green-normal`, `--c-gold`, `--c-light-gold`
- Fonts: Playfair Display (headings), Montserrat (body)

## Translation system
- HTML uses `@T:keyName` syntax
- `ex-translate.js` loads JSON from `src/translations/translations.{lang}.json`
- Language stored in localStorage, auto-detected from browser
- Translation JSON has duplicate `"-----COMMENT-----"` keys — expected, not a bug
- Allergen key prefix is `alergy_` (one L) — misspelled intentionally, keep consistent

## Critical gotchas
- `ex-main` renders via `this.outerHTML` — destroys itself, re-parents children into `<main>`
- `ex-infcard` is NOT a registered custom element — just a semantic tag styled by CSS
- Footer `#links` has `width: 600%` — intentional, contained via `overflow: clip` + `contain: layout`
- The 3000px clock-hand height is intentional (decorative)
- `--spacing-3xl` is very large on mobile — use `2xl` or smaller for tight mobile spacing
- Popups are rendered by `ex-main.js` — do NOT add popup HTML to page files
- `page-effects.js` handles clock rotation and header scroll shrink — separate from `ex-main.js`
- `squircle.js` clips elements with superellipse corners — targets are defined in its TARGETS array
- `send.php` is server-side and should not be modified during frontend work
- `loading-critical.css` must load before any JS — it provides the pre-JS loading spinner

## Shared CSS classes
- `.btn-action` — green action button (consent accept, confirm yes)
- `.btn-ghost` — outlined ghost button (consent reject, confirm no)
- `.empty-infocard` — content card with gold background
- `.art-deco-diamond` — decorative divider
- `.spacer` / `.spacer-super` — vertical spacing elements
