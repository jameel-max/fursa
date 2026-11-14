import { getDb, query, queryOne, execute } from '../../db';
import { badRequest, notFound } from '../../lib/ApiError';
import { validate } from '../../lib/validate';
import { updateSchema, updateContactPreferencesSchema } from './users.schemas';

export async function getUserById(userId: number) {
  const user = await queryOne<{
    id: number;
    full_name: string;
    phone: string;
    account_status: string;
    role: string;
    created_at: number;
  }>('SELECT id, full_name, phone, account_status, role, created_at FROM users WHERE id = ?', [userId]);
  if (!user) throw notFound('USER_NOT_FOUND', 'User not found');
  const profile = await queryOne<{
    business_name: string;
    description: string;
    governorate_id: number;
    area: string;
  }>('SELECT business_name, description, governorate_id, area FROM user_profiles WHERE user_id = ?', [userId]);
  const specialties = await query<{ id: number; name: string; custom_specialty: string | null }>(
    `SELECT s.id AS id, s.name AS name, us.custom_specialty AS custom_specialty FROM user_specialties us LEFT JOIN specialties s ON s.id = us.specialty_id WHERE us.user_id = ?`,
    [userId],
  );
  const contactPrefs = await queryOne<{
    show_phone: number;
    whatsapp_enabled: number;
    internal_messages_enabled: number;
  }>('SELECT show_phone, whatsapp_enabled, internal_messages_enabled FROM contact_preferences WHERE user_id = ?', [userId]);
  return {
    user: {
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      accountStatus: user.account_status,
      role: user.role,
      createdAt: user.created_at,
    },
    profile: profile
      ? {
          businessName: profile.business_name,
          description: profile.description,
          governorateId: profile.governorate_id,
          area: profile.area,
        }
      : null,
    specialties: specialties.map((row) => ({
      id: row.id,
      name: row.name,
      customSpecialty: row.custom_specialty,
    })),
    contactPreferences: contactPrefs ?? { showPhone: 0, whatsappEnabled: 0, internalMessagesEnabled: 1 },
  };
}

export async function getProfileWithUser(userId: number) {
  const db = getDb();
  const full = await queryOne<{
    full_name: string;
    phone: string;
    account_status: string;
    role: string;
    created_at: number;
  }>('SELECT full_name, phone, account_status, role, created_at FROM users WHERE id = ?', [userId]);
  const profile = await queryOne<{
    business_name: string;
    description: string;
    governorate_id: number;
    area: string;
  }>('SELECT business_name, description, governorate_id, area FROM user_profiles WHERE user_id = ?', [userId]);
  const specialties = await query<{ id: number; name: string; custom_specialty: string | null }>(
    `SELECT s.id AS id, s.name AS name, us.custom_specialty AS custom_specialty FROM user_specialties us LEFT JOIN specialties s ON s.id = us.specialty_id WHERE us.user_id = ?`,
    [userId],
  );
  const contactPrefs = await queryOne<{
    show_phone: number;
    whatsapp_enabled: number;
    internal_messages_enabled: number;
  }>('SELECT show_phone, whatsapp_enabled, internal_messages_enabled FROM contact_preferences WHERE user_id = ?', [userId]);
  return {
    id: userId,
    fullName: full?.full_name ?? '',
    phone: full?.phone ?? '',
    accountStatus: full?.account_status ?? 'pending',
    role: full?.role ?? 'user',
    createdAt: full?.created_at ?? 0,
    profile: profile
      ? {
          businessName: profile.business_name,
          description: profile.description,
          governorateId: profile.governorate_id,
          area: profile.area,
        }
      : null,
    specialties: specialties.map((row) => ({
      id: row.id,
      name: row.name,
      customSpecialty: row.custom_specialty,
    })),
    contactPreferences: contactPrefs ?? { showPhone: 0, whatsappEnabled: 0, internalMessagesEnabled: 1 },
  };
}

export async function updateMe(userId: number, input: unknown) {
  const data = validate(updateSchema, input);
  const db = getDb();
  await db.prepare(
    `UPDATE users SET full_name = ?, updated_at = ? WHERE id = ?`,
  ).run(data.fullName.trim(), Math.floor(Date.now() / 1000), userId);
  await db.prepare(
    `INSERT INTO user_profiles (user_id, business_name, description, governorate_id, area, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       business_name = excluded.business_name,
       description = excluded.description,
       governorate_id = excluded.governorate_id,
       area = excluded.area,
       updated_at = excluded.updated_at`,
  ).run(
    userId,
    data.businessName?.trim() || null,
    data.description?.trim() || null,
    data.governorateId ?? null,
    data.area?.trim() || null,
    Math.floor(Date.now() / 1000),
  );
  if (data.specialties) {
    await execute('DELETE FROM user_specialties WHERE user_id = ?', [userId]);
    for (const specialty of data.specialties) {
      if (typeof specialty === 'number') {
        const row = await queryOne<{ id: number }>('SELECT id FROM specialties WHERE id = ?', [specialty]);
        if (row) await execute('INSERT INTO user_specialties (user_id, specialty_id, custom_specialty) VALUES (?, ?, NULL)', [userId, row.id]);
      } else {
        const trimmed = specialty.trim();
        if (trimmed) await execute('INSERT INTO user_specialties (user_id, specialty_id, custom_specialty) VALUES (?, NULL, ?)', [userId, trimmed]);
      }
    }
  }
  return { success: true };
}

export async function updateContactPreferences(userId: number, input: unknown) {
  const data = validate(updateContactPreferencesSchema, input);
  const db = getDb();
  await db.prepare(
    `INSERT INTO contact_preferences (user_id, show_phone, whatsapp_enabled, internal_messages_enabled, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       show_phone = excluded.show_phone,
       whatsapp_enabled = excluded.whatsapp_enabled,
       internal_messages_enabled = excluded.internal_messages_enabled,
       updated_at = excluded.updated_at`,
  ).run(userId, data.showPhone ? 1 : 0, data.whatsappEnabled ? 1 : 0, data.internalMessagesEnabled ? 1 : 0, Math.floor(Date.now() / 1000));
  return { success: true };
}
