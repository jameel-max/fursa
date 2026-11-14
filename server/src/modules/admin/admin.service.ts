import { getDb, query, queryOne, execute, withTransaction } from '../../db';
import { badRequest } from '../../lib/ApiError';

export interface AdminStats {
  users: { total: number; newThisMonth: number; pending: number; active: number; suspended: number };
  listings: { total: number; offers: number; requests: number; active: number; paused: number; closed: number; expired: number };
  offers: { total: number; new: number; negotiation: number; accepted: number; rejected: number; cancelled: number };
  subscriptions: { active: number; canceled: number; expired: number };
  revenue: { total: number; successful: number; pending: number };
  recentOperations: Array<{ id: number; action: string; entityType: string; entityId: number | null; createdAt: number }>;
}

export async function getAdminStats() {
  const nowSec = Math.floor(Date.now() / 1000);
  const monthStart = Math.floor(nowSec / (30 * 24 * 3600)) * (30 * 24 * 3600);
  const users = await query<{ total: number; new_this_month: number; pending: number; active: number; suspended: number }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN created_at >= ${monthStart} THEN 1 ELSE 0 END) AS new_this_month,
            SUM(CASE WHEN account_status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN account_status IN ('suspended', 'banned') THEN 1 ELSE 0 END) AS suspended
     FROM users`,
  );
  const listings = await query<{ total: number; offers: number; requests: number; services: number; active: number; paused: number; closed: number; expired: number }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN listing_type = 'offer' THEN 1 ELSE 0 END) AS offers,
            SUM(CASE WHEN listing_type = 'request' THEN 1 ELSE 0 END) AS requests,
            SUM(CASE WHEN listing_type = 'service' THEN 1 ELSE 0 END) AS services,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) AS paused,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed,
            SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired
     FROM listings`,
  );
  const offers = await query<{ total: number; new: number; negotiation: number; accepted: number; rejected: number; cancelled: number }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS "new",
            SUM(CASE WHEN status = 'negotiation' THEN 1 ELSE 0 END) AS negotiation,
            SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM offers`,
  );
  const subscriptions = await query<{ active: number; canceled: number; expired: number }>(
    `SELECT SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) AS canceled,
            SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired
     FROM subscriptions`,
  );
  const payments = await query<{ total_amount: number; successful: number; pending: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total_amount,
            SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) AS successful,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
     FROM payments`,
  );
  const recentOperations = await query<{ id: number; action: string; entity_type: string; entity_id: number | null; created_at: number }>(
    'SELECT id, action, entity_type, entity_id, created_at FROM audit_logs ORDER BY id DESC LIMIT 10',
  );

  const usersRow = users[0] ?? { total: 0, new_this_month: 0, pending: 0, active: 0, suspended: 0 };
  const listingsRow = listings[0] ?? { total: 0, offers: 0, requests: 0, active: 0, paused: 0, closed: 0, expired: 0 };
  const offersRow = offers[0] ?? { total: 0, new: 0, negotiation: 0, accepted: 0, rejected: 0, cancelled: 0 };
  const subscriptionsRow = subscriptions[0] ?? { active: 0, canceled: 0, expired: 0 };
  const paymentsRow = payments[0] ?? { total: 0, successful: 0, pending: 0 };

  const farmerCount = Number(
    ((await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM user_specialties us JOIN specialties s ON s.id = us.specialty_id WHERE s.name = 'مزارع'`,
    )))[0]?.total ?? 0,
  );

  return {
    users: {
      total: Number(usersRow.total ?? 0),
      newThisMonth: Number(usersRow.new_this_month ?? 0),
      pending: Number(usersRow.pending ?? 0),
      active: Number(usersRow.active ?? 0),
      suspended: Number(usersRow.suspended ?? 0),
    },
    farmers: farmerCount,
    listings: {
      total: Number(listingsRow.total ?? 0),
      offers: Number(listingsRow.offers ?? 0),
      requests: Number(listingsRow.requests ?? 0),
      active: Number(listingsRow.active ?? 0),
      paused: Number(listingsRow.paused ?? 0),
      closed: Number(listingsRow.closed ?? 0),
      expired: Number(listingsRow.expired ?? 0),
    },
    offers: {
      total: Number(offersRow.total ?? 0),
      new: Number(offersRow.new ?? 0),
      negotiation: Number(offersRow.negotiation ?? 0),
      accepted: Number(offersRow.accepted ?? 0),
      rejected: Number(offersRow.rejected ?? 0),
      cancelled: Number(offersRow.cancelled ?? 0),
    },
    subscriptions: {
      active: Number(subscriptionsRow.active ?? 0),
      canceled: Number(subscriptionsRow.canceled ?? 0),
      expired: Number(subscriptionsRow.expired ?? 0),
    },
    revenue: {
      total: Number(paymentsRow.total_amount ?? 0),
      successful: Number(paymentsRow.successful ?? 0),
      pending: Number(paymentsRow.pending ?? 0),
    },
    recentOperations: recentOperations.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      createdAt: Math.floor(row.created_at),
    })),
  };
}

export async function listAdminUsers(filters: { status?: string; specialty?: string; search?: string; page?: number; limit?: number }) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.status) {
    conditions.push('u.account_status = ?');
    params.push(filters.status);
  }
  if (filters.specialty) {
    conditions.push(`EXISTS (SELECT 1 FROM user_specialties us JOIN specialties s ON s.id = us.specialty_id WHERE us.user_id = u.id AND s.name = ?)`);
    params.push(filters.specialty);
  }
  if (filters.search) {
    conditions.push('(u.full_name LIKE ? OR u.phone LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await query<{
    id: number;
    full_name: string;
    phone: string;
    account_status: string;
    role: string;
    created_at: number;
  }>(`SELECT u.id, u.full_name, u.phone, u.account_status, u.role, u.created_at FROM users u ${whereClause} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const total = Number(((await query<{ total: number }>(`SELECT COUNT(*) AS total FROM users u ${whereClause}`, params)))[0]?.total ?? 0);
  const items = rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    accountStatus: row.account_status,
    role: row.role,
    createdAt: Math.floor(row.created_at),
  }));
  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function setUserStatus(adminUserId: number, userId: number, status: 'active' | 'suspended' | 'banned') {
  const db = getDb();
  if (userId === adminUserId && status !== 'active') {
    throw badRequest('CANNOT_CHANGE_OWN_STATUS', 'You cannot suspend or ban your own admin account');
  }
  const user = await queryOne<{ id: number }>('SELECT id FROM users WHERE id = ?', [userId]);
  if (!user) throw Object.assign(new Error('USER_NOT_FOUND'), { statusCode: 404, code: 'USER_NOT_FOUND' });
  await execute('UPDATE users SET account_status = ?, updated_at = ? WHERE id = ?', [status, Math.floor(Date.now() / 1000), userId]);
  await execute('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)', [adminUserId, `USER_${status.toUpperCase()}`, 'user', userId, JSON.stringify({ status }), Math.floor(Date.now() / 1000)]);
  return { success: true, status };
}

