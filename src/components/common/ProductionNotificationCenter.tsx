import React, { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { ProductionNotification } from '../../types';
import { db } from '../../lib/firebase';

interface ProductionNotificationCenterProps {
  uid: string;
}

export const ProductionNotificationCenter: React.FC<ProductionNotificationCenterProps> = ({ uid }) => {
  const [notifications, setNotifications] = useState<ProductionNotification[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => onSnapshot(
    query(collection(db, 'userNotifications', uid, 'items'), orderBy('createdAt', 'desc'), limit(50)),
    snapshot => {
      setNotifications(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionNotification)));
      setError('');
    },
    err => setError(err.message),
  ), [uid]);

  const markRead = async (notification: ProductionNotification) => {
    if (notification.read) return;
    try {
      await updateDoc(doc(db, 'userNotifications', uid, 'items', notification.id), {
        read: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(unread.map(notification => updateDoc(doc(db, 'userNotifications', uid, 'items', notification.id), {
        read: true,
        updatedAt: new Date().toISOString(),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const unread = notifications.filter(notification => !notification.read);
  const unreadCount = unread.length;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        onClick={() => setOpen(value => !value)}
        className="relative rounded border border-[#292929] bg-[#141414] px-3 py-1.5 text-xs text-white"
      >
        Notifications
        {unreadCount > 0 && <span className="ml-2 rounded-full bg-[#FF1E1E] px-1.5 py-0.5 text-[10px]">{unreadCount}</span>}
      </button>
      {open && (
        <section className="absolute right-0 z-50 mt-2 max-h-[min(70vh,32rem)] w-[min(24rem,calc(100vw-2rem))] overflow-auto rounded border border-[#292929] bg-[#0C0C0C] p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white">Production notifications</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500">{unreadCount} unread</span>
              {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} className="text-[10px] text-red-300 underline">Mark all read</button>}
            </div>
          </div>
          {error && <p role="alert" className="mb-2 text-xs text-red-300">{error}</p>}
          {notifications.length === 0 && <p className="py-5 text-center text-xs text-neutral-500">No notifications yet.</p>}
          <div className="space-y-2">
            {notifications.map(notification => (
              <button
                type="button"
                key={notification.id}
                onClick={() => void markRead(notification)}
                className={`block w-full rounded border p-3 text-left ${notification.read ? 'border-[#222] bg-[#111] opacity-70' : 'border-red-900/50 bg-red-950/20'}`}
              >
                <span className="block text-xs font-semibold text-white">{notification.title}</span>
                <span className="mt-1 block text-xs text-neutral-300">{notification.message}</span>
                <span className="mt-2 block text-[10px] text-neutral-500">{notification.createdAt}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductionNotificationCenter;
