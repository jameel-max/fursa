import { query, queryOne, execute } from '../../db';
import { badRequest, forbidden, notFound } from '../../lib/ApiError';
import { validate } from '../../lib/validate';
import { createReviewSchema } from './reviews.schemas';
import { assertUserPermission } from '../../lib/permissions';

export interface ReviewRecord {
  id: number;
  listingId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment: string | null;
  createdAt: number;
  updatedAt: number;
  reviewerName?: string;
  listingTitle?: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

function toUnixSeconds(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Math.floor(Number(value));
}

export async function getRatingSummary(userId: number): Promise<RatingSummary> {
  const row = await queryOne<{ average: number | null; count: number }>(
    'SELECT AVG(rating) AS average, COUNT(*) AS count FROM reviews WHERE reviewee_id = ?',
    [userId],
  );
  return { average: row?.average != null ? Math.round(Number(row.average) * 10) / 10 : 0, count: Number(row?.count ?? 0) };
}

export async function createReview(reviewerId: number, input: unknown) {
  await assertUserPermission(reviewerId, 'reviews.create');
  const data = validate(createReviewSchema, input);

  const listing = await queryOne<{ id: number; user_id: number; status: string }>(
    'SELECT id, user_id, status FROM listings WHERE id = ?',
    [data.listingId],
  );
  if (!listing) throw notFound('LISTING_NOT_FOUND', 'Listing not found');
  if (listing.user_id === reviewerId) {
    throw forbidden('CANNOT_REVIEW_SELF', 'You cannot review your own listing');
  }
  if (listing.status !== 'active') {
    throw badRequest('LISTING_NOT_ACTIVE', 'You can only review active listings');
  }

  const now = Math.floor(Date.now() / 1000);
  const comment = data.comment?.trim() ? data.comment.trim() : null;

  // One review per reviewer per seller — rating a product rates the seller
  // across all of their listings. listing_id keeps the latest context.
  await execute(
    `INSERT INTO reviews (listing_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(reviewee_id, reviewer_id) DO UPDATE SET
       listing_id = excluded.listing_id,
       rating = excluded.rating,
       comment = excluded.comment,
       updated_at = excluded.updated_at`,
    [listing.id, reviewerId, listing.user_id, data.rating, comment, now, now],
  );

  const review = await queryOne<{
    id: number;
    listing_id: number;
    reviewer_id: number;
    reviewee_id: number;
    rating: number;
    comment: string | null;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM reviews WHERE reviewee_id = ? AND reviewer_id = ?', [listing.user_id, reviewerId]);

  return mapReview(review!);
}

export async function getMyReviewForListing(userId: number, listingId: number): Promise<ReviewRecord | null> {
  const listing = await queryOne<{ user_id: number }>('SELECT user_id FROM listings WHERE id = ?', [listingId]);
  if (!listing) return null;
  const row = await queryOne<{
    id: number;
    listing_id: number;
    reviewer_id: number;
    reviewee_id: number;
    rating: number;
    comment: string | null;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM reviews WHERE reviewee_id = ? AND reviewer_id = ?', [listing.user_id, userId]);
  return row ? mapReview(row) : null;
}

export async function listUserReviews(userId: number, limit = 20) {
  const rows = await query<{
    id: number;
    listing_id: number;
    reviewer_id: number;
    reviewee_id: number;
    rating: number;
    comment: string | null;
    created_at: number;
    updated_at: number;
    reviewer_name: string;
    listing_title: string;
  }>(
    `SELECT r.id, r.listing_id, r.reviewer_id, r.reviewee_id, r.rating, r.comment, r.created_at, r.updated_at,
            u.full_name AS reviewer_name, l.title AS listing_title
     FROM reviews r
     JOIN users u ON u.id = r.reviewer_id
     LEFT JOIN listings l ON l.id = r.listing_id
     WHERE r.reviewee_id = ?
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [userId, Math.min(50, Math.max(1, limit))],
  );
  const summary = await getRatingSummary(userId);
  return {
    summary,
    items: rows.map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      reviewerId: row.reviewer_id,
      revieweeId: row.reviewee_id,
      rating: row.rating,
      comment: row.comment,
      createdAt: toUnixSeconds(row.created_at),
      updatedAt: toUnixSeconds(row.updated_at),
      reviewerName: row.reviewer_name,
      listingTitle: row.listing_title,
    })),
  };
}

function mapReview(row: {
  id: number;
  listing_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment: string | null;
  created_at: number;
  updated_at: number;
}): ReviewRecord {
  return {
    id: row.id,
    listingId: row.listing_id,
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewee_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: toUnixSeconds(row.created_at),
    updatedAt: toUnixSeconds(row.updated_at),
  };
}
