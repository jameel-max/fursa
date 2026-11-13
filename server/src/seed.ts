import { query, queryOne, execute, execSql, loadSchemaSql, insertAndGetId } from './db';
import { seedDemoData } from './demo-seed';

export async function seed() {
  const schema = loadSchemaSql();
  await execSql(schema);

  const insertSpecialty = (name: string) => {
    const result = execute('INSERT INTO specialties (name, is_active) VALUES (?, 1) ON CONFLICT DO NOTHING', [name]);
    return Number(result.lastInsertRowid);
  };
  const specialtyIds: Record<string, number> = {};
  const specialtySeeds = [
    'مزارع',
    'تاجر',
    'تاجر جملة',
    'تاجر تجزئة',
    'مصنع تعبئة وتوضيب',
    'شركة نقل',
    'مورد مستلزمات زراعية',
    'مقدم خدمات زراعية',
    'شركة زراعية',
    'وسيط تجاري',
    'أخرى',
  ];
  for (const name of specialtySeeds) {
    const id = insertSpecialty(name);
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

  const categorySeeds = [
    'الخضروات',
    'الفواكه',
    'المحاصيل الحقلية',
    'البقوليات',
    'الأعشاب والنباتات العطرية',
    'الحمضيات',
  ];
  for (const name of categorySeeds) {
    await execute('INSERT INTO categories (name, parent_id, is_active) VALUES (?, NULL, 1) ON CONFLICT DO NOTHING', [name]);
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
}

export async function runSeed() {
  seed();
}
