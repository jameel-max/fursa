import { getDb, query, queryOne, execute } from '../../db';
import { badRequest, notFound } from '../../lib/ApiError';
import { getVapidPublicKey } from '../../lib/push';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  targetUrl: string | null;
  isRead: boolean;
  createdAt: number;
}

export async function listNotifications(userId: number) {
  const rows = await query<{
    id: number;
    type: string;
    title: string;
    body: string;
    target_url: string;
    is_read: number;
    created_at: number;
  }>(
    'SELECT id, type, title, body, target_url, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY is_read ASC, created_at DESC LIMIT 100',
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    targetUrl: row.target_url,
    isRead: row.is_read === 1,
    createdAt: Math.floor(row.created_at),
  }));
}

export async function markRead(userId: number, notificationId: number) {
  const db = getDb();
  const result = await execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notificationId, userId]);
  if (Number(result.changes) === 0) {
    throw notFound('NOTIFICATION_NOT_FOUND', 'Notification not found');
  }
  return { success: true };
}

export async function markAllRead(userId: number) {
  const db = getDb();
  await execute('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
  const rows = await query<{ total: number }>('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0', [userId]);
  return { success: true, unreadCount: Number(rows[0]?.total ?? 0) };
}

export async function notificationsSummary(userId: number) {
  const unread = await queryOne<{ total: number }>(
    'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId],
  );
  const latest = await queryOne<{
    id: number;
    type: string;
    title: string;
    body: string;
    target_url: string | null;
    is_read: number;
    created_at: number;
  }>(
    'SELECT id, type, title, body, target_url, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 1',
    [userId],
  );
  return {
    unreadCount: Number(unread?.total ?? 0),
    latest: latest
      ? {
          id: latest.id,
          type: latest.type,
          title: latest.title,
          body: latest.body,
          targetUrl: latest.target_url,
          isRead: latest.is_read === 1,
          createdAt: Math.floor(Number(latest.created_at)),
        }
      : null,
  };
}

export function getPushPublicKey() {
  return { publicKey: getVapidPublicKey() };
}

export async function subscribePush(userId: number, input: unknown) {
  const body = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh : '';
  const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth : '';
  if (!endpoint.startsWith('https://') || !p256dh || !auth) {
    throw badRequest('INVALID_SUBSCRIPTION', 'Invalid push subscription');
  }
  await execute(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    [userId, endpoint, p256dh, auth, Math.floor(Date.now() / 1000)],
  );
  return { success: true };
}

export async function unsubscribePush(userId: number, input: unknown) {
  const endpoint = typeof (input as { endpoint?: unknown })?.endpoint === 'string'
    ? String((input as { endpoint?: unknown }).endpoint)
    : '';
  if (!endpoint) throw badRequest('INVALID_SUBSCRIPTION', 'Invalid push subscription');
  await execute('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?', [endpoint, userId]);
  return { success: true };
}

export async function createNotification(userId: number, type: string, title: string, body: string, targetUrl?: string) {
  const db = getDb();
  db.prepare(
    'INSERT INTO notifications (user_id, type, title, body, target_url, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
  ).run(userId, type, title, body, targetUrl ?? null, Math.floor(Date.now() / 1000));
  return { success: true };
}
