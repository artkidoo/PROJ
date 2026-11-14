import React, { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { X } from 'lucide-react';
import { ProductionNotification } from '../../types';
import { db } from '../../lib/firebase';

interface ProductionNotificationCenterProps {
  uid: string;
  onSelectNotification?: (notification: ProductionNotification) => void;
}

export const ProductionNotificationCenter: React.FC<ProductionNotificationCenterProps> = ({
  uid,
  onSelectNotification,
}) => {
  const [notifications, setNotifications] = useState<ProductionNotification[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setNotifications([]);
    setError('');
    if (!uid) return undefined;

    return onSnapshot(
      query(collection(db, 'userNotifications', uid, 'items'), orderBy('createdAt', 'desc'), limit(50)),
      snapshot => {
        setNotifications(
          snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionNotification))
        );
        setError('');
      },
      err => setError(err.message)
    );
  }, [uid]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const markRead = async (notification: ProductionNotification) => {
    if (!uid || notification.read) return;
    try {
      await updateDoc(doc(db, 'userNotifications', uid, 'items', notification.id), {
        read: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const unread = notifications.filter(notification => !notification.read);
  const unreadCount = unread.length;

  const markAllRead = async () => {
    if (!uid || unread.length === 0) return;
    try {
      await Promise.all(
        unread.map(notification =>
          updateDoc(doc(db, 'userNotifications', uid, 'items', notification.id), {
            read: true,
            updatedAt: new Date().toISOString(),
          })
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleNotificationClick = async (notification: ProductionNotification) => {
    await markRead(notification);
    if (onSelectNotification) {
      onSelectNotification(notification);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        onClick={() => setOpen(value => !value)}
        className="relative rounded border border-[#292929] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#3F3F3F]"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-2 rounded-full bg-[#FF1E1E] px-1.5 py-0.5 text-[10px] font-mono tabular-nums">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section
          aria-label="Production notifications"
          className="absolute right-0 z-50 mt-2 max-h-[min(70vh,32rem)] w-[min(24rem,calc(100vw-2rem))] overflow-auto rounded border border-[#292929] bg-[#0C0C0C] p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white">Production notifications</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tabular-nums text-neutral-500">
                {unreadCount} unread
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-[10px] text-red-300 underline hover:text-white"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="p-0.5 text-neutral-500 hover:text-white"
              >
                <X size={13} />
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="mb-2 text-xs text-red-300">
              {error}
            </p>
          )}
          {notifications.length === 0 && (
            <p className="py-5 text-center text-xs text-neutral-500">No notifications yet.</p>
          )}
          <div className="space-y-2">
            {notifications.map(notification => (
              <button
                type="button"
                key={notification.id}
                onClick={() => void handleNotificationClick(notification)}
                className={`block w-full rounded border p-3 text-left transition-colors ${
                  notification.read
                    ? 'border-[#222] bg-[#111] opacity-75 hover:opacity-100'
                    : 'border-red-900/50 bg-red-950/20 hover:border-red-700/60'
                }`}
              >
                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-white">
                  <span className="truncate">{notification.title}</span>
                  {notification.type && (
                    <span className="font-mono text-[9px] uppercase text-neutral-400 shrink-0">
                      {notification.type}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs text-neutral-300">{notification.message}</span>
                <span className="mt-2 block text-[10px] font-mono tabular-nums text-neutral-500">
                  {notification.createdAt
                    ? new Date(notification.createdAt).toLocaleString()
                    : '—'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductionNotificationCenter;
