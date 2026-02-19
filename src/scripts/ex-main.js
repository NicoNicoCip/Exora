class ExMain extends HTMLElement {
    constructor() {
        super();
        this.focusStylesAdded = false;
        this.clockInterval = null;
        this.scrollHandler = null;
    }

    connectedCallback() {
        this.render();

        requestAnimationFrame(() => {
            if (!this.focusStylesAdded) {
                this.addFocusStyles();
                this.focusStylesAdded = true;
            }
        });
    }

    disconnectedCallback() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }
    }

    addFocusStyles() {
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

      a:focus-visible {
        outline: 3px solid var(--c-gold) !important;
        outline-offset: 2px !important;
        text-decoration: underline !important;
      }

      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible {
        outline: 3px solid var(--c-gold) !important;
        outline-offset: 2px !important;
        border-color: var(--c-gold) !important;
      }

      @media (prefers-contrast: high) {
        *:focus-visible {
          outline: 3px solid currentColor !important;
          outline-offset: 2px !important;
        }
      }

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
        this.outerHTML = /*html */ `
      <div class="page-clock-bg" aria-hidden="true">
        <div class="clock-hand"></div>
      </div>

      <header class="large">
        <nav role="navigation" aria-label="Main navigation">
          <div id="left">
            <ex-nav-button gap="80px" name="about start">@T:home</ex-nav-button>
          </div>
          <ex-nav-button id="navlogo" gap="170px" name="top" aria-label="EXORA — Back to top">
            <img loading="lazy" src="/functions/images/ExoraLogo.webp?quality=auto&format=webp" alt="EXORA Bistro logo">
          </ex-nav-button>
          <div id="right">
            <ex-nav-button gap="80px" name="menu">@T:menu</ex-nav-button>
          </div>
        </nav>
      </header>

      <main role="main" id="main-content">
        ${this.innerHTML}

        <div id="carousel-instructions" class="sr-only">
          @T:aria_useArrows
        </div>
      </main>

      <footer role="contentinfo">
        <ex-nav-header name="bottom"></ex-nav-header>

        <ex-line dir="v" width="3px" aria-hidden="true"></ex-line>

        <div id="links">
          <ex-line width="3px" aria-hidden="true"></ex-line>

          <h2>@T:socials</h2>

          <div id="socials" role="list" aria-label="Social media links">
            <a href="https://instagram.com" class="social-link instagram-link" aria-label="Visit our Instagram page" role="listitem">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://www.tripadvisor.com/" class="social-link tripadvisor-link" aria-label="Visit our TripAdvisor page" role="listitem">
              <svg class="icon" viewBox="0 -96 512.2 512.2" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M128.2 127.9C92.7 127.9 64 156.6 64 192c0 35.4 28.7 64.1 64.1 64.1 35.4 0 64.1-28.7 64.1-64.1.1-35.4-28.6-64.1-64-64.1zm0 110c-25.3 0-45.9-20.5-45.9-45.9s20.5-45.9 45.9-45.9S174 166.7 174 192s-20.5 45.9-45.8 45.9z"/><circle cx="128.4" cy="191.9" r="31.9"/><path d="M384.2 127.9c-35.4 0-64.1 28.7-64.1 64.1 0 35.4 28.7 64.1 64.1 64.1 35.4 0 64.1-28.7 64.1-64.1 0-35.4-28.7-64.1-64.1-64.1zm0 110c-25.3 0-45.9-20.5-45.9-45.9s20.5-45.9 45.9-45.9S430 166.7 430 192s-20.5 45.9-45.8 45.9z"/><circle cx="384.4" cy="191.9" r="31.9"/><path d="M474.4 101.2l37.7-37.4h-76.4C392.9 29 321.8 0 255.9 0c-66 0-136.5 29-179.3 63.8H0l37.7 37.4C14.4 124.4 0 156.5 0 192c0 70.8 57.4 128.2 128.2 128.2 32.5 0 62.2-12.1 84.8-32.1l43.4 31.9 42.9-31.2-.5-1.2c22.7 20.2 52.5 32.5 85.3 32.5 70.8 0 128.2-57.4 128.2-128.2-.1-35.4-14.6-67.5-37.9-90.7zM368 64.8c-60.7 7.6-108.3 57.6-111.9 119.5-3.7-62-51.4-112.1-112.3-119.5 30.6-22 69.6-32.8 112.1-32.8S337.4 42.8 368 64.8zM128.2 288.2C75 288.2 32 245.1 32 192s43.1-96.2 96.2-96.2 96.2 43.1 96.2 96.2c-.1 53.1-43.1 96.2-96.2 96.2zm256 0c-53.1 0-96.2-43.1-96.2-96.2s43.1-96.2 96.2-96.2 96.2 43.1 96.2 96.2c-.1 53.1-43.1 96.2-96.2 96.2z"/>
              </svg>
            </a>
            <a href="https://facebook.com" class="social-link facebook-link" aria-label="Visit our Facebook page" role="listitem">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://g.page/r/CROFVjZO59hNEBM/review" class="social-link google-link" aria-label="@T:aria_googleReview" role="listitem">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </a>
          </div>

          <ex-line width="3px" aria-hidden="true"></ex-line>

          <div id="policies" role="group" aria-label="Legal and contact information">
            <button id="pop-contact-btn">@T:contactUs</button>
            <button id="pop-privacy-btn">@T:privacyPolicy</button>
            <button id="pop-legal-btn">@T:legalAdvice</button>
            <button id="pop-cookie-btn">@T:cookieSettings</button>
            <button id="pop-langsett-btn">@T:languageSettings</button>
          </div>

          <ex-line width="3px" aria-hidden="true"></ex-line>

          <p>@T:copyright</p>
        </div>

        <ex-line dir="v" width="3px" aria-hidden="true"></ex-line>
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
