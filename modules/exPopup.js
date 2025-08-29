class ExPopup extends HTMLElement {
  constructor() {
    super()
    this.isDragging = false
    this.currentX = 0
    this.currentY = 0
    this.initialX = 0
    this.initialY = 0
    this.xOffset = 0
    this.yOffset = 0
    this.isRendered = false
    this.outsideClickHandler = null
  }
  
  connectedCallback() {
    // Store the original content before it gets cleared
    this.originalContent = this.innerHTML
    // Don't render on connection - wait for show() to be called
    this.innerHTML = ''
    this.style.display = 'none'
  }
  
  render() {
    this.innerHTML = `
      <div class="popup-container">
        <div class="popup-header">
          <span class="popup-title">${this.getAttribute('popupTitle') || 'Popup'}</span>
          <button class="popup-close">X</button>
        </div>
        <div class="popup-content">
          ${this.originalContent || ''}
        </div>
      </div>
    `
    this.isRendered = true
  }
  
  setupEventListeners() {
    const header = this.querySelector('.popup-header')
    const closeBtn = this.querySelector('.popup-close')
    
    // Make popup draggable by header
    header.addEventListener('mousedown', this.dragStart.bind(this))
    document.addEventListener('mousemove', this.dragMove.bind(this))
    document.addEventListener('mouseup', this.dragEnd.bind(this))
    
    // Close button functionality
    closeBtn.addEventListener('click', this.close.bind(this))
    
    // Setup outside click handler
    this.outsideClickHandler = this.handleOutsideClick.bind(this)
  }
  
  handleOutsideClick(e) {
    // Don't close if we're dragging
    if (this.isDragging) {
      return
    }
    
    const container = this.querySelector('.popup-container')
    // Check if click is outside the popup container
    if (container && !container.contains(e.target)) {
      this.hide()
    }
  }
  
  dragStart(e) {
    this.initialX = e.clientX - this.xOffset
    this.initialY = e.clientY - this.yOffset
    
    if (e.target === this.querySelector('.popup-header') ||
        e.target === this.querySelector('.popup-title')) {
      this.isDragging = true
    }
  }
  
  dragMove(e) {
    if (this.isDragging) {
      e.preventDefault()
     
      this.currentX = e.clientX - this.initialX
      this.currentY = e.clientY - this.initialY
      
      this.xOffset = this.currentX
      this.yOffset = this.currentY
      
      const container = this.querySelector('.popup-container')
      container.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`
    }
  }
  
  dragEnd() {
    this.initialX = this.currentX
    this.initialY = this.currentY
    this.isDragging = false
  }
  
  center() {
    const container = this.querySelector('.popup-container')
    
    // Force a reflow to ensure we get accurate dimensions
    container.offsetHeight
    
    const rect = container.getBoundingClientRect()
    
    // Calculate center position relative to the viewport
    this.currentX = (window.innerWidth - rect.width) / 2 - rect.left
    this.currentY = (window.innerHeight - rect.height) / 2 - rect.top
   
    this.xOffset = this.currentX
    this.yOffset = this.currentY
   
    container.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`
  }
  
  close() {
    // Hide the popup instead of removing it
    this.hide()
  }
  
  show() {
    // Render content if not already rendered
    if (!this.isRendered) {
      this.render()
      this.setupEventListeners()
    }
    
    this.style.display = 'block'
    
    // Add outside click listener
    setTimeout(() => {
      document.addEventListener('click', this.outsideClickHandler)
    }, 0)
    
    // Center popup after it's visible and laid out
    // Use requestAnimationFrame to ensure the element is fully rendered
    requestAnimationFrame(() => {
      this.center()
    })
  }
  
  hide() {
    // Remove outside click listener
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler)
    }
    
    // Clear the content and hide
    this.innerHTML = ''
    this.isRendered = false
    this.style.display = 'none'
   
    // Reset position for next show
    this.currentX = 0
    this.currentY = 0
    this.xOffset = 0
    this.yOffset = 0
  }
}

customElements.define("ex-popup", ExPopup);