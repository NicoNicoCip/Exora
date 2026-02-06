class Clase extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /* html */`
      <p>Hello, World!</p>
    `;
  }
}

customElements.define("app-clase", Clase);