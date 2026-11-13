import { getDb, query, queryOne, execute, withTransaction, insertAndGetId } from '../../db';
import { badRequest, notFound } from '../../lib/ApiError';
import { validate } from '../../lib/validate';
import { z } from 'zod';
import { createListingSchema, updateListingSchema, listingStatusSchema, offerSchema, offerStatusSchema } from './listings.schemas';
import { canPublish, getEffectiveSubscription } from '../subscriptions/subscriptions.service';

export interface ListingFilters {
  listingType?: 'offer' | 'request';
  categoryId?: number;
  governorateId?: number;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  status?: string;
  sort?: 'newest' | 'price_low' | 'price_high' | 'quantity';
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListingImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

export interface ListingOwner {
  id: number;
  fullName: string;
  phone: string;
  accountStatus: string;
  role: string;
  businessName: string | null;
  governorateId: number | null;
  area: string | null;
  specialties: Array<{ id: number; name: string; customSpecialty: string | null }>;
  contactPreferences: { showPhone: number; whatsappEnabled: number; internalMessagesEnabled: number };
}

export interface ListingDetail {
  id: number;
  userId: number;
  listingType: string;
  title: string;
  categoryId: number;
  description: string | null;
  quantity: number;
  unitId: number;
  price: number | null;
  priceType: string;
  governorateId: number | null;
  area: string | null;
  status: string;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
  images: ListingImage[];
  owner: ListingOwner | null;
  offerCount: number;
}

function toUnixSeconds(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Math.floor(numeric);
}

async function buildOwner(listingUserId: number) {
  const owner = await queryOne<{
    id: number;
    full_name: string;
    phone: string;
    account_status: string;
    role: string;
    business_name: string;
    governorate_id: number;
    area: string;
  }>('SELECT u.id AS id, u.full_name AS full_name, u.phone AS phone, u.account_status AS account_status, u.role AS role, up.business_name AS business_name, up.governorate_id AS governorate_id, up.area AS area FROM users u LEFT JOIN user_profiles up ON up.user_id = u.id WHERE u.id = ?', [listingUserId]);
  if (!owner) {
    return null;
  }
  const specialties = await query<{ id: number; name: string; custom_specialty: string | null }>(
    `SELECT s.id AS id, s.name AS name, us.custom_specialty AS custom_specialty FROM user_specialties us LEFT JOIN specialties s ON s.id = us.specialty_id WHERE us.user_id = ?`,
    [listingUserId],
  );
  const contactPrefs = await queryOne<{ show_phone: number; whatsapp_enabled: number; internal_messages_enabled: number }>(
    'SELECT show_phone, whatsapp_enabled, internal_messages_enabled FROM contact_preferences WHERE user_id = ?',
    [listingUserId],
  );
  return {
    id: owner.id,
    fullName: owner.full_name,
    phone: owner.phone,
    accountStatus: owner.account_status,
    role: owner.role,
    businessName: owner.business_name,
    governorateId: owner.governorate_id,
    area: owner.area,
    specialties: specialties.map((row) => ({ id: row.id, name: row.name, customSpecialty: row.custom_specialty })),
    contactPreferences: contactPrefs
      ? { showPhone: contactPrefs.show_phone, whatsappEnabled: contactPrefs.whatsapp_enabled, internalMessagesEnabled: contactPrefs.internal_messages_enabled }
      : { showPhone: 0, whatsappEnabled: 0, internalMessagesEnabled: 1 },
  };
}

export async function listListings(filters: ListingFilters) {
  const db = getDb();
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 12));
  const offset = (page - 1) * limit;

  const conditions: string[] = ['l.status = ?'];
  const params: unknown[] = [filters.status ?? 'active'];
  if (filters.listingType) {
    conditions.push('l.listing_type = ?');
    params.push(filters.listingType);
  }
  if (filters.categoryId) {
    conditions.push('l.category_id = ?');
    params.push(filters.categoryId);
  }
  if (filters.governorateId) {
    conditions.push('l.governorate_id = ?');
    params.push(filters.governorateId);
  }
  if (filters.area) {
    conditions.push('l.area LIKE ?');
    params.push(`%${filters.area}%`);
  }
  conditions.push('(l.expires_at IS NULL OR l.expires_at = 0 OR l.expires_at > ?)');
  params.push(Math.floor(Date.now() / 1000));
  if (filters.minPrice !== undefined) {
    conditions.push('l.price >= ?');
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push('l.price <= ?');
    params.push(filters.maxPrice);
  }
  if (filters.minQuantity) {
    conditions.push('l.quantity >= ?');
    params.push(filters.minQuantity);
  }
  if (filters.search) {
    conditions.push('(l.title LIKE ? OR l.description LIKE ? OR u.full_name LIKE ?)');
    const pattern = `%${filters.search}%`;
    params.push(pattern, pattern, pattern);
  }

  const whereClause = conditions.join(' AND ');
  const countRows = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM listings l JOIN users u ON u.id = l.user_id WHERE ${whereClause}`,
    params,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const orderBy =
    filters.sort === 'price_low'
      ? 'l.price ASC'
      : filters.sort === 'price_high'
        ? 'l.price DESC'
        : filters.sort === 'quantity'
          ? 'l.quantity DESC'
          : 'l.created_at DESC';

  const rows = await query<{
    id: number;
    user_id: number;
    listing_type: string;
    title: string;
    category_id: number;
    description: string;
    quantity: number;
    unit_id: number;
    price: number;
    price_type: string;
    governorate_id: number;
    area: string;
    status: string;
    expires_at: number;
    created_at: number;
    updated_at: number;
  }>(
    `SELECT l.id, l.user_id, l.listing_type, l.title, l.category_id, l.description, l.quantity, l.unit_id, l.price, l.price_type, l.governorate_id, l.area, l.status, l.expires_at, l.created_at, l.updated_at
     FROM listings l JOIN users u ON u.id = l.user_id
     WHERE ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const items: ListingDetail[] = [];
  for (const row of rows) {
    const images = await query<ListingImage>('SELECT id, image_url AS imageUrl, sort_order AS sortOrder FROM listing_images WHERE listing_id = ? ORDER BY sort_order ASC', [row.id]);
    const owner = await buildOwner(row.user_id);
    const offerCount = Number(await query<{ total: number }>('SELECT COUNT(*) AS total FROM offers WHERE listing_id = ?', [row.id])[0]?.total ?? 0);
    items.push({
      id: row.id,
      userId: row.user_id,
      listingType: row.listing_type,
      title: row.title,
      categoryId: row.category_id,
      description: row.description,
      quantity: row.quantity,
      unitId: row.unit_id,
      price: row.price,
      priceType: row.price_type,
      governorateId: row.governorate_id,
      area: row.area,
      status: row.status,
      expiresAt: row.expires_at ? toUnixSeconds(row.expires_at) : null,
      createdAt: toUnixSeconds(row.created_at),
      updatedAt: toUnixSeconds(row.updated_at),
      images,
      owner,
      offerCount,
    });
  }

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getListingById(id: number, viewerId: number | undefined) {
  const listing = await queryOne<{
    id: number;
    user_id: number;
    listing_type: string;
    title: string;
    category_id: number;
    description: string;
    quantity: number;
    unit_id: number;
    price: number;
    price_type: string;
    governorate_id: number;
    area: string;
    status: string;
    expires_at: number;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM listings WHERE id = ?', [id]);
  if (!listing) throw notFound('LISTING_NOT_FOUND', 'Listing not found');

  const images = await query<ListingImage>('SELECT id, image_url AS imageUrl, sort_order AS sortOrder FROM listing_images WHERE listing_id = ? ORDER BY sort_order ASC', [id]);
  const owner = await buildOwner(listing.user_id);
  const offerCount = Number(await query<{ total: number }>('SELECT COUNT(*) AS total FROM offers WHERE listing_id = ?', [id])[0]?.total ?? 0);

  const detail: ListingDetail = {
    id: listing.id,
    userId: listing.user_id,
    listingType: listing.listing_type,
    title: listing.title,
    categoryId: listing.category_id,
    description: listing.description,
    quantity: listing.quantity,
    unitId: listing.unit_id,
    price: listing.price,
    priceType: listing.price_type,
    governorateId: listing.governorate_id,
    area: listing.area,
    status: listing.status,
    expiresAt: listing.expires_at ? toUnixSeconds(listing.expires_at) : null,
    createdAt: toUnixSeconds(listing.created_at),
    updatedAt: toUnixSeconds(listing.updated_at),
    images,
    owner,
    offerCount,
  };
  return detail;
}

export async function listMyListings(userId: number, status: string) {
  const conditions = ['user_id = ?'];
  const params: unknown[] = [userId];
  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }
  const rows = await query<{
    id: number;
    user_id: number;
    listing_type: string;
    title: string;
    category_id: number;
    description: string;
    quantity: number;
    unit_id: number;
    price: number;
    price_type: string;
    governorate_id: number;
    area: string;
    status: string;
    expires_at: number;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM listings WHERE ' + conditions.join(' AND ') + ' ORDER BY updated_at DESC', params);
  const items: ListingDetail[] = [];
  for (const row of rows) {
    const images = await query<ListingImage>('SELECT id, image_url AS imageUrl, sort_order AS sortOrder FROM listing_images WHERE listing_id = ? ORDER BY sort_order ASC', [row.id]);
    const owner = await buildOwner(row.user_id);
    const offerCount = Number(await query<{ total: number }>('SELECT COUNT(*) AS total FROM offers WHERE listing_id = ?', [row.id])[0]?.total ?? 0);
    items.push({
      id: row.id,
      userId: row.user_id,
      listingType: row.listing_type,
      title: row.title,
      categoryId: row.category_id,
      description: row.description,
      quantity: row.quantity,
      unitId: row.unit_id,
      price: row.price,
      priceType: row.price_type,
      governorateId: row.governorate_id,
      area: row.area,
      status: row.status,
      expiresAt: row.expires_at ? toUnixSeconds(row.expires_at) : null,
      createdAt: toUnixSeconds(row.created_at),
      updatedAt: toUnixSeconds(row.updated_at),
      images,
      owner,
      offerCount,
    });
  }
  return items;
}

export async function createListing(userId: number, input: unknown, imageUrls: string[]) {
  const data = validate(createListingSchema, input);
  const nowSec = Math.floor(Date.now() / 1000);
  const { allowed, subscription, usage } = await canPublish(userId, nowSec);
  if (!allowed) {
    throw Object.assign(new Error('POST_LIMIT_REACHED'), { statusCode: 402, code: 'POST_LIMIT_REACHED' });
  }
  const expirySetting = await queryOne<{ value: string }>(
    'SELECT value FROM platform_settings WHERE key = ?',
    ['listing_expiry_days'],
  );
  const configuredExpiryDays = Number(expirySetting?.value);
  const expiryDays =
    Number.isFinite(configuredExpiryDays) && configuredExpiryDays >= 1 ? Math.floor(configuredExpiryDays) : 30;
  const listingId = await withTransaction(async () => {
    const expiresAt = data.expiresAt ?? nowSec + expiryDays * 24 * 3600;
    const newListingId = await insertAndGetId(
      `INSERT INTO listings (user_id, listing_type, title, category_id, description, quantity, unit_id, price, price_type, governorate_id, area, status, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.listingType,
        data.title.trim(),
        data.categoryId,
        data.description ?? null,
        data.quantity,
        data.unitId,
        data.price ?? null,
        data.priceType,
        data.governorateId,
        data.area ?? null,
        'active',
        expiresAt,
        nowSec,
        nowSec,
      ],
    );
    for (const [index, url] of imageUrls.entries()) {
      await execute('INSERT INTO listing_images (listing_id, image_url, sort_order) VALUES (?, ?, ?)', [newListingId, url, index]);
    }
    const periodStart = Math.floor(nowSec / (30 * 24 * 3600)) * (30 * 24 * 3600);
    const periodEnd = periodStart + 30 * 24 * 3600;
    const existing = await queryOne<{ id: number }>('SELECT id FROM post_usage WHERE user_id = ? AND billing_period_start = ?', [userId, periodStart]);
    if (existing) {
      await execute('UPDATE post_usage SET used_posts = used_posts + 1 WHERE id = ?', [existing.id]);
    } else {
      await execute(
        'INSERT INTO post_usage (user_id, subscription_id, billing_period_start, billing_period_end, monthly_post_limit, used_posts) VALUES (?, ?, ?, ?, ?, 1)',
        [userId, subscription.id > 0 ? subscription.id : null, periodStart, periodEnd, subscription.monthlyPostLimit],
      );
    }
    return newListingId;
  });
  return { id: listingId, subscription, usage };
}

export async function updateListing(userId: number, listingId: number, input: unknown, imageUrls: string[] = []) {
  const db = getDb();
  const listing = await queryOne<{ user_id: number; status: string }>('SELECT user_id, status FROM listings WHERE id = ?', [listingId]);
  if (!listing) throw notFound('LISTING_NOT_FOUND', 'Listing not found');
  if (listing.user_id !== userId) {
    throw Object.assign(new Error('NOT_LISTING_OWNER'), { statusCode: 403, code: 'NOT_LISTING_OWNER' });
  }
  const hasBodyFields = input && typeof input === 'object' && Object.keys(input as Record<string, unknown>).length > 0;
  if (!hasBodyFields && imageUrls.length === 0) {
    throw badRequest('NO_FIELDS', 'No fields provided to update');
  }
  const data: z.infer<typeof updateListingSchema> = hasBodyFields ? validate(updateListingSchema, input) : {};
  if (imageUrls.length > 0) {
    const existing = await query<{ total: number }>('SELECT COUNT(*) AS total FROM listing_images WHERE listing_id = ?', [listingId])[0]?.total ?? 0;
    if (existing + imageUrls.length > 5) {
      throw badRequest('IMAGE_LIMIT_REACHED', 'You can upload up to 5 images');
    }
    const start = Number(existing);
    for (const [index, url] of imageUrls.entries()) {
      await execute('INSERT INTO listing_images (listing_id, image_url, sort_order) VALUES (?, ?, ?)', [listingId, url, start + index]);
    }
  }
  if (data.status) {
    await execute('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?', [data.status, Math.floor(Date.now() / 1000), listingId]);
    return { status: data.status };
  }
  if (data.title !== undefined) {
    await execute('UPDATE listings SET title = ?, updated_at = ? WHERE id = ?', [data.title.trim(), Math.floor(Date.now() / 1000), listingId]);
  }
  if (data.categoryId !== undefined) {
    await execute('UPDATE listings SET category_id = ?, updated_at = ? WHERE id = ?', [data.categoryId, Math.floor(Date.now() / 1000), listingId]);
  }
  if (data.description !== undefined) {
    await execute('UPDATE listings SET description = ?, updated_at = ? WHERE id = ?', [data.description, Math.floor(Date.now() / 1000), listingId]);
  }
  if (data.quantity !== undefined) {
    await execute('UPDATE listings SET quantity = ?, updated_at = ? WHERE id = ?', [data.quantity, Math.floor(Date.now() / 1000), listingId]);
  }
  if (data.unitId !== undefined) {
    await execute('UPDATE listings SET unit_id = ?, updated_at = ? WHERE id = ?', [data.unitId, Math.floor(Date.now() / 1000), listingId]);
  }
  if (data.price !== undefined || data.priceType !== undefined) {
    const current = await queryOne<{ price: number; price_type: string }>('SELECT price, price_type FROM listings WHERE id = ?', [listingId]);
    await execute('UPDATE listings SET price = ?, price_type = ?, updated_at = ? WHERE id = ?', [data.price ?? null,
      data.priceType ?? current?.price_type ?? 'fixed',
      Math.floor(Date.now() / 1000),
      listingId,]);
  }
  if (data.governorateId !== undefined) {
    await execute('UPDATE listings SET governorate_id = ?, updated_at = ? WHERE id = ?', [data.governorateId, Math.floor(Date.now() / 1000), listingId]);
  }
  if (data.area !== undefined) {
    await execute('UPDATE listings SET area = ?, updated_at = ? WHERE id = ?', [data.area, Math.floor(Date.now() / 1000), listingId]);
  }
  if (data.expiresAt !== undefined) {
    await execute('UPDATE listings SET expires_at = ?, updated_at = ? WHERE id = ?', [data.expiresAt, Math.floor(Date.now() / 1000), listingId]);
  }
  return { success: true };
}

export async function setListingStatus(userId: number, listingId: number, status: 'active' | 'paused' | 'closed' | 'expired') {
  const db = getDb();
  const listing = await queryOne<{ user_id: number }>('SELECT user_id FROM listings WHERE id = ?', [listingId]);
  if (!listing) throw notFound('LISTING_NOT_FOUND', 'Listing not found');
  if (listing.user_id !== userId) {
    throw Object.assign(new Error('NOT_LISTING_OWNER'), { statusCode: 403, code: 'NOT_LISTING_OWNER' });
  }
  await execute('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?', [status, Math.floor(Date.now() / 1000), listingId]);
  return { status };
}

export async function deleteListingImage(userId: number, listingId: number, imageId: number) {
  const listing = await queryOne<{ user_id: number }>('SELECT user_id FROM listings WHERE id = ?', [listingId]);
  if (!listing) throw notFound('LISTING_NOT_FOUND', 'Listing not found');
  if (listing.user_id !== userId) {
    throw Object.assign(new Error('NOT_LISTING_OWNER'), { statusCode: 403, code: 'NOT_LISTING_OWNER' });
  }
  const image = await queryOne<{ id: number }>('SELECT id FROM listing_images WHERE id = ? AND listing_id = ?', [imageId, listingId]);
  if (!image) throw notFound('IMAGE_NOT_FOUND', 'Image not found');
  await execute('DELETE FROM listing_images WHERE id = ?', [imageId]);
  return { success: true };
}

export async function deleteListing(userId: number, listingId: number) {
  const db = getDb();
  const listing = await queryOne<{ user_id: number }>('SELECT user_id FROM listings WHERE id = ?', [listingId]);
  if (!listing) throw notFound('LISTING_NOT_FOUND', 'Listing not found');
  if (listing.user_id !== userId) {
    throw Object.assign(new Error('NOT_LISTING_OWNER'), { statusCode: 403, code: 'NOT_LISTING_OWNER' });
  }
  await execute('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?', ['closed', Math.floor(Date.now() / 1000), listingId]);
  return { success: true };
}
