class SquishableHeader {
  constructor() {
    this.header = document.querySelector('header');
    this.main = document.querySelector('main');
    this.navlogo = document.querySelector('#navlogo');
    this.initialHeight = 8; // rem
    this.targetHeight = 4; // rem
    this.maxScrollDistance = 8; // pixels
    this.currentHeight = this.initialHeight;
    this.targetCurrentHeight = this.initialHeight;
    this.lerpFactor = 0.1; // Smoothing factor

    this.init();
  }

  init() {
    this.bindEvents();
    this.startAnimationLoop();
  }

  bindEvents() {
    window.addEventListener('scroll', () => {
      this.calculateTargetHeight();
    }, { passive: true });

    window.addEventListener('resize', () => {
      this.updateMainMargin();
    });
  }

  calculateTargetHeight() {
    const scrollY = window.pageYOffset;
    const progress = Math.min(scrollY / this.maxScrollDistance, 1);

    // Linear interpolation between initial and target heights
    this.targetCurrentHeight = this.lerp(
      this.initialHeight,
      this.targetHeight,
      progress
    );
  }

  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  updateHeaderHeight() {
    // Smooth the height transition using LERP
    this.currentHeight = this.lerp(
      this.currentHeight,
      this.targetCurrentHeight,
      this.lerpFactor
    );

    // Apply the height to the header
    this.header.style.height = `${this.currentHeight}rem`;

    // Update main margin to prevent content jumping
    this.updateMainMargin();
    this.updateNavLogoMaxes();
  }

  updateMainMargin() {
    this.main.style.marginTop = `${this.currentHeight}rem`;
  }

  updateNavLogoMaxes() {
    this.navlogo.style.width = `${this.currentHeight}% `;
  }

  startAnimationLoop() {
    const animate = () => {
      this.updateHeaderHeight();
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  new SquishableHeader();
});