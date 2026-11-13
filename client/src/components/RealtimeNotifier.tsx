import { useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { playMessageSound } from '../lib/sound';
import { subscribeToPush } from '../lib/push';

interface Summary {
  unreadCount: number;
  latest: {
    id: number;
    type: string;
    title: string;
    body: string;
    targetUrl: string | null;
    isRead: boolean;
    createdAt: number;
  } | null;
}

export function RealtimeNotifier() {
  const { user } = useAuth();
  const lastIdRef = useRef<number | null>(null);
  const primedRef = useRef(false);
  const permissionRequestedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      primedRef.current = false;
      lastIdRef.current = null;
      return;
    }

    let active = true;

    const setupPush = async () => {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default' && !permissionRequestedRef.current) {
        permissionRequestedRef.current = true;
        try {
          const result = await Notification.requestPermission();
          if (result === 'granted') await subscribeToPush();
        } catch {
          // permission prompt unavailable
        }
      } else if (Notification.permission === 'granted') {
        await subscribeToPush();
      }
    };
    void setupPush();

    const poll = async () => {
      try {
        const summary = await api<Summary>('/notifications/summary');
        if (!active) return;
        window.dispatchEvent(new Event('fursa:notifications'));

        if (!primedRef.current) {
          primedRef.current = true;
          lastIdRef.current = summary.latest?.id ?? 0;
          return;
        }

        const latest = summary.latest;
        if (!latest) return;
        const previous = lastIdRef.current ?? 0;
        lastIdRef.current = latest.id;
        if (latest.id <= previous) return;

        if (document.hidden) {
          if (Notification.permission === 'granted') {
            try {
              const notification = new Notification(latest.title, {
                body: latest.body,
                icon: '/favicon.svg',
                tag: `fursa-${latest.id}`,
              });
              notification.onclick = () => {
                window.focus();
                if (latest.targetUrl) window.location.assign(latest.targetUrl);
              };
            } catch {
              // notification API unavailable
            }
          }
        } else {
          playMessageSound();
        }
      } catch {
        // polling is best-effort
      }
    };

    void poll();
    const timer = window.setInterval(poll, 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user]);

  return null;
}
