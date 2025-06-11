class LoadingScreen extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /* html */`
      <div id="loadingScreen">
        <div class="spinner"></div>
      </div>
    `;

    window.addEventListener("load", () => {
      const loader = this;
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.remove();
      }, 200);
    });

  }
}

customElements.define("ex-loading", LoadingScreen);
