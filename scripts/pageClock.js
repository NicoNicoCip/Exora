(() => {
  const clockHand = document.querySelector('.clock-hand');
  
  if (!clockHand) return;
  
  function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    
    // Calculate rotation (30 degrees per hour + 0.5 degrees per minute)
    const rotation = (hours * 30) + (minutes * 0.5);
    
    clockHand.style.transform = `rotate(${rotation}deg)`;
  }
  
  // Update immediately on load
  updateClock();
  
  // Update every time       \/
  setInterval(updateClock, 15000);
})();
