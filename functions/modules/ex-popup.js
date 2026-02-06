// ExPopup Web Component - Mobile Fixed with Fade Effects
class ExPopup extends HTMLElement {
    constructor() {
        super()
        this.drag = { active: false, offsetX: 0, offsetY: 0 }
        this.content = this.innerHTML
        this.handlers = new Map()
        this.rendered = false
        this.fadeSpeed = 200 // milliseconds
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
            zIndex: '9999',
            opacity: '0',
            transition: `opacity ${this.fadeSpeed}ms ease-in-out`
        })
    }

    render() {
        if (this.rendered) return

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
            transform: 'translate(0, 0)',
            touchAction: 'none',
            opacity: '0',
            transition: `opacity ${this.fadeSpeed}ms ease-in-out`
        })

        this.bindEvents()
        this.rendered = true
    }

    bindEvents() {
        const header = this.querySelector('.popup-header')
        const closeBtn = this.querySelector('.popup-close')

        if (!header || !closeBtn) return

        this.unbindEvents()

        // Store handlers for cleanup
        this.handlers.set('pointerdown', this.handlePointerDown.bind(this))
        this.handlers.set('pointermove', this.handlePointerMove.bind(this))
        this.handlers.set('pointerup', this.handlePointerUp.bind(this))
        this.handlers.set('pointercancel', this.handlePointerUp.bind(this))
        this.handlers.set('click', this.handleOutsideClick.bind(this))
        this.handlers.set('close', (e) => {
            e.preventDefault()
            e.stopPropagation()
            this.close()
        })

        // Use pointer events (works for both mouse and touch)
        header.addEventListener('pointerdown', this.handlers.get('pointerdown'))
        document.addEventListener('pointermove', this.handlers.get('pointermove'))
        document.addEventListener('pointerup', this.handlers.get('pointerup'))
        document.addEventListener('pointercancel', this.handlers.get('pointercancel'))
        closeBtn.addEventListener('click', this.handlers.get('close'))
    }

    unbindEvents() {
        if (this.handlers.has('click')) {
            document.removeEventListener('click', this.handlers.get('click'))
        }
        if (this.handlers.has('pointermove')) {
            document.removeEventListener('pointermove', this.handlers.get('pointermove'))
        }
        if (this.handlers.has('pointerup')) {
            document.removeEventListener('pointerup', this.handlers.get('pointerup'))
        }
        if (this.handlers.has('pointercancel')) {
            document.removeEventListener('pointercancel', this.handlers.get('pointercancel'))
        }
    }

    handlePointerDown(e) {
        // Don't start dragging if clicking the close button
        if (e.target.closest('.popup-close')) {
            return
        }

        if (e.target.closest('.popup-header')) {
            this.drag.active = true
            this.drag.startX = e.clientX - this.drag.offsetX
            this.drag.startY = e.clientY - this.drag.offsetY

            // Capture pointer for smooth dragging
            const header = this.querySelector('.popup-header')
            if (header) {
                header.setPointerCapture(e.pointerId)
            }

            e.preventDefault()
        }
    }

    handlePointerMove(e) {
        if (!this.drag.active) return

        e.preventDefault()
        this.drag.offsetX = e.clientX - this.drag.startX
        this.drag.offsetY = e.clientY - this.drag.startY

        this.updatePosition()
    }

    handlePointerUp(e) {
        if (this.drag.active) {
            const header = this.querySelector('.popup-header')
            if (header) {
                header.releasePointerCapture(e.pointerId)
            }
        }
        this.drag.active = false
    }

    handleOutsideClick(e) {
        const container = this.querySelector('.popup-container')
        if (!this.drag.active && container && !container.contains(e.target)) {
            this.close()
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

        // Reset position and clear any constraints
        container.style.transform = 'translate(0, 0)'
        container.style.maxWidth = ''
        container.style.maxHeight = ''

        // Force a reflow to ensure accurate measurements
        container.offsetHeight

        const { width, height } = container.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Add constraints if popup is too large
        const maxWidth = viewportWidth - 40 // 20px margin on each side
        const maxHeight = viewportHeight - 40

        if (width > maxWidth) {
            container.style.maxWidth = `${maxWidth}px`
        }
        if (height > maxHeight) {
            container.style.maxHeight = `${maxHeight}px`
            container.style.overflowY = 'auto'
        }

        // Get dimensions after constraints are applied
        const finalRect = container.getBoundingClientRect()
        const finalWidth = finalRect.width
        const finalHeight = finalRect.height

        // Calculate centered position
        this.drag.offsetX = Math.max(20, (viewportWidth - finalWidth) / 2)
        this.drag.offsetY = Math.max(20, (viewportHeight - finalHeight) / 2)

        this.updatePosition()
    }

    show() {
        this.render()
        this.style.display = 'block'

        // Wait for content to fully render before centering and fading in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.center()
                    // Trigger fade in
                    requestAnimationFrame(() => {
                        this.style.opacity = '1'
                        const container = this.querySelector('.popup-container')
                        if (container) {
                            container.style.opacity = '1'
                        }
                    })
                })
            })
        })

        setTimeout(() => {
            if (this.handlers.has('click')) {
                document.addEventListener('click', this.handlers.get('click'))
            }
        }, 100)
    }

    hide() {
        // Fade out first
        this.style.opacity = '0'
        const container = this.querySelector('.popup-container')
        if (container) {
            container.style.opacity = '0'
        }

        // Wait for fade animation to complete before hiding
        setTimeout(() => {
            this.style.display = 'none'
            this.resetPosition()
            if (this.handlers.has('click')) {
                document.removeEventListener('click', this.handlers.get('click'))
            }
        }, this.fadeSpeed)
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
        this.unbindEvents()
        this.handlers.clear()
    }
}

