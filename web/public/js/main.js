window.showConfirmModal = function({ title = 'Xác nhận', message = 'Bạn có chắc chắn muốn thực hiện?', onConfirm }) {
  const existing = document.getElementById('custom-confirm-modal');
  if (existing) existing.remove();

  const modalHtml = `
    <div id="custom-confirm-modal" style="opacity: 0; display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); transition: opacity 0.2s ease;">
      <div class="modal-container" style="background: white; border-radius: 12px; width: 90%; max-width: 400px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); overflow: hidden; transform: scale(0.95); transition: transform 0.2s ease; border: 1px solid #f1f5f9;">
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; font-family: inherit;">${title}</h3>
          <p style="font-size: 13px; font-weight: 500; color: #64748b; line-height: 1.5; margin: 0; font-family: inherit;">${message}</p>
        </div>
        <div style="padding: 12px 16px; background-color: #f8fafc; display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid #f1f5f9;">
          <button type="button" id="confirm-cancel-btn" style="font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #475569; cursor: pointer; transition: all 0.15s ease;">Hủy</button>
          <button type="button" id="confirm-ok-btn" style="font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 8px; border: none; background: #ef4444; color: white; cursor: pointer; transition: all 0.15s ease;">Xác nhận</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('custom-confirm-modal');
  const container = modal.querySelector('.modal-container');
  const cancelBtn = modal.querySelector('#confirm-cancel-btn');
  const okBtn = modal.querySelector('#confirm-ok-btn');

  setTimeout(() => {
    modal.style.opacity = '1';
    container.style.transform = 'scale(1)';
  }, 10);

  const close = () => {
    modal.style.opacity = '0';
    container.style.transform = 'scale(0.95)';
    setTimeout(() => {
      modal.remove();
    }, 200);
  };

  cancelBtn.onmouseenter = () => { cancelBtn.style.backgroundColor = '#f1f5f9'; };
  cancelBtn.onmouseleave = () => { cancelBtn.style.backgroundColor = 'white'; };
  okBtn.onmouseenter = () => { okBtn.style.backgroundColor = '#dc2626'; };
  okBtn.onmouseleave = () => { okBtn.style.backgroundColor = '#ef4444'; };

  cancelBtn.onclick = close;
  okBtn.onclick = () => {
    close();
    if (onConfirm) onConfirm();
  };
};

window.showToast = function(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.zIndex = '10000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.alignItems = 'center';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.background = '#0f172a';
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '10px';
  toast.style.fontSize = '13px';
  toast.style.fontWeight = '700';
  toast.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '8px';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(10px)';
  toast.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

  if (type === 'success') {
    toast.style.background = '#0f172a';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${message}</span>
    `;
  } else if (type === 'error') {
    toast.style.background = '#ef4444';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <span>${message}</span>
    `;
  } else {
    toast.innerHTML = `<span>${message}</span>`;
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
};

window.handleDeleteFormSubmit = function(event, message = 'Bạn có chắc chắn muốn xóa?') {
  event.preventDefault();
  const form = event.currentTarget;
  window.showConfirmModal({
    title: 'Xác nhận xóa',
    message: message,
    onConfirm: () => {
      form.submit();
    }
  });
};

window.goBackOrHome = function(event) {
  if (document.referrer && document.referrer.startsWith(window.location.origin)) {
    const referrerUrl = new URL(document.referrer);
    if (referrerUrl.pathname === '/') {
      event.preventDefault();
      history.back();
    }
  }
};

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
  const actionParts = form ? form.action.split('/') : [];
  const postId = actionParts[actionParts.length - 2] || 'post';

  try {
    await navigator.clipboard.writeText(window.location.href);
    window.showToast('Đã sao chép liên kết vào clipboard!', 'success');
    
    if (form) {
      if (localStorage.getItem(`shared_post_${postId}`)) {
        return;
      }

      const url = form.action;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const result = await res.json();
        const span = form.querySelector('span');
        if (span) {
          span.textContent = `Chia sẻ (${result.shares || 0})`;
        }
        localStorage.setItem(`shared_post_${postId}`, 'true');
      }
    }
  } catch (err) {
    console.error('Failed to copy link: ', err);
  }
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

window.submitRate = async function(event, url, isPost, targetId) {
  event.preventDefault();
  const form = event.currentTarget.form || event.target.closest('form');
  const submitButton = event.target.closest('button');
  if (!submitButton) return;
  const value = submitButton.value;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({ value }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || 'Lỗi khi đánh giá.');
      return;
    }

    const result = await res.json(); // { ratingAvg, ratingCount, myRating }
    
    // Close popover
    document.querySelectorAll('.star-rating-popover .dropdown-menu').forEach(el => {
      el.style.display = 'none';
    });

    if (isPost) {
      // Update post rating UI elements
      const textSpan = document.getElementById('post-rating-text');
      if (textSpan) {
        textSpan.textContent = result.ratingCount > 0 
          ? `${result.ratingAvg.toFixed(1)}/5 (${result.ratingCount})`
          : 'Đánh giá';
      }
      
      // Update main rating icon
      const rateBtn = document.getElementById('post-rating-btn');
      if (rateBtn) {
        const svg = rateBtn.querySelector('svg');
        if (svg) {
          const poly = svg.querySelector('polygon');
          if (result.myRating) {
            svg.setAttribute('fill', 'var(--amber)');
            svg.setAttribute('stroke', 'var(--amber)');
            if (poly) poly.setAttribute('fill', 'var(--amber)');
            rateBtn.style.color = 'var(--amber)';
          } else {
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'var(--slate-300)');
            if (poly) poly.setAttribute('fill', 'none');
            rateBtn.style.color = 'var(--slate-500)';
          }
        }
      }

      // Update popover star highlighting
      const popover = document.getElementById(`rate-popover-post-${targetId}`);
      if (popover) {
        const stars = popover.querySelectorAll('button[name="value"]');
        stars.forEach(btn => {
          const val = parseInt(btn.value);
          if (val > 0) {
            const svg = btn.querySelector('svg');
            if (svg) {
              const poly = svg.querySelector('polygon');
              if ((result.myRating || 0) >= val) {
                svg.setAttribute('fill', 'var(--amber)');
                svg.setAttribute('stroke', 'var(--amber)');
                if (poly) poly.setAttribute('fill', 'var(--amber)');
              } else {
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'var(--slate-300)');
                if (poly) poly.setAttribute('fill', 'none');
              }
            }
          }
        });
      }
    } else {
      // Update comment rating UI elements
      const textBtn = document.getElementById(`comment-rating-btn-${targetId}`);
      if (textBtn) {
        if (result.myRating) {
          textBtn.style.color = 'var(--amber)';
          textBtn.style.fontWeight = '900';
          const textNode = document.getElementById(`comment-rating-text-${targetId}`);
          if (textNode) {
            textNode.textContent = `Đã đánh giá ${result.myRating}★`;
          }
          const svg = textBtn.querySelector('svg');
          if (svg) {
            const poly = svg.querySelector('polygon');
            svg.setAttribute('fill', 'var(--amber)');
            svg.setAttribute('stroke', 'var(--amber)');
            if (poly) poly.setAttribute('fill', 'var(--amber)');
          }
        } else {
          textBtn.style.color = 'var(--slate-500)';
          textBtn.style.fontWeight = '700';
          const textNode = document.getElementById(`comment-rating-text-${targetId}`);
          if (textNode) {
            textNode.textContent = 'Đánh giá';
          }
          const svg = textBtn.querySelector('svg');
          if (svg) {
            const poly = svg.querySelector('polygon');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            if (poly) poly.setAttribute('fill', 'none');
          }
        }
      }

      // Update comment rating summary at top right
      const summaryDiv = document.getElementById(`comment-rating-summary-${targetId}`);
      if (summaryDiv) {
        if (result.ratingCount > 0) {
          summaryDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 4px; color: var(--amber); font-weight: 700;">
              <svg class="icon icon-star" width="14" height="14" viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>${result.ratingAvg.toFixed(1)} (${result.ratingCount})</span>
            </div>
          `;
        } else {
          summaryDiv.innerHTML = '';
        }
      }

      // Update popover star highlighting
      const popover = document.getElementById(`rate-popover-${targetId}`);
      if (popover) {
        const stars = popover.querySelectorAll('button[name="value"]');
        stars.forEach(btn => {
          const val = parseInt(btn.value);
          if (val > 0) {
            const svg = btn.querySelector('svg');
            if (svg) {
              const poly = svg.querySelector('polygon');
              if ((result.myRating || 0) >= val) {
                svg.setAttribute('fill', 'var(--amber)');
                svg.setAttribute('stroke', 'var(--amber)');
                if (poly) poly.setAttribute('fill', 'var(--amber)');
              } else {
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'var(--slate-300)');
                if (poly) poly.setAttribute('fill', 'none');
              }
            }
          }
        });
      }
    }
  } catch (e) {
    console.error(e);
    alert('Không thể gửi đánh giá.');
  }
};

