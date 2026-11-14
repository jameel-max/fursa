import '../server/src/config';
import { execute, query, queryOne } from '../server/src/db';
import { hashPassword } from '../server/src/lib/password';

const nowSeconds = () => Math.floor(Date.now() / 1000);

// deterministic PRNG so re-runs produce the same data
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20250117);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

const IMAGES = [
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
];

const GOVERNORATES = [
  'عمان', 'إربد', 'الزرقاء', 'البلقاء', 'المفرق', 'جرش', 'عجلون', 'مادبا', 'الكرك', 'معان', 'الطفيلة', 'العقبة',
];
const SELLERS = [
  { name: 'مزرعة النخيل الحديثة', phone: '0790000101', gov: 'إربد', area: 'وادي العرب', specialty: 'مزارع', desc: 'مزرعة متخصصة بالخضروات والفواكه الطازجة في وادي العرب.' },
  { name: 'شركة الوادي للتجارة الزراعية', phone: '0790000102', gov: 'عمان', area: 'سوق الجملة', specialty: 'تاجر جملة', desc: 'تجارة جملة للمنتجات الزراعية مع شبكة توزيع على كل المحافظات.' },
  { name: 'مزرعة السرو الدافئة', phone: '0790000103', gov: 'الزرقاء', area: 'الزرقاء الجديدة', specialty: 'مزارع', desc: 'إنتاج محاصيل حقلية وخضروات موسمية بجودة عالية.' },
  { name: 'محطة دير علا الزراعية', phone: '0790000104', gov: 'البلقاء', area: 'دير علا', specialty: 'مزارع', desc: 'مزرعة في السهول الشمالية تنتج البطاطا والبصل والخضروات.' },
  { name: 'تجار السوق المركزي', phone: '0790000105', gov: 'عمان', area: 'وسط البلد', specialty: 'تاجر تجزئة', desc: 'تجزئة منتجات زراعية طازجة يومياً للسوق المحلي.' },
  { name: 'موردو المزرعة', phone: '0790000106', gov: 'الزرقاء', area: 'الزرقاء', specialty: 'مورد مستلزمات زراعية', desc: 'توريد أسمدة ومبيدات وبذور ومعدات لكل المزارعين.' },
  { name: 'نقليات الجزيرة', phone: '0790000107', gov: 'المفرق', area: 'المفرق', specialty: 'شركة نقل', desc: 'نقل محاصيل ومستلزمات زراعية بشاحنات مبردة ومفتوحة.' },
  { name: 'مصنع الوفرة للتعبئة', phone: '0790000108', gov: 'عمان', area: 'ماركا', specialty: 'مصنع تعبئة وتوضيب', desc: 'تعبئة وتوضيب وتجميد للخضروات والفواكه للمنشآت والمستهلك.' },
  { name: 'مزرعة الكرك الزراعية', phone: '0790000109', gov: 'الكرك', area: 'المدورة', specialty: 'مزارع', desc: 'مزارع في جنوب المملكة للإنتاج الموسمي.' },
  { name: 'وسيط الخير للتسويق', phone: '0790000110', gov: 'عجلون', area: 'عجلون', specialty: 'وسيط تجاري', desc: 'ربط المزارعين بالمشترين والتجار بخدمات تسويق متكاملة.' },
];