export async function setListingStatus(adminUserId: number, listingId: number, status: 'active' | 'paused' | 'closed' | 'expired') {
  const db = getDb();
  const listing = await queryOne<{ id: number; user_id: number }>('SELECT id, user_id FROM listings WHERE id = ?', [listingId]);
  if (!listing) throw Object.assign(new Error('LISTING_NOT_FOUND'), { statusCode: 404, code: 'LISTING_NOT_FOUND' });
  await execute('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?', [status, Math.floor(Date.now() / 1000), listingId]);
  await execute('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)', [adminUserId, `LISTING_${status.toUpperCase()}`, 'listing', listingId, JSON.stringify({ status }), Math.floor(Date.now() / 1000)]);
  return { success: true, status };
}

export async function setListingFeatured(adminUserId: number, listingId: number, featured: boolean) {
  const db = getDb();
  const listing = await queryOne<{ id: number }>('SELECT id FROM listings WHERE id = ?', [listingId]);
  if (!listing) throw Object.assign(new Error('LISTING_NOT_FOUND'), { statusCode: 404, code: 'LISTING_NOT_FOUND' });
  await execute('UPDATE listings SET featured = ?, updated_at = ? WHERE id = ?', [featured ? 1 : 0, Math.floor(Date.now() / 1000), listingId]);
  await execute('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [adminUserId, featured ? 'LISTING_FEATURED' : 'LISTING_UNFEATURED', 'listing', listingId, JSON.stringify({ featured }), Math.floor(Date.now() / 1000)]);
  return { success: true, featured };
}

export async function listAdminSubscriptions() {
  const rows = await query<{
    id: number;
    user_id: number;
    user_name: string;
    plan_id: number;
    plan_name: string;
    amount: number;
    status: string;
    starts_at: number;
    ends_at: number;
    auto_renew: number;
    payment_provider_reference: string;
  }>(
    `SELECT s.id, s.user_id, u.full_name AS user_name, s.plan_id, p.name AS plan_name, p.price AS amount,
            s.status, s.starts_at, s.ends_at, s.auto_renew, s.payment_provider_reference
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     JOIN plans p ON p.id = s.plan_id
     ORDER BY s.id DESC LIMIT 100`,
  );
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    planId: row.plan_id,
    planName: row.plan_name,
    amount: row.amount,
    status: row.status,
    startsAt: Math.floor(row.starts_at),
    endsAt: Math.floor(row.ends_at),
    autoRenew: row.auto_renew === 1,
    paymentProviderReference: row.payment_provider_reference,
  }));
}

