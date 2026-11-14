import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Funnel, Leaf, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { api, toQuery } from '../lib/api';
import { useCatalog, flattenCategories } from '../lib/catalog';
import { listingTypeLabel } from '../lib/format';
import { LISTING_SECTIONS } from '../lib/sections';
import type { Listing, ListingList, ListingType } from '../types';
import { ListingCard } from '../components/ListingCard';
import { Button, buttonClass } from '../components/ui/Button';
import { Alert, CardsSkeleton, EmptyState } from '../components/ui/Feedback';
import { PageHeader, Pagination } from '../components/ui/Surfaces';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

const SORT_OPTIONS = [
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'newest', label: 'الأحدث أولاً' },
  { value: 'price_low', label: 'السعر: من الأقل' },
  { value: 'price_high', label: 'السعر: من الأعلى' },
  { value: 'quantity', label: 'الكمية: الأكبر' },
];

export function MarketPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { ids: favoriteIds, toggle: toggleFavorite } = useFavorites();
  const { categories, units, governorates, specialties, unitMap, governorateMap, categoryMap } = useCatalog();

  const [draft, setDraft] = useState({
    search: searchParams.get('search') ?? '',
    listingType: searchParams.get('type') ?? '',
    categoryId: searchParams.get('categoryId') ?? '',
    governorateId: searchParams.get('governorateId') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    sort: searchParams.get('sort') ?? 'rating',
  });

  const [data, setData] = useState<ListingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = Number(searchParams.get('page') ?? '1') || 1;

  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    setDraft({
      search: searchParams.get('search') ?? '',
      listingType: searchParams.get('type') ?? '',
      categoryId: searchParams.get('categoryId') ?? '',
      governorateId: searchParams.get('governorateId') ?? '',
      minPrice: searchParams.get('minPrice') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? '',
      sort: searchParams.get('sort') ?? 'rating',
    });
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      const source = new URLSearchParams(queryString);
      const params = new URLSearchParams();
      for (const key of ['search', 'categoryId', 'specialtyId', 'section', 'governorateId', 'minPrice', 'maxPrice', 'sort', 'page']) {
        const value = source.get(key);
        if (value) params.set(key, value);
      }
      const type = source.get('type');
      if (type) params.set('listingType', type);
      const requestPath = `/listings${params.toString() ? `?${params.toString()}` : ''}`;
      try {
        const result = await api<ListingList>(requestPath, { signal: controller.signal });
        setData(result);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'تعذّر تحميل الإعلانات.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [queryString]);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (draft.search.trim()) params.set('search', draft.search.trim());
    if (draft.listingType) params.set('type', draft.listingType);
    if (draft.categoryId) params.set('categoryId', draft.categoryId);
    if (draft.governorateId) params.set('governorateId', draft.governorateId);
    if (draft.minPrice) params.set('minPrice', draft.minPrice);
    if (draft.maxPrice) params.set('maxPrice', draft.maxPrice);
    if (draft.sort && draft.sort !== 'rating') params.set('sort', draft.sort);
    const specialtyId = searchParams.get('specialtyId');
    if (specialtyId) params.set('specialtyId', specialtyId);
    const section = searchParams.get('section');
    if (section) params.set('section', section);
    setSearchParams(params);
  };

  const resetFilters = () => {
    setDraft({
      search: '',
      listingType: '',
      categoryId: '',
      governorateId: '',
      minPrice: '',
      maxPrice: '',
      sort: 'rating',
    });
    setSearchParams(new URLSearchParams());
  };

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next <= 1) params.delete('page');
    else params.set('page', String(next));
    setSearchParams(params);
  };

  const flatCategories = flattenCategories(categories);
  const activeType = searchParams.get('type');
  const activeSpecialtyId = searchParams.get('specialtyId');
  const activeSpecialty = activeSpecialtyId
    ? specialties.find((s) => String(s.id) === activeSpecialtyId)
    : undefined;
  const activeSection = searchParams.get('section');
  const activeSectionDef = activeSection
    ? LISTING_SECTIONS.find((s) => s.value === activeSection)
    : undefined;
  const hasFilters = Array.from(searchParams.keys()).some((key) => key !== 'page');
  const activeFilterCount = [
    searchParams.get('type'),
    searchParams.get('categoryId'),
    searchParams.get('specialtyId'),
    searchParams.get('section'),
    searchParams.get('governorateId'),
    searchParams.get('minPrice'),
    searchParams.get('maxPrice'),
    searchParams.get('sort') && searchParams.get('sort') !== 'rating' ? searchParams.get('sort') : '',
  ].filter(Boolean).length;

  return (
    <div className="page container">
      <PageHeader
        eyebrow={
          <span className="eyebrow">
            <Leaf size={15} /> سوق فُرصة
          </span>
        }
        title={activeType === 'request' ? 'طلبات الشراء' : activeType === 'offer' ? 'عروض البيع' : activeType === 'service' ? 'الخدمات' : 'السوق الزراعي'}
        description={
          activeType === 'request'
            ? 'طلبات شراء نشرها التجار والمصانع — ابحث عن الطلب المناسب وقدّم عرضك.'
            : activeType === 'service'
              ? 'خدمات زراعية ونقل وتعبئة معروضة من مقدمي الخدمات في الأردن.'
              : 'تصفح عروض البيع وطلبات الشراء من مختلف محافظات الأردن، وفلتر النتائج حسب احتياجك.'
        }
        actions={
          user ? (
            <Link to="/dashboard/listings/new" className={buttonClass()}>
              أضف إعلاناً
            </Link>
          ) : (
            <Link to="/register" className={buttonClass()}>
              انضم إلى السوق
            </Link>
          )
        }
      />

      <form className="filters mb-4" onSubmit={applyFilters} aria-label="تصفية الإعلانات">
        <div className="field market-search-cell">
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              id="market-search"
              className="input"
              value={draft.search}
              onChange={(event) => setDraft({ ...draft, search: event.target.value })}
              placeholder="ابحث في السوق…"
              aria-label="البحث في السوق"
            />
            <Search size={16} className="muted" style={{ position: 'absolute', insetInlineStart: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button
            type="button"
            className={filtersOpen ? 'btn btn-secondary market-filter-toggle active' : 'btn btn-secondary market-filter-toggle'}
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-label="فتح الفلاتر"
          >
            <Funnel size={16} />
            <span className="hide-sm-inline">فلترة</span>
            {activeFilterCount > 0 ? <span className="filter-count">{activeFilterCount}</span> : null}
          </button>
        </div>

        <div className={filtersOpen ? 'filters-extra' : 'filters-extra closed'}>

        <div className="field">
          <label htmlFor="market-type">نوع الإعلان</label>
          <select
            id="market-type"
            className="select"
            value={draft.listingType}
            onChange={(event) => setDraft({ ...draft, listingType: event.target.value })}
          >
            <option value="">الكل</option>
            <option value="offer">عروض بيع</option>
            <option value="request">طلبات شراء</option>
            <option value="service">خدمات</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="market-category">الفئة</label>
          <select
            id="market-category"
            className="select"
            value={draft.categoryId}
            onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}
          >
            <option value="">كل الفئات</option>
            {flatCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? '— ' : ''}
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="market-governorate">المحافظة</label>
          <select
            id="market-governorate"
            className="select"
            value={draft.governorateId}
            onChange={(event) => setDraft({ ...draft, governorateId: event.target.value })}
          >
            <option value="">كل المحافظات</option>
            {governorates.map((governorate) => (
              <option key={governorate.id} value={governorate.id}>
                {governorate.nameAr}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="market-min-price">أقل سعر (د.أ)</label>
          <input
            id="market-min-price"
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={draft.minPrice}
            onChange={(event) => setDraft({ ...draft, minPrice: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="market-max-price">أعلى سعر (د.أ)</label>
          <input
            id="market-max-price"
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={draft.maxPrice}
            onChange={(event) => setDraft({ ...draft, maxPrice: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="market-sort">الترتيب</label>
          <select
            id="market-sort"
            className="select"
            value={draft.sort}
            onChange={(event) => setDraft({ ...draft, sort: event.target.value })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filters-actions">
          <Button type="submit" icon={<SlidersHorizontal size={16} />}>
            تطبيق
          </Button>
          <Button type="button" variant="secondary" onClick={resetFilters} icon={<RotateCcw size={16} />}>
            إعادة تعيين
          </Button>
        </div>
        </div>
      </form>

      <div className="between mb-3">
        <p className="muted small">
          {loading || !data ? 'جارٍ تحميل النتائج…' : `${data.total} نتيجة — الصفحة ${data.page} من ${data.totalPages}`}
        </p>
        <span className="row" style={{ gap: '0.4rem' }}>
          {activeType ? (
            <span className="badge badge-outline">{listingTypeLabel[activeType as ListingType] ?? activeType}</span>
          ) : null}
          {activeSectionDef ? (
            <button
              type="button"
              className="badge badge-outline"
              style={{ cursor: 'pointer' }}
              title="إزالة فلتر القسم"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('section');
                params.delete('page');
                setSearchParams(params);
              }}
            >
              {activeSectionDef.label}
              {activeSection === 'other' ? ' — أخرى' : ''} ✕
            </button>
          ) : null}
          {activeSpecialty ? (
            <button
              type="button"
              className="badge badge-outline"
              style={{ cursor: 'pointer' }}
              title="إزالة فلتر التخصص"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('specialtyId');
                params.delete('page');
                setSearchParams(params);
              }}
            >
              {activeSpecialty.name} ✕
            </button>
          ) : null}
        </span>
      </div>

      {error ? (
        <Alert kind="error">{error}</Alert>
      ) : loading ? (
        <CardsSkeleton count={9} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Search size={26} />}
          title="لا توجد نتائج مطابقة"
          description={hasFilters ? 'جرّب تعديل الفلاتر أو إعادة تعيينها لعرض المزيد من الإعلانات.' : 'السوق فارغ حالياً. كن أول من ينشر إعلاناً.'}
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={resetFilters}>
                إعادة تعيين الفلاتر
              </Button>
            ) : (
              <Link to={user ? '/dashboard/listings/new' : '/register'} className={buttonClass()}>
                أضف إعلاناً
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-3">
            {data.items.map((listing: Listing) => (
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
          <Pagination page={data.page} totalPages={data.totalPages} onChange={goToPage} />
        </>
      )}
    </div>
  );
}
