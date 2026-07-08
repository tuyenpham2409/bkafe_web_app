import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const BadgeContext = createContext(null);
export const useBadges = () => useContext(BadgeContext);

export function BadgeProvider({ children }) {
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadContacts, setUnreadContacts] = useState(0);
  const [pendingPosts, setPendingPosts] = useState(0);

  const fetchNotificationCount = async () => {
    if (!user) return;
    try {
      const data = await api.get('/notifications');
      setUnreadNotifications(data.unread || 0);
    } catch (e) {
      console.error('Failed to fetch notification count:', e);
    }
  };

  const fetchAdminBadges = async () => {
    if (user?.role === 'admin') {
      try {
        const cs = await api.get('/contacts');
        setUnreadContacts(cs.filter(c => !c.handled).length);
      } catch (e) {
        console.error('Failed to fetch unread contacts:', e);
      }
      try {
        const ps = await api.get('/posts?status=pending');
        setPendingPosts(ps.length);
      } catch (e) {
        console.error('Failed to fetch pending posts:', e);
      }
    } else {
      setUnreadContacts(0);
      setPendingPosts(0);
    }
  };

  const refreshAll = () => {
    if (user) {
      fetchNotificationCount();
      fetchAdminBadges();
    }
  };

  useEffect(() => {
    if (user) {
      refreshAll();
      
      // Fast polling (every 4 seconds) to keep badges updated without socket.io
      const interval = setInterval(refreshAll, 4000);
      
      return () => clearInterval(interval);
    } else {
      setUnreadNotifications(0);
      setUnreadContacts(0);
      setPendingPosts(0);
    }
  }, [user]);

  return (
    <BadgeContext.Provider value={{
      unreadNotifications,
      unreadContacts,
      pendingPosts,
      refreshNotifications: fetchNotificationCount,
      refreshAdminBadges: fetchAdminBadges,
      refreshAll
    }}>
      {children}
    </BadgeContext.Provider>
  );
}
