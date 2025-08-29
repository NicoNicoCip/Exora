// menu.js - Restaurant Menu Module
allergyList = {
  "allergens" : {
    "celery" : "",
    "cereal" : "",
    "crustaceans" : "",
    "eggs" : "",
    "fish" : "",
    "lupin" : "",
    "milk" : "",
    "molluscs" : "",
    "nuts" : "",
    "peanuts" : "",
    "sesame" : "",
    "soya" : "",
    "sulphites" : ""
  }
}

// Custom element class for ex-menu
class ExMenuElement extends HTMLElement {
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

    // Create allergens container
    if (allergensEl) {
      const allergensContainer = document.createElement('div');
      allergensContainer.className = 'allergens-container';

      const allergenElements = allergensEl.querySelectorAll('allergen');
      allergenElements.forEach(allergenEl => {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'allergen-icon';
        iconSpan.textContent = allergenEl.textContent || '⚠️';
        allergensContainer.appendChild(iconSpan);
      });

      itemDiv.appendChild(allergensContainer);
    }

    // Replace original item with processed div
    item.parentNode.replaceChild(itemDiv, item);
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

    if (itemData.allergens && itemData.allergens.length > 0) {
      const allergens = document.createElement('allergens');
      itemData.allergens.forEach(allergenText => {
        const allergen = document.createElement('allergen');
        allergen.textContent = allergenText;
        allergens.appendChild(allergen);
      });
      item.appendChild(allergens);
    }

    menuElement.appendChild(item);
    menuElement.processItems();
  }

  createMenu() {
    return document.createElement('ex-menu');
  }
}

// Auto-initialize when module loads
const restaurantMenu = new RestaurantMenu();

// Export for use in other modules
export { RestaurantMenu, ExMenuElement, restaurantMenu as default };