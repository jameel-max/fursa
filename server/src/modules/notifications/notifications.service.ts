import { getDb, query, queryOne, execute } from '../../db';
import { badRequest, notFound } from '../../lib/ApiError';

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

export async function createNotification(userId: number, type: string, title: string, body: string, targetUrl?: string) {
  const db = getDb();
  db.prepare(
    'INSERT INTO notifications (user_id, type, title, body, target_url, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
  ).run(userId, type, title, body, targetUrl ?? null, Math.floor(Date.now() / 1000));
  return { success: true };
}
