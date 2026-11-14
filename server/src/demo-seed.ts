import { execute, queryOne } from './db';
import { hashPassword } from './lib/password';

interface DemoUser {
  fullName: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
  businessName: string;
  description: string;
  governorate: string;
  area: string;
  specialty: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    fullName: 'مدير منصة فُرصة',
    phone: '0790000000',
    password: 'Admin1234',
    role: 'admin',
    businessName: 'منصة فُرصة الزراعية',
    description: 'إدارة المنصة والتحقق من المحتوى.',
    governorate: 'عمان',
    area: 'عبدون',
    specialty: 'شركة زراعية',
  },
  {
    fullName: 'أحمد العبادي',
    phone: '0790000001',
    password: 'FURSA123',
    role: 'user',
    businessName: 'مزرعة وادي الأردن',
    description: 'مزرعة عائلية تنتج الخضروات والفواكه الطازجة منذ أكثر من 20 عاماً، ونصدّر إلى الأسواق المحلية.',
    governorate: 'إربد',
    area: 'وادي الأردن',
    specialty: 'مزارع',
  },
  {
    fullName: 'سامر الحمد',
    phone: '0790000002',
    password: 'FURSA123',
    role: 'user',
    businessName: 'شركة الأمانة للتجارة',
    description: 'تاجر جملة للمنتجات الزراعية، نشتري الكميات الكبيرة من المزارعين ونوزعها على أسواق الجملة.',
    governorate: 'عمان',
    area: 'سوق الجملة',
    specialty: 'تاجر جملة',
  },
  {
    fullName: 'خالد الزعبي',
    phone: '0790000003',
    password: 'FURSA123',
    role: 'user',
    businessName: 'النقل السريع للشحن الزراعي',
    description: 'شركة نقل مبرد متخصصة في شحن المنتجات الزراعية بين المحافظات والموانئ.',
    governorate: 'الزرقاء',
    area: 'الزرقاء الجديدة',
    specialty: 'شركة نقل',
  },
];

interface DemoListing {
  phone: string;
  listingType: 'offer' | 'request';
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  price: number | null;
  priceType: 'fixed' | 'negotiable' | 'at_contact';
  governorate: string;
  area: string;
  images: string[];
}

