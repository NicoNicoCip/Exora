/**
 * InfiniCardHolder — RecyclerView-style infinite card carousel.
 *
 * Uses N card nodes (no cloning) positioned in a virtual ring via per-card
 * translate3d. Supports snap-to-card, velocity fling, and smooth time-based
 * easing. Inspired by Android's ViewPager2 / RecyclerView pattern.
 */
class InfiniCardHolder extends HTMLElement {

    /* ── constants ── */
    static FLING_THRESHOLD = 0.3;   // px/ms  – minimum cursor velocity to fling
    static SNAP_DURATION   = 300;   // ms     – default snap animation length
    static ARROW_HOLD_MS   = 400;   // ms     – repeat delay when holding an arrow
    static DRAG_LOCK_PX    = 5;     // px     – movement before drag is recognised

    /* ── lifecycle ── */

    constructor() {
        super();

        // adapter
        this.cardCount = 0;
        this.cardNodes = [];

        // layout
        this.cardWidths    = [];
        this.cardPositions = [];
        this.totalWidth    = 0;
        this.holderWidth   = 0;

        // scroll
        this.scrollOffset = 0;
        this.currentIndex = 0;

        // animation
        this._animId    = 0;
        this._animating = false;

        // drag
        this._dragging      = false;
        this._dragStartX    = 0;
        this._dragStartY    = 0;
        this._dragStartOff  = 0;
        this._dragHoriz     = null;
        this._dragMoved     = false;

        // velocity tracker (last N samples)
        this._velSamples = [];

        // dom refs
        this._els = {};

        // arrow hold
        this._arrowTimer = null;

        // bound handlers (for add/removeEventListener)
        this._onDrag    = this._handleDrag.bind(this);
        this._onDragEnd = this._handleDragEnd.bind(this);
    }

    connectedCallback() {
        const cards = Array.from(this.querySelectorAll(':scope > ex-infcard'));
        if (cards.length === 0) return;

        this.cardCount = cards.length;
        this._render(cards);
        this._setupEvents();
        this._waitForImages().then(() => this._measure());
    }

    disconnectedCallback() {
        document.removeEventListener('mousemove', this._onDrag);
        document.removeEventListener('mouseup',   this._onDragEnd);
        document.removeEventListener('touchmove',  this._onDrag);
        document.removeEventListener('touchend',   this._onDragEnd);
        clearInterval(this._arrowTimer);
        this._animating = false;
    }

    /* ── render ── */

    _render(cards) {
        const container = document.createElement('div');
        container.className = 'scroll-container';

        this.cardNodes = [];
        for (let i = 0; i < this.cardCount; i++) {
            const card = cards[i].cloneNode(true);
            card.dataset.idx = i;
            container.appendChild(card);
            this.cardNodes.push(card);
        }

        const leftArrow  = this._btn('nav-arrow nav-arrow-left',  'Previous card');
        const rightArrow = this._btn('nav-arrow nav-arrow-right', 'Next card');

        const dots = document.createElement('div');
        dots.className = 'dots-container';
        for (let i = 0; i < this.cardCount; i++) {
            const dot = this._btn('dot', `Go to card ${i + 1}`);
            dot.dataset.index = i;
            dots.appendChild(dot);
        }

        this.innerHTML = '';
        this.append(container, leftArrow, rightArrow, dots);
        this._els = { container, leftArrow, rightArrow, dots };
    }

    _btn(cls, label) {
        const b = document.createElement('button');
        b.className = cls;
        b.setAttribute('aria-label', label);
        return b;
    }

    /* ── measurement ── */

    _measure() {
        const c = this._els.container;
        if (!c) return;

        this.holderWidth = this.getBoundingClientRect().width;

        // reset cards to normal flow so we can measure natural widths
        c.style.position = '';
        for (const card of this.cardNodes) {
            card.style.position  = '';
            card.style.transform = '';
            card.style.left      = '';
            card.style.top       = '';
        }
        c.offsetHeight; // force reflow

        this.cardWidths    = [];
        this.cardPositions = [];
        let x = 0;
        for (let i = 0; i < this.cardCount; i++) {
            const w = this.cardNodes[i].getBoundingClientRect().width;
            this.cardWidths.push(w);
            this.cardPositions.push(x);
            x += w;
        }
        this.totalWidth = x;

        // switch to absolute positioning for virtual layout
        c.style.position = 'relative';
        for (const card of this.cardNodes) {
            card.style.position = 'absolute';
            card.style.top      = '0';
            card.style.height   = '100%';
        }

        // re-centre on the current card (preserves index across resizes)
        const idx = Math.min(this.currentIndex, this.cardCount - 1);
        const cc  = this.cardPositions[idx] + this.cardWidths[idx] / 2;
        this.scrollOffset = cc - this.holderWidth / 2;
        this.currentIndex = idx;
        this._layout();
        this._dots();
    }