window.submitApprove = async function(event, url) {
  event.preventDefault();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.message || 'Lỗi khi duyệt bài.');
      return;
    }
    const data = await res.json();
    
    // Remove or update moderation banner
    const banner = document.getElementById('moderation-banner');
    if (banner) {
      banner.style.backgroundColor = 'var(--emerald-light)';
      banner.style.borderColor = 'rgba(16,185,129,0.15)';
      banner.innerHTML = `
        <span class="badge badge-success" style="font-weight: 800; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
          <svg class="icon icon-check-circle" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Đã duyệt
        </span>
        <span style="font-size: 13px; font-weight: 600; color: var(--emerald-dark); margin-left: 8px;">Bài viết đã được phê duyệt hiển thị công khai thành công!</span>
      `;
      // Auto-hide the banner after 3 seconds
      setTimeout(() => {
        banner.style.display = 'none';
      }, 3000);
    }
    const adminActions = document.getElementById('admin-moderation-actions');
    if (adminActions) adminActions.style.display = 'none';
  } catch (e) {
    console.error(e);
    alert('Không thể kết nối đến máy chủ.');
  }
};

window.submitReject = async function(event, url) {
  event.preventDefault();
  const form = event.target;
  const reason = form.querySelector('[name="reason"]').value;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({ reason })
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.message || 'Lỗi khi từ chối duyệt.');
      return;
    }
    
    // Close modal
    window.closeRejectModal();
    
    // Update moderation banner
    const banner = document.getElementById('moderation-banner');
    if (banner) {
      banner.style.backgroundColor = 'var(--rose-light)';
      banner.style.borderColor = 'rgba(244,63,94,0.15)';
      banner.innerHTML = `
        <span class="badge badge-danger" style="font-weight: 800; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
          <svg class="icon icon-x-circle" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          Bị từ chối
        </span>
        <span style="font-size: 13px; font-weight: 600; color: var(--rose-dark); margin-left: 8px;">Bài viết đã bị từ chối phê duyệt (Lý do: ${reason}).</span>
      `;
    }
    const adminActions = document.getElementById('admin-moderation-actions');
    if (adminActions) adminActions.style.display = 'none';
  } catch (e) {
    console.error(e);
    alert('Không thể kết nối đến máy chủ.');
  }
};