// per-parent pricing rules: [unitName, unitAbbr, minPrice, maxPrice, qtyMin, qtyMax]
const PARENT_RULES: Record<string, { unit: string; unitAbbr: string; min: number; max: number; qtyMin: number; qtyMax: number }> = {
  'الخضروات': { unit: 'كيلوغرام', unitAbbr: 'كغ', min: 0.25, max: 1.6, qtyMin: 500, qtyMax: 20000 },
  'الفواكه': { unit: 'كيلوغرام', unitAbbr: 'كغ', min: 0.5, max: 4.5, qtyMin: 300, qtyMax: 15000 },
  'الحمضيات': { unit: 'كيلوغرام', unitAbbr: 'كغ', min: 0.4, max: 2.2, qtyMin: 1000, qtyMax: 30000 },
  'المحاصيل الحقلية': { unit: 'طن', unitAbbr: 'طن', min: 280, max: 850, qtyMin: 5, qtyMax: 200 },
  'البقوليات': { unit: 'كيلوغرام', unitAbbr: 'كغ', min: 0.8, max: 3.5, qtyMin: 500, qtyMax: 20000 },
  'الأعشاب والنباتات العطرية': { unit: 'كيلوغرام', unitAbbr: 'كغ', min: 1, max: 7, qtyMin: 50, qtyMax: 5000 },
  'الألبان والأجبان': { unit: 'كيلوغرام', unitAbbr: 'كغ', min: 0.4, max: 2.5, qtyMin: 100, qtyMax: 10000 },
  'اللحوم والدواجن': { unit: 'كيلوغرام', unitAbbr: 'كغ', min: 2.5, max: 9, qtyMin: 50, qtyMax: 3000 },
  'الأسماك والمأكولات البحرية': { unit: 'كيلوغرام', unitAbbr: 'كغ', min: 2, max: 8, qtyMin: 50, qtyMax: 3000 },
  'معلبات ومصنعات غذائية': { unit: 'وحدة', unitAbbr: 'و', min: 0.3, max: 6, qtyMin: 100, qtyMax: 20000 },
  'مستلزمات زراعية': { unit: 'وحدة', unitAbbr: 'و', min: 2, max: 400, qtyMin: 10, qtyMax: 5000 },
};

const QUALITY = ['درجة أولى', 'طازج', 'بلدي', 'ممتاز', 'سعر الجملة', 'موسم جديد', 'للتصدير', 'للبيع'];

async function ensureUser(s: (typeof SELLERS)[number]): Promise<number> {
  const existing = await queryOne<{ id: number }>('SELECT id FROM users WHERE phone = ?', [s.phone]);
  if (existing) return existing.id;
  const now = nowSeconds();
  await execute(
    'INSERT INTO users (full_name, phone, password_hash, phone_verified_at, account_status, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [s.name, s.phone, hashPassword('FURSA123'), now, 'active', 'user', now, now],
  );
  const id = Number((await queryOne<{ id: number }>('SELECT id FROM users WHERE phone = ?', [s.phone]))?.id);
  const gov = await queryOne<{ id: number }>('SELECT id FROM governorates WHERE name_ar = ?', [s.gov]);
  await execute(
    'INSERT INTO user_profiles (user_id, business_name, description, governorate_id, area, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, s.name, s.desc, gov?.id ?? null, s.area, now, now],
  );
  const spec = await queryOne<{ id: number }>('SELECT id FROM specialties WHERE name = ?', [s.specialty]);
  if (spec) {
    await execute('INSERT INTO user_specialties (user_id, specialty_id, custom_specialty) VALUES (?, ?, NULL) ON CONFLICT DO NOTHING', [id, spec.id]);
  }
  await execute(
    'INSERT INTO contact_preferences (user_id, show_phone, whatsapp_enabled, internal_messages_enabled, updated_at) VALUES (?, 1, 1, 1, ?)',
    [id, now],
  );
  return id;
}