customElements.define("ex-popup", ExPopup)

// Main Popup Manager - Same as before
class PopupManager {
    constructor() {
        this.popups = new Map()
        this.navigationStack = []
        this.measurementId = 'G-S5JXG6GFF0'
        this.consentEventsbound = false
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents())
        } else {
            this.initializeComponents()
        }
    }

    initializeComponents() {
        const popupElements = ['pop-contact', 'pop-privacy', 'pop-legal', 'pop-cookie-consent', 'pop-langsett']
        popupElements.forEach(id => {
            const element = document.getElementById(id)
            if (element) {
                this.popups.set(id, element)
            } else {
                console.warn(`Popup element not found: ${id}`)
            }
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
            { btn: 'pop-cookie-btn', popup: 'pop-cookie-consent' },
            { btn: 'pop-langsett-btn', popup: 'pop-langsett' }
        ]

        triggers.forEach(({ btn, popup }) => {
            const button = document.getElementById(btn)
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault()
                    this.show(popup)
                })
            } else {
                console.warn(`Trigger button not found: ${btn}`)
            }
        })
    }

    bindCloseEvents() {
        this.popups.forEach((popup, id) => {
            popup.addEventListener('popup-close', () => {
                this.handleNavigation(id)
                this.hide(id)
            })
        })
    }

    bindLanguageButtons() {
        const langButtons = [
            { id: 'pop-langsett-en', code: 'en' },
            { id: 'pop-langsett-es', code: 'es' },
            { id: 'pop-langsett-ro', code: 'ro' }
        ]

        langButtons.forEach(({ id, code }) => {
            const button = document.getElementById(id)
            if (button) {
                // Remove existing listener if any
                const newButton = button.cloneNode(true)
                button.parentNode.replaceChild(newButton, button)

                // Add fresh listener
                newButton.addEventListener('click', (e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    // Try global function first
                    if (typeof window.changeLanguage === 'function') {
                        window.changeLanguage(code)
                    } else {
                        // Fallback: directly access the ex-translate element
                        const translator = document.querySelector('ex-translate')
                        if (translator && typeof translator.changeLanguage === 'function') {
                            translator.changeLanguage(code)
                        } else {
                            console.error('Neither global changeLanguage nor ex-translate element found')
                        }
                    }
                })
            } else {
                console.warn(`Language button not found: ${id}`)
            }
        })
    }

    show(popupId, fromPopup = null) {
        const popup = this.popups.get(popupId)
        if (!popup) {
            console.error(`Popup not found: ${popupId}`)
            return
        }

        if (fromPopup) {
            this.navigationStack.push(fromPopup)
        }

        popup.show()

        if (popupId === 'pop-cookie-consent' && !this.consentEventsbound) {
            setTimeout(() => this.bindConsentEvents(), 100)
        }

        // Bind language buttons when language settings popup is shown
        if (popupId === 'pop-langsett') {
            setTimeout(() => this.bindLanguageButtons(), 100)
        }
    }

    hide(popupId) {
        const popup = this.popups.get(popupId)
        if (popup) {
            popup.hide()
        }
    }

    hideAll() {
        this.popups.forEach((popup, id) => {
            popup.hide()
        })
        this.navigationStack = []
    }

    handleNavigation(closedPopup) {
        const stackCopy = [...this.navigationStack]

        if (stackCopy.length > 0) {
            const returnTo = stackCopy[stackCopy.length - 1]

            if (closedPopup === 'pop-privacy' && returnTo === 'pop-cookie-consent') {
                this.navigationStack.pop()
                setTimeout(() => this.show('pop-cookie-consent'), 300) // Increased delay for fade
                return
            }

            if (closedPopup === 'pop-langsett' && returnTo === 'pop-cookie-consent') {
                this.navigationStack.pop()
                setTimeout(() => this.show('pop-cookie-consent'), 300) // Increased delay for fade
                return
            }
        }

        if (closedPopup === 'pop-cookie-consent') {
            this.setConsent(false)
        }
    }

    initConsent() {
        const existingConsent = localStorage.getItem("analytics")

        console.log('Existing consent:', existingConsent)

        if (!existingConsent || existingConsent === 'null') {
            setTimeout(() => this.show('pop-cookie-consent'), 500)
        } else if (existingConsent === 'true') {
            this.loadGoogleAnalytics()
        }
    }

    bindConsentEvents() {
        if (this.consentEventsbound) return

        setTimeout(() => {
            const acceptBtn = document.getElementById('pop-consent-accept')
            const rejectBtn = document.getElementById('pop-consent-reject')
            const privacyBtn = document.getElementById('pop-consent-privacy-btn')
            const languageBtn = document.getElementById('pop-consent-language-btn')

            if (acceptBtn) {
                acceptBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    this.setConsent(true)
                    this.hide('pop-cookie-consent')
                })
            } else {
                console.warn('Accept button not found')
            }

            if (rejectBtn) {
                rejectBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    this.setConsent(false)
                    this.hide('pop-cookie-consent')
                })
            } else {
                console.warn('Reject button not found')
            }

            if (privacyBtn) {
                privacyBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    this.hide('pop-cookie-consent')
                    setTimeout(() => this.show('pop-privacy', 'pop-cookie-consent'), 300) // Increased delay for fade
                })
            } else {
                console.warn('Privacy button not found')
            }

            if (languageBtn) {
                languageBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    this.hide('pop-cookie-consent')
                    setTimeout(() => this.show('pop-langsett', 'pop-cookie-consent'), 300) // Increased delay for fade
                })
            } else {
                console.warn('Language button not found')
            }

            this.consentEventsbound = true
        }, 200)
    }

    setConsent(analytics) {
        localStorage.setItem("analytics", analytics.toString())

        if (analytics) {
            this.loadGoogleAnalytics()
        } else {
            this.revokeConsent()
        }
    }

    loadGoogleAnalytics() {
        if (document.querySelector(`script[src*="${this.measurementId}"]`)) {
            console.log('Google Analytics already loaded')
            return
        }

        console.log('Loading Google Analytics...')

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
        localStorage.removeItem("cookie-consent")
        localStorage.removeItem("analytics-consent")

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

const popupManager = new PopupManager()
popupManager.init()
window.popupManager = popupManager