import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Handshake,
  Leaf,
  MapPin,
  Search,
  Shapes,
  ShieldCheck,
  Sprout,
  Users,
  Wallet,
} from 'lucide-react';
import { api } from '../lib/api';
import { useCatalog, flattenCategories, SPECIALTY_ICONS } from '../lib/catalog';
import type { AdBanner, Listing, ListingList, Plan } from '../types';
import { ListingCard } from '../components/ListingCard';
import { FeaturedHero } from '../components/FeaturedHero';
import { BannerCarousel } from '../components/BannerCarousel';
import { buttonClass } from '../components/ui/Button';
import { Alert, CardsSkeleton, EmptyState } from '../components/ui/Feedback';
import { SectionHead } from '../components/ui/Surfaces';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { formatPrice, formatNumber } from '../lib/format';

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ids: favoriteIds, toggle: toggleFavorite } = useFavorites();
  const { categories, units, governorates, specialties, unitMap, governorateMap, categoryMap } = useCatalog();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [requests, setRequests] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [latest, requestList, plansData, featured, adsData] = await Promise.all([
          api<ListingList>('/listings?limit=6&sort=newest'),
          api<ListingList>('/listings?listingType=request&limit=3&sort=newest'),
          api<{ items: Plan[] }>('/subscriptions/plans'),
          api<ListingList>('/listings?featured=1&limit=6&sort=newest'),
          api<{ items: AdBanner[] }>('/ads'),
        ]);
        if (!active) return;
        setListings(latest.items);
        setTotal(latest.total);
        setRequests(requestList.items);
        setPlans(plansData.items);
        setFeaturedListings(featured.items);
        setAds(adsData.items);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'تعذّر تحميل بيانات السوق.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (categoryId) params.set('categoryId', categoryId);
    navigate(`/market${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const rootCategories = categories.filter((category) => category.parentId === null).slice(0, 6);
  const categoryCount = flattenCategories(categories).length;

  const searchBlock = (
    <>
      <form className="hero-search" role="search" onSubmit={onSearch}>
        <label className="sr-only" htmlFor="home-search">
          ابحث عن منتج أو خدمة
        </label>
        <input
          id="home-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="طماطم، زيت زيتون، نقل مبرد…"
        />
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="الفئة">
          <option value="">كل الفئات</option>
          {rootCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn">
          <Search size={17} /> بحث
        </button>
      </form>
      <div className="hero-chips">
        <Link to="/market?type=offer">عروض البيع</Link>
        <Link to="/market?type=request">طلبات الشراء</Link>
        <Link to="/market?type=service">الخدمات</Link>
        {rootCategories.slice(0, 2).map((category) => (
          <Link key={category.id} to={`/market?categoryId=${category.id}`}>
            {category.name}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <div>
      <section className={ads.length > 0 ? 'hero hero-plain' : 'hero'}>
        {ads.length > 0 ? (
          <BannerCarousel ads={ads} />
        ) : (
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', borderColor: 'rgba(255,255,255,0.22)' }}>
              <Sprout size={15} /> سوق زراعي أردني موثوق
            </span>
            <h1 className="mt-3">من الحقل إلى السوق، بثقة ووضوح.</h1>
            <p>
              اعرض محاصيلك، أو ابحث عن طلبات شراء وخدمات نقل ومستلزمات زراعية. منصة واحدة تجمع المزارعين والتجار
              ومقدمي الخدمات في الأردن.
            </p>
{searchBlock}
          </div>

          <div className="hero-card">
            {featuredListings.length > 0 ? (
              <FeaturedHero listings={featuredListings} />
            ) : (
              <div className="row" style={{ gap: '0.6rem' }}>
                <span className="tile-icon" aria-hidden="true">
                  <BadgeCheck size={22} />
                </span>
                <div>
                  <h3>سوق حقيقي، بيانات حقيقية</h3>
                  <p className="muted small">كل إعلان مرتبط بحساب موثّق وبيانات واضحة.</p>
                </div>
              </div>
            )}
            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{loading ? '…' : formatNumber(total)}</strong>
                <span>إعلان نشط</span>
              </div>
              <div className="hero-stat">
                <strong>{governorates.length || 12}</strong>
                <span>محافظة</span>
              </div>
              <div className="hero-stat">
                <strong>{categoryCount || '—'}</strong>
                <span>فئة زراعية</span>
              </div>
            </div>
            <div className="stack-sm mt-4">
              <div className="row" style={{ gap: '0.5rem', color: 'var(--ink-soft)' }}>
                <ShieldCheck size={17} /> حسابات موثّقة برقم هاتف
              </div>
              <div className="row" style={{ gap: '0.5rem', color: 'var(--ink-soft)' }}>
                <Handshake size={17} /> عروض وتفاوض مباشر
              </div>
              <div className="row" style={{ gap: '0.5rem', color: 'var(--ink-soft)' }}>
                <MapPin size={17} /> تغطية جميع المحافظات
              </div>
            </div>
            <Link to={user ? '/dashboard/listings/new' : '/register'} className={buttonClass('primary', 'md', 'btn-block mt-3')}>
              {user ? 'أضف إعلانك الأول' : 'ابدأ الآن مجاناً'} <ArrowLeft size={16} />
            </Link>
          </div>
        </div>
        )}
      </section>

      {ads.length > 0 ? (
        <section className="search-strip" aria-label="البحث في السوق">
          <div className="container">{searchBlock}</div>
        </section>
      ) : null}

      <div className="container">
        <section className="section" aria-labelledby="specialties-title">
          <SectionHead
            title="تصفح حسب التخصص"
            description="اختر المجال الأقرب لاحتياجك للوصول بسرعة إلى الإعلانات والطلبات المناسبة."
            action={
              <Link to="/market" className="btn btn-sm btn-secondary">
                كل الإعلانات
              </Link>
            }
          />
          <div className="grid grid-3" id="specialties-title">
            {specialties.length === 0
              ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton" style={{ height: 74 }} />)
              : specialties.filter((s) => s.isActive).map((specialty) => {
                  const Icon = SPECIALTY_ICONS[specialty.icon ?? ''] ?? Shapes;
                  return (
                    <Link key={specialty.id} to={`/market?specialtyId=${specialty.id}`} className="tile">
                      <span className="tile-icon" aria-hidden="true">
                        <Icon size={20} />
                      </span>
                      <span className="grow">
                        {specialty.name}
                        {specialty.description ? (
                          <span className="field-hint" style={{ display: 'block', fontWeight: 500 }}>
                            {specialty.description}
                          </span>
                        ) : null}
                      </span>
                      <ArrowLeft size={16} className="muted" aria-hidden="true" />
                    </Link>
                  );
                })}
          </div>
        </section>

        <section className="section" aria-labelledby="latest-title">
          <SectionHead
            title="أحدث الإعلانات"
            description="عروض وطلبات أضيفت مؤخراً من مستخدمي المنصة."
            action={
              <Link to="/market" className="btn btn-sm btn-secondary">
                عرض السوق
              </Link>
            }
          />
          <h2 id="latest-title" className="sr-only">
            أحدث الإعلانات
          </h2>
          {error ? <Alert kind="error">{error}</Alert> : null}
          {loading ? (
            <CardsSkeleton count={6} />
          ) : listings.length === 0 ? (
            <EmptyState
              icon={<Leaf size={26} />}
              title="لا توجد إعلانات بعد"
              description="كن أول من ينشر عرضاً أو طلباً زراعياً على المنصة."
              action={
                <Link to={user ? '/dashboard/listings/new' : '/register'} className={buttonClass()}>
                  أضف إعلاناً
                </Link>
              }
            />
          ) : (
            <div className="grid grid-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  unitName={unitMap.get(listing.unitId)?.name}
                  governorateName={listing.governorateId ? governorateMap.get(listing.governorateId)?.nameAr : undefined}
                  categoryName={categoryMap.get(listing.categoryId)?.name}
                  isFavorite={favoriteIds.has(listing.id)}
                  onToggleFavorite={user ? (id) => void toggleFavorite(id) : undefined}
                />
              ))}
            </div>
          )}
        </section>

        <section className="section" aria-labelledby="requests-title">
          <SectionHead
            title="طلبات شراء مفتوحة"
            description="تجار يبحثون عن منتجات محددة — قدّم عرضك مباشرة."
            action={
              <Link to="/market?type=request" className="btn btn-sm btn-secondary">
                كل الطلبات
              </Link>
            }
          />
          <h2 id="requests-title" className="sr-only">
            طلبات شراء مفتوحة
          </h2>
          {loading ? (
            <CardsSkeleton count={3} />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<Handshake size={26} />}
              title="لا توجد طلبات شراء حالياً"
              description="أنشئ طلب شراء وسيصل إلى المزارعين والتجار في المنصة."
              action={
                <Link to={user ? '/dashboard/listings/new?type=request' : '/register'} className={buttonClass('secondary')}>
                  أنشئ طلب شراء
                </Link>
              }
            />
          ) : (
            <div className="grid grid-3">
              {requests.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  unitName={unitMap.get(listing.unitId)?.name}
                  governorateName={listing.governorateId ? governorateMap.get(listing.governorateId)?.nameAr : undefined}
                  categoryName={categoryMap.get(listing.categoryId)?.name}
                  isFavorite={favoriteIds.has(listing.id)}
                  onToggleFavorite={user ? (id) => void toggleFavorite(id) : undefined}
                />
              ))}
            </div>
          )}
        </section>

        <section className="section" id="how" aria-labelledby="how-title">
          <SectionHead title="كيف تعمل فُرصة؟" description="ثلاث خطوات بسيطة من التسجيل إلى إتمام الصفقة." />
          <h2 id="how-title" className="sr-only">
            كيف تعمل فُرصة؟
          </h2>
          <div className="grid grid-3">
            <div className="card card-pad stack-sm">
              <span className="tile-icon" style={{ width: 48, height: 48 }}>
                <Users size={22} />
              </span>
              <h3>1. أنشئ حسابك ووثّق رقمك</h3>
              <p className="muted small">
                سجّل باسمك ونشاطك، وأكّد رقم هاتفك برمز تحقق. الحسابات الموثّقة تبني ثقة أكبر مع بقية المستخدمين.
              </p>
            </div>
            <div className="card card-pad stack-sm">
              <span className="tile-icon" style={{ width: 48, height: 48 }}>
                <Leaf size={22} />
              </span>
              <h3>2. انشر عرضاً أو طلب شراء</h3>
              <p className="muted small">
                حدّد المنتج والكمية والوحدة والسعر والمحافظة. أضف صوراً حقيقية لزيادة فرص التواصل.
              </p>
            </div>
            <div className="card card-pad stack-sm">
              <span className="tile-icon" style={{ width: 48, height: 48 }}>
                <Handshake size={22} />
              </span>
              <h3>3. تواصل وقدّم عرضك</h3>
              <p className="muted small">
                راسل صاحب الإعلان عبر المنصة أو واتساب، وقدّم عرضاً بالسعر والكمية، ثم تابع حالة العرض حتى الإغلاق.
              </p>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="plans-title">
          <SectionHead
            title="خطط تناسب نشاطك"
            description="ابدأ مجاناً، وارتقِ إلى الخطة المهنية عند الحاجة إلى نشر أكبر."
            action={
              <Link to="/subscription" className="btn btn-sm btn-secondary">
                تفاصيل الخطط
              </Link>
            }
          />
          <h2 id="plans-title" className="sr-only">
            خطط الاشتراك
          </h2>
          <div className="grid grid-2">
            {plans.length === 0 ? (
              <>
                <div className="skeleton" style={{ height: 200 }} />
                <div className="skeleton" style={{ height: 200 }} />
              </>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className={plan.name === 'professional' ? 'plan-card featured' : 'plan-card'}>
                  <div className="between">
                    <h3>{plan.name === 'free' ? 'الخطة المجانية' : 'الخطة المهنية'}</h3>
                    {plan.name === 'professional' ? <span className="badge badge-gold">الأكثر فائدة</span> : null}
                  </div>
                  <div className="plan-price">
                    {plan.price === 0 ? 'مجاناً' : formatPrice(plan.price)}
                    {plan.price > 0 ? <small> / شهرياً</small> : null}
                  </div>
                  <ul className="plan-features">
                    <li>
                      <BadgeCheck size={16} /> حتى {plan.monthlyPostLimit} إعلاناً شهرياً
                    </li>
                    <li>
                      <Wallet size={16} /> مدة الاشتراك {plan.durationDays} يوماً
                    </li>
                    <li>
                      <Handshake size={16} /> عروض ومحادثات غير محدودة
                    </li>
                  </ul>
                  <Link to={user ? '/subscription' : '/register'} className={buttonClass(plan.name === 'professional' ? 'gold' : 'secondary', 'md', 'btn-block')}>
                    {plan.name === 'free' ? 'ابدأ مجاناً' : 'اختر الخطة'}
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