async function main() {
  // maps
  const cats = await query<{ id: number; name: string; parent_id: number | null; parent_name: string | null }>(
    `SELECT c.id, c.name, c.parent_id, p.name AS parent_name
     FROM categories c LEFT JOIN categories p ON p.id = c.parent_id
     WHERE c.is_active = 1`,
  );
  const leaves = cats.filter((c) => c.parent_id !== null && PARENT_RULES[c.parent_name ?? '']);
  const unitRows = await query<{ id: number; name: string }>('SELECT id, name FROM units');
  const unitMap = new Map(unitRows.map((u) => [u.name, u.id]));
  const govRows = await query<{ id: number; name_ar: string }>('SELECT id, name_ar FROM governorates');
  const govMap = new Map(govRows.map((g) => [g.name_ar, g.id]));

  const sellerIds: number[] = [];
  for (const s of SELLERS) sellerIds.push(await ensureUser(s));
  const farmerSellers = [0, 2, 3, 8].map((i) => sellerIds[i]); // مزارعون
  const traderSellers = [1, 4, 9].map((i) => sellerIds[i]); // تجار/وسطاء
  const supplySeller = sellerIds[5];

  let inserted = 0;
  let skipped = 0;

  // ~85 sale offers: cycle through leaf categories
  const offerCount = 85;
  for (let i = 0; i < offerCount; i++) {
    const cat = leaves[i % leaves.length];
    const rule = PARENT_RULES[cat.parent_name!];
    const sellerIdx = cat.parent_name === 'مستلزمات زراعية' ? supplySeller : pick([...farmerSellers, ...traderSellers]);
    const seller = SELLERS[sellerIds.indexOf(sellerIdx)];
    const quality = pick(QUALITY);
    const title = `${cat.name} ${quality} - ${seller.name.split(' ')[0]}`;
    const exists = await queryOne<{ id: number }>('SELECT id FROM listings WHERE user_id = ? AND title = ?', [sellerIdx, title]);
    if (exists) { skipped++; continue; }

    const price = Math.round(between(rule.min, rule.max) * 100) / 100;
    const quantity = intBetween(rule.qtyMin, rule.qtyMax);
    const govName = seller.gov;
    const govId = govMap.get(govName);
    const unitId = unitMap.get(rule.unit);
    if (!govId || !unitId) { skipped++; continue; }
    const createdAt = nowSeconds() - intBetween(0, 14 * 24 * 3600);
    const priceType = rand() < 0.7 ? 'fixed' : 'negotiable';
    const image = IMAGES[i % IMAGES.length];

    await execute(
      `INSERT INTO listings (user_id, listing_type, title, category_id, description, quantity, unit_id, price, price_type, governorate_id, area, status, expires_at, created_at, updated_at)
       VALUES (?, 'offer', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      [
        sellerIdx,
        title,
        cat.id,
        `نوفر ${cat.name} ${quality} من إنتاج ${seller.name} في ${govName}. الكمية المتوفرة ${quantity} ${rule.unit}، والسعر ${price} د.أ للوحدة. التسليم متاح داخل ${govName} وباقي المحافظات حسب الاتفاق.`,
        quantity,
        unitId,
        price,
        priceType,
        govId,
        seller.area,
        createdAt + 30 * 24 * 3600,
        createdAt,
        createdAt,
      ],
    );
    const row = await queryOne<{ id: number }>('SELECT id FROM listings WHERE user_id = ? AND title = ?', [sellerIdx, title]);
    if (row) {
      await execute('INSERT INTO listing_images (listing_id, image_url, sort_order) VALUES (?, ?, 0)', [row.id, image]);
      inserted++;
    }
  }

  // ~10 purchase requests from traders
  const requestTitles = [
    'مطلوب بصل أصفر كميات كبيرة', 'مطلوب طماطم للتصنيع', 'مطلوب برتقال للتصنيع', 'مطلوب زيت زيتون عبوات',
    'مطلوب بقوليات متنوعة', 'مطلوب أعشاب طازجة للمطاعم', 'مطلوب لحوم مجمدة', 'مطلوب سماد مركب',
    'مطلوب باك جن شاحنات', 'مطلوب خيار للتصدير',
  ];
  for (let i = 0; i < requestTitles.length; i++) {
    const cat = leaves[(i * 7 + 3) % leaves.length];
    const sellerIdx = traderSellers[i % traderSellers.length];
    const title = requestTitles[i];
    const exists = await queryOne<{ id: number }>('SELECT id FROM listings WHERE user_id = ? AND title = ?', [sellerIdx, title]);
    if (exists) { skipped++; continue; }
    const rule = PARENT_RULES[cat.parent_name!];
    const quantity = intBetween(Math.max(1, Math.floor(rule.qtyMin / 10)), Math.max(2, Math.floor(rule.qtyMax / 10)));
    const govId = govMap.get(SELLERS[sellerIds.indexOf(sellerIdx)].gov);
    const unitId = unitMap.get(rule.unit);
    if (!govId || !unitId) { skipped++; continue; }
    const price = Math.round(between(rule.min, rule.max) * 100) / 100;
    const createdAt = nowSeconds() - intBetween(0, 10 * 24 * 3600);
    await execute(
      `INSERT INTO listings (user_id, listing_type, title, category_id, description, quantity, unit_id, price, price_type, governorate_id, area, status, expires_at, created_at, updated_at)
       VALUES (?, 'request', ?, ?, ?, ?, ?, ?, 'negotiable', ?, ?, 'active', ?, ?, ?)`,
      [
        sellerIdx,
        title,
        cat.id,
        `نبحث عن ${cat.name} بكميات مناسبة مع إمكانية التعاقد الدوري. التسليم في ${SELLERS[sellerIds.indexOf(sellerIdx)].gov} أو الترتيب للشحن.`,
        quantity,
        unitId,
        price,
        govId,
        SELLERS[sellerIds.indexOf(sellerIdx)].area,
        createdAt + 30 * 24 * 3600,
        createdAt,
        createdAt,
      ],
    );
    const row = await queryOne<{ id: number }>('SELECT id FROM listings WHERE user_id = ? AND title = ?', [sellerIdx, title]);
    if (row) {
      await execute('INSERT INTO listing_images (listing_id, image_url, sort_order) VALUES (?, ?, 0)', [row.id, IMAGES[(i + 5) % IMAGES.length]]);
      inserted++;
    }
  }

  // ~5 service listings
  const services = [
    { title: 'خدمة نقل محاصيل ومستلزمات زراعية', cat: 'نقل محاصيل', unit: 'وحدة', price: 150 },
    { title: 'خدمات تعبئة وتوضيب وتجميد', cat: 'خدمات تعبئة وتوضيب', unit: 'وحدة', price: null },
    { title: 'استشارات زراعية وإدارة مزارع', cat: 'استشارات زراعية', unit: 'وحدة', price: 75 },
    { title: 'خدمات حصاد يدوي وميكانيكي', cat: 'خدمات حصاد', unit: 'طن', price: 60 },
    { title: 'تسويق محاصيل نيابة عن المزارعين', cat: 'تسويق محاصيل', unit: 'وحدة', price: null },
  ];
  for (let i = 0; i < services.length; i++) {
    const svc = services[i];
    const sellerIdx = i === 0 ? sellerIds[6] : i === 1 ? sellerIds[7] : sellerIds[9];
    const exists = await queryOne<{ id: number }>('SELECT id FROM listings WHERE user_id = ? AND title = ?', [sellerIdx, svc.title]);
    if (exists) { skipped++; continue; }
    const cat = await queryOne<{ id: number }>('SELECT id FROM categories WHERE name = ?', [svc.cat]);
    const govId = govMap.get(SELLERS[sellerIds.indexOf(sellerIdx)].gov);
    const unitId = unitMap.get(svc.unit);
    if (!cat || !govId || !unitId) { skipped++; continue; }
    const createdAt = nowSeconds() - intBetween(0, 7 * 24 * 3600);
    await execute(
      `INSERT INTO listings (user_id, listing_type, title, category_id, description, quantity, unit_id, price, price_type, governorate_id, area, status, expires_at, created_at, updated_at)
       VALUES (?, 'service', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      [
        sellerIdx,
        svc.title,
        cat.id,
        `${svc.title} — فريق متخصص يعمل على مدار الساعة. تواصل معنا لتفاصيل الخدمة والتسعير حسب الكمية والمسافة.`,
        1,
        unitId,
        svc.price,
        svc.price === null ? 'at_contact' : 'fixed',
        govId,
        SELLERS[sellerIds.indexOf(sellerIdx)].area,
        createdAt + 30 * 24 * 3600,
        createdAt,
        createdAt,
      ],
    );
    inserted++;
  }

  console.log(`Done: ${inserted} listings inserted, ${skipped} skipped (already existed).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
