import { query, queryOne, execute, execSql, loadSchemaSql, insertAndGetId } from './db';
import { seedDemoData } from './demo-seed';
import { hashPassword } from './lib/password';
import { PERMISSIONS, SPECIALTY_REGISTRY, BASE_PERMISSIONS } from './lib/permissions';

export async function seed() {
  const schema = loadSchemaSql();
  await execSql(schema);

  try {
    await execute('ALTER TABLE conversations ADD COLUMN listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL');
  } catch {
    // column already exists
  }

  try {
    await execute('ALTER TABLE listings ADD COLUMN featured INTEGER NOT NULL DEFAULT 0');
  } catch {
    // column already exists
  }

  for (const column of ['code TEXT', 'name_en TEXT', 'description TEXT', 'icon TEXT']) {
    try {
      await execute(`ALTER TABLE specialties ADD COLUMN ${column}`);
    } catch {
      // column already exists
    }
  }
  try {
    await execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_specialties_code ON specialties(code)');
  } catch {
    // index already exists
  }

  try {
    await execute('ALTER TABLE listings ADD COLUMN service_meta TEXT');
  } catch {
    // column already exists
  }

  // Reviews are per seller (reviewee), not per listing — dedupe then enforce uniqueness.
  try {
    await execute(
      `DELETE FROM reviews WHERE id NOT IN (
         SELECT MAX(id) FROM reviews GROUP BY reviewee_id, reviewer_id
       )`,
    );
    await execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_reviewee_reviewer ON reviews(reviewee_id, reviewer_id)');
  } catch {
    // dedupe/index may fail on engines without the needed syntax — non-fatal
  }

  const insertSpecialty = async (name: string) => {
    const result = await execute('INSERT INTO specialties (name, is_active) VALUES (?, 1) ON CONFLICT DO NOTHING', [name]);
    return result.lastInsertRowid;
  };
  const specialtyIds: Record<string, number> = {};
  const specialtySeeds = [
    'مزارع',
    'تاجر',
    'تاجر جملة',
    'تاجر تجزئة',
    'مصنع تعبئة وتصنيع',
    'شركة نقل',
    'مورد مستلزمات زراعية',
    'مقدم خدمات زراعية',
    'شركة زراعية',
    'وسيط تجاري',
    'مجال آخر',
  ];
  for (const name of specialtySeeds) {
    const id = await insertSpecialty(name);
    const existing = await queryOne<{ id: number }>('SELECT id FROM specialties WHERE name = ?', [name]);
    specialtyIds[name] = existing?.id ?? id;
  }

  const governorateSeeds: Array<[string, string]> = [
    ['عمان', 'Amman'],
    ['إربد', 'Irbid'],
    ['الزرقاء', 'Zarqa'],
    ['البلقاء', 'Balqa'],
    ['المفرق', 'Mafraq'],
    ['جرش', 'Jerash'],
    ['عجلون', 'Ajloun'],
    ['مادبا', 'Madaba'],
    ['الكرك', 'Karak'],
    ['معان', 'Maan'],
    ['الطفيلة', 'Tafilah'],
    ['العقبة', 'Aqaba'],
  ];
  for (const [nameAr, nameEn] of governorateSeeds) {
    await execute('INSERT INTO governorates (name_ar, name_en, is_active) VALUES (?, ?, 1) ON CONFLICT DO NOTHING', [nameAr, nameEn]);
  }

  const categoryTree: Array<[string, string[]]> = [
    ['الخضروات', ['طماطم', 'خيار بلدي', 'بصل أصفر', 'ثوم', 'بطاطا', 'جزر', 'خس', 'سبانخ', 'كوسا', 'باذنجان', 'فلفل حار', 'فلفل رومي', 'ملفوف', 'شمندر', 'لفت']],
    ['الفواكه', ['تفاح', 'إجاص', 'خوخ', 'مشمش', 'برقوق', 'عنب', 'تين', 'رمان', 'مانجو', 'فراولة', 'توت أرضي', 'بطيخ', 'شمام', 'موز', 'أناناس', 'كيوي']],
    ['الحمضيات', ['برتقال', 'ليمون بلدي', 'جريب فروت', 'يوسفي', 'نارنج']],
    ['المحاصيل الحقلية', ['قمح', 'شعير', 'ذرة', 'شوفان', 'أرز', 'برسيم', 'تبغ', 'قطن']],
    ['البقوليات', ['حمص', 'عدس', 'فول', 'فاصوليا حمراء', 'بازلاء', 'لوبيا عريضة', 'فول الصويا']],
    ['الأعشاب والنباتات العطرية', ['نعناع', 'ريحان', 'زعتر', 'إكليل الجبل', 'بقدونس', 'كزبرة خضراء', 'شبت', 'مرمية']],
    ['الألبان والأجبان', ['حليب طازج', 'لبن رايب', 'جبنة بيضاء', 'جبنة شيدر', 'جبنة قريش', 'زبادي', 'قشطة', 'سمن بلدي']],
    ['اللحوم والدواجن', ['لحم ضأن', 'لحم عجول', 'دجاج بلدي', 'ديك رومي', 'بيض', 'مرتديلا', 'سجق', 'لانشون']],
    ['الأسماك والمأكولات البحرية', ['بلطي', 'كارب', 'جمبري', 'سردين', 'تونة طازجة', 'بلح البحر']],
    ['معلبات ومصنعات غذائية', ['زيت زيتون', 'عسل سدر', 'معجون طماطم', 'مربى مشمش', 'حمص معلب', 'فول معلب', 'تونة معلبة', 'معكرونة', 'برغل', 'طحينة']],
    ['مستلزمات زراعية', ['سماد أزوتي', 'سماد مركب', 'مبيد فطري', 'مبيد حشري', 'بذور خضروات', 'شبك تظليل', 'أنابيب ري بالتنقيط', 'مقص تقليم', 'قفازات عمل', 'أوعية سقي']],
    ['خدمات زراعية', ['نقل محاصيل', 'خدمات حصاد', 'خدمات تعبئة وتوضيب', 'استشارات زراعية', 'إيجار معدات زراعية', 'تسويق محاصيل']],
  ];
  for (const [parentName, children] of categoryTree) {
    await execute('INSERT INTO categories (name, parent_id, is_active) VALUES (?, NULL, 1) ON CONFLICT DO NOTHING', [parentName]);
    const parent = await queryOne<{ id: number }>('SELECT id FROM categories WHERE name = ?', [parentName]);
    if (!parent) continue;
    for (const childName of children) {
      await execute(
        'INSERT INTO categories (name, parent_id, is_active) VALUES (?, ?, 1) ON CONFLICT DO NOTHING',
        [childName, parent.id],
      );
    }
  }

  // Specialty metadata + permission registry (idempotent)
  for (const meta of SPECIALTY_REGISTRY) {
    await execute(
      `INSERT INTO specialties (name, code, name_en, description, icon, is_active)
       VALUES (?, ?, ?, ?, ?, 1)
       ON CONFLICT(name) DO UPDATE SET code = excluded.code, name_en = excluded.name_en,
         description = excluded.description, icon = excluded.icon
       WHERE specialties.code IS NULL`,
      [meta.nameAr, meta.code, meta.nameEn, meta.description, meta.icon],
    );
  }
  for (const perm of PERMISSIONS) {
    await execute(
      `INSERT INTO permissions (code, label_ar, is_base) VALUES (?, ?, ?)
       ON CONFLICT(code) DO UPDATE SET label_ar = excluded.label_ar, is_base = excluded.is_base`,
      [perm.code, perm.labelAr, BASE_PERMISSIONS.includes(perm.code as (typeof BASE_PERMISSIONS)[number]) ? 1 : 0],
    );
  }
  for (const meta of SPECIALTY_REGISTRY) {
    for (const permCode of meta.permissions) {
      await execute(
        'INSERT INTO specialization_permissions (specialty_code, permission_code) VALUES (?, ?) ON CONFLICT DO NOTHING',
        [meta.code, permCode],
      );
    }
  }

  const unitSeeds = [
    ['كيلوغرام', 'كغ'],
    ['طن', 'طن'],
    ['صندوق', 'ص'],
    ['كرتونة', 'ك'],
    ['حبة', 'ح'],
    ['شوال', 'ش'],
    ['لتر', 'ل'],
    ['متر', 'م'],
    ['وحدة', 'و'],
  ];
  for (const [name, abbreviation] of unitSeeds) {
    await execute('INSERT INTO units (name, abbreviation) VALUES (?, ?) ON CONFLICT DO NOTHING', [name, abbreviation]);
  }

  await execute(
    'INSERT INTO plans (name, price, monthly_post_limit, duration_days, is_active) VALUES (?, ?, ?, ?, 1) ON CONFLICT DO NOTHING',
    ['free', 0, 5, 30],
  );
  await execute(
    'INSERT INTO plans (name, price, monthly_post_limit, duration_days, is_active) VALUES (?, ?, ?, ?, 1) ON CONFLICT DO NOTHING',
    ['professional', 4.97, 50, 30],
  );

  const settings: Record<string, string> = {
    free_post_limit: '5',
    professional_post_limit: '50',
    professional_price: '4.97',
    subscription_duration_days: '30',
    listing_expiry_days: '30',
  };
  const now = Math.floor(Date.now() / 1000);
  for (const [key, value] of Object.entries(settings)) {
    await execute(
      'INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      [key, value, now],
    );
  }

  if (process.env.SEED_DEMO === 'true') {
    await seedDemoData();
  }

  await ensureAdminUser();
}

