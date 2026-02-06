/**
 * InfiniCardHolder - A custom HTML element for infinite card carousels.
 * Supports variable-width cards with a fixed holder height.
 * Free-scrolling drag with per-card dot navigation.
 */
class InfiniCardHolder extends HTMLElement {
    constructor() {
        super();

        this.config = { totalSets: 3, dragThreshold: 5, arrowHoldDelay: 150, animationSpeed: 0.25 };
        this.state = { currentIndex: 0, translate: 0, isAnimating: false, isDragging: false };
        this.drag = { startX: 0, startY: 0, hasMoved: false, isHorizontal: null };
        this.cards = [];
        this.elements = {};
        this.arrowInterval = null;
        this._cardPositions = null;
        this._setWidth = null;

        this.handleDrag = this.handleDrag.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
    }

    /** Measure all cards in one set and build a position map. */
    measureCards() {
        if (this._cardPositions) return;

        const container = this.elements.container;
        if (!container) return;

        const allCards = container.querySelectorAll('ex-infcard');
        const n = this.cards.length;
        if (!n || !allCards.length) return;

        const gap = this.getGap();
        const positions = [];
        let x = 0;

        for (let i = 0; i < n; i++) {
            const w = allCards[i].getBoundingClientRect().width;
            positions.push(x);
            x += w + gap;
        }

        this._cardPositions = positions;
        this._setWidth = x;
    }

    getGap() {
        const s = getComputedStyle(this.elements.container);
        if (s.gap && s.gap !== 'normal') return parseFloat(s.gap);
        if (s.columnGap && s.columnGap !== 'normal') return parseFloat(s.columnGap);
        return 0;
    }

    /** Get the left-edge position of card `index` within the center set. */
    cardPosition(index) {
        this.measureCards();
        if (!this._cardPositions) return 0;
        const centerStart = this._setWidth * Math.floor(this.config.totalSets / 2);
        return centerStart + this._cardPositions[index % this.cards.length];
    }

    get setWidth() {
        this.measureCards();
        return this._setWidth || 0;
    }

    /** Amount to scroll per arrow press — roughly one "screen" worth. */
    get scrollStep() {
        return this.getBoundingClientRect().width * 0.6;
    }

    connectedCallback() {
        this.cards = Array.from(this.children);
        this.render();
        this.setupEvents();

        this.waitForImages().then(() => {
            this.invalidateLayout();
        });
    }

