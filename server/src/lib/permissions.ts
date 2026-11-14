import type { Request, Response, NextFunction } from 'express';
import { query, queryOne, execute } from '../db';

/**
 * Central permission registry for FURSA.
 * Permissions are derived from the user's approved specialties (user_specialties)
 * merged with the base permission set granted to every active account.
 */

export const BASE_PERMISSIONS = [
  'listings.view',
  'listings.edit_own',
  'listings.delete_own',
  'offers.view',
  'offers.manage_own',
  'messages.use',
  'favorites.use',
  'reviews.create',
  'offers.create',
  'profile.edit',
  'subscriptions.manage',
] as const;

export interface PermissionDef {
  code: string;
  labelAr: string;
}

export const PERMISSIONS: PermissionDef[] = [
  { code: 'listings.view', labelAr: 'تصفح الإعلانات' },
  { code: 'listings.create_offer', labelAr: 'نشر عرض بيع' },
  { code: 'listings.create_request', labelAr: 'نشر طلب شراء' },
  { code: 'listings.create_service', labelAr: 'نشر خدمة' },
  { code: 'listings.edit_own', labelAr: 'تعديل إعلاناتي' },
  { code: 'listings.delete_own', labelAr: 'حذف إعلاناتي' },
  { code: 'offers.view', labelAr: 'عرض العروض' },
  { code: 'offers.create', labelAr: 'تقديم عروض' },
  { code: 'offers.manage_own', labelAr: 'إدارة عروضي' },
  { code: 'messages.use', labelAr: 'المراسلة' },
  { code: 'favorites.use', labelAr: 'المفضلة' },
  { code: 'reviews.create', labelAr: 'كتابة تقييمات' },
  { code: 'profile.edit', labelAr: 'تعديل الملف الشخصي' },
  { code: 'subscriptions.manage', labelAr: 'إدارة الاشتراك' },
];

export interface SpecialtyMeta {
  code: string;
  nameAr: string;
  nameEn: string;
  description: string;
  icon: string;
  permissions: string[];
}

/** Default permission matrix — mirrored into specialization_permissions at seed time. */
export const SPECIALTY_REGISTRY: SpecialtyMeta[] = [
  {
    code: 'farmer',
    nameAr: 'مزارع',
    nameEn: 'Farmer',
    description: 'أنتج وبيع المحاصيل والخضروات الطازجة مباشرة من الحقل.',
    icon: 'sprout',
    permissions: ['listings.create_offer', 'offers.create'],
  },
  {
    code: 'trader',
    nameAr: 'تاجر',
    nameEn: 'Trader',
    description: 'اشترِ وبِع المنتجات الزراعية بين المزارعين والأسواق.',
    icon: 'store',
    permissions: ['listings.create_request', 'offers.create'],
  },
  {
    code: 'wholesaler',
    nameAr: 'تاجر جملة',
    nameEn: 'Wholesaler',
    description: 'تجارة كميات كبيرة مع تجار التجزئة والمصانع.',
    icon: 'warehouse',
    permissions: ['listings.create_request', 'listings.create_offer', 'offers.create'],
  },
  {
    code: 'retailer',
    nameAr: 'تاجر تجزئة',
    nameEn: 'Retailer',
    description: 'بيع المنتجات الزراعية للمستهلك النهائي بكميات صغيرة.',
    icon: 'shopping-bag',
    permissions: ['listings.create_request', 'offers.create'],
  },
  {
    code: 'manufacturer',
    nameAr: 'مصنع تعبئة وتصنيع',
    nameEn: 'Manufacturer',
    description: 'تعبئة وتصنيع وتجميد المنتجات الزراعية.',
    icon: 'factory',
    permissions: ['listings.create_request', 'listings.create_service', 'offers.create'],
  },
  {
    code: 'transporter',
    nameAr: 'شركة نقل',
    nameEn: 'Transport Company',
    description: 'نقل المحاصيل والمستلزمات بين المزارع والأسواق.',
    icon: 'truck',
    permissions: ['listings.create_service', 'offers.create'],
  },
  {
    code: 'supplier',
    nameAr: 'مورد مستلزمات زراعية',
    nameEn: 'Agricultural Supplier',
    description: 'توريد الأسمدة والمبيدات والبذور والمعدات الزراعية.',
    icon: 'package',
    permissions: ['listings.create_offer', 'offers.create'],
  },
  {
    code: 'service_provider',
    nameAr: 'مقدم خدمات زراعية',
    nameEn: 'Agricultural Service Provider',
    description: 'خدمات زراعية مثل الحصاد والتعبئة والاستشارات.',
    icon: 'wrench',
    permissions: ['listings.create_service', 'offers.create'],
  },
  {
    code: 'agri_company',
    nameAr: 'شركة زراعية',
    nameEn: 'Agricultural Company',
    description: 'شركة متكاملة للإنتاج والتجارة الزراعية.',
    icon: 'building',
    permissions: ['listings.create_offer', 'listings.create_request', 'offers.create'],
  },
  {
    code: 'broker',
    nameAr: 'وسيط تجاري',
    nameEn: 'Commercial Broker',
    description: 'ربط البائعين والمشترين وإدارة الصفقات التجارية.',
    icon: 'briefcase',
    permissions: ['listings.create_service', 'offers.create'],
  },
  {
    code: 'other',
    nameAr: 'مجال آخر',
    nameEn: 'Other',
    description: 'مجال عمل مختلف — صفه ليتمكن فريقنا من تخصيص تجربتك.',
    icon: 'shapes',
    permissions: [],
  },
];

