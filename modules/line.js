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

    // Reset all styles first
    this.style.cssText = '';
    
    // Base styles
    this.style.backgroundColor = this._color;
    this.style.margin = this._margin;
    this.style.flexShrink = "0"; // Prevent shrinking in flex containers
    this.style.border = "none";
    this.style.padding = "0";

    if (this._direction.toLowerCase().startsWith("h")) {
      // Horizontal line
      this.style.display = "block";
      this.style.width = "100%";
      this.style.height = this._width;
      this.style.minHeight = this._width; // Ensure minimum height
    } else if (this._direction.toLowerCase().startsWith("v")) {
      // Vertical line
      this.style.display = "inline-block";
      this.style.width = this._width;
      this.style.height = "100%";
      this.style.minWidth = this._width; // Ensure minimum width
      this.style.verticalAlign = "top"; // Align properly in inline contexts
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
