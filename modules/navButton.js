// Simple scroll controller to prevent multiple simultaneous scrolls
class ScrollController {
  constructor() {
    this.activeButton = null;
    this.setupGlobalListeners();
  }

  setupGlobalListeners() {
    // Global listeners to cancel any active scroll
    window.addEventListener('wheel', () => this.cancelActiveScroll(), { passive: true });
    window.addEventListener('touchstart', () => this.cancelActiveScroll(), { passive: true });
    window.addEventListener('keydown', (event) => {
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (scrollKeys.includes(event.key)) {
        this.cancelActiveScroll();
      }
    }, { passive: true });
  }

  setActive(button) {
    if (this.activeButton && this.activeButton !== button) {
      this.activeButton.cancelScroll();
    }
    this.activeButton = button;
  }

  clearActive(button) {
    if (this.activeButton === button) {
      this.activeButton = null;
    }
  }

  cancelActiveScroll() {
    if (this.activeButton) {
      this.activeButton.cancelScroll();
    }
  }
}

const scrollController = new ScrollController();

class ExNavButton extends HTMLElement {
  constructor() {
    super();
    this.isScrolling = false;
    this.animationId = null;
  }

  connectedCallback() {
    this.addEventListener('click', this.handleClick.bind(this));
  }

  disconnectedCallback() {
    this.cancelScroll();
  }

  cancelScroll() {
    if (this.isScrolling) {
      this.isScrolling = false;
      scrollController.clearActive(this);
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }
  }

  // Simple smooth scroll implementation
  smoothScrollTo(targetPosition, duration = 600) {
    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      if (!this.isScrolling) return; // Stop if cancelled

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Simple easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentPosition = startPosition + (distance * easeOut);
      window.scrollTo(0, currentPosition);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animateScroll);
      } else {
        // Animation complete
        this.isScrolling = false;
        scrollController.clearActive(this);
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(animateScroll);
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

    // Check if the header contains a link - if so, navigate to it
    const link = targetHeader.querySelector('a[href]');
    if (link && link.href) {
      window.location.href = link.href;
      return;
    }

    // Otherwise, scroll to the header
    this.scrollToTarget(targetHeader);
  }

  findTargetHeader(name) {
    // Try to find by name attribute first
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
    if (gapAttr === null || gapAttr === '') return 20;
    
    const gap = parseInt(gapAttr, 10);
    return isNaN(gap) ? 20 : gap;
  }

  calculateScrollPosition(target) {
    const gap = this.getGapValue();
    const targetRect = target.getBoundingClientRect();
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const targetTop = targetRect.top + currentScroll;
    
    let scrollPosition = targetTop - gap;
    
    // Ensure we don't scroll beyond document bounds
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.max(0, Math.min(scrollPosition, maxScroll));
  }

  scrollToTarget(target) {
    // Cancel any existing scroll and register this one
    scrollController.setActive(this);
    this.isScrolling = true;
    
    const scrollPosition = this.calculateScrollPosition(target);
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    
    // If we're already at the target position, don't scroll
    if (Math.abs(currentScroll - scrollPosition) <= 5) {
      this.isScrolling = false;
      scrollController.clearActive(this);
      return;
    }
    
    // Use our custom smooth scroll
    this.smoothScrollTo(scrollPosition);
  }
}

class ExNavHeader extends HTMLElement {
  connectedCallback() {
    this.setAttribute('role', 'heading');
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