class Line extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._direction = 'horizontal';
        this._width = '1px';
        this._color = 'var(--c-gold, #F2CB90)';
        this._margin = '0';
    }

    connectedCallback() {
        this.render();
        this.setupObserver();
    }

    disconnectedCallback() {
        this.observer?.disconnect();
    }

    static get observedAttributes() {
        return ['dir', 'width', 'color', 'margin'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        // Update internal properties
        switch (name) {
            case 'dir':
                this._direction = newValue || 'horizontal';
                break;
            case 'width':
                this._width = newValue || '1px';
                break;
            case 'color':
                this._color = newValue || 'var(--c-gold, #F2CB90)';
                break;
            case 'margin':
                this._margin = newValue || '0';
                break;
        }

        // Only update styles if component is connected
        if (this.isConnected && this._styleElement) {
            this.updateStylesOnly();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          flex-shrink: 0;
          border: none;
          padding: 0;
          margin: ${this._margin};
          background-color: ${this._color};
          ${this.getDirectionStyles()}
        }
      </style>
    `;
    }

    getDirectionStyles() {
        return this._direction.startsWith('h') ? `
      width: 100%;
      height: ${this._width};
      min-height: ${this._width};
    ` : `
      display: inline-block;
      vertical-align: top;
      width: ${this._width};
      min-width: ${this._width};
      height: 100%;
    `;
    }

    updateStyles() {
        this._direction = this.getAttribute('dir') || 'horizontal';
        this._width = this.getAttribute('width') || '1px';
        this._color = this.getAttribute('color') || 'var(--c-gold, #F2CB90)';
        this._margin = this.getAttribute('margin') || '0';
        this.render();
    }

    setupObserver() {
        this.observer = new MutationObserver(() => this.updateStyles());
        this.observer.observe(this, { attributes: true });
    }
}

customElements.define("ex-line", Line);