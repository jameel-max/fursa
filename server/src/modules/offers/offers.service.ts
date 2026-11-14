import { getDb, query, queryOne, execute } from '../../db';
import { badRequest, notFound } from '../../lib/ApiError';
import { validate } from '../../lib/validate';
import { offerSchema, offerStatusSchema } from '../listings/listings.schemas';
import { sendPushToUser } from '../../lib/push';
import { assertUserPermission } from '../../lib/permissions';

export interface OfferRecord {
  id: number;
  listingId: number;
  listingTitle: string;
  listingType: string;
  status: string;
  proposedPrice: number;
  proposedQuantity: number;
  notes: string | null;
  createdAt: number;
  buyerId: number;
  buyerName: string;
}

interface OfferRow {
  id: number;
  buyer_user_id: number;
  listing_id: number;
  status: string;
  owner_id: number;
  listing_type: string;
  listing_title: string;
}

function toUnixSeconds(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Math.floor(numeric);
}

async function pushNotification(userId: number, type: string, title: string, body: string, targetUrl: string) {
  await execute(
    'INSERT INTO notifications (user_id, type, title, body, target_url, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
    [userId, type, title, body, targetUrl, Math.floor(Date.now() / 1000)],
  );
  void sendPushToUser(userId, { title, body, url: targetUrl, tag: `offer-${userId}` });
}

export async function createOffer(listingId: number, buyerUserId: number, input: unknown) {
  await assertUserPermission(buyerUserId, 'offers.create');
  const data = validate(offerSchema, input);
  const listing = await queryOne<{ id: number; user_id: number; listing_type: string; status: string; title: string }>(
    'SELECT id, user_id, listing_type, status, title FROM listings WHERE id = ?',
    [listingId],
  );
  if (!listing) throw notFound('LISTING_NOT_FOUND', 'Listing not found');
  if (listing.listing_type !== 'request') {
    throw badRequest('INVALID_LISTING_TYPE', 'Only purchase requests accept offers');
  }
  if (listing.status !== 'active') {
    throw badRequest('LISTING_CLOSED', 'This purchase request is closed');
  }
  if (listing.user_id === buyerUserId) {
    throw badRequest('CANNOT_OFFER_SELF', 'You cannot make an offer on your own listing');
  }
  const now = Math.floor(Date.now() / 1000);
  const info = await execute(
    'INSERT INTO offers (listing_id, buyer_user_id, proposed_price, proposed_quantity, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [listingId, buyerUserId, data.proposedPrice, data.proposedQuantity, data.notes ?? null, 'new', now, now],
  );
  const offerId = Number(info.lastInsertRowid);
  pushNotification(
    listing.user_id,
    'OFFER_RECEIVED',
    'عرض جديد على طلبك',
    `تلقيت عرضاً جديداً على «${listing.title}».`,
    `/dashboard/offers`,
  );
  return {
    id: offerId,
    listingId,
    buyerUserId,
    proposedPrice: data.proposedPrice,
    proposedQuantity: data.proposedQuantity,
    status: 'new',
  };
}

const OFFER_SELECT = `SELECT o.id, o.listing_id, l.title AS listing_title, l.listing_type AS listing_type,
  o.status, o.proposed_price, o.proposed_quantity, o.notes, o.created_at,
  o.buyer_user_id AS buyer_id, u.full_name AS buyer_name
  FROM offers o
  JOIN listings l ON l.id = o.listing_id
  JOIN users u ON u.id = o.buyer_user_id`;

function mapOffer(row: {
  id: number;
  listing_id: number;
  listing_title: string;
  listing_type: string;
  status: string;
  proposed_price: number;
  proposed_quantity: number;
  notes: string;
  created_at: number;
  buyer_id: number;
  buyer_name: string;
}): OfferRecord {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    listingType: row.listing_type,
    status: row.status,
    proposedPrice: row.proposed_price,
    proposedQuantity: row.proposed_quantity,
    notes: row.notes,
    createdAt: toUnixSeconds(row.created_at),
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
  };
}

type OfferListRow = Parameters<typeof mapOffer>[0];

