/**
 * InfiniCardHolder - A custom HTML element for infinite card carousels
 * Supports touch/mouse dragging, arrow navigation, and dot indicators
 */
class InfiniCardHolder extends HTMLElement {
  constructor() {
    super();
    
    // Core configuration
    this.config = {
      cardWidth: 416,
      totalSets: 5,
      dragThreshold: 5,
      arrowHoldDelay: 150,
      animationSpeed: 0.25
    };
    
    // State management
    this.state = {
      currentIndex: 0,
      currentTranslate: 0,
      prevTranslate: 0,
      isInitialized: false,
      isAnimating: false,
      isDragging: false,
      isHorizontalDrag: null
    };
    
    // Drag tracking
    this.drag = {
      startX: 0,
      startY: 0,
      hasMoved: false,
      offset: 0
    };
    
    // DOM references
    this.elements = {};
    this.originalCards = [];
    
    // Utilities
    this.resizeObserver = null;
    this.arrowHoldInterval = null;
    
    // Bind methods
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
  }

  /**
   * Initialize component when connected to DOM
   */
  connectedCallback() {
    this.originalCards = Array.from(this.children);
    this.render();
    this.setupEventListeners();
    
    // Calculate dimensions after render
    requestAnimationFrame(() => {
      this.calculateDimensions();
      this.state.isInitialized = true;
      this.updateDots();
    });
  }

  /**
   * Calculate card width and initialize positioning
   */
  calculateDimensions() {
    const firstCard = this.elements.scrollContainer.querySelector('ex-infcard');
    if (!firstCard) return;

    const cardRect = firstCard.getBoundingClientRect();
    const computedStyle = getComputedStyle(this.elements.scrollContainer);
    const gap = parseFloat(computedStyle.gap) || 16;

    if (cardRect.width > 0) {
      this.config.cardWidth = cardRect.width + gap;
      this.resetToCenter();
    }
  }

  /**
   * Reset carousel to center position for seamless infinite scroll
   */
  resetToCenter() {
    const centerOffset = -this.config.cardWidth * this.originalCards.length * 2;
    this.state.currentTranslate = centerOffset;
    this.state.prevTranslate = centerOffset;
    this.updateTransform();
    this.updateCurrentIndex();
  }

  /**
   * Render carousel structure and navigation elements
   */
  render() {
    // Create scroll container with duplicated cards
    const scrollContainer = this.createElement('div', 'scroll-container');
    
    for (let set = 0; set < this.config.totalSets; set++) {
      this.originalCards.forEach((card, index) => {
        const clone = card.cloneNode(true);
        clone.dataset.set = set;
        clone.dataset.originalIndex = index;
        scrollContainer.appendChild(clone);
      });
    }

    // Create navigation controls
    const leftArrow = this.createElement('button', 'nav-arrow nav-arrow-left', '', 'Previous card');
    const rightArrow = this.createElement('button', 'nav-arrow nav-arrow-right', '', 'Next card');
    const dotsContainer = this.createElement('div', 'dots-container');

    // Create dot indicators
    this.originalCards.forEach((_, index) => {
      const dot = this.createElement('button', 'dot', '', `Go to card ${index + 1}`);
      dot.dataset.index = index;
      dotsContainer.appendChild(dot);
    });

    // Update DOM
    this.innerHTML = '';
    this.appendChild(scrollContainer);
    this.appendChild(leftArrow);
    this.appendChild(rightArrow);
    this.appendChild(dotsContainer);

    // Store element references
    this.elements = {
      scrollContainer,
      leftArrow,
      rightArrow,
      dotsContainer
    };
  }

