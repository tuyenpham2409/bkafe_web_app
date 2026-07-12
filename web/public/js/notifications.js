document.addEventListener('DOMContentLoaded', () => {
  const bellWrapper = document.getElementById('notification-bell-wrapper');
  if (!bellWrapper) return; 

  const bellBtn = document.getElementById('notification-bell-btn');
  const dropdown = document.getElementById('notification-dropdown');
  const badge = document.getElementById('notification-badge');
  const listContainer = document.getElementById('notification-list');
  const markAllBtn = document.getElementById('notification-mark-all');

  
  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = dropdown.style.display === 'none';
    dropdown.style.display = isHidden ? 'block' : 'none';
  });

  document.addEventListener('click', (e) => {
    if (!bellWrapper.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  
  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      const notifications = data.items || [];

      const unreadCount = data.unread ?? notifications.filter(n => !n.read).length;
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-flex';
        markAllBtn.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
        markAllBtn.style.display = 'none';
      }

      if (notifications.length === 0) {
        listContainer.innerHTML = '<div class="text-center font-bold" style="padding: 24px; font-size: 12px; color: var(--slate-400);">Chưa có thông báo nào.</div>';
        return;
      }

      listContainer.innerHTML = '';
      notifications.forEach(n => {
        const item = document.createElement('a');
        item.href = n.link || '#';
        item.className = `dropdown-item ${!n.read ? 'unread' : ''}`;
        item.style.display = 'block';
        item.style.padding = '12px 16px';
        item.style.borderBottom = '1px solid var(--slate-100)';
        item.style.textDecoration = 'none';
        item.style.color = 'inherit';
        if (!n.read) {
          item.style.backgroundColor = 'var(--primary-light)';
        }

        item.innerHTML = `
          <div style="font-weight: 700; font-size: 13px; color: var(--slate-900); margin-bottom: 2px;">${n.title}</div>
          <div style="font-size: 12px; color: var(--slate-500); line-height: 1.4;">${n.message}</div>
          <div style="font-size: 11px; color: var(--slate-400); font-weight: 500; margin-top: 4px;">${n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}</div>
        `;

        item.addEventListener('click', async (e) => {
          if (!n.read) {
            e.preventDefault();
            try {
              await fetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
            } catch (err) {
              console.error(err);
            }
            window.location.href = n.link || '/';
          }
        });

        listContainer.appendChild(item);
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }

  
  markAllBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  });

  
  async function fetchAdminStats() {
    const adminDot = document.getElementById('header-admin-dot');
    if (!adminDot) return;
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) return;
      const data = await res.json();

      adminDot.style.display = data.pendingPosts > 0 ? 'block' : 'none';

      const sidebarDot = document.getElementById('sidebar-admin-dot');
      if (sidebarDot) sidebarDot.style.display = data.pendingPosts > 0 ? 'inline-block' : 'none';

      const feedbackBadge = document.getElementById('sidebar-feedback-badge');
      if (feedbackBadge) {
        if (data.unreadContacts > 0) {
          feedbackBadge.textContent = data.unreadContacts > 99 ? '99+' : String(data.unreadContacts);
          feedbackBadge.style.display = 'inline-flex';
        } else {
          feedbackBadge.style.display = 'none';
        }
      }
    } catch {}
  }

  
  fetchNotifications();
  fetchAdminStats();
  setInterval(() => { fetchNotifications(); fetchAdminStats(); }, 10000);
});