async function ensureAdminUser() {
  const phone = process.env.ADMIN_PHONE || '0790000000';
  const password = process.env.ADMIN_PASSWORD || 'Admin1234';
  const existing = await queryOne<{ id: number }>('SELECT id FROM users WHERE phone = ?', [phone]);
  if (existing) return;

  const now = Math.floor(Date.now() / 1000);
  const hash = hashPassword(password);
  await execute(
    'INSERT INTO users (full_name, phone, password_hash, phone_verified_at, account_status, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['مدير منصة فُرصة', phone, hash, now, 'active', 'admin', now, now],
  );
  const id = Number((await queryOne<{ id: number }>('SELECT id FROM users WHERE phone = ?', [phone]))?.id);
  const governorate = await queryOne<{ id: number }>('SELECT id FROM governorates WHERE name_ar = ?', ['عمان']);
  await execute(
    'INSERT INTO user_profiles (user_id, business_name, description, governorate_id, area, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, 'منصة فُرصة الزراعية', 'إدارة المنصة والتحقق من المحتوى.', governorate?.id ?? null, 'عمّان', now, now],
  );
  const specialty = await queryOne<{ id: number }>('SELECT id FROM specialties WHERE name = ?', ['شركة زراعية']);
  if (specialty) {
    await execute('INSERT INTO user_specialties (user_id, specialty_id, custom_specialty) VALUES (?, ?, NULL) ON CONFLICT DO NOTHING', [id, specialty.id]);
  }
  await execute(
    'INSERT INTO contact_preferences (user_id, show_phone, whatsapp_enabled, internal_messages_enabled, updated_at) VALUES (?, 1, 1, 1, ?)',
    [id, now],
  );
}

export async function runSeed() {
  seed();
}
