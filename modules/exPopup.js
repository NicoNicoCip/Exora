// ExPopup Web Component - Optimized
class ExPopup extends HTMLElement {
  constructor() {
    super()
    // Reduced state - only essential drag tracking
    this.drag = { active: false, offsetX: 0, offsetY: 0 }
    this.content = this.innerHTML
    this.handlers = new Map()
  }

  connectedCallback() {
    this.innerHTML = ''
    Object.assign(this.style, {
      display: 'none',
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '9999'
    })
  }

  render() {
    if (this.querySelector('.popup-container')) return // Already rendered
    
    this.innerHTML = `
      <div class="popup-container">
        <div class="popup-header">
          <span class="popup-title">${this.getAttribute('popupTitle') || 'Popup'}</span>
          <button class="popup-close" aria-label="Close popup">X</button>
        </div>
        <div class="popup-content">${this.content}</div>
      </div>
    `
    
    const container = this.querySelector('.popup-container')
    Object.assign(container.style, {
      position: 'absolute',
      pointerEvents: 'auto',
      transformOrigin: 'top left',
      transform: 'translate(0, 0)'
    })
    
    this.bindEvents()
  }

  bindEvents() {
    const header = this.querySelector('.popup-header')
    const closeBtn = this.querySelector('.popup-close')
    
    if (!header || !closeBtn) return
    
    // Store handlers for cleanup
    this.handlers.set('mousedown', this.handleMouseDown.bind(this))
    this.handlers.set('mousemove', this.handleMouseMove.bind(this))
    this.handlers.set('mouseup', this.handleMouseUp.bind(this))
    this.handlers.set('click', this.handleOutsideClick.bind(this))
    this.handlers.set('close', this.close.bind(this))
    
    header.addEventListener('mousedown', this.handlers.get('mousedown'))
    document.addEventListener('mousemove', this.handlers.get('mousemove'))
    document.addEventListener('mouseup', this.handlers.get('mouseup'))
    closeBtn.addEventListener('click', this.handlers.get('close'))
  }

  handleMouseDown(e) {
    if (e.target.closest('.popup-header')) {
      this.drag.active = true
      this.drag.startX = e.clientX - this.drag.offsetX
      this.drag.startY = e.clientY - this.drag.offsetY
      e.preventDefault()
    }
  }

  handleMouseMove(e) {
    if (!this.drag.active) return
    
    e.preventDefault()
    this.drag.offsetX = e.clientX - this.drag.startX
    this.drag.offsetY = e.clientY - this.drag.startY
    
    this.updatePosition()
  }

  handleMouseUp() {
    this.drag.active = false
  }

  handleOutsideClick(e) {
    const container = this.querySelector('.popup-container')
    if (!this.drag.active && container && !container.contains(e.target)) {
      this.close() // Use close() instead of hide() to trigger popup-close event
    }
  }

  updatePosition() {
    const container = this.querySelector('.popup-container')
    if (container) {
      container.style.transform = `translate(${this.drag.offsetX}px, ${this.drag.offsetY}px)`
    }
  }

  center() {
    const container = this.querySelector('.popup-container')
    if (!container) return
    
    // Reset position to measure natural size
    container.style.transform = 'translate(0, 0)'
    
    const { width, height } = container.getBoundingClientRect()
    
    // Calculate center with boundaries
    this.drag.offsetX = Math.max(10, Math.min(
      (window.innerWidth - width) / 2,
      window.innerWidth - width - 10
    ))
    this.drag.offsetY = Math.max(10, Math.min(
      (window.innerHeight - height) / 2,
      window.innerHeight - height - 10
    ))
    
    this.updatePosition()
  }

  show() {
    this.render()
    this.style.display = 'block'
    
    // Center after layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.center())
    })
    
    // Enable outside click detection
    setTimeout(() => {
      document.addEventListener('click', this.handlers.get('click'))
    }, 10)
  }

  hide() {
    this.style.display = 'none'
    this.resetPosition()
    document.removeEventListener('click', this.handlers.get('click'))
  }

  close() {
    this.dispatchEvent(new CustomEvent('popup-close', { bubbles: true }))
    this.hide()
  }

  resetPosition() {
    this.drag.offsetX = 0
    this.drag.offsetY = 0
    this.drag.active = false
    this.updatePosition()
  }

  disconnectedCallback() {
    // Clean up all event listeners
    document.removeEventListener('click', this.handlers.get('click'))
    document.removeEventListener('mousemove', this.handlers.get('mousemove'))
    document.removeEventListener('mouseup', this.handlers.get('mouseup'))
    this.handlers.clear()
  }
}

customElements.define("ex-popup", ExPopup)

// Main Popup Manager - Optimized
class PopupManager {
  constructor() {
    this.popups = new Map()
    this.navigationStack = []
    this.measurementId = 'G-S5JXG6GFF0'
  }

