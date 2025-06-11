// Global scroll controller to manage all ex-nav-button scroll operations
class ScrollController {
  constructor() {
    this.activeScrolls = new Set();
    this.scrollEndTimer = null;
    this.lastKnownScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    this.scrollVelocityHistory = [];
    this.isExternalScrolling = false;
  }

  registerScroll(button) {
    // Cancel all existing scrolls
    this.cancelAllScrolls();
    
    // Register the new active scroll
    this.activeScrolls.add(button);
    this.isExternalScrolling = false;
    
    // Reset scroll tracking
    this.lastKnownScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    this.scrollVelocityHistory = [];
  }

  cancelAllScrolls() {
    // Stop tracking all current scrolls
    this.activeScrolls.forEach(button => {
      button.cancelScroll();
    });
    this.activeScrolls.clear();
    
    // Clear any pending scroll end detection
    if (this.scrollEndTimer) {
      clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = null;
    }
    
    this.isExternalScrolling = false;
  }

  unregisterScroll(button) {
    this.activeScrolls.delete(button);
    if (this.activeScrolls.size === 0) {
      this.isExternalScrolling = false;
    }
  }

  // Check if scrolling appears to be external (user or other code)
  checkForExternalScroll(currentPosition, expectedDirection = null) {
    const timeDelta = 16; // Assume ~60fps
    const velocity = (currentPosition - this.lastKnownScrollPosition) / timeDelta;
    
    // Add to velocity history (keep last 5 measurements)
    this.scrollVelocityHistory.push(velocity);
    if (this.scrollVelocityHistory.length > 5) {
      this.scrollVelocityHistory.shift();
    }
    
    // Check for signs of external scrolling
    let isExternal = false;
    
    if (this.scrollVelocityHistory.length >= 3) {
      // Check for sudden velocity changes that indicate user intervention
      const avgVelocity = this.scrollVelocityHistory.reduce((a, b) => a + b, 0) / this.scrollVelocityHistory.length;
      const velocityVariance = this.scrollVelocityHistory.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / this.scrollVelocityHistory.length;
      
      // High variance suggests erratic movement (user scrolling)
      if (velocityVariance > 100) {
        isExternal = true;
      }
      
      // Check if scroll direction suddenly reversed (user scrolling opposite direction)
      if (expectedDirection && this.scrollVelocityHistory.length >= 2) {
        const recentVelocity = this.scrollVelocityHistory[this.scrollVelocityHistory.length - 1];
        if ((expectedDirection > 0 && recentVelocity < -5) || (expectedDirection < 0 && recentVelocity > 5)) {
          isExternal = true;
        }
      }
    }
    
    // Check for very high velocity (wheel scrolling or programmatic jumps)
    if (Math.abs(velocity) > 50) {
      isExternal = true;
    }
    
    this.lastKnownScrollPosition = currentPosition;
    
    if (isExternal && !this.isExternalScrolling) {
      this.isExternalScrolling = true;
      // Cancel all button scrolls when external scrolling is detected
      this.cancelAllScrolls();
    }
    
    return isExternal;
  }

  // Detect when smooth scrolling has ended
  onScrollEnd(callback) {
    if (this.scrollEndTimer) {
      clearTimeout(this.scrollEndTimer);
    }
    
    this.scrollEndTimer = setTimeout(callback, 100);
  }
}

// Global instance
const scrollController = new ScrollController();