const DEMO_LISTINGS: DemoListing[] = [
  {
    phone: '0790000001',
    listingType: 'offer',
    title: 'طماطم طازجة - صنف هجين',
    description: 'طماطم حمراء ممتازة مقطوفة اليوم، معبأة في صناديق بلاستيكية سعة 10 كغ. متوفرة بكميات كبيرة طوال الأسبوع.',
    category: 'الخضروات',
    quantity: 5000,
    unit: 'كيلوغرام',
    price: 0.65,
    priceType: 'negotiable',
    governorate: 'إربد',
    area: 'وادي الأردن',
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1200&q=80'],
  },
  {
    phone: '0790000001',
    listingType: 'offer',
    title: 'زيت زيتون بكر ممتاز',
    description: 'زيت زيتون عصرة أولى على البارد، حموضة أقل من 0.8%، معبأ في عبوات زجاجية 5 لتر.',
    category: 'الخضروات',
    quantity: 500,
    unit: 'لتر',
    price: 7.5,
    priceType: 'fixed',
    governorate: 'إربد',
    area: 'كفر أسد',
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80'],
  },
  {
    phone: '0790000001',
    listingType: 'offer',
    title: 'بطاطا سبونتا درجة أولى',
    description: 'بطاطا مفرزة حجم وسط، مناسبة للتصدير والتجزئة. التعبئة حسب الطلب في أكياس 25 كغ.',
    category: 'الخضروات',
    quantity: 12,
    unit: 'طن',
    price: 380,
    priceType: 'negotiable',
    governorate: 'البلقاء',
    area: 'دير علا',
    images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1200&q=80'],
  },
  {
    phone: '0790000002',
    listingType: 'request',
    title: 'مطلوب 10 طن بصل أحمر',
    description: 'نبحث عن بصل أحمر جودة ممتازة للتوزيع على أسواق الجملة، مع إمكانية التعاقد الشهري. التسليم في عمان.',
    category: 'الخضروات',
    quantity: 10000,
    unit: 'كيلوغرام',
    price: 0.4,
    priceType: 'negotiable',
    governorate: 'عمان',
    area: 'سوق الجملة',
    images: ['https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=1200&q=80'],
  },
  {
    phone: '0790000002',
    listingType: 'request',
    title: 'مطلوب شحن 5 طن خضروات من إربد إلى العقبة',
    description: 'نحتاج شاحنة مبردة لنقل 5 طن خضروات من إربد إلى العقبة، التحميل صباحاً والتسليم في نفس اليوم.',
    category: 'الخضروات',
    quantity: 5,
    unit: 'طن',
    price: 180,
    priceType: 'negotiable',
    governorate: 'إربد',
    area: 'إربد',
    images: ['https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80'],
  },
  {
    phone: '0790000001',
    listingType: 'offer',
    title: 'ليمون أداليا طازج',
    description: 'ليمون أصفر سميك القشرة، مناسب للعصير والتجزئة. متوفر على مدار الأسبوع بكميات تصل إلى 3 طن.',
    category: 'الحمضيات',
    quantity: 3,
    unit: 'طن',
    price: 500,
    priceType: 'fixed',
    governorate: 'العقبة',
    area: 'وادي عربة',
    images: ['https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=1200&q=80'],
  },
  {
    phone: '0790000001',
    listingType: 'offer',
    title: 'فراولة طازجة للتصدير',
    description: 'فراولة حمراء حلوة، مقطوفة في نفس يوم التسليم، معبأة في عبوات 500 غرام.',
    category: 'الفواكه',
    quantity: 800,
    unit: 'كيلوغرام',
    price: 2.2,
    priceType: 'negotiable',
    governorate: 'البلقاء',
    area: 'دير علا',
    images: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80'],
  },
  {
    phone: '0790000002',
    listingType: 'offer',
    title: 'عنب أسود - صنف بلاك ماجيك',
    description: 'عنب أسود حبة كبيرة، مذاق حلو وخالٍ من البذور، معبأ في صناديق كرتونية 5 كغ.',
    category: 'فواكه',
    quantity: 2,
    unit: 'طن',
    price: 900,
    priceType: 'fixed',
    governorate: 'عمان',
    area: 'سحاب',
    images: ['https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=1200&q=80'],
  },
];

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function ensureUser(user: DemoUser, passwordHash: string): Promise<number> {
  const existing = await queryOne<{ id: number }>('SELECT id FROM users WHERE phone = ?', [user.phone]);
  if (existing) return existing.id;
  const now = nowSeconds();
  await execute(
    'INSERT INTO users (full_name, phone, password_hash, phone_verified_at, account_status, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [user.fullName, user.phone, passwordHash, now, 'active', user.role, now, now],
  );
  const id = Number((await queryOne<{ id: number }>('SELECT id FROM users WHERE phone = ?', [user.phone]))?.id);
  const governorate = await queryOne<{ id: number }>('SELECT id FROM governorates WHERE name_ar = ?', [user.governorate]);
  await execute(
    'INSERT INTO user_profiles (user_id, business_name, description, governorate_id, area, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, user.businessName, user.description, governorate?.id ?? null, user.area, now, now],
  );
  const specialty = await queryOne<{ id: number }>('SELECT id FROM specialties WHERE name = ?', [user.specialty]);
  if (specialty) {
    await execute('INSERT INTO user_specialties (user_id, specialty_id, custom_specialty) VALUES (?, ?, NULL) ON CONFLICT DO NOTHING', [id, specialty.id]);
  }
  await execute(
    'INSERT INTO contact_preferences (user_id, show_phone, whatsapp_enabled, internal_messages_enabled, updated_at) VALUES (?, 1, 1, 1, ?)',
    [id, now],
  );
  return id;
}