  /**
   * Create DOM element with specified attributes
   */
  createElement(tag, className, innerHTML = '', ariaLabel = '') {
    const element = document.createElement(tag);
    element.className = className;
    element.innerHTML = innerHTML;
    if (ariaLabel) element.setAttribute('aria-label', ariaLabel);
    return element;
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Drag events
    this.addEventListener('mousedown', this.handleDragStart.bind(this));
    this.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: true });
    
    document.addEventListener('mousemove', this.handleDrag);
    document.addEventListener('mouseup', this.handleDragEnd);
    document.addEventListener('touchmove', this.handleDrag, { passive: false });
    document.addEventListener('touchend', this.handleDragEnd);

    // Arrow navigation
    this.setupArrowControls();
    
    // Dot navigation
    this.elements.dotsContainer.addEventListener('mouseover', this.handleDotClick.bind(this));
    
    // Responsive handling
    this.setupResizeObserver();
    
    // Prevent context menu
    this.addEventListener('contextmenu', e => e.preventDefault());
  }

  /**
   * Setup arrow button controls with hold functionality
   */
  setupArrowControls() {
    const arrows = [
      { element: this.elements.leftArrow, direction: 'left' },
      { element: this.elements.rightArrow, direction: 'right' }
    ];

    arrows.forEach(({ element, direction }) => {
      ['mousedown', 'touchstart'].forEach(eventType => {
        element.addEventListener(eventType, (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.startArrowHold(direction);
        });
      });

      ['mouseup', 'mouseleave', 'touchend'].forEach(eventType => {
        element.addEventListener(eventType, () => {
          this.stopArrowHold();
        });
      });
    });
  }

  /**
   * Handle drag start
   */
  handleDragStart(e) {
    if (e.target.closest('.nav-arrow, .dots-container') || !this.state.isInitialized) {
      return;
    }

    this.state.isDragging = true;
    this.state.isHorizontalDrag = null;
    this.drag.hasMoved = false;
    this.drag.startX = this.getEventX(e);
    this.drag.startY = this.getEventY(e);
    this.drag.offset = 0;
    
    this.setCursor('grabbing');

    if (e.type === 'mousedown') {
      e.preventDefault();
    }
  }

  /**
   * Handle drag movement
   */
  handleDrag(e) {
    if (!this.state.isDragging || !this.state.isInitialized) return;

    const currentX = this.getEventX(e);
    const currentY = this.getEventY(e);
    const diffX = currentX - this.drag.startX;
    const diffY = currentY - this.drag.startY;

    // Determine drag direction
    if (this.state.isHorizontalDrag === null && (Math.abs(diffX) > 3 || Math.abs(diffY) > 3)) {
      this.state.isHorizontalDrag = Math.abs(diffX) > Math.abs(diffY);
    }

    // Handle vertical drag (allow default scrolling)
    if (this.state.isHorizontalDrag === false) {
      this.state.isDragging = false;
      this.setCursor('grab');
      return;
    }

    // Handle horizontal drag
    if (this.state.isHorizontalDrag === true && Math.abs(diffX) > this.config.dragThreshold) {
      this.drag.hasMoved = true;
      e.preventDefault();

      this.drag.offset = diffX;
      this.state.currentTranslate = this.state.prevTranslate + diffX;
      
      this.updateTransform();
      this.handleInfiniteLoop();
    }
  }

  /**
   * Handle drag end
   */
  handleDragEnd() {
    if (!this.state.isDragging) return;

    this.state.isDragging = false;
    this.state.isHorizontalDrag = null;
    this.setCursor('grab');

    if (this.drag.hasMoved) {
      this.snapToNearestCard();
    } else {
      // Reset position for clean click behavior
      this.state.currentTranslate = this.state.prevTranslate;
      this.updateTransform();
    }
  }

  /**
   * Snap to the nearest card position
   */
  snapToNearestCard() {
    if (this.state.isAnimating) return;

    const basePosition = -this.config.cardWidth * this.originalCards.length * 2;
    const offset = this.state.currentTranslate - basePosition;
    const nearestIndex = Math.round(-offset / this.config.cardWidth);
    const targetPosition = basePosition - (nearestIndex * this.config.cardWidth);

    this.animateToPosition(targetPosition, () => {
      this.state.prevTranslate = this.state.currentTranslate;
      this.updateCurrentIndex();
    });
  }

  /**
   * Navigate to previous card
   */
  navigateLeft() {
    if (this.state.isAnimating) return;
    
    const targetPosition = this.state.currentTranslate + this.config.cardWidth;
    this.animateToPosition(targetPosition, () => {
      this.state.prevTranslate = this.state.currentTranslate;
      this.updateCurrentIndex();
    });
  }

  /**
   * Navigate to next card
   */
  navigateRight() {
    if (this.state.isAnimating) return;
    
    const targetPosition = this.state.currentTranslate - this.config.cardWidth;
    this.animateToPosition(targetPosition, () => {
      this.state.prevTranslate = this.state.currentTranslate;
      this.updateCurrentIndex();
    });
  }

  /**
   * Navigate directly to a specific card index
   */
  goToIndex(index, animate = true) {
    if (index < 0 || index >= this.originalCards.length) return;

    this.state.currentIndex = index;
    const targetPosition = -this.config.cardWidth * (this.originalCards.length * 2 + index);

    if (animate && !this.state.isAnimating) {
      this.animateToPosition(targetPosition, () => {
        this.state.prevTranslate = this.state.currentTranslate;
      });
    } else if (!animate) {
      this.state.currentTranslate = targetPosition;
      this.state.prevTranslate = targetPosition;
      this.updateTransform();
    }

    this.updateDots();
  }

  /**
   * Animate to target position with easing
   */
  animateToPosition(targetPosition, callback) {
    this.state.isAnimating = true;

    const animate = () => {
      const diff = targetPosition - this.state.currentTranslate;

      if (Math.abs(diff) < 1) {
        this.state.currentTranslate = targetPosition;
        this.state.isAnimating = false;
        this.updateTransform();
        this.handleInfiniteLoop();
        callback?.();
      } else {
        this.state.currentTranslate += diff * this.config.animationSpeed;
        this.updateTransform();
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Handle infinite loop by repositioning when at boundaries
   */
  handleInfiniteLoop() {
    const setWidth = this.config.cardWidth * this.originalCards.length;
    const loopOffset = setWidth * 2;

    if (this.state.currentTranslate > -setWidth * 0.5) {
      this.state.currentTranslate -= loopOffset;
      if (!this.state.isDragging) {
        this.state.prevTranslate = this.state.currentTranslate;
      } else {
        this.state.prevTranslate -= loopOffset;
      }
      this.updateTransform();
    } else if (this.state.currentTranslate < -setWidth * 3.5) {
      this.state.currentTranslate += loopOffset;
      if (!this.state.isDragging) {
        this.state.prevTranslate = this.state.currentTranslate;
      } else {
        this.state.prevTranslate += loopOffset;
      }
      this.updateTransform();
    }
  }

  /**
   * Update current card index based on position
   */
  updateCurrentIndex() {
    const basePosition = -this.config.cardWidth * this.originalCards.length * 2;
    const offset = this.state.currentTranslate - basePosition;
    const cardIndex = Math.round(-offset / this.config.cardWidth);

    let newIndex = cardIndex % this.originalCards.length;
    if (newIndex < 0) {
      newIndex += this.originalCards.length;
    }

    if (newIndex !== this.state.currentIndex) {
      this.state.currentIndex = newIndex;
      this.updateDots();
    }
  }

  /**
   * Update dot indicator states
   */
  updateDots() {
    const dots = this.elements.dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.state.currentIndex);
    });
  }

  /**
   * Handle dot navigation clicks
   */
  handleDotClick(e) {
    if (e.target.classList.contains('dot')) {
      const index = parseInt(e.target.dataset.index);
      this.goToIndex(index);
    }
  }

  /**
   * Start arrow hold for continuous navigation
   */
  startArrowHold(direction) {
    // Immediate action
    if (direction === 'left') {
      this.navigateLeft();
    } else {
      this.navigateRight();
    }

    // Continuous action
    this.arrowHoldInterval = setInterval(() => {
      if (direction === 'left') {
        this.navigateLeft();
      } else {
        this.navigateRight();
      }
    }, this.config.arrowHoldDelay);
  }

  /**
   * Stop arrow hold
   */
  stopArrowHold() {
    if (this.arrowHoldInterval) {
      clearInterval(this.arrowHoldInterval);
      this.arrowHoldInterval = null;
    }
  }

  /**
   * Setup resize observer for responsive behavior
   */
  setupResizeObserver() {
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.calculateDimensions();
      });
      this.resizeObserver.observe(this);
    }
  }

  /**
   * Update transform position
   */
  updateTransform() {
    this.elements.scrollContainer.style.transform = `translate3d(${this.state.currentTranslate}px, 0, 0)`;
  }

  /**
   * Set cursor style
   */
  setCursor(cursor) {
    this.style.cursor = cursor;
    document.body.style.cursor = cursor === 'grab' ? '' : cursor;
  }

  /**
   * Get X coordinate from mouse or touch event
   */
  getEventX(e) {
    return e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  }

  /**
   * Get Y coordinate from mouse or touch event
   */
  getEventY(e) {
    return e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  }

  /**
   * Cleanup when component is removed
   */
  disconnectedCallback() {
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
    document.removeEventListener('touchmove', this.handleDrag);
    document.removeEventListener('touchend', this.handleDragEnd);
    
    this.stopArrowHold();
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

// Register the custom element
customElements.define('ex-infcard-holder', InfiniCardHolder);