    /* ── virtual-ring layout (the core RecyclerView trick) ── */

    _layout() {
        const tw = this.totalWidth;
        if (tw === 0) return;

        const viewCentre = this.holderWidth / 2;

        for (let i = 0; i < this.cardCount; i++) {
            const cw = this.cardWidths[i];

            // where this card sits relative to the left edge of the viewport
            let sx = this.cardPositions[i] - this.scrollOffset;

            // normalise into [0, totalWidth)
            sx = ((sx % tw) + tw) % tw;

            // pick the wrap (sx or sx-tw) whose card centre is closest to
            // the viewport centre — this handles both left and right overflow
            const c0 = sx + cw / 2;          // centre if we keep sx
            const c1 = c0 - tw;              // centre if we wrap left
            if (Math.abs(c1 - viewCentre) < Math.abs(c0 - viewCentre)) sx -= tw;

            this.cardNodes[i].style.transform = `translate3d(${sx}px, 0, 0)`;
        }
    }

    /* ── snap target finder ── */

    _snapTarget(offset) {
        const tw = this.totalWidth;
        if (tw === 0) return { index: 0, offset: 0 };

        const vc = offset + this.holderWidth / 2;   // viewport centre

        let bestIdx  = 0;
        let bestDist = Infinity;
        let bestOff  = offset;

        for (let i = 0; i < this.cardCount; i++) {
            const cc = this.cardPositions[i] + this.cardWidths[i] / 2; // card centre
            const k  = Math.round((vc - cc) / tw);                    // nearest wrap
            const sc = cc + k * tw;                                    // snapped centre
            const d  = Math.abs(sc - vc);
            if (d < bestDist) {
                bestDist = d;
                bestIdx  = i;
                bestOff  = sc - this.holderWidth / 2;
            }
        }
        return { index: bestIdx, offset: bestOff };
    }

    /* ── animation (time-based ease-out cubic) ── */

    _animateTo(target, duration = InfiniCardHolder.SNAP_DURATION) {
        this._animId++;
        const id    = this._animId;
        const start = this.scrollOffset;
        const delta = target - start;
        const t0    = performance.now();
        this._animating = true;

        const step = (now) => {
            if (this._animId !== id) return;          // cancelled

            const p = Math.min((now - t0) / duration, 1);
            const e = 1 - Math.pow(1 - p, 3);        // ease-out cubic

            this.scrollOffset = start + delta * e;
            this._layout();

            if (p < 1) {
                requestAnimationFrame(step);
            } else {
                this.scrollOffset = target;
                this._layout();
                this._animating = false;
                this._updateIndex();
            }
        };
        requestAnimationFrame(step);
    }

    /* ── fling + snap ── */

    _flingSnap(cursorVel) {
        // cursorVel is px/ms of cursor movement (positive = dragging right)
        // scrollOffset moves opposite to cursor
        if (Math.abs(cursorVel) < InfiniCardHolder.FLING_THRESHOLD) {
            // no fling — snap from current position
            const s = this._snapTarget(this.scrollOffset);
            this.currentIndex = s.index;
            this._dots();
            this._animateTo(s.offset);
            return;
        }

        // project where a decelerated fling would end
        const scrollVel = -cursorVel;                       // invert for scroll direction
        const flingDist = (scrollVel * Math.abs(scrollVel)) / (2 * 0.003);
        const projected = this.scrollOffset + flingDist;

        const s = this._snapTarget(projected);
        this.currentIndex = s.index;
        this._dots();

        const dist = Math.abs(s.offset - this.scrollOffset);
        const dur  = Math.min(Math.max(dist / Math.abs(scrollVel), 200), 600);
        this._animateTo(s.offset, dur);
    }

    /* ── drag handling ── */

    _handleDragStart(e) {
        if (e.target.closest('.nav-arrow, .dots-container')) return;

        // cancel any running animation
        this._animId++;
        this._animating = false;

        this._dragging     = true;
        this._dragHoriz    = null;
        this._dragMoved    = false;
        this._dragStartX   = this._ex(e);
        this._dragStartY   = this._ey(e);
        this._dragStartOff = this.scrollOffset;
        this._velSamples   = [{ x: this._dragStartX, t: performance.now() }];

        this.style.cursor = 'grabbing';
        if (e.type === 'mousedown') e.preventDefault();
    }