export const LISTING_TYPE_PERMISSION: Record<string, string> = {
  offer: 'listings.create_offer',
  request: 'listings.create_request',
  service: 'listings.create_service',
};

interface UserSpecialtyRow {
  code: string | null;
  name: string | null;
  custom_specialty: string | null;
}

const registryByCode = new Map(SPECIALTY_REGISTRY.map((s) => [s.code, s]));

/** Fallback matrix used when the DB mapping tables are unavailable. */
function registryPermissionsFor(codes: string[]): string[] {
  const set = new Set<string>();
  for (const code of codes) {
    const meta = registryByCode.get(code);
    for (const perm of meta?.permissions ?? []) set.add(perm);
  }
  return [...set];
}

/**
 * Returns the effective permission codes for a user.
 * DB `specialization_permissions` is the source of truth once seeded;
 * falls back to the in-code registry if the tables are missing/empty.
 */
export async function getUserPermissions(userId: number, role?: string): Promise<string[]> {
  if (role === 'admin') return ['*'];
  const rows = await query<UserSpecialtyRow>(
    `SELECT s.code AS code, s.name AS name, us.custom_specialty AS custom_specialty
     FROM user_specialties us LEFT JOIN specialties s ON s.id = us.specialty_id
     WHERE us.user_id = ?`,
    [userId],
  );
  const codes = rows.map((r) => r.code).filter((c): c is string => Boolean(c));
  // custom-only specialties (specialty_id NULL) and 'other' get base permissions only

  let specialtyPerms: string[] = [];
  try {
    const dbPerms = await query<{ permission_code: string }>(
      `SELECT DISTINCT sp.permission_code FROM specialization_permissions sp
       JOIN user_specialties us ON us.specialty_id IN (
         SELECT id FROM specialties WHERE code = sp.specialty_code
       )
       WHERE us.user_id = ?`,
      [userId],
    );
    if (dbPerms.length > 0 || codes.length > 0) {
      specialtyPerms = dbPerms.map((r) => r.permission_code);
    } else {
      specialtyPerms = registryPermissionsFor(codes);
    }
  } catch {
    specialtyPerms = registryPermissionsFor(codes);
  }
  return [...new Set([...BASE_PERMISSIONS, ...specialtyPerms])];
}

/** Service-level check: throws 403 ApiError-style errors. */
export async function assertUserPermission(userId: number, permission: string): Promise<void> {
  const user = await queryOne<{ account_status: string; role: string }>(
    'SELECT account_status, role FROM users WHERE id = ?',
    [userId],
  );
  if (!user || user.account_status !== 'active') {
    throw Object.assign(new Error('ACCOUNT_NOT_ACTIVE'), { statusCode: 403, code: 'ACCOUNT_NOT_ACTIVE' });
  }
  const permissions = await getUserPermissions(userId, user.role);
  if (!hasPermission(permissions, permission)) {
    try {
      await execute(
        'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 'PERMISSION_DENIED', 'permission', undefined, JSON.stringify({ permission }), Math.floor(Date.now() / 1000)],
      );
    } catch {
      // ignore audit failures
    }
    throw Object.assign(new Error('FORBIDDEN'), { statusCode: 403, code: 'FORBIDDEN' });
  }
}

export function hasPermission(permissions: string[], code: string): boolean {
  return permissions.includes('*') || permissions.includes(code);
}

function forbidden(code: string, message: string) {
  return Object.assign(new Error(message), { statusCode: 403, code });
}

/**
 * Requires an authenticated, active user holding `permission`.
 * Must be mounted AFTER `authenticate`.
 */
export function requirePermission(permission: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return next(forbidden('AUTH_REQUIRED', 'Authentication required'));
      if (user.accountStatus !== 'active') {
        return next(forbidden('ACCOUNT_NOT_ACTIVE', 'Your account is not active'));
      }
      const permissions = await getUserPermissions(user.id, user.role);
      if (!hasPermission(permissions, permission)) {
        await logPermissionDenied(user.id, permission, req);
        return next(forbidden('FORBIDDEN', 'You do not have permission to perform this action'));
      }
      req.permissions = permissions;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

async function logPermissionDenied(userId: number, permission: string, req: Request) {
  try {
    const { execute } = await import('../db');
    await execute(
      'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'PERMISSION_DENIED', 'permission', undefined, JSON.stringify({ permission, path: req.originalUrl, method: req.method }), Math.floor(Date.now() / 1000)],
    );
  } catch {
    // never block the request on audit logging
  }
}

/** Returns the user's specialty rows with registry metadata for API responses. */
export async function getUserSpecialtyDetails(userId: number) {
  const rows = await query<{
    id: number;
    name: string | null;
    code: string | null;
    name_en: string | null;
    description: string | null;
    icon: string | null;
    custom_specialty: string | null;
  }>(
    `SELECT s.id AS id, s.name AS name, s.code AS code, s.name_en AS name_en, s.description AS description,
            s.icon AS icon, us.custom_specialty AS custom_specialty
     FROM user_specialties us LEFT JOIN specialties s ON s.id = us.specialty_id
     WHERE us.user_id = ?`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    nameEn: row.name_en,
    description: row.description ?? registryByCode.get(row.code ?? '')?.description ?? null,
    icon: row.icon ?? registryByCode.get(row.code ?? '')?.icon ?? null,
    customSpecialty: row.custom_specialty,
  }));
}
