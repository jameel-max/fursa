import { query, queryOne, execute, insertAndGetId } from '../../db';
import { badRequest, notFound } from '../../lib/ApiError';
import { assertUserPermission } from '../../lib/permissions';

export interface FavoriteItem {
  id: number;
  listingId: number;
  title: string;
  listingType: string;
  price: number | null;
  quantity: number;
  status: string;
  createdAt: number;
  imageUrl: string | null;
}

export async function listFavorites(userId: number) {
  const rows = await query<{
    id: number;
    listing_id: number;
    title: string;
    listing_type: string;
    price: number;
    quantity: number;
    status: string;
    created_at: number;
    image_url: string | null;
  }>(
    `SELECT f.id, f.listing_id, l.title, l.listing_type, l.price, l.quantity, l.status, f.created_at,
            (SELECT li.image_url FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order ASC LIMIT 1) AS image_url
     FROM favorites f JOIN listings l ON l.id = f.listing_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    listingId: row.listing_id,
    title: row.title,
    listingType: row.listing_type,
    price: row.price,
    quantity: row.quantity,
    status: row.status,
    createdAt: Math.floor(row.created_at),
    imageUrl: row.image_url,
  }));
}

export async function toggleFavorite(listingId: number, userId: number) {
  await assertUserPermission(userId, 'favorites.use');
  const listing = await queryOne<{ id: number; user_id: number }>('SELECT id, user_id FROM listings WHERE id = ?', [listingId]);
  if (!listing) throw notFound('LISTING_NOT_FOUND', 'Listing not found');
  const existing = await queryOne<{ id: number }>('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?', [userId, listingId]);
  if (existing) {
    await execute('DELETE FROM favorites WHERE id = ?', [existing.id]);
    return { added: false };
  }
  const favoriteId = await insertAndGetId('INSERT INTO favorites (user_id, listing_id, created_at) VALUES (?, ?, ?)', [userId, listingId, Math.floor(Date.now() / 1000)]);
  return { added: true, id: favoriteId };
}
