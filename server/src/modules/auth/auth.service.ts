import { getDb, query, queryOne, execute, withTransaction } from '../../db';
import { validate } from '../../lib/validate';
import { config } from '../../config';
import { signToken, findUserById, type AuthUser } from '../../lib/auth';
import { hashPassword, comparePassword } from '../../lib/password';
import { badRequest, notFound } from '../../lib/ApiError';
import { logAudit } from '../../lib/auth';
import { registerSchema, verifyPhoneSchema, loginSchema, forgotPasswordSchema, resendOtpSchema, resetPasswordSchema, changePasswordSchema } from './auth.schemas';

export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_MAX_ATTEMPTS = 3;

export function generateOtpCode(): string {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function issueOtp(phone: string) {
  const db = getDb();
  await execute('DELETE FROM otp_codes WHERE phone = ? AND verified_at IS NOT NULL', [phone]);
  const code = generateOtpCode();
  await db
    .prepare('INSERT INTO otp_codes (phone, code, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, ?)')
    .run(phone, code, Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS, Math.floor(Date.now() / 1000));
  return code;
}

export async function verifyOtp(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const otp = await queryOne<{ id: number; code: string; expires_at: number; attempts: number; verified_at: number | null }>(
    'SELECT id, code, expires_at, attempts, verified_at FROM otp_codes WHERE phone = ? ORDER BY id DESC LIMIT 1',
    [phone],
  );
  const now = Math.floor(Date.now() / 1000);
  if (!otp) return { ok: false, error: 'OTP_NOT_FOUND' };
  if (otp.verified_at) return { ok: false, error: 'OTP_ALREADY_USED' };
  if (otp.expires_at < now) return { ok: false, error: 'OTP_EXPIRED' };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, error: 'OTP_MAX_ATTEMPTS' };
  if (otp.code !== code) {
    await execute('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [otp.id]);
    const remaining = OTP_MAX_ATTEMPTS - (otp.attempts + 1);
    return { ok: false, error: remaining > 0 ? `OTP_INVALID ${remaining}` : 'OTP_MAX_ATTEMPTS' };
  }
  await execute('UPDATE otp_codes SET verified_at = ? WHERE id = ?', [now, otp.id]);
  return { ok: true };
}

export async function register(input: unknown): Promise<{ user: AuthUser; devCode?: string }> {
  const data = validate(registerSchema, input);
  const phone = data.phone.replace(/[^0-9]/g, '');
  const passwordHash = hashPassword(data.password);

  const existing = await queryOne<{ id: number }>('SELECT id FROM users WHERE phone = ?', [phone]);
  if (existing) {
    throw badRequest('PHONE_ALREADY_REGISTERED', 'This phone number is already registered');
  }

  const now = Math.floor(Date.now() / 1000);
  const userId = await withTransaction(async (): Promise<number> => {
    await execute(
      'INSERT INTO users (full_name, phone, password_hash, phone_verified_at, account_status, role, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?, ?, ?)',
      [data.fullName.trim(), phone, passwordHash, 'pending', 'user', now, now],
    );
    const user = await queryOne<{ id: number }>('SELECT id FROM users WHERE phone = ?', [phone]);
    if (!user) throw new Error('USER_CREATE_FAILED');
    const newUserId = user.id;

    for (const specialty of data.specialties) {
      if (typeof specialty === 'number') {
        const specialtyRow = await queryOne<{ id: number }>('SELECT id FROM specialties WHERE id = ?', [specialty]);
        if (specialtyRow) {
          await execute('INSERT INTO user_specialties (user_id, specialty_id, custom_specialty) VALUES (?, ?, NULL) ON CONFLICT DO NOTHING', [
            newUserId,
            specialtyRow.id,
          ]);
        }
        continue;
      }
      const trimmed = specialty.trim();
      if (trimmed) {
        await execute('INSERT INTO user_specialties (user_id, specialty_id, custom_specialty) VALUES (?, NULL, ?)', [newUserId, trimmed]);
      }
    }
    return newUserId;
  });

  const user = await findAuthUserById(userId);
  const code = await issueOtp(phone);
  const devCode = config.nodeEnv !== 'production' ? code : undefined;
  return { user, devCode };
}

export async function findAuthUserById(id: number): Promise<AuthUser> {
  const user = await queryOne<{ id: number; fullName: string; phone: string; accountStatus: string; role: string }>(
    'SELECT id, full_name AS fullName, phone, account_status AS accountStatus, role FROM users WHERE id = ?',
    [id],
  );
  if (!user) throw notFound('USER_NOT_FOUND', 'User not found');
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    accountStatus: user.accountStatus,
    role: user.role,
  };
}

