class ExMain extends HTMLElement {
    constructor() {
        super();
        this.tabOrderSetup = false;
        this.focusStylesAdded = false;
        this.clockInterval = null;
        this.scrollHandler = null;
    }



    connectedCallback() {
        this.render();

        // Use requestAnimationFrame for better performance timing
        requestAnimationFrame(() => {
            if (!this.tabOrderSetup) {
                this.setupTabOrder();
                this.tabOrderSetup = true;
            }
            if (!this.focusStylesAdded) {
                this.addFocusStyles();
                this.focusStylesAdded = true;
            }
        });
    }

    disconnectedCallback() {
        // Clean up intervals and event listeners when component is removed
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }
    }

    setupTabOrder() {
        // Use requestIdleCallback if available, fallback to setTimeout with shorter delay
        const scheduleWork = window.requestIdleCallback || ((cb) => setTimeout(cb, 50));

        scheduleWork(() => {
            let currentTabIndex = 1;

            // 1. Header elements first (left to right)
            currentTabIndex = this.setupHeaderTabOrder(currentTabIndex);

            // 2. Main content elements (top to bottom, left to right)
            currentTabIndex = this.setupMainTabOrder(currentTabIndex);

            // 3. Footer elements (sidenavigator, then socials, then policies)
            this.setupFooterTabOrder(currentTabIndex);
        });
    }

    setupHeaderTabOrder(startIndex) {
        const header = document.querySelector('header');
        if (!header) return startIndex;

        // Cache selectors - querySelectorAll is expensive
        const headerElements = [
            header.querySelector('#left ex-nav-button'),
            header.querySelector('#navlogo'),
            header.querySelector('#right ex-nav-button')
        ].filter(Boolean);

        headerElements.forEach((el, index) => {
            el.setAttribute('tabindex', String(startIndex + index));
            this.addAriaAttributes(el, 'header');
        });

        return startIndex + headerElements.length;
    }

    setupMainTabOrder(startIndex) {
        const main = document.querySelector('main');
        if (!main) return startIndex;

        let currentIndex = startIndex;
        const processedElements = new Set();

        // More efficient element traversal - avoid TreeWalker overhead
        const elements = main.querySelectorAll('*');

        for (const node of elements) {
            if (processedElements.has(node)) continue;

            // Handle infini-card holders when we encounter them
            if (node.matches('ex-infcard-holder')) {
                currentIndex = this.setupInfiniCardTabOrder(node, currentIndex, processedElements);
                continue;
            }

            // Skip elements that are inside infini-card holders
            if (node.closest('ex-infcard-holder')) continue;

            // Handle regular focusable elements
            if (this.isFocusableElement(node)) {
                node.setAttribute('tabindex', String(currentIndex));
                this.addAriaAttributes(node, 'main');
                processedElements.add(node);
                currentIndex++;
            }
        }

        return currentIndex;
    }

    setupInfiniCardTabOrder(holder, startIndex, processedElements) {
        let currentIndex = startIndex;

        // Batch DOM queries to reduce reflows
        const leftArrow = holder.querySelector('.nav-arrow-left');
        const rightArrow = holder.querySelector('.nav-arrow-right');
        const dots = holder.querySelectorAll('.dot');
        const otherFocusable = holder.querySelectorAll('button, a, input, select, textarea, ex-nav-button');

        // Process navigation arrows
        if (leftArrow) {
            leftArrow.setAttribute('tabindex', String(currentIndex));
            this.addAriaAttributes(leftArrow, 'carousel-control');
            processedElements.add(leftArrow);
            currentIndex++;
        }

        if (rightArrow) {
            rightArrow.setAttribute('tabindex', String(currentIndex));
            this.addAriaAttributes(rightArrow, 'carousel-control');
            processedElements.add(rightArrow);
            currentIndex++;
        }

        // Process dots
        for (const dot of dots) {
            dot.setAttribute('tabindex', String(currentIndex));
            this.addAriaAttributes(dot, 'carousel-indicator');
            processedElements.add(dot);
            currentIndex++;
        }

        // Process other focusable elements
        for (const el of otherFocusable) {
            if (!processedElements.has(el) &&
                !el.classList.contains('nav-arrow-left') &&
                !el.classList.contains('nav-arrow-right') &&
                !el.classList.contains('dot')) {
                el.setAttribute('tabindex', String(currentIndex));
                this.addAriaAttributes(el, 'carousel-section');
                processedElements.add(el);
                currentIndex++;
            }
        }

        processedElements.add(holder);
        return currentIndex;
    }

    setupFooterTabOrder(startIndex) {
        const footer = document.querySelector('footer');
        if (!footer) return;

        let currentIndex = startIndex;

        // Batch all footer queries
        const sidenavigator = footer.querySelector('#sidenavigator');
        const socials = footer.querySelector('#socials');
        const policies = footer.querySelector('#policies');

        // 1. Side navigator elements
        if (sidenavigator) {
            const sideNavElements = sidenavigator.querySelectorAll('ex-nav-button');
            for (const el of sideNavElements) {
                el.setAttribute('tabindex', String(currentIndex));
                this.addAriaAttributes(el, 'footer-navigation');
                currentIndex++;
            }
        }

        // 2. Social links
        if (socials) {
            const socialLinks = socials.querySelectorAll('a');
            for (const el of socialLinks) {
                el.setAttribute('tabindex', String(currentIndex));
                this.addAriaAttributes(el, 'social-link');
                currentIndex++;
            }
        }

        // 3. Policy buttons
        if (policies) {
            const policyButtons = policies.querySelectorAll('button');
            for (const el of policyButtons) {
                el.setAttribute('tabindex', String(currentIndex));
                this.addAriaAttributes(el, 'footer-policy');
                currentIndex++;
            }
        }
    }

    // Cache the focusable selectors to avoid recreating the array each time
    static FOCUSABLE_SELECTORS = [
        'ex-nav-button',
        'button',
        'a[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
        '.menu-item'
    ];

    isFocusableElement(element) {
        return ExMain.FOCUSABLE_SELECTORS.some(selector => element.matches(selector));
    }

    addAriaAttributes(element, context) {
        // Batch attribute reads/writes to minimize DOM access
        const hasRole = element.hasAttribute('role');
        const hasAriaLabel = element.hasAttribute('aria-label');
        const hasAriaLabelledby = element.hasAttribute('aria-labelledby');
        const hasAriaPressed = element.hasAttribute('aria-pressed');
        const hasAriaDescribedby = element.hasAttribute('aria-describedby');

        // Add role if not present
        if (!hasRole) {
            if (element.tagName === 'BUTTON' || element.classList.contains('nav-arrow') || element.classList.contains('dot')) {
                element.setAttribute('role', 'button');
            } else if (element.tagName === 'A') {
                element.setAttribute('role', 'link');
            } else if (element.classList.contains('menu-item')) {
                element.setAttribute('role', 'menuitem');
            }
        }

        // Add aria-label if not present
        if (!hasAriaLabel && !hasAriaLabelledby) {
            let label = '';

            if (element.classList.contains('nav-arrow-left')) {
                label = 'Previous item';
            } else if (element.classList.contains('nav-arrow-right')) {
                label = 'Next item';
            } else if (element.classList.contains('dot')) {
                const index = element.dataset.index;
                label = `Go to item ${parseInt(index) + 1}`;
            } else if (element.classList.contains('menu-item')) {
                label = element.dataset.label || element.textContent?.trim() || element.title || 'Menu item';
            } else if (element.hasAttribute('name')) {
                label = `Navigate to ${element.getAttribute('name')}`;
            } else if (element.textContent?.trim()) {
                label = element.textContent.trim();
            } else if (element.id) {
                label = element.id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }

            if (label) {
                element.setAttribute('aria-label', label);
            }
        }

        // Add aria-pressed for toggle buttons
        if (element.classList.contains('dot') && !hasAriaPressed) {
            element.setAttribute('aria-pressed', 'false');
        }

        // Add aria-describedby for context if helpful
        if (context === 'carousel-control' && !hasAriaDescribedby) {
            element.setAttribute('aria-describedby', 'carousel-instructions');
        }

        // Add menu-specific attributes
        if (element.classList.contains('menu-item')) {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            this.addMenuItemKeyboardHandling(element);
        }
    }

    addMenuItemKeyboardHandling(menuItem) {
        // Add keyboard event listener if not already added
        if (!menuItem.dataset.keyboardHandlerAdded) {
            menuItem.addEventListener('keydown', (e) => {
                // Handle Enter and Space key activation
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (menuItem.onclick) {
                        menuItem.onclick(e);
                    } else {
                        menuItem.click();
                    }
                }

                // Handle arrow key navigation within menu
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateMenuItems(menuItem, e.key === 'ArrowDown' ? 1 : -1);
                }
            });

            menuItem.dataset.keyboardHandlerAdded = 'true';
        }
    }

    navigateMenuItems(currentItem, direction) {
        // Find all menu items in the same container
        const container = currentItem.closest('[role="menu"], .menu, .menu-container') || document;
        const menuItems = Array.from(container.querySelectorAll('.menu-item[tabindex]:not([tabindex="-1"])'));

        const currentIndex = menuItems.indexOf(currentItem);
        if (currentIndex === -1) return;

        const nextIndex = direction > 0
            ? (currentIndex + 1) % menuItems.length
            : (currentIndex - 1 + menuItems.length) % menuItems.length;

        const nextItem = menuItems[nextIndex];
        if (nextItem) {
            nextItem.focus();
        }
    }

    addFocusStyles() {
        // Check if styles already exist to avoid duplicates
        if (document.getElementById('ex-main-focus-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'ex-main-focus-styles';
        style.textContent = `
      /* Remove all default focus styles first */
      *:focus {
        outline: none !important;
      }

      /* Only show focus styles when navigating via keyboard */
      *:focus-visible {
        outline: 3px solid var(--c-gold) !important;
        outline-offset: 2px !important;
      }

      /* Special focus styles for buttons during keyboard navigation */
      button:focus-visible,
      ex-nav-button:focus-visible,
      .nav-arrow-left:focus-visible,
      .nav-arrow-right:focus-visible,
      .dot:focus-visible {
        outline: 3px solid var(--c-gold) !important;
        outline-offset: 2px !important;
      }

      /* Focus styles for links during keyboard navigation */
      a:focus-visible {
        outline: 3px solid var(--c-gold) !important;
        outline-offset: 2px !important;
        text-decoration: underline !important;
      }

      /* Focus styles for form elements during keyboard navigation */
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible {
        outline: 3px solid var(--c-gold) !important;
        outline-offset: 2px !important;
        border-color: var(--c-gold) !important;
      }

      /* Focus styles for menu items during keyboard navigation */
      .menu-item:focus-visible {
        outline: 3px solid var(--c-gold) !important;
        outline-offset: 2px !important;
      }

      /* Selected menu item styles */
      .menu-item.selected {
        border-left: 4px solid var(--c-gold) !important;
      }

      /* Menu item selection indicator */
      .menu-item[aria-selected="true"]::before {
        content: "✓ ";
        color: var(--c-gold);
        font-weight: bold;
        margin-right: 0.5em;
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        *:focus-visible {
          outline: 3px solid currentColor !important;
          outline-offset: 2px !important;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        *:focus-visible {
          transition: none !important;
        }
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
        document.head.appendChild(style);
    }

    render() {
        // Use innerHTML instead of outerHTML to maintain DOM position
        this.outerHTML = /*html */ `
      <div class="page-clock-bg">
        <div class="clock-hand"></div>
      </div>

      <header class="large">
        <nav role="navigation" aria-label="Main navigation">
          <div id="left">
            <ex-nav-button gap="80px" name="about start">@T:home</ex-nav-button>
          </div>
          <ex-nav-button id="navlogo" gap="170px" name="top">
            <img loading="lazy" src="/functions/images/ExoraLogo.webp?quality=auto&format=webp" alt="Exora Logo">
          </ex-nav-button>
          <div id="right">
            <ex-nav-button gap="80px" name="menu">@T:menu</ex-nav-button>
          </div>
        </nav>
      </header>

      <main role="main">
        ${this.innerHTML}
        
        <!-- Hidden instructions for screen readers -->
        <div id="carousel-instructions" class="sr-only" aria-hidden="true">
          @T:aria_useArrows
        </div>
      </main>
      
      <footer role="contentinfo">
        <ex-nav-header name="bottom"></ex-nav-header>
        <!--
        <ex-line dir="v" width="3px"></ex-line>
        <div id="sidenavigator" role="navigation" aria-label="Page navigation">
          <ex-nav-button gap="170px" name="top">@T:top</ex-nav-button>
          <ex-nav-button gap="80px" name="menu">@T:menu</ex-nav-button>
          <ex-nav-button gap="170px" name="about start">@T:aboutUs</ex-nav-button>
          <ex-nav-button gap="80px" name="about experience">@T:experience</ex-nav-button>
          <ex-nav-button gap="80px" name="about vision">@T:vision</ex-nav-button>
          <ex-nav-button gap="80px" name="about philosophy">@T:philosophy</ex-nav-button>
          <ex-nav-button gap="80px" name="about location">@T:location</ex-nav-button>
          <ex-nav-button gap="80px" name="about team">@T:team</ex-nav-button>
        </div>
        -->

        <ex-line dir="v" width="3px"></ex-line>

        <div id="links">
          <ex-line width="3px"></ex-line>
          
          <h2>@T:socials</h2>

          <div id="socials" role="list" aria-label="Social media links">
            <a href="https://instagram.com" class="social-link instagram-link" aria-label="Visit our Instagram page" role="listitem">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://www.tripadvisor.com/" class="social-link tripadvisor-link" aria-label="Visit our TripAdvisor page" role="listitem">
              <svg class="icon" viewBox="0 -96 512.2 512.2" fill="currentColor" aria-hidden="true">
                <path d="M128.2 127.9C92.7 127.9 64 156.6 64 192c0 35.4 28.7 64.1 64.1 64.1 35.4 0 64.1-28.7 64.1-64.1.1-35.4-28.6-64.1-64-64.1zm0 110c-25.3 0-45.9-20.5-45.9-45.9s20.5-45.9 45.9-45.9S174 166.7 174 192s-20.5 45.9-45.8 45.9z"/><circle cx="128.4" cy="191.9" r="31.9"/><path d="M384.2 127.9c-35.4 0-64.1 28.7-64.1 64.1 0 35.4 28.7 64.1 64.1 64.1 35.4 0 64.1-28.7 64.1-64.1 0-35.4-28.7-64.1-64.1-64.1zm0 110c-25.3 0-45.9-20.5-45.9-45.9s20.5-45.9 45.9-45.9S430 166.7 430 192s-20.5 45.9-45.8 45.9z"/><circle cx="384.4" cy="191.9" r="31.9"/><path d="M474.4 101.2l37.7-37.4h-76.4C392.9 29 321.8 0 255.9 0c-66 0-136.5 29-179.3 63.8H0l37.7 37.4C14.4 124.4 0 156.5 0 192c0 70.8 57.4 128.2 128.2 128.2 32.5 0 62.2-12.1 84.8-32.1l43.4 31.9 42.9-31.2-.5-1.2c22.7 20.2 52.5 32.5 85.3 32.5 70.8 0 128.2-57.4 128.2-128.2-.1-35.4-14.6-67.5-37.9-90.7zM368 64.8c-60.7 7.6-108.3 57.6-111.9 119.5-3.7-62-51.4-112.1-112.3-119.5 30.6-22 69.6-32.8 112.1-32.8S337.4 42.8 368 64.8zM128.2 288.2C75 288.2 32 245.1 32 192s43.1-96.2 96.2-96.2 96.2 43.1 96.2 96.2c-.1 53.1-43.1 96.2-96.2 96.2zm256 0c-53.1 0-96.2-43.1-96.2-96.2s43.1-96.2 96.2-96.2 96.2 43.1 96.2 96.2c-.1 53.1-43.1 96.2-96.2 96.2z"/>
              </svg>
            </a>
            <a href="https://facebook.com" class="social-link facebook-link" aria-label="Visit our Facebook page" role="listitem">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>

          <ex-line width="3px"></ex-line>

          <div id="policies" role="group" aria-label="Legal and contact information">
            <button id="pop-contact-btn">@T:contactUs</button>
            <button id="pop-privacy-btn">@T:privacyPolicy</button>
            <button id="pop-legal-btn">@T:legalAdvice</button>
            <button id="pop-cookie-btn">@T:cookieSettings</button>
            <button id="pop-langsett-btn">@T:languageSettings</button>
          </div>

          <ex-line width="3px"></ex-line>

          <p>@T:copyright</p>
        </div>

        <ex-line dir="v" width="3px"></ex-line>
      </footer>

      <ex-translate></ex-translate>
    `;
    }
}

customElements.define("ex-main", ExMain);

document.addEventListener("DOMContentLoaded", () => {

    const clockHand = document.querySelector('.clock-hand');
    let clockInterval = null;

    if (clockHand) {
        function updateClock() {
            const now = new Date();
            const hours = now.getHours() % 12;
            const minutes = now.getMinutes();

            const rotation = (hours * 30) + (minutes * 0.5);


            clockHand.style.transform = `rotate3d(0, 0, 1, ${rotation}deg)`;
        }

        updateClock();

        clockInterval = setInterval(updateClock, 10000);
    }


    const header = document.querySelector('header');
    let scrollTimeout = null;
    let lastScrollY = window.scrollY;

    function updateHeader() {
        const currentScrollY = window.scrollY;

        if (Math.abs(currentScrollY - lastScrollY) > 5) {
            if (currentScrollY <= 20) {
                header?.classList.add('large');
            } else {
                header?.classList.remove('large');
            }
            lastScrollY = currentScrollY;
        }
    }
    function throttledScrollHandler() {
        if (scrollTimeout) return;

        scrollTimeout = requestAnimationFrame(() => {
            updateHeader();
            scrollTimeout = null;
        });
    }

    updateHeader();

    window.addEventListener('scroll', throttledScrollHandler, { passive: true });

    window.exMainCleanup = () => {
        if (clockInterval) {
            clearInterval(clockInterval);
        }
        window.removeEventListener('scroll', throttledScrollHandler);
    };
});