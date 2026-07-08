// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
  // Count one website view per browser session
  if (!sessionStorage.getItem('bkafe_site_viewed')) {
    sessionStorage.setItem('bkafe_site_viewed', 'true');
    fetch('/api/stats/view', { method: 'POST' }).catch(() => {});
  }

  const mobileToggleBtn = document.getElementById('mobile-menu-toggle-btn');
  const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
  const sidebarNav = document.querySelector('.sidebar-nav');
  const mobileMenuNav = document.getElementById('mobile-menu-nav');

  // After redirect-after-post lands on #comment-<id> or #comments-section,
  // flash the target briefly so the user notices the result without the
  // page having jumped back to the very top.
  if (location.hash.startsWith('#comment-')) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) {
      const card = target.querySelector('.card') || target;
      card.classList.add('comment-flash');
    }
  }

  if (mobileToggleBtn && mobileMenuOverlay && sidebarNav && mobileMenuNav) {
    // Clone sidebar nav into mobile menu nav
    mobileMenuNav.appendChild(sidebarNav.cloneNode(true));

    mobileToggleBtn.addEventListener('click', () => {
      const isVisible = mobileMenuOverlay.style.display === 'flex';
      mobileMenuOverlay.style.display = isVisible ? 'none' : 'flex';
    });

    mobileMenuOverlay.addEventListener('click', (e) => {
      if (e.target === mobileMenuOverlay) {
        mobileMenuOverlay.style.display = 'none';
      }
    });
  }
});

// Password show/hide toggle (delegated so it works for password fields loaded anywhere)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.toggle-password-btn');
  if (!btn) return;
  const input = document.getElementById(btn.dataset.target);
  if (!input) return;
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.querySelector('.icon-eye').style.display = showing ? 'flex' : 'none';
  btn.querySelector('.icon-eye-off').style.display = showing ? 'none' : 'flex';
  btn.title = showing ? 'Hiện mật khẩu' : 'Ẩn mật khẩu';
});

// Dropdowns & Popovers
window.togglePostMenu = function() {
  const dropdown = document.getElementById('post-options-dropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
};

window.toggleRatePopover = function(id) {
  const popover = document.getElementById(`rate-popover-${id}`);
  if (popover) {
    const isHidden = popover.style.display === 'none';
    // Close other open popovers
    document.querySelectorAll('.star-rating-popover .dropdown-menu').forEach(el => {
      el.style.display = 'none';
    });
    popover.style.display = isHidden ? 'flex' : 'none';
  }
};

// Comment Reply form toggle
window.toggleReplyForm = function(commentId) {
  const form = document.getElementById(`reply-form-${commentId}`);
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }
};

// Comment Edit form toggle
window.toggleEditComment = function(commentId) {
  const form = document.getElementById(`comment-edit-form-${commentId}`);
  const display = document.getElementById(`comment-content-display-${commentId}`);
  if (form && display) {
    const isEditing = form.style.display === 'block';
    form.style.display = isEditing ? 'none' : 'block';
    display.style.display = isEditing ? 'block' : 'none';
  }
};

// Admin Modals
window.openRejectModal = function() {
  const modal = document.getElementById('reject-modal');
  if (modal) modal.style.display = 'flex';
  togglePostMenu();
};
window.closeRejectModal = function() {
  const modal = document.getElementById('reject-modal');
  if (modal) modal.style.display = 'none';
};

window.openDeleteModal = function() {
  const modal = document.getElementById('delete-modal');
  if (modal) modal.style.display = 'flex';
  togglePostMenu();
};
window.closeDeleteModal = function() {
  const modal = document.getElementById('delete-modal');
  if (modal) modal.style.display = 'none';
};

// Copy Page URL (Post Share)
window.copyPageUrl = async function(event) {
  event.preventDefault();
  const form = event.currentTarget.closest('form');
  try {
    await navigator.clipboard.writeText(window.location.href);
    alert('Đã sao chép liên kết vào clipboard!');
  } catch (err) {
    console.error('Failed to copy link: ', err);
  }
  if (form) form.submit();
};

// Media Lightbox
window.openMediaLightbox = function(url) {
  const lightbox = document.getElementById('media-lightbox');
  const img = document.getElementById('lightbox-image');
  if (lightbox && img) {
    img.src = url;
    lightbox.style.display = 'flex';
  }
};
window.closeMediaLightbox = function() {
  const lightbox = document.getElementById('media-lightbox');
  if (lightbox) {
    lightbox.style.display = 'none';
  }
};

// Global click listener to close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  // Post Options dropdown
  const postBtn = document.getElementById('post-options-btn');
  const postDropdown = document.getElementById('post-options-dropdown');
  if (postDropdown && postDropdown.style.display === 'block' && postBtn && !postBtn.contains(e.target) && !postDropdown.contains(e.target)) {
    postDropdown.style.display = 'none';
  }

  // Rate Popovers
  if (!e.target.closest('.star-rating-popover')) {
    document.querySelectorAll('.star-rating-popover .dropdown-menu').forEach(el => {
      el.style.display = 'none';
    });
  }
});