async function ensureListing(listing: DemoListing, userId: number): Promise<number | null> {
  const existing = await queryOne<{ id: number }>('SELECT id FROM listings WHERE user_id = ? AND title = ?', [userId, listing.title]);
  if (existing) return existing.id;
  const category = await queryOne<{ id: number }>('SELECT id FROM categories WHERE name = ?', [listing.category]);
  const unit = await queryOne<{ id: number }>('SELECT id FROM units WHERE name = ?', [listing.unit]);
  const governorate = await queryOne<{ id: number }>('SELECT id FROM governorates WHERE name_ar = ?', [listing.governorate]);
  if (!category || !unit || !governorate) return null;
  const now = nowSeconds();
  await execute(
    `INSERT INTO listings (user_id, listing_type, title, category_id, description, quantity, unit_id, price, price_type, governorate_id, area, status, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    [
      userId,
      listing.listingType,
      listing.title,
      category.id,
      listing.description,
      listing.quantity,
      unit.id,
      listing.price,
      listing.priceType,
      governorate.id,
      listing.area,
      now + 30 * 24 * 3600,
      now,
      now,
    ],
  );
  const id = Number((await queryOne<{ id: number }>('SELECT id FROM listings WHERE user_id = ? AND title = ?', [userId, listing.title]))?.id);
  for (const [index, url] of listing.images.entries()) {
    await execute('INSERT INTO listing_images (listing_id, image_url, sort_order) VALUES (?, ?, ?)', [id, url, index]);
  }
  return id;
}

export async function seedDemoData() {
  const userIds: Record<string, number> = {};
  for (const user of DEMO_USERS) {
    const existing = await queryOne<{ id: number }>('SELECT id FROM users WHERE phone = ?', [user.phone]);
    if (existing) {
      userIds[user.phone] = existing.id;
      continue;
    }
    const hash = hashPassword(user.password);
    userIds[user.phone] = await ensureUser(user, hash);
  }

  const listingIds: Record<string, number> = {};
  for (const listing of DEMO_LISTINGS) {
    const id = await ensureListing(listing, userIds[listing.phone]);
    if (id) listingIds[listing.title] = id;
  }

  const now = nowSeconds();
  const farmerId = userIds['0790000001'];
  const traderId = userIds['0790000002'];
  const transporterId = userIds['0790000003'];

  const onionRequestId = listingIds['مطلوب 10 طن بصل أحمر'];
  if (onionRequestId) {
    const existingOffer = await queryOne<{ id: number }>('SELECT id FROM offers WHERE listing_id = ? AND buyer_user_id = ?', [
      onionRequestId,
      farmerId,
    ]);
    if (!existingOffer) {
      await execute(
        'INSERT INTO offers (listing_id, buyer_user_id, proposed_price, proposed_quantity, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [onionRequestId, farmerId, 0.38, 10000, 'متوفر لدينا بصل أحمر جودة ممتازة، ويمكن التسليم خلال 48 ساعة.', 'negotiation', now, now],
      );
    }
  }

  const shippingRequestId = listingIds['مطلوب شحن 5 طن خضروات من إربد إلى العقبة'];
  if (shippingRequestId) {
    const existingOffer = await queryOne<{ id: number }>('SELECT id FROM offers WHERE listing_id = ? AND buyer_user_id = ?', [
      shippingRequestId,
      transporterId,
    ]);
    if (!existingOffer) {
      await execute(
        'INSERT INTO offers (listing_id, buyer_user_id, proposed_price, proposed_quantity, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [shippingRequestId, transporterId, 170, 5, 'شاحنة مبردة متاحة صباح الغد، التسليم في نفس اليوم.', 'new', now, now],
      );
    }
  }

  const first = Math.min(farmerId, traderId);
  const second = Math.max(farmerId, traderId);
  let conversationId = (await queryOne<{ id: number }>(
    'SELECT id FROM conversations WHERE participant_one_id = ? AND participant_two_id = ?',
    [first, second],
  ))?.id;
  if (!conversationId) {
    await execute('INSERT INTO conversations (participant_one_id, participant_two_id, created_at) VALUES (?, ?, ?)', [first, second, now]);
    conversationId = Number(
      (await queryOne<{ id: number }>('SELECT id FROM conversations WHERE participant_one_id = ? AND participant_two_id = ?', [
        first,
        second,
      ]))?.id,
    );
    await execute('INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, 1, ?)', [
      conversationId,
      traderId,
      'مرحباً أحمد، شفت عرض البصل الأحمر. هل الكمية متوفرة للشهر القادم؟',
      now - 3600,
    ]);
    await execute('INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, 0, ?)', [
      conversationId,
      farmerId,
      'أهلاً سامر، نعم متوفرة. أرسل لي الكمية المطلوبة ونوع التعبئة.',
      now - 1800,
    ]);
  }

  const tomatoId = listingIds['طماطم طازجة - صنف هجين'];
  if (tomatoId) {
    if (!await queryOne<{ id: number }>('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?', [traderId, tomatoId])) {
      await execute('INSERT INTO favorites (user_id, listing_id, created_at) VALUES (?, ?, ?)', [traderId, tomatoId, now]);
    }
  }

  if (!await queryOne<{ id: number }>('SELECT id FROM notifications WHERE user_id = ? AND type = ?', [traderId, 'MESSAGE_RECEIVED'])) {
    await execute(
      'INSERT INTO notifications (user_id, type, title, body, target_url, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
      [traderId, 'MESSAGE_RECEIVED', 'رسالة جديدة', 'لديك رسالة جديدة من أحمد العبادي.', `/dashboard/messages/${conversationId}`, now - 1800],
    );
  }

  const periodStart = Math.floor(now / (30 * 24 * 3600)) * (30 * 24 * 3600);
  const periodEnd = periodStart + 30 * 24 * 3600;
  const freePlan = await queryOne<{ id: number; monthly_post_limit: number }>('SELECT id, monthly_post_limit FROM plans WHERE name = ?', ['free']);
  for (const phone of ['0790000001', '0790000002', '0790000003']) {
    const userId = userIds[phone];
    const existingUsage = await queryOne<{ id: number }>('SELECT id FROM post_usage WHERE user_id = ? AND billing_period_start = ?', [
      userId,
      periodStart,
    ]);
    if (!existingUsage) {
      await execute(
        'INSERT INTO post_usage (user_id, subscription_id, billing_period_start, billing_period_end, monthly_post_limit, used_posts) VALUES (?, NULL, ?, ?, ?, ?)',
        [userId, periodStart, periodEnd, freePlan?.monthly_post_limit ?? 5, 3],
      );
    }
  }
}
