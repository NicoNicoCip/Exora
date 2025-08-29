/**
 * InfiniCardHolder - Optimized infinite card carousel
 * Improvements: Performance optimizations, better event handling, accessibility, and bug fixes
 */
class InfiniCardHolder extends HTMLElement {
  constructor() {
    super();
    
    // Configuration
    this.config = {
      cardWidth: 416,
      totalSets: 5,
      animationSpeed: 0.25,
      arrowHoldDelay: 250,
      snapThreshold: 0.3, // Threshold for snapping to next/prev card
      dragThreshold: 10    // Minimum drag distance to trigger navigation
    };
    
    // State management
    this.state = {
      currentIndex: 0,
      currentTranslate: 0,
      isAnimating: false,
      isDragging: false,
      isHorizontalDrag: null,
      dragStartX: 0,
      dragStartY: 0,
      dragStartTranslate: 0,
      hasMoved: false,
      isInitialized: false
    };
    
    // DOM references
    this.refs = {
      scrollContainer: null,
      dotsContainer: null,
      leftArrow: null,
      rightArrow: null
    };
    
    // Cache original cards
    this.originalCards = [];
    
    // Utilities
    this.arrowHoldInterval = null;
    this.resizeObserver = null;
    this.animationFrameId = null;
    
    // Throttled functions
    this.throttledResize = this.throttle(this.handleResize.bind(this), 100);
    this.debouncedCalculateDimensions = this.debounce(this.calculateDimensions.bind(this), 50);
    
    // Bind methods once
    this.boundMethods = {
      handleDrag: this.handleDrag.bind(this),
      handleDragEnd: this.handleDragEnd.bind(this),
      handleKeyDown: this.handleKeyDown.bind(this),
      handleFocus: this.handleFocus.bind(this),
      handleResize: this.throttledResize
    };
  }

  // Lifecycle methods
  connectedCallback() {
    try {
      this.originalCards = Array.from(this.children).filter(child => 
        child.tagName && child.tagName.toLowerCase() === 'ex-infcard'
      );
      
      if (this.originalCards.length === 0) {
        console.warn('InfiniCardHolder: No ex-infcard elements found');
        return;
      }

      this.render();
      this.setupEventListeners();
      
      // Use RAF for initial setup to ensure DOM is ready
      requestAnimationFrame(() => {
        this.initialize();
      });
    } catch (error) {
      console.error('InfiniCardHolder initialization failed:', error);
    }
  }

  disconnectedCallback() {
    this.cleanup();
  }

  // Initialization
  async initialize() {
    await this.calculateDimensions();
    this.resetToCenter();
    this.updateDots();
    this.state.isInitialized = true;
    
    // Dispatch ready event
    this.dispatchEvent(new CustomEvent('carouselReady', {
      detail: { totalCards: this.originalCards.length }
    }));
  }

  // DOM manipulation
  render() {
    const fragment = document.createDocumentFragment();
    
    // Create scroll container
    this.refs.scrollContainer = this.createElement('div', {
      className: 'scroll-container',
      role: 'listbox',
      'aria-label': 'Card carousel'
    });
    
    // Clone cards for infinite scroll
    this.populateScrollContainer();
    
    // Create navigation elements
    const navigation = this.createNavigation();
    
    // Assemble DOM
    fragment.appendChild(this.refs.scrollContainer);
    fragment.appendChild(navigation.leftArrow);
    fragment.appendChild(navigation.rightArrow);
    fragment.appendChild(navigation.dotsContainer);
    
    // Replace content
    this.innerHTML = '';
    this.appendChild(fragment);
    
    // Store navigation references
    this.refs.leftArrow = navigation.leftArrow;
    this.refs.rightArrow = navigation.rightArrow;
    this.refs.dotsContainer = navigation.dotsContainer;
  }

  populateScrollContainer() {
    const fragment = document.createDocumentFragment();
    
    for (let set = 0; set < this.config.totalSets; set++) {
      this.originalCards.forEach((card, index) => {
        const clone = card.cloneNode(true);
        clone.setAttribute('data-set', set);
        clone.setAttribute('data-original-index', index);
        clone.setAttribute('role', 'option');
        clone.setAttribute('tabindex', '-1');
        fragment.appendChild(clone);
      });
    }
    
    this.refs.scrollContainer.appendChild(fragment);
  }

