(() => {
  const LARGE_CLASS = 'large';
  const SCROLL_THRESHOLD = 10;
  const FADE_DURATION = 300;
  const SCROLL_PAUSE_DELAY = 150; // Half second pause required
  
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const miniFooter = footer?.querySelector('.miniFooter');
  const megaFooter = footer?.querySelector('.megaFooter');
  
  if (!header && !footer) return;

  let isScrolling = false;
  let isAutoScrolling = false;
  let scrollTimeout = null;
  let hasWaitedBuffer = false;
  let lastScrollY = window.scrollY;

  function isInView(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function isAtBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5;
  }

  function fadeToMega() {
    if (!miniFooter || !megaFooter) return;
    
    miniFooter.style.transition = `opacity ${FADE_DURATION}ms ease`;
    megaFooter.style.transition = `opacity ${FADE_DURATION}ms ease`;
    miniFooter.style.display = 'none';
    megaFooter.style.opacity = '1';
    setTimeout(() => {
      miniFooter.style.display = 'none';
    }, FADE_DURATION);
  }

  function resetFooters() {
    if (!miniFooter || !megaFooter) return;
    
    // No transition for instant reset
    miniFooter.style.transition = 'none';
    megaFooter.style.transition = 'none';
    miniFooter.style.opacity = '1';
    megaFooter.style.opacity = '0';
    miniFooter.style.display = 'inline-flex';
  }

  function scrollToShowFooter() {
    if (!footer || isAutoScrolling) return;
    
    isAutoScrolling = true;
    
    requestAnimationFrame(() => {
      const footerRect = footer.getBoundingClientRect();
      if (footerRect.bottom > window.innerHeight) {
        const scrollAmount = footerRect.bottom - window.innerHeight;
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
      }
      
      setTimeout(() => {
        isAutoScrolling = false;
      }, 500);
    });
  }

  function update() {
    if (isAutoScrolling) {
      isScrolling = false;
      return;
    }

    const scrollY = window.scrollY;

    // Header: large at top
    if (header) {
      header.classList.toggle(LARGE_CLASS, scrollY <= SCROLL_THRESHOLD);
    }

    // Footer: large at bottom, but only if user has waited the buffer period
    if (footer) {
      const wasLarge = footer.classList.contains(LARGE_CLASS);
      
      if (isAtBottom() && !wasLarge && hasWaitedBuffer) {
        footer.classList.add(LARGE_CLASS);
        fadeToMega();
        setTimeout(() => scrollToShowFooter(), 100);
        // Reset the buffer flag after extending
        hasWaitedBuffer = false;
      } else if (wasLarge && !isInView(footer)) {
        footer.classList.remove(LARGE_CLASS);
        resetFooters();
        hasWaitedBuffer = false;
      }
    }

    isScrolling = false;
  }

  function handleScroll() {
    if (!isScrolling) {
      requestAnimationFrame(update);
      isScrolling = true;
    }

    const currentScrollY = window.scrollY;
    const isScrollingDown = currentScrollY > lastScrollY;
    
    // If user scrolls DOWN while at bottom and has waited the buffer, extend footer immediately
    if (isAtBottom() && hasWaitedBuffer && isScrollingDown && footer && !footer.classList.contains(LARGE_CLASS)) {
      footer.classList.add(LARGE_CLASS);
      fadeToMega();
      setTimeout(() => scrollToShowFooter(), 100);
      hasWaitedBuffer = false;
      lastScrollY = currentScrollY;
      return;
    }

    // Update last scroll position
    lastScrollY = currentScrollY;

    // Reset the buffer flag and timer if user is still scrolling
    hasWaitedBuffer = false;
    clearTimeout(scrollTimeout);
    
    // Set timer to mark buffer period as complete after pause
    scrollTimeout = setTimeout(() => {
      if (isAtBottom()) {
        hasWaitedBuffer = true;
      }
    }, SCROLL_PAUSE_DELAY);
  }

  function handleInteraction() {
    setTimeout(update, 50);
  }

  // Initialize - both footers visible and overlapping
  if (miniFooter && megaFooter) {
    miniFooter.style.opacity = '1';
    megaFooter.style.opacity = '0';
  }

  update();

  // Events
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('wheel', handleInteraction, { passive: true });
  window.addEventListener('touchend', handleInteraction, { passive: true });
  window.addEventListener('resize', update, { passive: true });
})();
