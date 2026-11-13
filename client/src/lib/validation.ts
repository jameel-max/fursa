import { ApiError } from './api';

const FIELD_MESSAGES: Record<string, string> = {
  'Full name must be at least 3 characters': 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل.',
  'Full name is too long': 'الاسم الكامل طويل جداً.',
  'Phone number must be a valid Jordanian mobile number': 'أدخل رقم هاتف أردني صحيح (مثال: 0791234567).',
  'Phone number must be at least 8 digits': 'رقم الهاتف قصير جداً.',
  'Phone number is too long': 'رقم الهاتف طويل جداً.',
  'Password must be at least 8 characters': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
  'Password must be at most 64 characters': 'كلمة المرور طويلة جداً.',
  'Password must contain both letters and numbers': 'كلمة المرور يجب أن تحتوي على أحرف وأرقام.',
  'Passwords do not match': 'كلمتا المرور غير متطابقتين.',
  'New passwords do not match': 'كلمتا المرور الجديدتان غير متطابقتين.',
  'You must accept the terms and conditions': 'يجب الموافقة على الشروط والأحكام.',
  'You can select up to 3 specialties': 'يمكنك اختيار 3 تخصصات كحد أقصى.',
  'Verification code must be 6 digits': 'رمز التحقق يجب أن يتكوّن من 6 أرقام.',
  'Invalid verification code': 'رمز التحقق غير صحيح أو منتهي الصلاحية.',
  'Verification code has expired': 'انتهت صلاحية رمز التحقق. اطلب رمزاً جديداً.',
  'Too many invalid attempts': 'محاولات خاطئة كثيرة. اطلب رمزاً جديداً.',
  'This phone number is already verified': 'رقم الهاتف موثّق مسبقاً.',
  'This verification code has already been used': 'تم استخدام رمز التحقق مسبقاً.',
  'Current password is required': 'أدخل كلمة المرور الحالية.',
  'Current password is incorrect': 'كلمة المرور الحالية غير صحيحة.',
  'Title must be at least 3 characters': 'عنوان الإعلان يجب أن يكون 3 أحرف على الأقل.',
  'Title is too long': 'عنوان الإعلان طويل جداً.',
  'Price is required unless the price type is "at contact"': 'السعر مطلوب إلا إذا اخترت «السعر عند التواصل».',
  'Please choose a valid plan': 'يرجى اختيار خطة صحيحة.',
  'Too many attempts, please try again later': 'محاولات كثيرة. يرجى المحاولة لاحقاً.',
  'Number must be greater than or equal to 1': 'القيمة يجب أن تكون 1 على الأقل.',
  'Number must be greater than 0': 'القيمة يجب أن تكون أكبر من صفر.',
  'Invalid input': 'يرجى التحقق من البيانات المدخلة.',
};

function translateFieldMessage(message: string): string {
  if (FIELD_MESSAGES[message]) return FIELD_MESSAGES[message];
  if (/^String must contain at least/i.test(message)) return 'القيمة المدخلة قصيرة جداً.';
  if (/^String must contain at most/i.test(message)) return 'القيمة المدخلة طويلة جداً.';
  if (/^Number must be/i.test(message)) return 'القيمة الرقمية غير صحيحة.';
  if (/^Invalid input/i.test(message)) return 'يرجى التحقق من البيانات المدخلة.';
  if (/^Required$/i.test(message)) return 'هذا الحقل مطلوب.';
  return message;
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const result: Record<string, string> = {};
  if (error.details) {
    for (const detail of error.details) {
      if (!result[detail.field]) result[detail.field] = translateFieldMessage(detail.message);
    }
  }
  return result;
}

export function getErrorMessage(error: unknown, fallback = 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.'): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