export async function listOffersReceived(userId: number): Promise<OfferRecord[]> {
  const rows = await query<OfferListRow>(`${OFFER_SELECT} WHERE l.user_id = ? ORDER BY o.created_at DESC`, [userId]);
  return rows.map(mapOffer);
}

export async function listOffersMade(userId: number): Promise<OfferRecord[]> {
  const rows = await query<OfferListRow>(`${OFFER_SELECT} WHERE o.buyer_user_id = ? ORDER BY o.created_at DESC`, [userId]);
  return rows.map(mapOffer);
}

export async function closeRequest(userId: number, offerId: number) {
  const offer = await queryOne<{ id: number; listing_id: number }>('SELECT id, listing_id FROM offers WHERE id = ?', [offerId]);
  if (!offer) throw notFound('OFFER_NOT_FOUND', 'Offer not found');
  const listing = await queryOne<{ user_id: number }>('SELECT user_id FROM listings WHERE id = ?', [offer.listing_id]);
  if (!listing) throw notFound('LISTING_NOT_FOUND', 'Listing not found');
  if (listing.user_id !== userId) {
    throw Object.assign(new Error('NOT_OFFER_PARTICIPANT'), { statusCode: 403, code: 'NOT_OFFER_PARTICIPANT' });
  }
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  await execute('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?', ['closed', now, offer.listing_id]);
  await execute('UPDATE offers SET status = ?, updated_at = ? WHERE id = ?', ['cancelled', now, offerId]);
  return { success: true };
}

export async function updateOfferStatus(
  userId: number,
  offerId: number,
  status: 'new' | 'negotiation' | 'accepted' | 'rejected' | 'cancelled',
) {
  const data = validate(offerStatusSchema, { status });
  const offer = await queryOne<OfferRow>(
    `SELECT o.id, o.buyer_user_id, o.listing_id, o.status,
            l.user_id AS owner_id, l.listing_type, l.title AS listing_title
     FROM offers o JOIN listings l ON l.id = o.listing_id WHERE o.id = ?`,
    [offerId],
  );
  if (!offer) throw notFound('OFFER_NOT_FOUND', 'Offer not found');

  const isOwner = offer.owner_id === userId;
  const isBuyer = offer.buyer_user_id === userId;
  if (!isOwner && !isBuyer) {
    throw Object.assign(new Error('NOT_OFFER_PARTICIPANT'), { statusCode: 403, code: 'NOT_OFFER_PARTICIPANT' });
  }

  if (data.status === 'cancelled' && !isBuyer) {
    throw Object.assign(new Error('NOT_OFFER_BUYER'), { statusCode: 403, code: 'NOT_OFFER_BUYER' });
  }
  if (['accepted', 'rejected'].includes(data.status) && !isOwner) {
    throw Object.assign(new Error('NOT_OFFER_OWNER'), { statusCode: 403, code: 'NOT_OFFER_OWNER' });
  }
  if (data.status === 'negotiation' && !isOwner) {
    throw Object.assign(new Error('NOT_OFFER_OWNER'), { statusCode: 403, code: 'NOT_OFFER_OWNER' });
  }

  const now = Math.floor(Date.now() / 1000);
  await execute('UPDATE offers SET status = ?, updated_at = ? WHERE id = ?', [data.status, now, offerId]);

  const titles: Record<string, [string, string]> = {
    accepted: ['تم قبول عرضك', 'قام صاحب الطلب بقبول عرضك.'],
    rejected: ['تم رفض عرضك', 'قام صاحب الطلب برفض عرضك.'],
    negotiation: ['عرض قيد التفاوض', 'صاحب الطلب يرغب بالتفاوض على عرضك.'],
    cancelled: ['تم إلغاء العرض', 'تم إلغاء العرض على طلبك.'],
  };
  const message = titles[data.status];
  if (message) {
    const recipient = isOwner ? offer.buyer_user_id : offer.owner_id;
    pushNotification(recipient, `OFFER_${data.status.toUpperCase()}`, message[0], message[1], '/dashboard/offers');
  }

  return { success: true, status: data.status };
}
