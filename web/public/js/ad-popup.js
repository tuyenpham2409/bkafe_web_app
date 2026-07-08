document.addEventListener('DOMContentLoaded', () => {
  // Only show the ad popup on the homepage
  const isHomepage = window.location.pathname === '/';
  if (!isHomepage) return;

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/`;
  }

  const dismissed = getCookie('bkafe_ad_dismissed');
  if (dismissed === 'true') {
    return;
  }

  // Show after 1 minute (60,000 ms)
  setTimeout(() => {
    const adModal = document.getElementById('ad-popup-modal');
    if (adModal) {
      adModal.style.display = 'flex';
      
      const closeBtn = document.getElementById('ad-popup-close-btn');
      const actionBtn = document.getElementById('ad-popup-action-btn');

      const dismissAd = () => {
        adModal.style.display = 'none';
        setCookie('bkafe_ad_dismissed', 'true', 30); // Dismiss for 30 days
      };

      if (closeBtn) closeBtn.addEventListener('click', dismissAd);
      if (actionBtn) actionBtn.addEventListener('click', dismissAd);

      // Dismiss if user clicks outside the modal box
      adModal.addEventListener('click', (e) => {
        if (e.target === adModal) {
          dismissAd();
        }
      });
    }
  }, 60000);
});
