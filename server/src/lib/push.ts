import { generateVAPIDKeys, sendNotification, setVapidDetails } from 'web-push';
import { query, queryOne, execute } from '../db';

let vapidReady = false;

function getSetting(key: string): string | null {
  const row = queryOne<{ value: string }>('SELECT value FROM platform_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

function setSetting(key: string, value: string) {
  execute(
    'INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    [key, value, Math.floor(Date.now() / 1000)],
  );
}

export function getVapidPublicKey(): string {
  ensureVapid();
  return getSetting('vapid_public_key')!;
}

function ensureVapid() {
  if (vapidReady) return;
  let publicKey = process.env.VAPID_PUBLIC_KEY || getSetting('vapid_public_key');
  let privateKey = process.env.VAPID_PRIVATE_KEY || getSetting('vapid_private_key');
  if (!publicKey || !privateKey) {
    const generated = generateVAPIDKeys();
    publicKey = publicKey || generated.publicKey;
    privateKey = privateKey || generated.privateKey;
    setSetting('vapid_public_key', publicKey);
    setSetting('vapid_private_key', privateKey);
  }
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@fursa.app';
  setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
}

export async function sendPushToUser(
  userId: number,
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<void> {
  try {
    ensureVapid();
    const subs = await query<{ id: number; endpoint: string; p256dh: string; auth: string }>(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
      [userId],
    );
    if (subs.length === 0) return;
    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      tag: payload.tag || 'fursa',
    });
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
            { TTL: 60 * 60 },
          );
        } catch (error) {
          const status = (error as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            await execute('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
          }
        }
      }),
    );
  } catch (error) {
    console.error('[push] failed to send notification', error);
  }
}
