class ExMain extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.outerHTML = /* html */`
      <ex-loading></ex-loading>

      <div class="page-clock-bg">
        <div class="clock-hand"></div>
      </div>

      <header>
        <nav>
          <div id="left">
            <ex-nav-button gap="80px" name="about start">Home</ex-nav-button>
            <ex-nav-button gap="80px" name="about experience">Experience</ex-nav-button>
          </div>
          <ex-nav-button id="navlogo" gap="170px" name="top">
            <img src="/Exora/images/ExoraLogo.webp"alt="Exora Logo">
          </ex-nav-button>
          <div id="right">
            <ex-nav-button gap="80px" name="menu">Menu</ex-nav-button>
            <ex-nav-button gap="80px" name="bottom">Contact</ex-nav-button>
          </div>
        </nav>
      </header>

      <main>
        ${this.innerHTML}
      </main>
      <ex-nav-header name="bottom">The bottom of the page.</ex-nav-header>
      
      <footer>
        <div class="miniFooter">
          <ex-line dir="v" width="2px"></ex-line>

          <ex-nav-button gap="80px" name="about start">Home</ex-nav-button>
          <ex-nav-button gap="170px" name="top">Top</ex-nav-button>

          <div id="ScrollDownArrow">
            <p>Scroll down for more</p>
            <span class="ScrollDownArrow"></span>
          </div>

          <ex-nav-button gap="80px" name="menu">Menu</ex-nav-button>
          <ex-nav-button gap="80px" name="bottom">Contact</ex-nav-button>
          
          <ex-line dir="v" width="2px"></ex-line>
        </div>

        <div class="megaFooter">
          <ex-line dir="v" width="3px"></ex-line>

          <div id="sidenavigator">
            <ex-nav-button gap="170px" name="top">Top</ex-nav-button>
            <ex-nav-button gap="80px" name="menu">Menu</ex-nav-button>
            <ex-nav-button gap="170px" name="about start">About Us</ex-nav-button>
            <ex-nav-button gap="80px" name="about experience">Experience</ex-nav-button>
            <ex-nav-button gap="80px" name="about vision">Vision</ex-nav-button>
            
            <ex-nav-button gap="80px" name="about philosophy">Philosophy</ex-nav-button>
            <ex-nav-button gap="80px" name="about location">Location</ex-nav-button>
            <ex-nav-button gap="80px" name="about team">Team</ex-nav-button>
          </div>

          <ex-line dir="v" width="3px"></ex-line>

          <div id="links">
            <ex-line width="3px"></ex-line>
            
            <h2>Socials</h2>

            <div id="socials">
              <a href="https://instagram.com" class="social-link instagram-link">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <!-- TripAdvisor Icon -->
              <a href="https://www.tripadvisor.com/" class="social-link tripadvisor-link">
                <svg class="icon" viewBox="0 -96 512.2 512.2" fill="currentColor">
                  <path d="M128.2 127.9C92.7 127.9 64 156.6 64 192c0 35.4 28.7 64.1 64.1 64.1 35.4 0 64.1-28.7 64.1-64.1.1-35.4-28.6-64.1-64-64.1zm0 110c-25.3 0-45.9-20.5-45.9-45.9s20.5-45.9 45.9-45.9S174 166.7 174 192s-20.5 45.9-45.8 45.9z"/><circle cx="128.4" cy="191.9" r="31.9"/><path d="M384.2 127.9c-35.4 0-64.1 28.7-64.1 64.1 0 35.4 28.7 64.1 64.1 64.1 35.4 0 64.1-28.7 64.1-64.1 0-35.4-28.7-64.1-64.1-64.1zm0 110c-25.3 0-45.9-20.5-45.9-45.9s20.5-45.9 45.9-45.9S430 166.7 430 192s-20.5 45.9-45.8 45.9z"/><circle cx="384.4" cy="191.9" r="31.9"/><path d="M474.4 101.2l37.7-37.4h-76.4C392.9 29 321.8 0 255.9 0c-66 0-136.5 29-179.3 63.8H0l37.7 37.4C14.4 124.4 0 156.5 0 192c0 70.8 57.4 128.2 128.2 128.2 32.5 0 62.2-12.1 84.8-32.1l43.4 31.9 42.9-31.2-.5-1.2c22.7 20.2 52.5 32.5 85.3 32.5 70.8 0 128.2-57.4 128.2-128.2-.1-35.4-14.6-67.5-37.9-90.7zM368 64.8c-60.7 7.6-108.3 57.6-111.9 119.5-3.7-62-51.4-112.1-112.3-119.5 30.6-22 69.6-32.8 112.1-32.8S337.4 42.8 368 64.8zM128.2 288.2C75 288.2 32 245.1 32 192s43.1-96.2 96.2-96.2 96.2 43.1 96.2 96.2c-.1 53.1-43.1 96.2-96.2 96.2zm256 0c-53.1 0-96.2-43.1-96.2-96.2s43.1-96.2 96.2-96.2 96.2 43.1 96.2 96.2c-.1 53.1-43.1 96.2-96.2 96.2z"/>
                </svg>
              </a>
              <!-- Facebook Icon -->
              <a href="https://facebook.com" class="social-link facebook-link">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>

            <ex-line width="3px"></ex-line>

            <div id="policies">
              <a href="##1">Privacy Polocy</a>
              <a href="##2">Cookie Policy</a>
            </div>

            

            <ex-line width="3px"></ex-line>

            <p>© Copyright Exora 2025. All rights reserved.</p>
          </div>

          <ex-line dir="v" width="3px"></ex-line>
        </div>
      </footer>
    `;
  }
}

customElements.define("ex-main", ExMain);