export async function verifyPhone(phone: string, code: string): Promise<{ user: AuthUser }> {
  const normalizedPhone = phone.replace(/[^0-9]/g, '');
  const check = await verifyOtp(normalizedPhone, code);
  if (!check.ok) {
    const errorMessage =
      check.error === 'OTP_NOT_FOUND'
        ? 'Invalid verification code'
        : check.error === 'OTP_EXPIRED'
          ? 'Verification code has expired'
          : check.error === 'OTP_ALREADY_USED'
            ? 'This verification code has already been used'
            : check.error === 'OTP_MAX_ATTEMPTS'
              ? 'Too many invalid attempts'
              : 'Invalid verification code';
    throw badRequest('OTP_INVALID', errorMessage);
  }
  const user = await queryOne<{ id: number; account_status: string }>('SELECT id, account_status FROM users WHERE phone = ?', [normalizedPhone]);
  if (!user) throw badRequest('USER_NOT_FOUND', 'User not found');
  if (user.account_status === 'active') {
    throw badRequest('ACCOUNT_ALREADY_VERIFIED', 'This phone number is already verified');
  }
  const now = Math.floor(Date.now() / 1000);
  await execute('UPDATE users SET phone_verified_at = ?, account_status = ?, updated_at = ? WHERE id = ?', [now, 'active', now, user.id]);
  await execute('DELETE FROM otp_codes WHERE phone = ?', [normalizedPhone]);
  const updated = await findAuthUserById(Number(user.id));
  return { user: updated };
}

export async function resendOtp(input: unknown): Promise<{ phone: string; devCode?: string }> {
  const data = validate(resendOtpSchema, input);
  const phone = data.phone.replace(/[^0-9]/g, '');
  const user = await queryOne<{ id: number; account_status: string }>('SELECT id, account_status FROM users WHERE phone = ?', [phone]);
  if (!user) throw notFound('USER_NOT_FOUND', 'User not found');
  if (user.account_status === 'active') {
    throw badRequest('ACCOUNT_ALREADY_VERIFIED', 'This phone number is already verified');
  }
  const code = await issueOtp(phone);
  return { phone, devCode: config.nodeEnv !== 'production' ? code : undefined };
}

export async function login(input: unknown): Promise<{ token: string; user: AuthUser }> {
  const data = validate(loginSchema, input);
  const phone = data.phone.replace(/[^0-9]/g, '');
  const user = await queryOne<{
    id: number;
    full_name: string;
    phone: string;
    account_status: string;
    role: string;
    password_hash: string;
  }>('SELECT id, full_name, phone, account_status, role, password_hash FROM users WHERE phone = ?', [phone]);
  if (!user) {
    throw Object.assign(new Error('Invalid phone or password'), { statusCode: 401, code: 'INVALID_CREDENTIALS' });
  }
  const passwordOk = comparePassword(data.password, user.password_hash);
  if (!passwordOk) {
    throw Object.assign(new Error('Invalid phone or password'), { statusCode: 401, code: 'INVALID_CREDENTIALS' });
  }
  if (user.account_status !== 'active') {
    throw badRequest('ACCOUNT_NOT_VERIFIED', 'Please verify your phone number before logging in');
  }
  const token = signToken({ id: user.id, phone: user.phone, role: user.role });
  const full = await findAuthUserById(Number(user.id));
  return { token, user: full };
}

export function logout(_req: unknown): { success: true } {
  // Token is stateless (JWT); clearing happens via cookie removal on the client.
  return { success: true };
}

export async function getSessionUser(userId: number): Promise<AuthUser> {
  return findAuthUserById(userId);
}

export async function forgotPassword(input: unknown): Promise<{ phone: string; devCode?: string }> {
  const data = validate(forgotPasswordSchema, input);
  const phone = data.phone.replace(/[^0-9]/g, '');
  const user = await queryOne<{ id: number; account_status: string }>('SELECT id, account_status FROM users WHERE phone = ?', [phone]);
  if (!user) {
    // Do not reveal whether the phone is registered.
    throw badRequest('OTP_NOT_FOUND', 'Invalid verification code');
  }
  const code = await issueOtp(phone);
  return { phone, devCode: config.nodeEnv !== 'production' ? code : undefined };
}

export async function resetPassword(input: unknown): Promise<{ success: true }> {
  const data = validate(resetPasswordSchema, input);
  const phone = data.phone.replace(/[^0-9]/g, '');
  const check = await verifyOtp(phone, data.code);
  if (!check.ok) {
    const errorMessage =
      check.error === 'OTP_NOT_FOUND'
        ? 'Invalid verification code'
        : check.error === 'OTP_EXPIRED'
          ? 'Verification code has expired'
          : check.error === 'OTP_ALREADY_USED'
            ? 'This verification code has already been used'
            : check.error === 'OTP_MAX_ATTEMPTS'
              ? 'Too many invalid attempts'
              : 'Invalid verification code';
    throw badRequest('OTP_INVALID', errorMessage);
  }
  const passwordHash = hashPassword(data.newPassword);
  await execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE phone = ?', [passwordHash, Math.floor(Date.now() / 1000), phone]);
  await execute('DELETE FROM otp_codes WHERE phone = ?', [phone]);
  return { success: true };
}

export async function changePassword(userId: number, input: unknown): Promise<{ success: true }> {
  const data = validate(changePasswordSchema, input);
  const user = await queryOne<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (!user) throw notFound('USER_NOT_FOUND', 'User not found');
  const ok = comparePassword(data.currentPassword, user.password_hash);
  if (!ok) {
    throw badRequest('INVALID_PASSWORD', 'Current password is incorrect');
  }
  const passwordHash = hashPassword(data.newPassword);
  await execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [passwordHash, Math.floor(Date.now() / 1000), userId]);
  return { success: true };
}