  init() {
    // Register all popups
    const popupElements = ['pop-contact', 'pop-privacy', 'pop-legal', 'pop-cookie-consent']
    popupElements.forEach(id => {
      const element = document.getElementById(id)
      if (element) this.popups.set(id, element)
    })

    this.bindTriggers()
    this.bindCloseEvents()
    this.initConsent()
  }

  bindTriggers() {
    const triggers = [
      { btn: 'pop-contact-btn', popup: 'pop-contact' },
      { btn: 'pop-privacy-btn', popup: 'pop-privacy' },
      { btn: 'pop-legal-btn', popup: 'pop-legal' },
      { btn: 'pop-cookie-btn', popup: 'pop-cookie-consent' }
    ]

    triggers.forEach(({ btn, popup }) => {
      const button = document.getElementById(btn)
      if (button) {
        button.addEventListener('click', () => this.show(popup))
      }
    })
  }

  bindCloseEvents() {
    this.popups.forEach((popup, id) => {
      popup.addEventListener('popup-close', () => {
        this.hide(id)
        this.handleNavigation(id)
      })
    })
  }

  show(popupId, fromPopup = null) {
    const popup = this.popups.get(popupId)
    if (!popup) return

    // Track navigation for cookie consent flow
    if (fromPopup) {
      this.navigationStack.push(fromPopup)
    }

    popup.show()
    
    // Bind consent events after cookie consent popup is shown
    if (popupId === 'pop-cookie-consent') {
      // Use setTimeout to ensure the popup content is fully rendered
      setTimeout(() => this.bindConsentEvents(), 50)
    }
  }

  hide(popupId) {
    const popup = this.popups.get(popupId)
    if (popup) popup.hide()
  }

  handleNavigation(closedPopup) {
    // Special handling for privacy popup - return to cookie consent if needed
    if (closedPopup === 'pop-privacy' && this.navigationStack.length > 0) {
      const returnTo = this.navigationStack.pop()
      if (returnTo === 'pop-cookie-consent') {
        this.show('pop-cookie-consent')
      }
    }

    if (closedPopup === 'pop-cookie-consent') {
      this.setConsent(false)
      this.hide('pop-cookie-consent')
    }
  }

  // Consent Management
  initConsent() {
    const existingConsent = localStorage.getItem("analytics")
    
    if (!existingConsent) {
      this.show('pop-cookie-consent')
    } else if (existingConsent === 'true') {
      this.loadGoogleAnalytics()
    }

    this.bindConsentEvents()
  }

  bindConsentEvents() {
    // Bind events after popup is shown and rendered
    const acceptBtn = document.getElementById('pop-consent-accept')
    const rejectBtn = document.getElementById('pop-consent-reject')
    const privacyBtn = document.getElementById('pop-consent-privacy-btn')

    if (acceptBtn && !acceptBtn.hasAttribute('data-bound')) {
      acceptBtn.addEventListener('click', () => {
        this.setConsent(true)
        this.hide('pop-cookie-consent')
      })
      acceptBtn.setAttribute('data-bound', 'true')
    }

    if (rejectBtn && !rejectBtn.hasAttribute('data-bound')) {
      rejectBtn.addEventListener('click', () => {
        this.setConsent(false)
        this.hide('pop-cookie-consent')
      })
      rejectBtn.setAttribute('data-bound', 'true')
    }

    if (privacyBtn && !privacyBtn.hasAttribute('data-bound')) {
      privacyBtn.addEventListener('click', () => {
        this.hide('pop-cookie-consent')
        this.show('pop-privacy', 'pop-cookie-consent')
      })
      privacyBtn.setAttribute('data-bound', 'true')
    }
  }

  setConsent(analytics) {
    localStorage.setItem("analytics", analytics.toString())
    
    if (analytics) {
      this.loadGoogleAnalytics()
    } else {
      this.revokeConsent()
    }
    
    console.log('Consent saved:', { analytics })
  }

  loadGoogleAnalytics() {
    if (document.querySelector(`script[src*="${this.measurementId}"]`)) {
      return // Already loaded
    }

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    function gtag() { dataLayer.push(arguments) }
    window.gtag = gtag

    gtag('js', new Date())
    gtag('config', this.measurementId, {
      'anonymize_ip': true,
      'allow_google_signals': false,
      'allow_ad_personalization_signals': false,
      'cookie_expires': 63072000,
      'cookie_domain': 'auto',
      'cookie_flags': 'SameSite=None;Secure'
    })

    console.log('Google Analytics loaded with consent')
  }

  revokeConsent() {
    // Clean up localStorage
    localStorage.removeItem("cookie-consent")
    localStorage.removeItem("analytics-consent")

    // Disable GA tracking
    if (window.gtag) {
      window.gtag('config', this.measurementId, { 'client_storage': 'none' })
    }

    this.clearGACookies()
    console.log('Consent revoked')
  }

  clearGACookies() {
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim()
      if (name.startsWith('_ga') || name.startsWith('_gid')) {
        const domain = window.location.hostname
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`
      }
    })
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const popupManager = new PopupManager()
  popupManager.init()
})