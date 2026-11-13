export class ApiError extends Error {
  code: string;
  status: number;
  details?: Array<{ field: string; message: string }>;

  constructor(message: string, code: string, status: number, details?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export function toQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Array<{ field: string; message: string }> };
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: payload,
      credentials: 'include',
      signal,
    });
  } catch {
    throw new ApiError('تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.', 'NETWORK_ERROR', 0);
  }

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || !envelope?.success) {
    const error = envelope?.error;
    throw new ApiError(
      translateMessage(error?.message) || 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.',
      error?.code || 'UNKNOWN_ERROR',
      response.status,
      error?.details,
    );
  }

  return envelope.data as T;
}

const MESSAGE_MAP: Record<string, string> = {
  'Authentication required': 'يجب تسجيل الدخول للمتابعة.',
  'Invalid credentials': 'رقم الهاتف أو كلمة المرور غير صحيحة.',
  'Account is not active': 'الحساب غير مفعّل بعد. يرجى تأكيد رقم الهاتف.',
  'Account is suspended': 'تم إيقاف هذا الحساب. يرجى التواصل مع الدعم.',
  'Account is banned': 'تم حظر هذا الحساب.',
  'Too many attempts, please try again later': 'محاولات كثيرة. يرجى المحاولة لاحقاً.',
  'User not found': 'المستخدم غير موجود.',
  'Listing not found': 'الإعلان غير موجود.',
  'Offer not found': 'العرض غير موجود.',
  'Phone number is already registered': 'رقم الهاتف مسجل مسبقاً.',
  'Phone number must be a valid Jordanian mobile number': 'أدخل رقم هاتف أردني صحيح (مثال: 0791234567).',
  'Invalid or expired verification code': 'رمز التحقق غير صحيح أو منتهي الصلاحية.',
  'Invalid or expired reset code': 'رمز إعادة التعيين غير صحيح أو منتهي الصلاحية.',
  'Price is required unless the price type is "at contact"': 'السعر مطلوب إلا إذا اخترت «السعر عند التواصل».',
  'No fields provided to update': 'لم يتم إرسال أي تعديل.',
  'You cannot make an offer on your own listing': 'لا يمكنك تقديم عرض على إعلانك الخاص.',
  'Only purchase requests accept offers': 'يمكن تقديم العروض على طلبات الشراء فقط.',
  'This purchase request is closed': 'هذا الطلب مغلق ولا يستقبل عروضاً جديدة.',
  'You cannot start a conversation with yourself': 'لا يمكنك بدء محادثة مع نفسك.',
  'This user is not available for messaging': 'هذا المستخدم غير متاح للمراسلة.',
  'You have reached your monthly posting limit': 'لقد استهلكت حد النشر الشهري. يمكنك الترقية للمتابعة.',
  'Online payments are currently unavailable': 'الدفع الإلكتروني غير متاح حالياً.',
  'Online payments are currently unavailable. Please contact support to activate the professional plan manually.':
    'الدفع الإلكتروني غير متاح حالياً. يرجى التواصل مع الدعم لتفعيل الخطة المهنية يدوياً.',
  'The free plan does not require a payment': 'الخطة المجانية لا تتطلب الدفع.',
  'Current password is incorrect': 'كلمة المرور الحالية غير صحيحة.',
  'Current password is required': 'أدخل كلمة المرور الحالية.',
  'Invalid phone or password': 'رقم الهاتف أو كلمة المرور غير صحيحة.',
  'Please verify your phone number before logging in': 'يرجى تأكيد رقم هاتفك قبل تسجيل الدخول.',
  'Please choose a valid recipient': 'يرجى اختيار مستلم صحيح.',
  'Message must be between 1 and 2000 characters': 'يجب أن تكون الرسالة بين حرف واحد و2000 حرف.',
  'You can upload up to 5 images': 'يمكنك رفع 5 صور كحد أقصى.',
  'Image not found': 'الصورة غير موجودة.',
  'NOT_OFFER_PARTICIPANT': 'لا تملك صلاحية على هذا العرض.',
  'NOT_OFFER_OWNER': 'هذا الإجراء متاح لصاحب الطلب فقط.',
  'NOT_OFFER_BUYER': 'هذا الإجراء متاح لمقدّم العرض فقط.',
  'NOT_LISTING_OWNER': 'لا تملك صلاحية تعديل هذا الإعلان.',
  'NOT_CONVERSATION_PARTICIPANT': 'لا تملك صلاحية الوصول إلى هذه المحادثة.',
  'You cannot message yourself': 'لا يمكنك مراسلة نفسك.',
  'You cannot suspend or ban your own admin account': 'لا يمكنك إيقاف أو حظر حساب المشرف الخاص بك.',
  'The value of the setting is not valid': 'قيمة الإعداد غير صحيحة.',
};

function translateMessage(message?: string): string | undefined {
  if (!message) return undefined;
  if (MESSAGE_MAP[message]) return MESSAGE_MAP[message];
  if (/^The value of .+ is not valid$/.test(message)) return 'قيمة الإعداد غير صحيحة.';
  if (/invalid input/i.test(message)) return 'يرجى التحقق من البيانات المدخلة.';
  if (/not found/i.test(message)) return 'العنصر المطلوب غير موجود.';
  return message;
}
