class InfiniCardHolder extends HTMLElement {
  constructor() {
    super();
    this.originalCards = [];
    this.scrollContainer = null;
    this.leftArrow = null;
    this.rightArrow = null;
    this.dotsContainer = null;
    this.isDragging = false;
    this.startX = 0;
    this.currentTranslate = 0;
    this.prevTranslate = 0;
    this.cardWidth = 416; // Fallback value
    this.totalSets = 5;
    this.isInitialized = false;
    this.currentIndex = 0;
    this.isAnimating = false;
    this.resizeObserver = null;
    this.scrollDirection = 0; // -1 for left, 1 for right, 0 for neutral
    this.dragThreshold = 5; // Slightly higher threshold to distinguish clicks from drags
    this.hasMoved = false; // Track if user has actually moved during drag
    this.dragOffset = 0; // Track the offset during dragging to fix infinite loop bug
  }

  connectedCallback() {
    this.originalCards = Array.from(this.children);
    this.render();
    this.setupControls();
    
    // Wait for render, then calculate width
    setTimeout(() => {
      this.calculateCardWidth();
      this.isInitialized = true;
      this.updateDots();
    }, 100);
  }

  calculateCardWidth() {
    if (this.originalCards.length === 0) return;
    
    const firstCard = this.scrollContainer.querySelector('ex-infcard');
    if (!firstCard) return;
    
    const cardRect = firstCard.getBoundingClientRect();
    const computedStyle = getComputedStyle(this.scrollContainer);
    const gap = parseFloat(computedStyle.gap) || 16;
    
    // Only update if we got a valid width
    if (cardRect.width > 0) {
      this.cardWidth = cardRect.width + gap;
      this.resetToInitialPosition();
    }
  }

  resetToInitialPosition() {
    // Set to middle set (index 2) for seamless infinite scroll
    this.currentTranslate = -this.cardWidth * this.originalCards.length * 2;
    this.prevTranslate = this.currentTranslate;
    this.updatePosition();
    this.updateCurrentIndex();
  }

  render() {
    // Create main container structure
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'scroll-container';
    
    // Create multiple sets for seamless infinite scroll
    for (let set = 0; set < this.totalSets; set++) {
      this.originalCards.forEach((card, index) => {
        const clonedCard = card.cloneNode(true);
        clonedCard.dataset.set = set;
        clonedCard.dataset.originalIndex = index;
        scrollContainer.appendChild(clonedCard);
      });
    }
    
    // Create navigation elements
    const leftArrow = this.createElement('button', 'nav-arrow nav-arrow-left', '', 'Scroll left');
    const rightArrow = this.createElement('button', 'nav-arrow nav-arrow-right', '', 'Scroll right');
    const dotsContainer = this.createElement('div', 'dots-container');
    
    // Create dots
    for (let i = 0; i < this.originalCards.length; i++) {
      const dot = this.createElement('button', 'dot', '', `Go to card ${i + 1}`);
      dot.dataset.index = i;
      dotsContainer.appendChild(dot);
    }
    
    // Clear and rebuild
    this.innerHTML = '';
    this.appendChild(scrollContainer);
    this.appendChild(leftArrow);
    this.appendChild(rightArrow);
    this.appendChild(dotsContainer);
    
    // Store references
    this.scrollContainer = scrollContainer;
    this.leftArrow = leftArrow;
    this.rightArrow = rightArrow;
    this.dotsContainer = dotsContainer;
  }

  createElement(tag, className, innerHTML = '', ariaLabel = '') {
    const element = document.createElement(tag);
    element.className = className;
    element.innerHTML = innerHTML;
    if (ariaLabel) element.setAttribute('aria-label', ariaLabel);
    return element;
  }

