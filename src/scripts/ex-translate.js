class ExTranslate extends HTMLElement {
    constructor() {
        super();

        const langMap = { 'en': 'en', 'es': 'es', 'ro': 'ro' };

        // Check localStorage first
        const storedLang = localStorage.getItem('selectedLanguage');

        if (storedLang && langMap[storedLang]) {
            this.currentLanguage = storedLang;
        } else {
            // Detect browser language and use it if supported
            const browserLang = this.detectBrowserLanguage();
            this.currentLanguage = langMap[browserLang] || 'en'; // fallback to English
        }

        this.translations = {};
        this.translationsLoaded = false;

        // Update the HTML lang attribute to match the selected language
        document.documentElement.lang = this.currentLanguage;

        // Load translations for current language
        this.loadTranslations();
    }

    loadTranslations() {
        const translationFile = `/functions/modules/translations.${this.currentLanguage}.json`;

        readTextFile(translationFile, (text) => {
            try {
                this.translations = JSON.parse(text);
                this.translationsLoaded = true;

                // Try to translate immediately if DOM is ready
                if (document.readyState !== 'loading') {
                    this.translatePage();
                }
            } catch (error) {
                console.error('Error parsing translations JSON:', error);
                this.translations = {};
                this.translationsLoaded = true;
            }
        });
    }

    detectBrowserLanguage() {
        // Get user's preferred languages from browser settings
        const preferredLanguages = navigator.languages || [navigator.language] || ['en'];

        // Check each preferred language in order
        const supportedLanguages = ['en', 'es', 'ro'];

        for (let lang of preferredLanguages) {
            const mainLang = lang.split('-')[0].toLowerCase();

            if (supportedLanguages.includes(mainLang)) {
                return mainLang;
            }
        }

        // Fallback to English if no supported language found
        return 'en';
    }

    connectedCallback() {
        // Wait for DOM to be ready and translations to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.render());
        } else {
            setTimeout(() => this.render(), 100);
        }

        // Set up MutationObserver to watch for DOM changes
        this.setupDOMObserver();
    }

    setupDOMObserver() {
        // Create a MutationObserver to watch for new elements being added to the DOM
        this.observer = new MutationObserver((mutations) => {
            // Check if translations are loaded before attempting to translate
            if (!this.translationsLoaded) {
                return;
            }

            let nodesToTranslate = [];

            mutations.forEach((mutation) => {
                // Check if nodes were added
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        // Only care about element nodes or text nodes with @T:
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            nodesToTranslate.push(node);
                        } else if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('@T:')) {
                            nodesToTranslate.push(node);
                        }
                    });
                }
            });

            // If new content was added, translate it
            if (nodesToTranslate.length > 0) {
                // Translate each new node
                nodesToTranslate.forEach(node => {
                    this.scanAndTranslate(node);
                });
            }
        });

        // Start observing the document body for changes
        this.observer.observe(document.body, {
            childList: true,      // Watch for added/removed children
            subtree: true,        // Watch all descendants
            characterData: true   // Watch for text changes
        });
    }

    disconnectedCallback() {
        // Clean up observer when element is removed
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    render() {
        // Only translate if translations are loaded
        if (this.translationsLoaded) {
            this.translatePage();
        } else {
            // Try again in a bit
            setTimeout(() => this.render(), 100);
        }
    }

    translatePage() {
        // Get all text nodes and attributes in the document
        this.scanAndTranslate(document.body);
    }

    scanAndTranslate(node) {
        // Pattern to match @T:stringName
        const translationPattern = /@T:(\w+)/g;

        // Process text nodes
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text.includes('@T:')) {
                const translatedText = text.replace(translationPattern, (match, key) => {
                    return this.translations[key] || match; // Keep original if not found
                });

                if (translatedText !== text) {
                    node.textContent = translatedText;
                }
            }
            return;
        }

        // Process element nodes
        if (node.nodeType === Node.ELEMENT_NODE) {
            // Translate attributes (like title, placeholder, alt, aria-label, etc.)
            const attributesToTranslate = [
                'title', 'placeholder', 'alt', 'aria-label',
                'aria-description', 'data-tooltip', 'value', 'label'
            ];

            attributesToTranslate.forEach(attr => {
                if (node.hasAttribute(attr)) {
                    const attrValue = node.getAttribute(attr);
                    if (attrValue.includes('@T:')) {
                        const translatedValue = attrValue.replace(translationPattern, (match, key) => {
                            return this.translations[key] || match;
                        });
                        node.setAttribute(attr, translatedValue);
                    }
                }
            });

            // Recursively process child nodes
            node.childNodes.forEach(child => this.scanAndTranslate(child));
        }
    }

    // Method to change language and reload page
    changeLanguage(langCode) {
        const supportedLangs = ['en', 'es', 'ro'];
        if (supportedLangs.includes(langCode)) {
            // Save the new language to localStorage
            localStorage.setItem('selectedLanguage', langCode);

            // Update the HTML lang attribute
            document.documentElement.lang = langCode;

            // Reload the page to apply new language
            window.location.reload();
        }
    }

    // Helper method to get a translation programmatically
    getString(key) {
        return this.translations[key] || `@T:${key}`;
    }

    // Method to manually translate a specific element and its children
    translateElement(element) {
        if (!this.translationsLoaded) {
            console.warn('Translations not loaded yet');
            return;
        }

        this.scanAndTranslate(element);
    }
}

// Define the custom element
customElements.define("ex-translate", ExTranslate);

// Global function to change language
function changeLanguage(langCode) {
    const translator = document.querySelector('ex-translate');
    if (translator) {
        translator.changeLanguage(langCode);
    }
}

// Global function to get a translation string programmatically
function getString(key) {
    const translator = document.querySelector('ex-translate');
    if (translator) {
        return translator.getString(key);
    }
    return `@T:${key}`;
}
window.getString = getString;

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        } else if (rawFile.readyState === 4) {
            console.error(`Failed to load translations: ${rawFile.status} ${rawFile.statusText}`);
        }
    }
    rawFile.send(null);
}