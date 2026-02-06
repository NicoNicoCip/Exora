// menu.js - Restaurant Menu Module

// Custom element class for ex-menu
class ExMenuElement extends HTMLElement {
    // celery, crustaceans, eggs, fish, gluten, lupin, milk, mustard, nuts, peanuts, sesame, shellfish, soya, sulphites,

    allergyList = {
        celery: "/functions/images/allergyIcons/celery-min.webp?quality=auto&format=webp",
        crustaceans: "/functions/images/allergyIcons/shrimp-min.webp?quality=auto&format=webp",
        eggs: "/functions/images/allergyIcons/eggs-min.webp?quality=auto&format=webp",
        fish: "/functions/images/allergyIcons/fish-min.webp?quality=auto&format=webp",
        wheat: "/functions/images/allergyIcons/wheat-min.webp?quality=auto&format=webp",
        barley: "/functions/images/allergyIcons/barley-min.webp?quality=auto&format=webp",
        lupin: "/functions/images/allergyIcons/lupin-min.webp?quality=auto&format=webp",
        milk: "/functions/images/allergyIcons/milk-min.webp?quality=auto&format=webp",
        mustard: "/functions/images/allergyIcons/mustard-min.webp?quality=auto&format=webp",
        nuts: "/functions/images/allergyIcons/walnut-min.webp?quality=auto&format=webp",
        sesame: "/functions/images/allergyIcons/sesame-min.webp?quality=auto&format=webp",
        shellfish: "/functions/images/allergyIcons/shell-min.webp?quality=auto&format=webp",
        soya: "/functions/images/allergyIcons/soya-min.webp?quality=auto&format=webp",
        sulphites: "/functions/images/allergyIcons/sulphites-min.webp?quality=auto&format=webp",
    }

    connectedCallback() {
        this.classList.add('menu-container');
        this.processItems();
    }

    processItems() {
        const items = this.querySelectorAll('item');
        items.forEach(item => this.processItem(item));
    }

    processItem(item) {
        // Create wrapper div
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';

        // Get content elements
        const nameEl = item.querySelector('name');
        const priceEl = item.querySelector('price');
        const allergensEl = item.querySelector('allergens');

        // Create header container for name and price
        const headerDiv = document.createElement('div');
        headerDiv.className = 'item-header';

        // Create name paragraph
        if (nameEl) {
            const namePara = document.createElement('p');
            namePara.className = 'item-name';
            namePara.textContent = nameEl.textContent;
            headerDiv.appendChild(namePara);
        }

        // Create price paragraph
        if (priceEl) {
            const pricePara = document.createElement('p');
            pricePara.className = 'item-price';
            pricePara.textContent = priceEl.textContent;
            headerDiv.appendChild(pricePara);
        }

        itemDiv.appendChild(headerDiv);

        // Process allergens
        if (allergensEl && allergensEl.textContent.trim() !== '?' && allergensEl.textContent.trim() !== '') {
            const allergensContainer = this.createAllergensContainer(allergensEl.textContent);
            if (allergensContainer.children.length > 0) {
                itemDiv.appendChild(allergensContainer);
            }
        }

        // Replace original item with processed div
        item.parentNode.replaceChild(itemDiv, item);
    }

    createAllergensContainer(allergensText) {
        const allergensContainer = document.createElement('div');
        allergensContainer.className = 'allergens-container';

        // Split by comma, clean up, and filter valid allergens
        const allergenNames = allergensText
            .split(',')
            .map(name => name.trim().toLowerCase())
            .filter(name => name && name !== '?' && this.allergyList.hasOwnProperty(name))
            .sort(); // Sort alphabetically

        // Create image elements for each valid allergen
        allergenNames.forEach(allergenName => {
            const img = document.createElement('img');
            img.src = this.allergyList[allergenName];
            img.alt = `${allergenName} allergen`;
            img.className = 'allergen-icon';
            img.title = allergenName.charAt(0).toUpperCase() + allergenName.slice(1); // Capitalize for tooltip

            // Add error handling for broken images
            img.onerror = function () {
                console.warn(`Failed to load allergen icon for: ${allergenName}`);
                // Fallback to text if image fails
                const span = document.createElement('span');
                span.className = 'allergen-icon allergen-text';
                span.textContent = allergenName.charAt(0).toUpperCase();
                span.title = allergenName.charAt(0).toUpperCase() + allergenName.slice(1);
                this.parentNode.replaceChild(span, this);
            };

            allergensContainer.appendChild(img);
        });

        return allergensContainer;
    }
}

// Restaurant Menu utility class
class RestaurantMenu {
    constructor() {
        this.init();
    }

    init() {
        // Define custom element if not already defined
        if (!customElements.get('ex-menu')) {
            customElements.define('ex-menu', ExMenuElement);
        }

        // Initialize existing menus
        this.initializeMenus();
    }

    initializeMenus() {
        // Process any existing menus on the page
        const existingMenus = document.querySelectorAll('ex-menu');
        existingMenus.forEach(menu => {
            if (!menu.classList.contains('menu-container')) {
                menu.processItems();
            }
        });
    }

    // Public API methods
    addMenuItem(menuElement, itemData) {
        const item = document.createElement('item');

        if (itemData.name) {
            const name = document.createElement('name');
            name.textContent = itemData.name;
            item.appendChild(name);
        }

        if (itemData.brief) {
            const brief = document.createElement('brief');
            brief.textContent = itemData.brief;
            item.appendChild(brief);
        }

        if (itemData.price) {
            const price = document.createElement('price');
            price.textContent = itemData.price;
            item.appendChild(price);
        }

        if (itemData.allergens) {
            const allergens = document.createElement('allergens');
            allergens.textContent = itemData.allergens; // Support comma-separated string
            item.appendChild(allergens);
        }

        menuElement.appendChild(item);
        menuElement.processItems();
    }

    createMenu() {
        return document.createElement('ex-menu');
    }

    // Helper method to get available allergen names
    getAvailableAllergens() {
        const menuElement = document.querySelector('ex-menu');
        if (menuElement) {
            return Object.keys(menuElement.allergyList).sort();
        }
        return [];
    }
}

// Auto-initialize when module loads
const restaurantMenu = new RestaurantMenu();

// Export for use in other modules
export { RestaurantMenu, ExMenuElement, restaurantMenu as default };