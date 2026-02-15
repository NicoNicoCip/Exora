/**
 * Squircle — Apple-style superellipse corners via clip-path.
 *
 * Two modes:
 *   1. Auto: elements matching TARGETS get squircled automatically
 *   2. Manual: add data-squircle attribute to any element
 *
 * data-squircle attributes:
 *   data-squircle              → all corners, radius from CSS --border-radius
 *   data-squircle="lg"         → --border-radius-lg
 *   data-squircle="sm"         → --border-radius-sm
 *   data-squircle="12"         → 12px radius
 *   data-squircle-corners="bl br" → only specific corners (tl, tr, bl, br)
 */

const N = 4.5;
const PTS = 10;

/* ── auto-target map: selector → { radius, corners } ── */

const TARGETS = [
    { sel: 'ex-infcard-holder',                corners: 'all',   radius: 'var' },
    { sel: '.empty-infocard',                  corners: 'all',   radius: 'var' },
    { sel: '.popup-container',                 corners: 'all',   radius: 'lg' },
    { sel: '.cookie-consent',                  corners: 'all',   radius: 'var' },
    { sel: '.menu-container',                  corners: 'all',   radius: 'var' },
    { sel: '.image-with-header > div:first-child', corners: 'bl br', radius: 4 },
    { sel: 'ex-infcard img',                   corners: 'all',   radius: 4 },
];

/* ── superellipse corner arc ── */

/**
 * Generate squircle arc points for one corner.
 * t goes 0→1, angle 0→π/2.
 * For TL: arc from (0, r) to (r, 0) curving inward.
 *   x = r * (1 - cos(a)^(2/n))   [0 at t=0, r at t=1]
 *   y = r * sin(a)^(2/n)         [0 at t=0... wait]
 *
 * Correct approach: parametric superellipse offset from corner point.
 * For TL corner at (0,0), arc goes from (0, r) to (r, 0):
 *   x = r * (1 - |cos(a)|^(2/n))
 *   y = r * (1 - |sin(a)|^(2/n))
 * At a=0: x=0, y=r → left edge ✓
 * At a=π/2: x=r, y=0 → top edge ✓
 * At a=π/4: x,y both < r/2 → curves inward ✓
 */
function arc(r, q, w, h) {
    const out = [];
    for (let i = 0; i <= PTS; i++) {
        const a = (i / PTS) * (Math.PI / 2);
        const cx = 1 - Math.pow(Math.abs(Math.cos(a)), 2 / N);
        const cy = 1 - Math.pow(Math.abs(Math.sin(a)), 2 / N);
        switch (q) {
            case 'tl': out.push([r * cx,       r * cy]);       break;  // (0,r) → (r,0)
            case 'tr': out.push([w - r * cx,    r * cy]);       break;  // (w,r) → (w-r,0)
            case 'br': out.push([w - r * cx,    h - r * cy]);   break;  // (w,h-r) → (w-r,h)
            case 'bl': out.push([r * cx,        h - r * cy]);   break;  // (0,h-r) → (r,h)
        }
    }
    return out;
}

/* ── build polygon (clockwise) ── */

function path(w, h, radius, corners) {
    const r = Math.min(radius, Math.min(w, h) / 2);
    const c = corners;
    const p = [];

    // TL: arc from (0,r)→(r,0) — already in clockwise order
    if (c.tl) { for (const pt of arc(r, 'tl', w, h)) p.push(pt); }
    else p.push([0, 0]);

    // TR: arc from (w-r,0)→(w,r) — need to reverse since arc goes (w,r)→(w-r,0)
    if (c.tr) { const a = arc(r, 'tr', w, h); for (let i = a.length - 1; i >= 0; i--) p.push(a[i]); }
    else p.push([w, 0]);

    // BR: arc from (w,h-r)→(w-r,h) — already in clockwise order
    if (c.br) { for (const pt of arc(r, 'br', w, h)) p.push(pt); }
    else p.push([w, h]);

    // BL: arc from (r,h)→(0,h-r) — need to reverse since arc goes (0,h-r)→(r,h)
    if (c.bl) { const a = arc(r, 'bl', w, h); for (let i = a.length - 1; i >= 0; i--) p.push(a[i]); }
    else p.push([0, h]);

    return `polygon(${p.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
}

/* ── resolve radius value ── */

function resolveRadius(el, spec) {
    if (typeof spec === 'number') return spec;
    const cs = getComputedStyle(el);
    if (spec === 'lg') return parseFloat(cs.getPropertyValue('--border-radius-lg')) || 8;
    if (spec === 'sm') return parseFloat(cs.getPropertyValue('--border-radius-sm')) || 2;
    // 'var' = read from --border-radius
    return parseFloat(cs.getPropertyValue('--border-radius')) || 4;
}

function parseCorners(str) {
    if (str === 'all') return { tl: true, tr: true, bl: true, br: true };
    const c = { tl: false, tr: false, bl: false, br: false };
    for (const t of str.split(/\s+/)) c[t] = true;
    return c;
}

/* ── apply squircle to one element ── */

function apply(el, radiusSpec, cornersSpec) {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w === 0 || h === 0) return;

    const r = resolveRadius(el, radiusSpec);
    const c = parseCorners(cornersSpec);
    el.style.clipPath = path(w, h, r, c);
    el.style.borderRadius = '0';
}

/* ── apply from data attribute ── */

function applyFromAttr(el) {
    const attr = el.dataset.squircle;
    let radiusSpec = 'var';
    if (attr === 'lg' || attr === 'sm') radiusSpec = attr;
    else if (attr && attr !== '') { const n = parseFloat(attr); if (!isNaN(n)) radiusSpec = n; }

    const cornersSpec = el.dataset.squircleCorners || 'all';
    apply(el, radiusSpec, cornersSpec);
}

/* ── track observed elements to avoid duplicates ── */

const observed = new WeakSet();
let ro;

function observe(el) {
    if (observed.has(el)) return;
    observed.add(el);
    if (ro) ro.observe(el);
}

/* ── scan & apply all targets ── */

function scan() {
    // Auto targets
    for (const t of TARGETS) {
        for (const el of document.querySelectorAll(t.sel)) {
            apply(el, t.radius, t.corners);
            observe(el);
            // Store config so ResizeObserver can re-apply
            el._sq = { r: t.radius, c: t.corners };
        }
    }
    // Manual data-squircle elements
    for (const el of document.querySelectorAll('[data-squircle]')) {
        applyFromAttr(el);
        observe(el);
        el._sq = null; // flag as manual
    }
}

/* ── init ── */

function init() {
    ro = new ResizeObserver(entries => {
        for (const e of entries) {
            const el = e.target;
            if (el._sq) apply(el, el._sq.r, el._sq.c);
            else if (el.hasAttribute('data-squircle')) applyFromAttr(el);
        }
    });

    // Initial scan
    scan();

    // Watch for dynamically added elements (popups, ex-main outerHTML, etc.)
    new MutationObserver(() => {
        // Debounce — batch DOM mutations
        clearTimeout(init._t);
        init._t = setTimeout(scan, 50);
    }).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // Small delay to let other custom elements render first
    requestAnimationFrame(() => requestAnimationFrame(init));
}