export async function listAdminListings(filters: { status?: string; type?: string; search?: string; page?: number; limit?: number }) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
  const offset = (page - 1) * limit;
  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];
  if (filters.status) {
    conditions.push('l.status = ?');
    params.push(filters.status);
  }
  if (filters.type) {
    conditions.push('l.listing_type = ?');
    params.push(filters.type);
  }
  if (filters.search) {
    conditions.push('(l.title LIKE ? OR l.description LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  const whereClause = conditions.join(' AND ');
  const rows = await query<{
    id: number;
    user_id: number;
    listing_type: string;
    title: string;
    status: string;
    featured: number;
    quantity: number;
    price: number;
    created_at: number;
    updated_at: number;
    owner_name: string;
  }>(`SELECT l.id, l.user_id, l.listing_type, l.title, l.status, l.featured, l.quantity, l.price, l.created_at, l.updated_at, u.full_name AS owner_name FROM listings l JOIN users u ON u.id = l.user_id WHERE ${whereClause} ORDER BY l.updated_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const total = Number(((await query<{ total: number }>(`SELECT COUNT(*) AS total FROM listings l WHERE ${whereClause}`, params)))[0]?.total ?? 0);
  const items = rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    listingType: row.listing_type,
    title: row.title,
    status: row.status,
    featured: row.featured === 1,
    quantity: row.quantity,
    price: row.price,
    ownerName: row.owner_name,
    createdAt: Math.floor(row.created_at),
    updatedAt: Math.floor(row.updated_at),
  }));
  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getAdminUserDetail(userId: number) {
  const user = await queryOne<{
    id: number;
    full_name: string;
    phone: string;
    account_status: string;
    role: string;
    created_at: number;
    updated_at: number;
  }>('SELECT id, full_name, phone, account_status, role, created_at, updated_at FROM users WHERE id = ?', [userId]);
  if (!user) throw Object.assign(new Error('USER_NOT_FOUND'), { statusCode: 404, code: 'USER_NOT_FOUND' });

  const profile = await queryOne<{
    business_name: string | null;
    description: string | null;
    governorate_id: number | null;
    area: string | null;
  }>('SELECT business_name, description, governorate_id, area FROM user_profiles WHERE user_id = ?', [userId]);

  const specialties = await query<{ name: string; custom_specialty: string | null }>(
    `SELECT s.name, us.custom_specialty FROM user_specialties us
     LEFT JOIN specialties s ON s.id = us.specialty_id
     WHERE us.user_id = ?`,
    [userId],
  );

  const counts = await queryOne<{
    listings: number;
    offers_made: number;
    offers_received: number;
    favorites: number;
    conversations: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM listings WHERE user_id = ?) AS listings,
       (SELECT COUNT(*) FROM offers WHERE buyer_user_id = ?) AS offers_made,
       (SELECT COUNT(*) FROM offers o JOIN listings l ON l.id = o.listing_id WHERE l.user_id = ?) AS offers_received,
       (SELECT COUNT(*) FROM favorites WHERE user_id = ?) AS favorites,
       (SELECT COUNT(*) FROM conversations WHERE participant_one_id = ? OR participant_two_id = ?) AS conversations`,
    [userId, userId, userId, userId, userId, userId],
  );

  const subscription = await queryOne<{
    id: number;
    plan_name: string;
    status: string;
    starts_at: number;
    ends_at: number;
    auto_renew: number;
  }>(
    `SELECT s.id, p.name AS plan_name, s.status, s.starts_at, s.ends_at, s.auto_renew
     FROM subscriptions s JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id = ? ORDER BY s.id DESC LIMIT 1`,
    [userId],
  );

  const recentListings = await query<{ id: number; title: string; listing_type: string; status: string; created_at: number }>(
    'SELECT id, title, listing_type, status, created_at FROM listings WHERE user_id = ? ORDER BY id DESC LIMIT 5',
    [userId],
  );

  return {
    id: user.id,
    fullName: user.full_name,
    phone: user.phone,
    accountStatus: user.account_status,
    role: user.role,
    createdAt: Math.floor(user.created_at),
    updatedAt: Math.floor(user.updated_at),
    profile: profile
      ? {
          businessName: profile.business_name,
          description: profile.description,
          governorateId: profile.governorate_id,
          area: profile.area,
        }
      : null,
    specialties: specialties.map((row) => ({ name: row.name, customSpecialty: row.custom_specialty })),
    counts: {
      listings: Number(counts?.listings ?? 0),
      offersMade: Number(counts?.offers_made ?? 0),
      offersReceived: Number(counts?.offers_received ?? 0),
      favorites: Number(counts?.favorites ?? 0),
      conversations: Number(counts?.conversations ?? 0),
    },
    subscription: subscription
      ? {
          id: subscription.id,
          planName: subscription.plan_name,
          status: subscription.status,
          startsAt: Math.floor(subscription.starts_at),
          endsAt: Math.floor(subscription.ends_at),
          autoRenew: subscription.auto_renew === 1,
        }
      : null,
    recentListings: recentListings.map((row) => ({
      id: row.id,
      title: row.title,
      listingType: row.listing_type,
      status: row.status,
      createdAt: Math.floor(row.created_at),
    })),
  };
}

export async function deleteAdminUser(adminUserId: number, userId: number) {
  const db = getDb();
  if (userId === adminUserId) {
    throw badRequest('CANNOT_DELETE_SELF', 'You cannot delete your own admin account');
  }
  const user = await queryOne<{ id: number; role: string }>('SELECT id, role FROM users WHERE id = ?', [userId]);
  if (!user) throw Object.assign(new Error('USER_NOT_FOUND'), { statusCode: 404, code: 'USER_NOT_FOUND' });
  if (user.role === 'admin') {
    throw badRequest('CANNOT_DELETE_ADMIN', 'Admin accounts cannot be deleted');
  }
  const now = Math.floor(Date.now() / 1000);
  await withTransaction(async () => {
    await db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    await execute('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [adminUserId, 'USER_DELETED', 'user', userId, null, now]);
  });
  return { success: true };
}

export async function deleteAdminListing(adminUserId: number, listingId: number) {
  const db = getDb();
  const listing = await queryOne<{ id: number }>('SELECT id FROM listings WHERE id = ?', [listingId]);
  if (!listing) throw Object.assign(new Error('LISTING_NOT_FOUND'), { statusCode: 404, code: 'LISTING_NOT_FOUND' });
  const now = Math.floor(Date.now() / 1000);
  await withTransaction(async () => {
    await db.prepare('DELETE FROM listings WHERE id = ?').run(listingId);
    await execute('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [adminUserId, 'LISTING_DELETED', 'listing', listingId, null, now]);
  });
  return { success: true };
}

export async function cancelAdminSubscription(adminUserId: number, subscriptionId: number) {
  const db = getDb();
  const subscription = await queryOne<{ id: number; status: string }>('SELECT id, status FROM subscriptions WHERE id = ?', [
    subscriptionId,
  ]);
  if (!subscription) {
    throw Object.assign(new Error('SUBSCRIPTION_NOT_FOUND'), { statusCode: 404, code: 'SUBSCRIPTION_NOT_FOUND' });
  }
  if (subscription.status !== 'active') {
    throw badRequest('SUBSCRIPTION_NOT_ACTIVE', 'Only active subscriptions can be canceled');
  }
  const now = Math.floor(Date.now() / 1000);
  await execute('UPDATE subscriptions SET status = ?, auto_renew = 0, updated_at = ? WHERE id = ?', ['canceled', now, subscriptionId]);
  await execute('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)', [adminUserId, 'SUBSCRIPTION_CANCELED', 'subscription', subscriptionId, JSON.stringify({ by: 'admin' }), now]);
  return { success: true, status: 'canceled' };
}

export async function getAdminSettings() {
  const rows = await query<{ key: string; value: string }>('SELECT key, value FROM platform_settings');
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return settings;
}

const SETTING_RULES: Record<string, { min: number; max: number; integer: boolean }> = {
  free_post_limit: { min: 1, max: 3650, integer: true },
  professional_post_limit: { min: 1, max: 3650, integer: true },
  professional_price: { min: 0.01, max: 10000, integer: false },
  listing_expiry_days: { min: 1, max: 3650, integer: true },
};

export async function updateAdminSettings(adminUserId: number, values: Record<string, string>) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  for (const [key, raw] of Object.entries(values)) {
    const rule = SETTING_RULES[key];
    if (!rule) continue;
    const numeric = Number(raw);
    if (
      !Number.isFinite(numeric) ||
      numeric < rule.min ||
      numeric > rule.max ||
      (rule.integer && !Number.isInteger(numeric))
    ) {
      throw badRequest('INVALID_SETTING', `The value of ${key} is not valid`);
    }
  }

  await withTransaction(async () => {
    for (const [key, value] of Object.entries(values)) {
      await execute(
        'INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
        [key, value, now],
      );
    }

    if (values.free_post_limit !== undefined) {
      await execute('UPDATE plans SET monthly_post_limit = ? WHERE name = ?', [Number(values.free_post_limit),
        'free',]);
    }
    if (values.professional_post_limit !== undefined) {
      await execute('UPDATE plans SET monthly_post_limit = ? WHERE name = ?', [Number(values.professional_post_limit),
        'professional',]);
    }
    if (values.professional_price !== undefined) {
      await execute('UPDATE plans SET price = ? WHERE name = ?', [Number(values.professional_price), 'professional']);
    }

    await execute('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [adminUserId, 'SETTINGS_UPDATE', 'settings', null, JSON.stringify(values), now]);
  });

  return { success: true };
}
