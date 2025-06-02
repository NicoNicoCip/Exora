class NavButton extends HTMLElement {
  static observedAttributes = ["name", "gap"];
  
  constructor() {
    super();
    this.scrolling = false;
  }

  connectedCallback() {
    this.render();
    this.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick() {
    const name = this.getAttribute('name');
    const gap = parseInt(this.getAttribute('gap')) || 0;
    if (!name) return;

    const targetHeader = document.querySelector(`ex-nav-header[name="${name}"]`);
    if (!targetHeader) return;

    this.scrollToTarget(targetHeader, gap);
  }

  scrollToTarget(targetElement, gap) {
    if (this.scrolling) return;
    this.scrolling = true;

    const duration = 300;
    const startTime = performance.now();
    const startPosition = window.pageYOffset;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Recalculate target position on each frame to account for dynamic changes
      const currentElementTop = this.getElementTop(targetElement);
      const targetPosition = Math.max(0, currentElementTop - gap);
      
      // Use easing function
      const easedProgress = this.easeInOutQuad(progress);
      const currentPosition = startPosition + (targetPosition - startPosition) * easedProgress;

      window.scrollTo(0, currentPosition);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scrolling = false;
        // Final adjustment to ensure perfect positioning
        this.finalAdjustment(targetElement, gap);
      }
    };

    requestAnimationFrame(animate);
  }

  getElementTop(element) {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return rect.top + scrollTop;
  }

  finalAdjustment(targetElement, gap) {
    // Wait a frame to let any pending layout changes settle
    requestAnimationFrame(() => {
      const finalTop = this.getElementTop(targetElement);
      const finalTarget = Math.max(0, finalTop - gap);
      const currentScroll = window.pageYOffset;
      
      // Only adjust if there's a significant difference (more than 1px)
      if (Math.abs(currentScroll - finalTarget) > 1) {
        window.scrollTo(0, finalTarget);
      }
    });
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  render() {
  }
}

class NavHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
  }
}

// Enhanced scroll system that works with dynamic headers
class ScrollSystem {
  constructor() {
    this.init();
  }

  init() {
    this.setupHeaderSquish();
    this.setupIntersectionObserver();
  }

  setupHeaderSquish() {
    let ticking = false;

    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const maxScroll = 200;
      const progress = Math.min(scrollTop / maxScroll, 1);
      
      // Calculate current header height
      const initialHeight = 80;
      const minHeight = 60;
      const currentHeaderHeight = initialHeight - (initialHeight - minHeight) * progress;
      
      // Update all nav headers with current header height as default gap
      this.updateNavHeaderGaps(currentHeaderHeight);
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateScrollProgress);
    updateScrollProgress();
  }

  updateNavHeaderGaps(headerHeight) {
    const navHeaders = document.querySelectorAll('ex-nav-header');
    navHeaders.forEach(header => {
      const correspondingButton = document.querySelector(`ex-nav-button[name="${header.getAttribute('name')}"]`);
      if (correspondingButton) {
        const customGap = correspondingButton.getAttribute('gap');
        const effectiveGap = customGap ? parseInt(customGap) : headerHeight;
      }
    });
  }

  setupIntersectionObserver() {
    // Optional: Add active state management
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const name = entry.target.getAttribute('name');
          const correspondingButton = document.querySelector(`ex-nav-button[name="${name}"]`);
          if (correspondingButton) {
            correspondingButton.classList.add('active');
          }
        } else {
          const name = entry.target.getAttribute('name');
          const correspondingButton = document.querySelector(`ex-nav-button[name="${name}"]`);
          if (correspondingButton) {
            correspondingButton.classList.remove('active');
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px'
    });

    // Observe all nav headers
    document.querySelectorAll('ex-nav-header').forEach(header => {
      observer.observe(header);
    });
  }
}

// Register components
customElements.define("ex-nav-header", NavHeader);
customElements.define("ex-nav-button", NavButton);

// Initialize scroll system when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ScrollSystem());
} else {
  new ScrollSystem();
}