  setupControls() {
    // Drag events
    this.addEventListener('mousedown', this.dragStart.bind(this));
    document.addEventListener('mousemove', this.dragMove.bind(this));
    document.addEventListener('mouseup', this.dragEnd.bind(this));
    
    // Touch events with passive: false for better responsiveness
    this.addEventListener('touchstart', this.dragStart.bind(this), { passive: false });
    this.addEventListener('touchmove', this.dragMove.bind(this), { passive: false });
    this.addEventListener('touchend', this.dragEnd.bind(this), { passive: false });
    
    // Handle mouse leave to prevent getting stuck when cursor leaves the element
    this.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Arrow clicks
    this.leftArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      this.scrollLeft();
    });
    this.rightArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      this.scrollRight();
    });
    
    // Dot clicks
    this.dotsContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.classList.contains('dot')) {
        const index = parseInt(e.target.dataset.index);
        this.goToIndex(index);
      }
    });
    
    // Resize observer for responsive card width
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.calculateCardWidth();
      });
      this.resizeObserver.observe(this);
    }
    
    // Prevent context menu
    this.addEventListener('contextmenu', e => e.preventDefault());
  }

  handleMouseLeave() {
    // If user drags outside the element, end the drag and snap to nearest card
    if (this.isDragging && this.hasMoved) {
      this.dragEnd();
    }
  }

  dragStart(e) {
    // Don't start drag if clicking on controls
    if (e.target.closest('.nav-arrow') || e.target.closest('.dots-container')) {
      return;
    }
    
    if (!this.isInitialized) return;
    
    this.isDragging = true;
    this.hasMoved = false; // Reset movement tracking
    this.startX = this.getPositionX(e);
    this.dragOffset = 0; // Reset drag offset
    this.setCursor('grabbing');
    
    // Prevent default to avoid text selection and improve responsiveness
    e.preventDefault();
  }

  dragMove(e) {
    if (!this.isDragging || !this.isInitialized) return;
    
    const currentPosition = this.getPositionX(e);
    const diff = currentPosition - this.startX;
    
    // Check if user has moved beyond threshold
    if (Math.abs(diff) > this.dragThreshold) {
      this.hasMoved = true;
      
      // Prevent default only after we confirm it's a drag, not a click
      e.preventDefault();
      
      this.dragOffset = diff; // Store the current drag offset
      this.currentTranslate = this.prevTranslate + diff;
      
      // Track scroll direction
      this.scrollDirection = diff > 0 ? 1 : -1; // 1 for right, -1 for left
      
      this.updatePosition();
      this.handleInfiniteLoop(); // Handle infinite loop during drag for smoother experience
    }
  }

  dragEnd(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.setCursor('grab');
    
    // If user didn't move much, treat it as a click and don't snap
    if (!this.hasMoved) {
      // Reset to previous position for clean click behavior
      this.currentTranslate = this.prevTranslate;
      this.updatePosition();
      return;
    }
    
    // Always snap to nearest card when user releases after dragging
    this.snapToNearestCard();
  }

  snapToNearestCard() {
    // Ensure we're not already animating
    if (this.isAnimating) return;
    
    // Find the nearest card position
    const basePosition = -this.cardWidth * this.originalCards.length * 2;
    const offset = this.currentTranslate - basePosition;
    const nearestCardIndex = Math.round(-offset / this.cardWidth);
    
    // Calculate target position
    const targetPosition = basePosition - (nearestCardIndex * this.cardWidth);
    
    // Animate to the nearest card
    this.animateToPosition(targetPosition, () => {
      this.prevTranslate = this.currentTranslate;
      this.updateCurrentIndex();
    });
  }

  setCursor(cursor) {
    this.style.cursor = cursor;
    document.body.style.cursor = cursor === 'grab' ? '' : cursor;
  }

  // Scroll left in the list (previous card)
  scrollLeft() {
    if (this.isAnimating) return;
    
    this.scrollDirection = -1; // Set direction to left
    
    // Move one card to the left
    const targetPosition = this.currentTranslate + this.cardWidth;
    
    this.animateToPosition(targetPosition, () => {
      this.prevTranslate = this.currentTranslate;
      this.updateCurrentIndex();
    });
  }

  // Scroll right in the list (next card)
  scrollRight() {
    if (this.isAnimating) return;
    
    this.scrollDirection = 1; // Set direction to right
    
    // Move one card to the right
    const targetPosition = this.currentTranslate - this.cardWidth;
    
    this.animateToPosition(targetPosition, () => {
      this.prevTranslate = this.currentTranslate;
      this.updateCurrentIndex();
    });
  }

  updateCurrentIndex() {
    // Calculate which card we're closest to based on current position
    const basePosition = -this.cardWidth * this.originalCards.length * 2; // Middle set position
    const offset = this.currentTranslate - basePosition;
    const cardIndex = Math.round(-offset / this.cardWidth);
    
    // Ensure index is within bounds
    let newIndex = cardIndex % this.originalCards.length;
    if (newIndex < 0) {
      newIndex += this.originalCards.length;
    }
    
    if (newIndex !== this.currentIndex) {
      this.currentIndex = newIndex;
      this.updateDots();
    }
  }

  goToIndex(index, animate = true) {
    // Ensure index is valid
    if (index < 0 || index >= this.originalCards.length) return;
    
    this.currentIndex = index;
    const targetPosition = -this.cardWidth * (this.originalCards.length * 2 + index);
    
    if (animate && !this.isAnimating) {
      this.animateToPosition(targetPosition, () => {
        this.prevTranslate = this.currentTranslate;
      });
    } else if (!animate) {
      this.currentTranslate = targetPosition;
      this.prevTranslate = targetPosition;
      this.updatePosition();
    }
    
    this.updateDots();
  }

  animateToPosition(targetPosition, callback) {
    this.isAnimating = true;
    
    const animate = () => {
      const diff = targetPosition - this.currentTranslate;
      
      if (Math.abs(diff) < 1) {
        this.currentTranslate = targetPosition;
        this.isAnimating = false;
        this.updatePosition();
        this.handleInfiniteLoop(); // Handle after animation completes
        if (callback) callback();
      } else {
        this.currentTranslate += diff * 0.25; // Slightly faster for more responsive feel
        this.updatePosition();
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  updateDots() {
    const dots = this.dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });
  }

  getPositionX(e) {
    return e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  }

  updatePosition() {
    this.scrollContainer.style.transform = `translate3d(${this.currentTranslate}px, 0, 0)`;
  }

  handleInfiniteLoop() {
    const setWidth = this.cardWidth * this.originalCards.length;
    
    // More lenient infinite loop handling - always loop when at boundaries
    if (this.currentTranslate > -setWidth * 0.5) {
      // At the right boundary, loop to continue
      const loopOffset = setWidth * 2;
      this.currentTranslate -= loopOffset;
      
      // Only update prevTranslate if not currently dragging to avoid breaking drag calculations
      if (!this.isDragging) {
        this.prevTranslate = this.currentTranslate;
      } else {
        // If dragging, adjust the start position to maintain smooth dragging
        this.prevTranslate -= loopOffset;
      }
      
      this.updatePosition();
    } else if (this.currentTranslate < -setWidth * 3.5) {
      // At the left boundary, loop to continue
      const loopOffset = setWidth * 2;
      this.currentTranslate += loopOffset;
      
      // Only update prevTranslate if not currently dragging to avoid breaking drag calculations
      if (!this.isDragging) {
        this.prevTranslate = this.currentTranslate;
      } else {
        // If dragging, adjust the start position to maintain smooth dragging
        this.prevTranslate += loopOffset;
      }
      
      this.updatePosition();
    }
  }

  disconnectedCallback() {
    document.removeEventListener('mousemove', this.dragMove.bind(this));
    document.removeEventListener('mouseup', this.dragEnd.bind(this));
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

customElements.define("ex-infcard-holder", InfiniCardHolder);

class InfiniCard extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    // Keep existing content
  }
}

customElements.define("ex-infcard", InfiniCard);