    _handleDrag(e) {
        if (!this._dragging) return;

        const cx = this._ex(e);
        const cy = this._ey(e);
        const dx = cx - this._dragStartX;
        const dy = cy - this._dragStartY;

        // decide direction on first significant movement
        if (this._dragHoriz === null && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
            this._dragHoriz = Math.abs(dx) > Math.abs(dy);
        }
        if (this._dragHoriz === false) {
            this._dragging = false;
            this.style.cursor = '';
            return;
        }

        if (this._dragHoriz && Math.abs(dx) > InfiniCardHolder.DRAG_LOCK_PX) {
            this._dragMoved = true;
            e.preventDefault();

            // velocity sample
            const now = performance.now();
            this._velSamples.push({ x: cx, t: now });
            if (this._velSamples.length > 5) this._velSamples.shift();

            // update offset (drag right → decrease scrollOffset)
            this.scrollOffset = this._dragStartOff - dx;
            this._layout();
            this._updateIndex();
        }
    }

    _handleDragEnd() {
        if (!this._dragging) return;
        this._dragging  = false;
        this._dragHoriz = null;
        this.style.cursor = '';

        if (this._dragMoved) {
            const v = this._velocity();
            this._flingSnap(v);
        }
    }

    /* ── velocity tracker ── */

    _velocity() {
        const s = this._velSamples;
        if (s.length < 2) return 0;
        const dt = s[s.length - 1].t - s[0].t;
        if (dt === 0) return 0;
        return (s[s.length - 1].x - s[0].x) / dt;   // px/ms
    }

    /* ── per-card navigation (arrows + dots) ── */

    _goTo(index, direction = 0) {
        if (index < 0 || index >= this.cardCount) return;
        this.currentIndex = index;
        this._dots();

        const cc  = this.cardPositions[index] + this.cardWidths[index] / 2;
        const vc  = this.scrollOffset + this.holderWidth / 2;
        const tw  = this.totalWidth;
        let   k   = Math.round((vc - cc) / tw);
        let   off = cc + k * tw - this.holderWidth / 2;

        // force direction: +1 = must scroll forward, -1 = must scroll backward
        if (direction > 0 && off <= this.scrollOffset) off += tw;
        if (direction < 0 && off >= this.scrollOffset) off -= tw;

        this._animateTo(off, 350);
    }

    _next() { this._goTo((this.currentIndex + 1) % this.cardCount,  1); }
    _prev() { this._goTo((this.currentIndex - 1 + this.cardCount) % this.cardCount, -1); }

    /* ── dots ── */

    _dots() {
        if (!this._els.dots) return;
        this._els.dots.querySelectorAll('.dot').forEach((d, i) => {
            d.classList.toggle('active', i === this.currentIndex);
        });
    }

    _updateIndex() {
        const s = this._snapTarget(this.scrollOffset);
        if (s.index !== this.currentIndex) {
            this.currentIndex = s.index;
            this._dots();
        }
    }

    /* ── events ── */

    _setupEvents() {
        // drag
        this.addEventListener('mousedown',  this._handleDragStart.bind(this));
        this.addEventListener('touchstart', this._handleDragStart.bind(this), { passive: true });
        document.addEventListener('mousemove', this._onDrag);
        document.addEventListener('mouseup',   this._onDragEnd);
        document.addEventListener('touchmove', this._onDrag, { passive: false });
        document.addEventListener('touchend',  this._onDragEnd);

        // arrows — advance 1 card
        const bind = (arrow, fn) => {
            ['mousedown', 'touchstart'].forEach(t => {
                arrow.addEventListener(t, (e) => {
                    e.stopPropagation(); e.preventDefault();
                    fn();
                    clearInterval(this._arrowTimer);
                    this._arrowTimer = setInterval(fn, InfiniCardHolder.ARROW_HOLD_MS);
                });
            });
            ['mouseup', 'mouseleave', 'touchend'].forEach(t => {
                arrow.addEventListener(t, () => {
                    clearInterval(this._arrowTimer);
                    this._arrowTimer = null;
                });
            });
        };
        bind(this._els.leftArrow,  () => this._prev());
        bind(this._els.rightArrow, () => this._next());

        // dots
        this._els.dots.addEventListener('click', (e) => {
            if (e.target.classList.contains('dot'))
                this._goTo(parseInt(e.target.dataset.index));
        });

        // resize
        if (window.ResizeObserver) {
            new ResizeObserver(() => {
                if (!this._dragging && !this._animating) this._measure();
            }).observe(this);
        }

        this.addEventListener('contextmenu', e => e.preventDefault());
    }

    /* ── helpers ── */

    _waitForImages() {
        const imgs = this._els.container?.querySelectorAll('img') || [];
        return Promise.all(Array.from(imgs).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(r => {
                img.addEventListener('load',  r, { once: true });
                img.addEventListener('error', r, { once: true });
            });
        }));
    }

    _ex(e) { return e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; }
    _ey(e) { return e.type.includes('mouse') ? e.clientY : e.touches[0].clientY; }
}

customElements.define('ex-infcard-holder', InfiniCardHolder);