    waitForImages() {
        const images = this.elements.container?.querySelectorAll('img') || [];
        const promises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
            });
        });
        return Promise.all(promises);
    }

    invalidateLayout() {
        this._cardPositions = null;
        this._setWidth = null;
        this.measureCards();
        this.state.translate = -this.cardPosition(0);
        this.state.currentIndex = 0;
        this.updateTransform();
        this.updateDots();
    }

    render() {
        const container = document.createElement('div');
        container.className = 'scroll-container';

        for (let set = 0; set < this.config.totalSets; set++) {
            this.cards.forEach(card => container.appendChild(card.cloneNode(true)));
        }

        const leftArrow = this.createButton('nav-arrow nav-arrow-left', 'Previous card');
        const rightArrow = this.createButton('nav-arrow nav-arrow-right', 'Next card');
        const dots = document.createElement('div');
        dots.className = 'dots-container';

        this.cards.forEach((_, i) => {
            const dot = this.createButton('dot', `Go to card ${i + 1}`);
            dot.dataset.index = i;
            dots.appendChild(dot);
        });

        this.innerHTML = '';
        this.append(container, leftArrow, rightArrow, dots);
        this.elements = { container, leftArrow, rightArrow, dots };
    }

    createButton(className, label) {
        const btn = document.createElement('button');
        btn.className = className;
        btn.setAttribute('aria-label', label);
        return btn;
    }

    setupEvents() {
        this.addEventListener('mousedown', this.handleDragStart.bind(this));
        this.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: true });
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.handleDragEnd);
        document.addEventListener('touchmove', this.handleDrag, { passive: false });
        document.addEventListener('touchend', this.handleDragEnd);

        // Arrow events — scroll by a fixed step
        [this.elements.leftArrow, this.elements.rightArrow].forEach((arrow, i) => {
            const direction = i === 0 ? 1 : -1;
            ['mousedown', 'touchstart'].forEach(type => {
                arrow.addEventListener(type, (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.scrollBy(direction * this.scrollStep);
                    this.arrowInterval = setInterval(() => this.scrollBy(direction * this.scrollStep), this.config.arrowHoldDelay);
                });
            });
            ['mouseup', 'mouseleave', 'touchend'].forEach(type => {
                arrow.addEventListener(type, () => {
                    clearInterval(this.arrowInterval);
                    this.arrowInterval = null;
                });
            });
        });

        // Dot navigation — snap to specific card
        this.elements.dots.addEventListener('click', (e) => {
            if (e.target.classList.contains('dot')) {
                this.goToIndex(parseInt(e.target.dataset.index));
            }
        });

        if (window.ResizeObserver) {
            new ResizeObserver(() => {
                if (!this.state.isDragging && !this.state.isAnimating) {
                    this.invalidateLayout();
                }
            }).observe(this);
        }

        this.addEventListener('contextmenu', e => e.preventDefault());
    }

    handleDragStart(e) {
        if (e.target.closest('.nav-arrow, .dots-container')) return;

        // Stop any running animation
        this.state.isAnimating = false;

        this.state.isDragging = true;
        this.drag.isHorizontal = null;
        this.drag.hasMoved = false;
        this.drag.startX = this.getEventX(e);
        this.drag.startY = this.getEventY(e);
        this.drag.initialTranslate = this.state.translate;

        this.style.cursor = 'grabbing';
        if (e.type === 'mousedown') e.preventDefault();
    }

    handleDrag(e) {
        if (!this.state.isDragging) return;

        const diffX = this.getEventX(e) - this.drag.startX;
        const diffY = this.getEventY(e) - this.drag.startY;

        if (this.drag.isHorizontal === null && (Math.abs(diffX) > 3 || Math.abs(diffY) > 3)) {
            this.drag.isHorizontal = Math.abs(diffX) > Math.abs(diffY);
        }

        if (this.drag.isHorizontal === false) {
            this.state.isDragging = false;
            this.style.cursor = '';
            return;
        }

        if (this.drag.isHorizontal && Math.abs(diffX) > this.config.dragThreshold) {
            this.drag.hasMoved = true;
            e.preventDefault();
            this.state.translate = this.drag.initialTranslate + diffX;
            this.handleWrap();
            this.updateTransform();
        }
    }

    handleDragEnd() {
        if (!this.state.isDragging) return;

        this.state.isDragging = false;
        this.drag.isHorizontal = null;
        this.style.cursor = '';

        // Free scroll — just update the dot indicator, no snapping
        if (this.drag.hasMoved) {
            this.updateCurrentIndex();
        }
    }

    /** Scroll by a pixel amount with animation. */
    scrollBy(px) {
        this.animateTo(this.state.translate + px);
    }

    /** Animate to a specific card index (used by dots). */
    goToIndex(index) {
        if (index < 0 || index >= this.cards.length) return;

        this.state.currentIndex = index;
        this.animateTo(-this.cardPosition(index));
        this.updateDots();
    }

    animateTo(target) {
        this._animationId = (this._animationId || 0) + 1;
        const id = this._animationId;
        this.state.isAnimating = true;

        const animate = () => {
            if (!this.state.isAnimating || this._animationId !== id) return;

            const diff = target - this.state.translate;

            if (Math.abs(diff) < 1) {
                this.state.translate = target;
                this.state.isAnimating = false;
            } else {
                this.state.translate += diff * this.config.animationSpeed;
            }

            const before = this.state.translate;
            this.handleWrap();
            const wrapOffset = this.state.translate - before;
            if (wrapOffset) target += wrapOffset;

            this.updateTransform();

            if (this.state.isAnimating) {
                requestAnimationFrame(animate);
            } else {
                this.updateCurrentIndex();
            }
        };

        animate();
    }

    handleWrap() {
        const sw = this.setWidth;
        if (!sw) return;
        const lo = -sw * (Math.floor(this.config.totalSets / 2) + 0.5);
        const hi = -sw * (Math.floor(this.config.totalSets / 2) - 0.5);

        while (this.state.translate > hi) {
            this.state.translate -= sw;
            if (this.state.isDragging) this.drag.initialTranslate -= sw;
        }
        while (this.state.translate < lo) {
            this.state.translate += sw;
            if (this.state.isDragging) this.drag.initialTranslate += sw;
        }
    }

    updateCurrentIndex() {
        this.measureCards();
        if (!this._cardPositions || !this._setWidth) return;

        const sw = this._setWidth;
        // Normalize scroll position into a single set range [0, setWidth)
        let pos = ((-this.state.translate) % sw + sw) % sw;

        let bestIndex = 0;
        let bestDist = Infinity;
        for (let i = 0; i < this.cards.length; i++) {
            // Check distance wrapping around the set boundary
            const cardPos = this._cardPositions[i];
            const dist = Math.min(
                Math.abs(pos - cardPos),
                Math.abs(pos - cardPos - sw),
                Math.abs(pos - cardPos + sw)
            );
            if (dist < bestDist) {
                bestDist = dist;
                bestIndex = i;
            }
        }

        if (bestIndex !== this.state.currentIndex) {
            this.state.currentIndex = bestIndex;
            this.updateDots();
        }
    }

    updateDots() {
        this.elements.dots.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.state.currentIndex);
        });
    }

    updateTransform() {
        this.elements.container.style.transform = `translate3d(${this.state.translate}px, 0, 0)`;
    }

    getEventX(e) {
        return e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    }

    getEventY(e) {
        return e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    }

    disconnectedCallback() {
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
        document.removeEventListener('touchmove', this.handleDrag);
        document.removeEventListener('touchend', this.handleDragEnd);
        clearInterval(this.arrowInterval);
    }
}

customElements.define('ex-infcard-holder', InfiniCardHolder);
