class LoadingScreen extends HTMLElement {
    constructor() {
        super();
        this.isRemoved = false;
        this.readyChecks = new Map();
        this.checkInterval = null;
        this.startTime = performance.now();
        this.minDisplayTime = 200;
        this.maxWaitTime = 5000;

        // Apply styles IMMEDIATELY in constructor to prevent any flash
        this.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: #0A3021 !important;
      z-index: 10000 !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      transition: opacity 0.5s ease;
    `;
    }

    connectedCallback() {
        // Force immediate display
        this.style.display = 'flex';
        this.render();
        this.setupReadyChecks();
    }

    render() {
        this.innerHTML = `
      <div id="loadingScreen">
        <img class="loading-logo" src="/functions/images/ExoraLogo.webp" alt="EXORA">
        <div class="loading-spinner"></div>
      </div>
    `;

        // Add spinner styles (only if not already added)
        if (!document.getElementById('loading-spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-styles';
            style.textContent = `
        ex-loading #loadingScreen {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        ex-loading .loading-logo {
          width: clamp(80px, 20vmin, 120px);
          height: auto;
          animation: loadingPulse 2s ease-in-out infinite;
        }

        ex-loading .loading-spinner {
          width: clamp(36px, 8vmin, 48px);
          height: clamp(36px, 8vmin, 48px);
          border: clamp(2px, 0.5vmin, 3px) solid color-mix(in srgb, var(--c-gold, #EABB6D) 20%, transparent);
          border-top: clamp(2px, 0.5vmin, 3px) solid var(--c-gold, #EABB6D);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes loadingPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
            document.head.appendChild(style);
        }
    }

    setupReadyChecks() {
        const checks = {
            document: {
                condition: () => document.readyState === 'complete',
                priority: 1,
                required: true
            },
            customElements: {
                condition: () => customElements.get('ex-translate') !== undefined,
                priority: 2,
                required: true
            },
            translations: {
                condition: () => {
                    const translator = document.querySelector('ex-translate');
                    return !translator || translator.translationsLoaded === true;
                },
                priority: 3,
                required: false
            },
            popups: {
                condition: () => {
                    return window.PopupManager !== undefined ||
                        document.querySelector('ex-popup') !== null ||
                        document.querySelectorAll('[id*="pop-"]').length > 0;
                },
                priority: 4,
                required: false
            },
            cards: {
                condition: () => {
                    const cardHolders = document.querySelectorAll('ex-infcard-holder');
                    if (cardHolders.length === 0) return true;

                    return Array.from(cardHolders).every(holder =>
                        holder.hasAttribute('data-ready') ||
                        holder.querySelector('.scroll-container') !== null
                    );
                },
                priority: 5,
                required: false
            }
        };

        Object.keys(checks).forEach(key => {
            this.readyChecks.set(key, false);
        });

        this.checks = checks;
        this.startChecking();
    }

    startChecking() {
        const checkReady = () => {
            if (this.isRemoved) return;

            let allReady = true;
            let hasRequiredElements = false;

            Object.entries(this.checks)
                .sort(([, a], [, b]) => a.priority - b.priority)
                .forEach(([key, check]) => {
                    const isReady = check.condition();
                    this.readyChecks.set(key, isReady);

                    if (check.required) {
                        hasRequiredElements = true;
                        if (!isReady) allReady = false;
                    } else {
                        const elementExists = this.checkIfElementExists(key);
                        if (elementExists && !isReady) {
                            allReady = false;
                        }
                    }
                });

            const elapsed = performance.now() - this.startTime;
            const minTimeReached = elapsed >= this.minDisplayTime;
            const maxTimeReached = elapsed >= this.maxWaitTime;

            if ((allReady && minTimeReached && hasRequiredElements) || maxTimeReached) {
                this.fadeOut();
            } else {
                requestAnimationFrame(checkReady);
            }
        };

        if (document.readyState === 'complete') {
            requestAnimationFrame(checkReady);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => requestAnimationFrame(checkReady), 16);
            }, { once: true });

            requestAnimationFrame(checkReady);
        }
    }

    checkIfElementExists(checkType) {
        switch (checkType) {
            case 'translations':
                return document.querySelector('ex-translate') !== null;
            case 'popups':
                return document.querySelector('ex-popup') !== null ||
                    document.querySelectorAll('[id*="pop-"]').length > 0;
            case 'cards':
                return document.querySelectorAll('ex-infcard-holder').length > 0;
            default:
                return true;
        }
    }

    fadeOut() {
        if (this.isRemoved) return;

        this.isRemoved = true;
        this.style.opacity = '0';

        setTimeout(() => {
            if (this.parentNode) {
                this.remove();
            }
        }, 600);
    }

    forceHide() {
        this.fadeOut();
    }

    getLoadingStatus() {
        const status = {};
        this.readyChecks.forEach((ready, key) => {
            status[key] = ready;
        });
        return {
            checks: status,
            elapsed: performance.now() - this.startTime,
            isRemoved: this.isRemoved
        };
    }

    addCustomCheck(name, condition, required = false, priority = 10) {
        if (!this.isRemoved) {
            this.checks[name] = { condition, required, priority };
            this.readyChecks.set(name, false);
        }
    }
}

customElements.define("ex-loading", LoadingScreen);

class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
    }

    register(loader) {
        this.activeLoaders.add(loader);
    }

    unregister(loader) {
        this.activeLoaders.delete(loader);
    }

    forceHideAll() {
        this.activeLoaders.forEach(loader => loader.forceHide());
    }

    getStatus() {
        return Array.from(this.activeLoaders).map(loader => loader.getLoadingStatus());
    }
}

if (typeof window !== 'undefined') {
    window.LoadingManager = window.LoadingManager || new LoadingManager();
}