  createNavigation() {
    // Left arrow
    const leftArrow = this.createElement('button', {
      className: 'nav-arrow nav-arrow-left',
      'aria-label': 'Previous card',
      type: 'button'
    });
    
    // Right arrow  
    const rightArrow = this.createElement('button', {
      className: 'nav-arrow nav-arrow-right',
      'aria-label': 'Next card',
      type: 'button'
    });
    
    // Dots container
    const dotsContainer = this.createElement('div', {
      className: 'dots-container',
      role: 'tablist',
      'aria-label': 'Card indicators'
    });
    
    // Create dots
    this.originalCards.forEach((_, index) => {
      const dot = this.createElement('button', {
        className: 'dot',
        'aria-label': `Go to card ${index + 1}`,
        'data-index': index,
        type: 'button',
        role: 'tab',
        'aria-selected': index === 0 ? 'true' : 'false'
      });
      dotsContainer.appendChild(dot);
    });
    
    return { leftArrow, rightArrow, dotsContainer };
  }

  // Utility methods
  createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    return element;
  }

  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return (...args) => {
      const currentTime = Date.now();
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Dimension calculations
  async calculateDimensions() {
    const firstCard = this.refs.scrollContainer?.querySelector('ex-infcard');
    if (!firstCard) return;

    // Force layout if needed
    if (firstCard.offsetWidth === 0) {
      await new Promise(resolve => {
        const observer = new ResizeObserver(() => {
          observer.disconnect();
          resolve();
        });
        observer.observe(firstCard);
      });
    }

    const cardRect = firstCard.getBoundingClientRect();
    const containerStyle = getComputedStyle(this.refs.scrollContainer);
    const gap = parseFloat(containerStyle.gap) || 16;

    if (cardRect.width > 0) {
      const newCardWidth = cardRect.width + gap;
      if (Math.abs(newCardWidth - this.config.cardWidth) > 1) {
        this.config.cardWidth = newCardWidth;
        if (this.state.isInitialized) {
          this.resetToCenter();
        }
      }
    }
  }

  resetToCenter() {
    const centerOffset = -this.config.cardWidth * this.originalCards.length * 2;
    this.state.currentTranslate = centerOffset;
    this.updateTransform(false);
    this.updateCurrentIndex();
  }

  // Event handling
  setupEventListeners() {
    // Drag events
    this.addEventListener('mousedown', this.handleDragStart.bind(this));
    this.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: true });
    
    // Global drag events
    document.addEventListener('mousemove', this.boundMethods.handleDrag, { passive: false });
    document.addEventListener('mouseup', this.boundMethods.handleDragEnd);
    document.addEventListener('touchmove', this.boundMethods.handleDrag, { passive: false });
    document.addEventListener('touchend', this.boundMethods.handleDragEnd);

    // Arrow controls
    this.setupArrowControls();
    
    // Dot navigation
    this.refs.dotsContainer.addEventListener('click', this.handleDotClick.bind(this));
    
    // Keyboard navigation
    this.addEventListener('keydown', this.boundMethods.handleKeyDown);
    this.addEventListener('focusin', this.boundMethods.handleFocus);
    
    // Responsive handling
    this.setupResizeObserver();
    
    // Prevent context menu on drag areas
    this.addEventListener('contextmenu', e => {
      if (this.state.isDragging) {
        e.preventDefault();
      }
    });

    // Accessibility - manage focus
    this.setAttribute('tabindex', '0');
  }

  setupArrowControls() {
    const arrows = [
      { element: this.refs.leftArrow, direction: 1 },
      { element: this.refs.rightArrow, direction: -1 }
    ];

    arrows.forEach(({ element, direction }) => {
      // Click events
      element.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigate(direction);
      });

      // Hold functionality
      ['mousedown', 'touchstart'].forEach(eventType => {
        element.addEventListener(eventType, (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.startArrowHold(direction);
        }, { passive: false });
      });

      ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(eventType => {
        element.addEventListener(eventType, () => {
          this.stopArrowHold();
        });
      });
    });
  }

  handleDragStart(e) {
    if (e.target.closest('.nav-arrow, .dots-container')) return;

    this.state.isDragging = true;
    this.state.isHorizontalDrag = null;
    this.state.hasMoved = false;
    this.state.dragStartX = this.getEventX(e);
    this.state.dragStartY = this.getEventY(e);
    this.state.dragStartTranslate = this.state.currentTranslate;
    
    this.style.cursor = 'grabbing';
    this.style.userSelect = 'none';

    if (e.type === 'mousedown') {
      e.preventDefault();
    }
  }

  handleDrag(e) {
    if (!this.state.isDragging) return;

    const currentX = this.getEventX(e);
    const currentY = this.getEventY(e);
    const diffX = currentX - this.state.dragStartX;
    const diffY = currentY - this.state.dragStartY;

    // Determine drag direction on first significant movement
    if (this.state.isHorizontalDrag === null && (Math.abs(diffX) > 5 || Math.abs(diffY) > 5)) {
      this.state.isHorizontalDrag = Math.abs(diffX) > Math.abs(diffY);
    }

    // Allow vertical scrolling
    if (this.state.isHorizontalDrag === false) {
      this.handleDragEnd();
      return;
    }

    // Handle horizontal drag
    if (this.state.isHorizontalDrag === true) {
      e.preventDefault();
      
      if (Math.abs(diffX) > this.config.dragThreshold) {
        this.state.hasMoved = true;
      }

      this.state.currentTranslate = this.state.dragStartTranslate + diffX;
      this.updateTransform(false);
      this.handleInfiniteLoop();
    }
  }

  handleDragEnd() {
    if (!this.state.isDragging) return;

    this.state.isDragging = false;
    this.state.isHorizontalDrag = null;
    this.style.cursor = '';
    this.style.userSelect = '';

    if (this.state.hasMoved) {
      this.snapToNearestCard();
    }
  }

  handleKeyDown(e) {
    if (!this.state.isInitialized) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.navigate(1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.navigate(-1);
        break;
      case 'Home':
        e.preventDefault();
        this.goToIndex(0);
        break;
      case 'End':
        e.preventDefault();
        this.goToIndex(this.originalCards.length - 1);
        break;
    }
  }

  handleFocus() {
    // Ensure current card is announced to screen readers
    this.updateAriaLive();
  }

  handleDotClick(e) {
    if (e.target.classList.contains('dot')) {
      const index = parseInt(e.target.dataset.index, 10);
      if (!isNaN(index)) {
        this.goToIndex(index);
      }
    }
  }

  handleResize() {
    this.debouncedCalculateDimensions();
  }

  // Navigation methods
  navigate(direction) {
    if (this.state.isAnimating || !this.state.isInitialized) return;
    
    const newIndex = this.getValidIndex(this.state.currentIndex - direction);
    this.goToIndex(newIndex);
  }

  goToIndex(index, animate = true) {
    if (!this.state.isInitialized || index < 0 || index >= this.originalCards.length) return;
    if (index === this.state.currentIndex && animate) return;

    this.state.currentIndex = index;
    const targetPosition = -this.config.cardWidth * (this.originalCards.length * 2 + index);

    if (animate && !this.state.isAnimating) {
      this.animateToPosition(targetPosition);
    } else {
      this.state.currentTranslate = targetPosition;
      this.updateTransform(false);
    }

    this.updateDots();
    this.updateAriaLive();
    
    // Dispatch navigation event
    this.dispatchEvent(new CustomEvent('cardChanged', {
      detail: { 
        currentIndex: this.state.currentIndex,
        totalCards: this.originalCards.length 
      }
    }));
  }

  snapToNearestCard() {
    if (this.state.isAnimating) return;

    const basePosition = -this.config.cardWidth * this.originalCards.length * 2;
    const offset = this.state.currentTranslate - basePosition;
    const cardPosition = -offset / this.config.cardWidth;
    
    // Determine snap direction based on drag distance and velocity
    const snapIndex = Math.round(cardPosition);
    const targetPosition = basePosition - (snapIndex * this.config.cardWidth);

    this.animateToPosition(targetPosition, () => {
      this.updateCurrentIndex();
    });
  }

  animateToPosition(targetPosition, callback) {
    if (this.state.isAnimating) return;
    
    this.state.isAnimating = true;
    const startPosition = this.state.currentTranslate;
    const distance = targetPosition - startPosition;
    
    const animate = () => {
      const remaining = targetPosition - this.state.currentTranslate;
      
      if (Math.abs(remaining) < 0.5) {
        this.state.currentTranslate = targetPosition;
        this.state.isAnimating = false;
        this.updateTransform(false);
        this.handleInfiniteLoop();
        callback?.();
      } else {
        this.state.currentTranslate += remaining * this.config.animationSpeed;
        this.updateTransform(false);
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  // Infinite scroll logic
  handleInfiniteLoop() {
    const setWidth = this.config.cardWidth * this.originalCards.length;
    const centerSetStart = -setWidth * 2;
    const loopDistance = setWidth;

    if (this.state.currentTranslate > centerSetStart + loopDistance * 0.5) {
      this.state.currentTranslate -= loopDistance;
    } else if (this.state.currentTranslate < centerSetStart - loopDistance * 0.5) {
      this.state.currentTranslate += loopDistance;
    }
  }

  // State updates
  updateCurrentIndex() {
    const basePosition = -this.config.cardWidth * this.originalCards.length * 2;
    const offset = this.state.currentTranslate - basePosition;
    const cardIndex = Math.round(-offset / this.config.cardWidth);

    const newIndex = this.getValidIndex(cardIndex);

    if (newIndex !== this.state.currentIndex) {
      this.state.currentIndex = newIndex;
      this.updateDots();
      this.updateAriaLive();
    }
  }

  updateDots() {
    if (!this.refs.dotsContainer) return;
    
    const dots = this.refs.dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
      const isActive = index === this.state.currentIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  updateAriaLive() {
    // Announce current position to screen readers
    const announcement = `Card ${this.state.currentIndex + 1} of ${this.originalCards.length}`;
    
    // Create or update aria-live region
    let liveRegion = this.querySelector('.sr-only');
    if (!liveRegion) {
      liveRegion = this.createElement('div', {
        className: 'sr-only',
        'aria-live': 'polite',
        'aria-atomic': 'true'
      });
      this.appendChild(liveRegion);
    }
    
    liveRegion.textContent = announcement;
  }

  updateTransform(handleLoop = true) {
    if (!this.refs.scrollContainer) return;
    
    this.refs.scrollContainer.style.transform = `translate3d(${this.state.currentTranslate}px, 0, 0)`;
    
    if (handleLoop) {
      this.handleInfiniteLoop();
    }
  }

  // Arrow hold functionality
  startArrowHold(direction) {
    this.navigate(direction);
    
    this.arrowHoldInterval = setInterval(() => {
      this.navigate(direction);
    }, this.config.arrowHoldDelay);
  }

  stopArrowHold() {
    if (this.arrowHoldInterval) {
      clearInterval(this.arrowHoldInterval);
      this.arrowHoldInterval = null;
    }
  }

  // Resize handling
  setupResizeObserver() {
    if (!window.ResizeObserver) return;
    
    this.resizeObserver = new ResizeObserver(this.boundMethods.handleResize);
    this.resizeObserver.observe(this);
  }

  // Utility functions
  getValidIndex(index) {
    const length = this.originalCards.length;
    return ((index % length) + length) % length;
  }

  getEventX(e) {
    return e.type.includes('mouse') ? e.clientX : e.touches[0]?.clientX ?? 0;
  }

  getEventY(e) {
    return e.type.includes('mouse') ? e.clientY : e.touches[0]?.clientY ?? 0;
  }

  // Cleanup
  cleanup() {
    // Remove global event listeners
    document.removeEventListener('mousemove', this.boundMethods.handleDrag);
    document.removeEventListener('mouseup', this.boundMethods.handleDragEnd);
    document.removeEventListener('touchmove', this.boundMethods.handleDrag);
    document.removeEventListener('touchend', this.boundMethods.handleDragEnd);
    
    // Clear intervals and timeouts
    this.stopArrowHold();
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Disconnect observers
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  // Public API methods
  getCurrentIndex() {
    return this.state.currentIndex;
  }

  getTotalCards() {
    return this.originalCards.length;
  }

  next() {
    this.navigate(-1);
  }

  prev() {
    this.navigate(1);
  }
}

// Register the custom element
customElements.define('ex-infcard-holder', InfiniCardHolder);