import { z } from 'zod';
import { badRequest, notFound } from '../../lib/ApiError';
import { validate } from '../../lib/validate';
import { query, queryOne, execute } from '../../db';

export const adSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(160),
  linkUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v) || v.startsWith('/'), 'Link must be a valid URL')
    .optional(),
  isActive: z
    .preprocess((v) => v === true || v === 'true' || v === 1 || v === '1', z.boolean())
    .optional(),
  sortOrder: z
    .preprocess((v) => (v === undefined || v === '' || v === null ? undefined : Number(v)), z.number().int().min(0).max(9999).optional()),
});

export interface AdRecord {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: number;
}

function mapAd(row: {
  id: number;
  title: string;
  image_url: string;
  link_url: string | null;
  is_active: number;
  sort_order: number;
  created_at: number;
}): AdRecord {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
    createdAt: Math.floor(Number(row.created_at)),
  };
}

const AD_SELECT = 'SELECT id, title, image_url, link_url, is_active, sort_order, created_at FROM ads';

export async function listActiveAds(): Promise<AdRecord[]> {
  const rows = await query<Parameters<typeof mapAd>[0]>(
    `${AD_SELECT} WHERE is_active = 1 ORDER BY sort_order ASC, id DESC LIMIT 10`,
  );
  return rows.map(mapAd);
}

export async function listAllAds(): Promise<AdRecord[]> {
  const rows = await query<Parameters<typeof mapAd>[0]>(`${AD_SELECT} ORDER BY sort_order ASC, id DESC`);
  return rows.map(mapAd);
}

export async function createAd(adminUserId: number, input: unknown, imageDataUrl?: string): Promise<AdRecord> {
  const data = validate(adSchema, input);
  if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
    throw badRequest('IMAGE_REQUIRED', 'An image is required');
  }
  const now = Math.floor(Date.now() / 1000);
  const info = await execute(
    'INSERT INTO ads (title, image_url, link_url, is_active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      data.title,
      imageDataUrl,
      data.linkUrl?.trim() || null,
      data.isActive === false ? 0 : 1,
      data.sortOrder ?? 0,
      now,
      now,
    ],
  );
  const ad = await queryOne<Parameters<typeof mapAd>[0]>(`${AD_SELECT} WHERE id = ?`, [info.lastInsertRowid]);
  await logAdAudit(adminUserId, 'AD_CREATED', info.lastInsertRowid, { title: data.title });
  return mapAd(ad!);
}

export async function updateAd(adminUserId: number, id: number, input: unknown, imageDataUrl?: string): Promise<AdRecord> {
  const existing = await queryOne<{ id: number }>('SELECT id FROM ads WHERE id = ?', [id]);
  if (!existing) throw notFound('AD_NOT_FOUND', 'Ad not found');
  const data = validate(adSchema.partial(), input);
  const now = Math.floor(Date.now() / 1000);

  const current = await queryOne<Parameters<typeof mapAd>[0]>(`${AD_SELECT} WHERE id = ?`, [id]);
  const merged = {
    title: data.title ?? current!.title,
    linkUrl: data.linkUrl !== undefined ? data.linkUrl : current!.link_url,
    isActive: data.isActive !== undefined ? (data.isActive ? 1 : 0) : current!.is_active,
    sortOrder: data.sortOrder ?? current!.sort_order,
    imageUrl: imageDataUrl ?? current!.image_url,
  };

  await execute(
    'UPDATE ads SET title = ?, image_url = ?, link_url = ?, is_active = ?, sort_order = ?, updated_at = ? WHERE id = ?',
    [merged.title, merged.imageUrl, merged.linkUrl?.trim() || null, merged.isActive, merged.sortOrder, now, id],
  );
  await logAdAudit(adminUserId, 'AD_UPDATED', id, {});
  const ad = await queryOne<Parameters<typeof mapAd>[0]>(`${AD_SELECT} WHERE id = ?`, [id]);
  return mapAd(ad!);
}

export async function deleteAd(adminUserId: number, id: number): Promise<{ success: true }> {
  const existing = await queryOne<{ id: number }>('SELECT id FROM ads WHERE id = ?', [id]);
  if (!existing) throw notFound('AD_NOT_FOUND', 'Ad not found');
  await execute('DELETE FROM ads WHERE id = ?', [id]);
  await logAdAudit(adminUserId, 'AD_DELETED', id, {});
  return { success: true };
}

async function logAdAudit(actorId: number, action: string, entityId: number, metadata: Record<string, unknown>) {
  await execute(
    'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [actorId, action, 'ad', entityId, JSON.stringify(metadata), Math.floor(Date.now() / 1000)],
  );
}