class ExNavButton extends HTMLElement {
  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.resizeObserver = null;
    this.mutationObserver = null;
    this.isScrolling = false;
    this.currentTarget = null;
    this.scrollUpdateTimer = null;
    this.targetScrollPosition = null;
    this.lastScrollPosition = null;
    this.scrollStuckCount = 0;
    this.expectedScrollDirection = null;
    this.lastScrollTime = 0;
  }

  connectedCallback() {
    this.addEventListener('click', this.handleClick);
    this.setupObservers();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
    this.cleanupObservers();
    this.cancelScroll();
  }

  setupObservers() {
    // Observe resize changes on the document body and window
    this.resizeObserver = new ResizeObserver(() => {
      // Debounce resize events
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.updateScrollPosition();
      }, 100);
    });

    // Observe the entire document for size changes
    this.resizeObserver.observe(document.body);

    // Also observe DOM mutations that might affect layout
    this.mutationObserver = new MutationObserver(() => {
      clearTimeout(this.mutationTimeout);
      this.mutationTimeout = setTimeout(() => {
        this.updateScrollPosition();
      }, 100);
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Listen for window resize
    window.addEventListener('resize', this.handleResize);
    
    // Listen for scroll events to detect when smooth scrolling ends
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    
    // Listen for user input events that might cause scrolling
    window.addEventListener('wheel', this.handleUserScroll, { passive: true });
    window.addEventListener('touchstart', this.handleUserScroll, { passive: true });
    window.addEventListener('keydown', this.handleKeyScroll, { passive: true });
  }

  cleanupObservers() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('wheel', this.handleUserScroll);
    window.removeEventListener('touchstart', this.handleUserScroll);
    window.removeEventListener('keydown', this.handleKeyScroll);
    clearTimeout(this.resizeTimeout);
    clearTimeout(this.mutationTimeout);
    clearTimeout(this.scrollUpdateTimer);
  }

  handleResize = () => {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.updateScrollPosition();
    }, 100);
  }

  handleUserScroll = () => {
    // User initiated scroll - cancel our scroll
    if (this.isScrolling) {
      this.cancelScroll();
    }
  }

  handleKeyScroll = (event) => {
    // Check for scroll-related keys
    const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    if (scrollKeys.includes(event.key) && this.isScrolling) {
      this.cancelScroll();
    }
  }

  handleScroll = () => {
    const currentTime = performance.now();
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Check for external scrolling if we have an active scroll
    if (this.isScrolling && scrollController.activeScrolls.has(this)) {
      // Calculate expected direction
      if (this.targetScrollPosition !== null) {
        this.expectedScrollDirection = this.targetScrollPosition > currentScroll ? 1 : -1;
      }
      
      // Check if this appears to be external scrolling
      const isExternal = scrollController.checkForExternalScroll(currentScroll, this.expectedScrollDirection);
      
      if (isExternal) {
        this.cancelScroll();
        return;
      }
      
      // Check if we're stuck at a boundary
      if (this.lastScrollPosition !== null && Math.abs(currentScroll - this.lastScrollPosition) < 1) {
        this.scrollStuckCount++;
        
        // If we've been stuck for a few scroll events, check if we're at target or boundary
        if (this.scrollStuckCount >= 3) {
          const distanceToTarget = Math.abs(currentScroll - this.targetScrollPosition);
          
          // If we're close to target or at a document boundary, finish the scroll
          if (distanceToTarget <= 5 || this.isAtScrollBoundary(currentScroll)) {
            this.finishScroll();
            return;
          }
        }
      } else {
        // Reset stuck counter if we're moving
        this.scrollStuckCount = 0;
      }
      
      this.lastScrollPosition = currentScroll;
    }

    // Detect when scrolling has stopped
    scrollController.onScrollEnd(() => {
      if (this.isScrolling) {
        this.finishScroll();
      }
    });
    
    this.lastScrollTime = currentTime;
  }

  isAtScrollBoundary(currentScroll) {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const minScroll = 0;
    
    // Check if we're at the top or bottom boundary (within 5px tolerance)
    return currentScroll <= minScroll + 5 || currentScroll >= maxScroll - 5;
  }

  cancelScroll() {
    this.isScrolling = false;
    this.currentTarget = null;
    this.targetScrollPosition = null;
    this.lastScrollPosition = null;
    this.scrollStuckCount = 0;
    this.expectedScrollDirection = null;
    scrollController.unregisterScroll(this);
    
    if (this.scrollUpdateTimer) {
      clearTimeout(this.scrollUpdateTimer);
      this.scrollUpdateTimer = null;
    }
  }

  finishScroll() {
    this.isScrolling = false;
    this.currentTarget = null;
    this.targetScrollPosition = null;
    this.lastScrollPosition = null;
    this.scrollStuckCount = 0;
    this.expectedScrollDirection = null;
    scrollController.unregisterScroll(this);
  }

  updateScrollPosition() {
    // Only update if we're currently tracking a target and this is the active scroll
    if (this.currentTarget && this.isScrolling && scrollController.activeScrolls.has(this)) {
      const gap = this.getGapValue();
      const newTargetPosition = this.calculateScrollPosition(this.currentTarget, gap);
      
      // Check if the target position has changed significantly
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const distanceToNewTarget = Math.abs(currentScroll - newTargetPosition);
      
      // Only scroll if we're not already close to the target and position has changed
      if (distanceToNewTarget > 5 && Math.abs(newTargetPosition - (this.targetScrollPosition || 0)) > 5) {
        this.targetScrollPosition = newTargetPosition;
        this.scrollStuckCount = 0; // Reset stuck counter for new scroll
        
        // Cancel the scroll end timer since we're manually scrolling
        if (scrollController.scrollEndTimer) {
          clearTimeout(scrollController.scrollEndTimer);
        }
        
        window.scrollTo({
          top: newTargetPosition,
          behavior: 'smooth'
        });
      } else if (distanceToNewTarget <= 5) {
        // We're close enough to the target, finish the scroll
        this.finishScroll();
      }
    }
  }

  handleClick(event) {
    event.preventDefault();
    
    const targetName = this.getAttribute('name') || this.textContent.trim();
    if (!targetName) {
      console.warn('ex-nav-button: No name attribute or text content found');
      return;
    }

    const targetHeader = this.findTargetHeader(targetName);
    if (!targetHeader) {
      console.warn(`ex-nav-button: No ex-nav-header found with name "${targetName}"`);
      return;
    }

    this.scrollToTarget(targetHeader);
  }

  findTargetHeader(name) {
    // First try to find by name attribute
    let target = document.querySelector(`ex-nav-header[name="${name}"]`);
    
    // If not found, try to find by text content
    if (!target) {
      const headers = document.querySelectorAll('ex-nav-header');
      target = Array.from(headers).find(header => 
        header.textContent.trim() === name
      );
    }

    return target;
  }

  getGapValue() {
    const gapAttr = this.getAttribute('gap');
    if (gapAttr === null || gapAttr === '') {
      return 20; // Default gap
    }
    
    const gap = parseInt(gapAttr, 10);
    return isNaN(gap) ? 20 : gap;
  }

  calculateScrollPosition(target, gap) {
    const targetRect = target.getBoundingClientRect();
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const targetTop = targetRect.top + currentScroll;
    
    // Position the header at the top of the viewport with the specified gap
    let scrollPosition = targetTop - gap;
    
    // Handle negative gaps - allow header to scroll off-screen
    if (gap < 0) {
      // With negative gap, we might scroll past the header
      scrollPosition = targetTop - gap; // This will be targetTop + |gap|
    } else {
      // With positive gap, ensure we don't scroll too far down
      // The header should appear at the top with the gap above it
      scrollPosition = targetTop - gap;
      
      // Ensure we don't scroll beyond what makes sense
      // If gap is very large, make sure we don't scroll past the header
      const viewportHeight = window.innerHeight;
      const targetHeight = targetRect.height;
      
      // Don't let a large positive gap push the header completely off screen at the bottom
      const maxReasonableScroll = targetTop + targetHeight - viewportHeight;
      if (scrollPosition > maxReasonableScroll && gap > viewportHeight) {
        scrollPosition = maxReasonableScroll;
      }
    }
    
    // Ensure we don't scroll beyond document bounds
    const maxDocumentScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const minDocumentScroll = 0;
    
    scrollPosition = Math.max(minDocumentScroll, Math.min(scrollPosition, maxDocumentScroll));
    
    return scrollPosition;
  }

  scrollToTarget(target) {
    // Register this scroll operation (this will cancel any existing ones)
    scrollController.registerScroll(this);
    
    this.currentTarget = target;
    this.isScrolling = true;
    this.scrollStuckCount = 0;
    this.lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    const gap = this.getGapValue();
    const scrollPosition = this.calculateScrollPosition(target, gap);
    this.targetScrollPosition = scrollPosition;
    
    // Set expected scroll direction
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    this.expectedScrollDirection = scrollPosition > currentScroll ? 1 : -1;
    
    // Check if we're already at the target position
    if (Math.abs(currentScroll - scrollPosition) <= 5) {
      // We're already at the target, no need to scroll
      this.finishScroll();
      return;
    }
    
    window.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });

    // Set a fallback timer in case scroll events don't fire properly
    this.scrollUpdateTimer = setTimeout(() => {
      if (this.isScrolling) {
        this.finishScroll();
      }
    }, 1500); // Longer timeout as fallback
  }
}

class ExNavHeader extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Add any initialization logic for headers if needed
    this.setAttribute('role', 'heading');
    this.render()
  }

  render() {
    this.innerHTML = ''
  }
}

// Register the custom elements
if (!customElements.get('ex-nav-button')) {
  customElements.define('ex-nav-button', ExNavButton);
}

if (!customElements.get('ex-nav-header')) {
  customElements.define('ex-nav-header', ExNavHeader);
}

// Export for module usage
export { ExNavButton, ExNavHeader };

