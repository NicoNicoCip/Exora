document.addEventListener("DOMContentLoaded" ,() => {
  const LARGE_CLASS = 'large';
  const SCROLL_THRESHOLD = 10;
  const FADE_DURATION = 300;
  const SCROLL_PAUSE_DELAY = 150; // Half second pause required
  
  const header = document.querySelector('header');
  
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

    isScrolling = false;
  }

  function handleScroll() {
    if (!isScrolling) {
      requestAnimationFrame(update);
      isScrolling = true;
    }

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

  update();

  // Events
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('wheel', handleInteraction, { passive: true });
  window.addEventListener('touchend', handleInteraction, { passive: true });
  window.addEventListener('resize', update, { passive: true });
});
