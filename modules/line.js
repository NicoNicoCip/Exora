class Line extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    // Re-render if attributes change
    this.observer = new MutationObserver(() => this.render());
    this.observer.observe(this, { attributes: true });
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  render() {
    const direction = this.getAttribute("dir") || "horizontal";
    const width = this.getAttribute("width") || "1px";
    const color = this.getAttribute("color") || "#000000";
    const margin = this.getAttribute("margin") || "0";
        
    // Store values as instance properties
    this._direction = direction;
    this._width = width;
    this._color = color;
    this._margin = margin;

    // Set styles with lower priority so CSS can override
    this.style.setProperty('background-color', this._color);
    this.style.setProperty('margin', this._margin);
    this.style.setProperty('flex-shrink', '0');
    this.style.setProperty('border', 'none');
    this.style.setProperty('padding', '0');

    if (this._direction.toLowerCase().startsWith("h")) {
      // Horizontal line
      this.style.setProperty('display', 'block');
      this.style.setProperty('width', '100%');
      this.style.setProperty('height', this._width);
      this.style.setProperty('min-height', this._width);
      // Remove vertical-specific styles
      this.style.removeProperty('min-width');
      this.style.removeProperty('vertical-align');
    } else if (this._direction.toLowerCase().startsWith("v")) {
      // Vertical line
      this.style.setProperty('display', 'inline-block');
      this.style.setProperty('width', this._width);
      this.style.setProperty('height', '100%');
      this.style.setProperty('min-width', this._width);
      this.style.setProperty('vertical-align', 'top');
      // Remove horizontal-specific styles
      this.style.removeProperty('min-height');
    }
  }

  // Getter methods for accessing current values
  get direction() {
    return this._direction;
  }

  get lineWidth() {
    return this._width;
  }

  get lineColor() {
    return this._color;
  }

  // Method to update attributes programmatically
  setAttributes(attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      this.setAttribute(key, value);
    });
  }
}

customElements.define("ex-line", Line);
