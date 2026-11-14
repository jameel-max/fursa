import type { ListingStatus, ListingType, OfferStatus, PriceType, UserRole } from '../types';

const arabicNumber = new Intl.NumberFormat('ar-JO-u-nu-latn', { maximumFractionDigits: 2 });

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return arabicNumber.format(value);
}

export function formatPrice(price: number | null, priceType?: PriceType): string {
  if (priceType === 'at_contact' || price === null || price === undefined) {
    return 'السعر عند التواصل';
  }
  return `${formatNumber(price)} د.أ`;
}

export function formatQuantity(quantity: number, unit?: string): string {
  return `${formatNumber(quantity)} ${unit ?? ''}`.trim();
}

const dateFormatter = new Intl.DateTimeFormat('ar-JO-u-nu-latn', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('ar-JO-u-nu-latn', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return '—';
  return dateFormatter.format(new Date(unixSeconds * 1000));
}

export function formatDateTime(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return '—';
  return dateTimeFormatter.format(new Date(unixSeconds * 1000));
}

export function timeAgo(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return '';
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diff < 60) return 'الآن';
  if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return minutes === 1 ? 'قبل دقيقة' : `قبل ${minutes} دقيقة`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return hours === 1 ? 'قبل ساعة' : `قبل ${hours} ساعة`;
  }
  if (diff < 2592000) {
    const days = Math.floor(diff / 86400);
    return days === 1 ? 'قبل يوم' : `قبل ${days} يوم`;
  }
  return formatDate(unixSeconds);
}

export const listingTypeLabel: Record<ListingType, string> = {
  offer: 'عرض بيع',
  request: 'طلب شراء',
  service: 'خدمة',
};

export const listingStatusLabel: Record<ListingStatus, string> = {
  active: 'نشط',
  paused: 'موقوف مؤقتاً',
  closed: 'مغلق',
  expired: 'منتهي',
};

export const priceTypeLabel: Record<PriceType, string> = {
  fixed: 'سعر ثابت',
  negotiable: 'قابل للتفاوض',
  at_contact: 'السعر عند التواصل',
};

export const offerStatusLabel: Record<OfferStatus, string> = {
  new: 'جديد',
  negotiation: 'قيد التفاوض',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
};

export const roleLabel: Record<UserRole, string> = {
  user: 'مستخدم',
  admin: 'مشرف',
};

export const accountStatusLabel: Record<string, string> = {
  pending: 'بانتظار التحقق',
  active: 'نشط',
  suspended: 'موقوف',
  banned: 'محظور',
};

export const auditActionLabel: Record<string, string> = {
  USER_ACTIVE: 'تفعيل مستخدم',
  USER_SUSPENDED: 'إيقاف مستخدم',
  USER_BANNED: 'حظر مستخدم',
  LISTING_ACTIVE: 'تفعيل إعلان',
  LISTING_PAUSED: 'إيقاف إعلان مؤقتاً',
  LISTING_CLOSED: 'إغلاق إعلان',
  LISTING_EXPIRED: 'تعليم إعلان منتهياً',
  USER_DELETED: 'حذف مستخدم',
  LISTING_DELETED: 'حذف إعلان',
  SETTINGS_UPDATE: 'تحديث إعدادات المنصة',
  SUBSCRIPTION_PURCHASED: 'اشتراك مدفوع جديد',
  SUBSCRIPTION_CANCELED: 'إلغاء اشتراك',
  PASSWORD_CHANGE: 'تغيير كلمة مرور',
};

export const subscriptionStatusLabel: Record<string, string> = {
  active: 'نشط',
  canceled: 'ملغي',
  expired: 'منتهي',
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0)).join('');
}

export function normalizePhone(value: string): string {
  return value.replace(/[^\d]/g, '');
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  const international = digits.startsWith('0') ? `962${digits.slice(1)}` : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}