window.submitCommentForm = async function(event, url, isReply, parentId, depth = 0) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  
  if (isReply) {
    formData.append('depth', depth);
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: formData
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || 'Lỗi khi gửi bình luận.');
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const result = await res.json();
    
    form.reset();
    const fileInfo = form.querySelector('[id^="file-info-"], [id^="reply-file-info-"]');
    if (fileInfo) fileInfo.textContent = '';
    const fileInput = form.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';

    if (isReply) {
      window.toggleReplyForm(parentId);
      
      const parentNode = document.getElementById(`comment-${parentId}`);
      if (parentNode) {
        let repliesContainer = parentNode.querySelector('.replies-container');
        if (!repliesContainer) {
          repliesContainer = document.createElement('div');
          repliesContainer.className = 'replies-container';
          parentNode.appendChild(repliesContainer);
        }
        repliesContainer.insertAdjacentHTML('beforeend', result.html);
      }
    } else {
      const list = document.querySelector('.comments-list');
      if (list) {
        const placeholder = list.querySelector('.card.text-center');
        if (placeholder) {
          placeholder.remove();
        }
        list.insertAdjacentHTML('beforeend', result.html);
      }
    }

    const targetEl = document.getElementById(`comment-${result.id}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      targetEl.classList.add('comment-flash');
      setTimeout(() => {
        targetEl.classList.remove('comment-flash');
      }, 2000);
    }
  } catch (e) {
    console.error(e);
    alert('Không thể kết nối đến máy chủ.');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

window.submitEditComment = async function(event, url, commentId) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: formData
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || 'Lỗi khi sửa bình luận.');
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const result = await res.json();
    
    const displayDiv = document.getElementById(`comment-content-display-${commentId}`);
    if (displayDiv) {
      displayDiv.textContent = result.comment.content;
    }

    const dateDiv = document.getElementById(`comment-date-${commentId}`);
    if (dateDiv) {
      let editedLabel = dateDiv.querySelector('.comment-edited-label');
      if (!editedLabel) {
        editedLabel = document.createElement('span');
        editedLabel.className = 'comment-edited-label';
        editedLabel.style.fontSize = '11px';
        editedLabel.style.color = 'var(--slate-400)';
        editedLabel.style.fontWeight = '500';
        editedLabel.style.marginLeft = '4px';
        editedLabel.textContent = '(đã sửa)';
        dateDiv.appendChild(editedLabel);
      }
    }

    window.toggleEditComment(commentId);
  } catch (e) {
    console.error(e);
    alert('Không thể kết nối đến máy chủ.');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

window.submitDeleteComment = async function(event, url, commentId) {
  event.preventDefault();
  window.showConfirmModal({
    title: 'Xác nhận xóa bình luận',
    message: 'Bạn có chắc chắn muốn xóa bình luận này và tất cả phản hồi của nó?',
    onConfirm: async () => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.message || 'Lỗi khi xóa bình luận.');
          return;
        }

        const commentNode = document.getElementById(`comment-${commentId}`);
        if (commentNode) {
          commentNode.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          commentNode.style.opacity = '0';
          commentNode.style.transform = 'translateY(-10px)';
          setTimeout(() => {
            commentNode.remove();
          }, 500);
        }
      } catch (e) {
        console.error(e);
        alert('Không thể kết nối đến máy chủ.');
      }
    }
  });
};
