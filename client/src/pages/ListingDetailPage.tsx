import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  Heart,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Phone,
  Share2,
  ShieldCheck,
  ShoppingBasket,
  Star,
  Tag,
} from 'lucide-react';
import { api } from '../lib/api';
import { useCatalog } from '../lib/catalog';
import { formatDate, formatPrice, formatQuantity, listingStatusLabel, listingTypeLabel, priceTypeLabel, serviceKindLabel, timeAgo, whatsappLink } from '../lib/format';
import { SECTION_LABELS } from '../lib/sections';
import type { Listing, ListingList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { ListingImage } from '../components/ListingImage';
import { ListingCard } from '../components/ListingCard';
import { ReviewsCard } from '../components/ReviewsCard';
import { Button, buttonClass } from '../components/ui/Button';
import { Alert, ErrorState, LoadingBlock } from '../components/ui/Feedback';
import { Avatar, Badge, Card, SectionHead } from '../components/ui/Surfaces';
import { Input, Select, Textarea } from '../components/ui/Form';

export function ListingDetailPage() {
  const { id } = useParams();
  const listingId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { ids: favoriteIds, toggle: toggleFavorite } = useFavorites();
  const { unitMap, governorateMap, categoryMap } = useCatalog();

  const [listing, setListing] = useState<Listing | null>(null);
  const [related, setRelated] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [messaging, setMessaging] = useState(false);

  const [offerPrice, setOfferPrice] = useState('');
  const [offerQuantity, setOfferQuantity] = useState('');
  const [offerNotes, setOfferNotes] = useState('');
  const [offerStatus, setOfferStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [offerError, setOfferError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api<Listing>(`/listings/${listingId}`);
        if (!active) return;
        setListing(data);
        setActiveImage(0);
        setOfferQuantity(String(data.quantity));
        const relatedData = await api<ListingList>(`/listings?categoryId=${data.categoryId}&limit=3`);
        if (active) setRelated(relatedData.items.filter((item) => item.id !== data.id).slice(0, 3));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'تعذّر تحميل الإعلان.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  const isOwner = Boolean(user && listing && user.id === listing.userId);
  const unitName = listing ? unitMap.get(listing.unitId)?.name : undefined;
  const governorateName = listing?.governorateId ? governorateMap.get(listing.governorateId)?.nameAr : undefined;
  const categoryName = listing ? categoryMap.get(listing.categoryId)?.name : undefined;
  const image = listing?.images[activeImage]?.imageUrl ?? listing?.images[0]?.imageUrl ?? null;

  const phoneVisible = Boolean(listing?.owner?.contactPreferences.showPhone);
  const whatsappEnabled = Boolean(listing?.owner?.contactPreferences.whatsappEnabled);
  const messagesEnabled = listing?.owner ? Boolean(listing.owner.contactPreferences.internalMessagesEnabled) : true;

  const shareUrl = useMemo(() => (typeof window === 'undefined' ? '' : window.location.href), []);

  const requireLogin = () => {
    navigate(`/login?next=${encodeURIComponent(`/market/${listingId}`)}`);
  };

  const onFavorite = async () => {
    if (!user) {
      requireLogin();
      return;
    }
    try {
      const added = await toggleFavorite(listingId);
      showToast(added ? 'تمت إضافة الإعلان إلى المفضلة.' : 'تمت إزالة الإعلان من المفضلة.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر تحديث المفضلة.', 'error');
    }
  };

  const onMessage = async () => {
    if (!user) {
      requireLogin();
      return;
    }
    if (!listing?.owner) return;
    setMessaging(true);
    try {
      const data = await api<{ conversationId: number }>('/messages', {
        method: 'POST',
        body: { recipientId: listing.owner.id, listingId: listing.id },
      });
      navigate(`/dashboard/messages/${data.conversationId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر بدء المحادثة.', 'error');
    } finally {
      setMessaging(false);
    }
  };

  const onShare = async () => {
    const shareData = { title: listing?.title ?? 'إعلان على فُرصة', url: shareUrl };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      showToast('تم نسخ رابط الإعلان.');
    } catch {
      showToast('تعذّر مشاركة الرابط.', 'error');
    }
  };

  const reloadListing = async () => {
    try {
      const data = await api<Listing>(`/listings/${listingId}`);
      setListing(data);
    } catch {
      // keep current listing on refresh failure
    }
  };

  const submitOffer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      requireLogin();
      return;
    }
    setOfferError(null);
    setOfferStatus('sending');
    try {
      await api(`/listings/${listingId}/offers`, {
        method: 'POST',
        body: {
          proposedPrice: Number(offerPrice),
          proposedQuantity: Number(offerQuantity),
          notes: offerNotes.trim() || undefined,
        },
      });
      setOfferStatus('sent');
      showToast('تم إرسال عرضك إلى صاحب الطلب.');
    } catch (err) {
      setOfferStatus('idle');
      setOfferError(err instanceof Error ? err.message : 'تعذّر إرسال العرض.');
    }
  };

  if (loading) {
    return (
      <div className="page container">
        <LoadingBlock label="جارٍ تحميل الإعلان…" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="page container">
        <ErrorState message={error ?? 'الإعلان غير موجود.'} />
        <div className="center mt-4">
          <Link to="/market" className={buttonClass('secondary')}>
            العودة إلى السوق
          </Link>
        </div>
      </div>
    );
  }

  const canOffer = listing.listingType === 'request' && !isOwner && listing.status === 'active';

  return (
    <div className="page container">
      <nav className="row small muted mb-3" aria-label="مسار التنقل">
        <Link to="/market">السوق</Link>
        <span aria-hidden="true">/</span>
        {categoryName ? (
          <>
            <Link to={`/market?categoryId=${listing.categoryId}`}>{categoryName}</Link>
            <span aria-hidden="true">/</span>
          </>
        ) : null}
        <span>{listing.title}</span>
      </nav>

      <div className="detail-layout">
        <div className="stack">
          <div>
            <div className="gallery-main">
              <ListingImage src={image} alt={listing.title} />
            </div>
            {listing.images.length > 1 ? (
              <div className="gallery-thumbs">
                {listing.images.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={index === activeImage ? 'gallery-thumb active' : 'gallery-thumb'}
                    onClick={() => setActiveImage(index)}
                    aria-label={`الصورة ${index + 1}`}
                  >
                    <ListingImage src={item.imageUrl} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Card pad>
            <div className="between">
              <div className="row wrap">
                <Badge tone={listing.listingType}>{listingTypeLabel[listing.listingType]}</Badge>
                <Badge tone={listing.status === 'active' ? 'default' : 'muted'}>{listingStatusLabel[listing.status]}</Badge>
                {categoryName ? <Badge tone="muted">{categoryName}</Badge> : null}
              </div>
              <span className="muted small row" style={{ gap: '0.3rem' }}>
                <Clock size={14} /> {timeAgo(listing.createdAt)}
              </span>
            </div>

            <h1 className="mt-3" style={{ fontSize: 'clamp(1.4rem, 1.15rem + 1.4vw, 2rem)' }}>
              {listing.title}
            </h1>

            <div className="listing-meta mt-2" style={{ fontSize: '0.9rem' }}>
              {governorateName ? (
                <span>
                  <MapPin size={15} /> {governorateName}
                  {listing.area ? ` · ${listing.area}` : ''}
                </span>
              ) : null}
              <span>
                <Package size={15} /> {formatQuantity(listing.quantity, unitName)}
              </span>
              <span>
                <ShoppingBasket size={15} /> {listing.offerCount} عرض
              </span>
              {listing.expiresAt ? (
                <span>
                  <CalendarDays size={15} /> ينتهي {formatDate(listing.expiresAt)}
                </span>
              ) : null}
            </div>

            <hr className="divider" />

            <h2 style={{ fontSize: '1.1rem' }}>وصف الإعلان</h2>
            <p className="muted mt-2" style={{ whiteSpace: 'pre-line' }}>
              {listing.description?.trim() || 'لم يضف الناشر وصفاً تفصيلياً لهذا الإعلان. يمكنك التواصل معه للاستفسار عن التفاصيل.'}
            </p>

            <hr className="divider" />

            <div className="grid grid-2">
              <ul className="spec-list">
                <li>
                  <span className="k">نوع الإعلان</span>
                  <span className="v">{listingTypeLabel[listing.listingType]}</span>
                </li>
                <li>
                  <span className="k">الكمية المتاحة</span>
                  <span className="v">{formatQuantity(listing.quantity, unitName)}</span>
                </li>
                <li>
                  <span className="k">طريقة السعر</span>
                  <span className="v">{priceTypeLabel[listing.priceType]}</span>
                </li>
              </ul>
              <ul className="spec-list">
                <li>
                  <span className="k">الفئة</span>
                  <span className="v">{categoryName ?? '—'}</span>
                </li>
                <li>
                  <span className="k">المحافظة</span>
                  <span className="v">{governorateName ?? '—'}</span>
                </li>
                <li>
                  <span className="k">المنطقة</span>
                  <span className="v">{listing.area ?? '—'}</span>
                </li>
                {listing.section ? (
                  <li>
                    <span className="k">القسم</span>
                    <span className="v">
                      {SECTION_LABELS[listing.section] ?? listing.section}
                      {listing.section === 'other' && listing.sectionOther ? ` — ${listing.sectionOther}` : ''}
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>

            {listing.serviceMeta ? (
              <>
                <hr className="divider" />
                <h2 style={{ fontSize: '1.1rem' }}>{listing.listingType === 'service' ? 'تفاصيل الخدمة' : 'تفاصيل الطلب'}</h2>
                <div className="grid grid-2 mt-2">
                  <ul className="spec-list">
                    {listing.serviceMeta.serviceKind ? (
                      <li>
                        <span className="k">نوع {listing.listingType === 'service' ? 'الخدمة' : 'الطلب'}</span>
                        <span className="v">{serviceKindLabel[listing.serviceMeta.serviceKind] ?? listing.serviceMeta.serviceKind}</span>
                      </li>
                    ) : null}
                    {listing.serviceMeta.vehicleType ? (
                      <li>
                        <span className="k">المركبة</span>
                        <span className="v">{listing.serviceMeta.vehicleType}</span>
                      </li>
                    ) : null}
                    {listing.serviceMeta.loadCapacity ? (
                      <li>
                        <span className="k">الحمولة</span>
                        <span className="v">{listing.serviceMeta.loadCapacity}</span>
                      </li>
                    ) : null}
                  </ul>
                  <ul className="spec-list">
                    {listing.serviceMeta.serviceAreas ? (
                      <li>
                        <span className="k">مناطق الخدمة</span>
                        <span className="v">{listing.serviceMeta.serviceAreas}</span>
                      </li>
                    ) : null}
                    {listing.serviceMeta.deliveryTime ? (
                      <li>
                        <span className="k">مدة التوصيل</span>
                        <span className="v">{listing.serviceMeta.deliveryTime}</span>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </>
            ) : null}
          </Card>

          {listing.listingType === 'request' ? (
            <Card pad>
              <h2 style={{ fontSize: '1.15rem' }}>قدّم عرضك على هذا الطلب</h2>
              <p className="muted small mt-1">
                أدخل السعر والكمية المقترحة. سيصل العرض إلى صاحب الطلب ويمكنه قبوله أو التفاوض معك.
              </p>

              {offerStatus === 'sent' ? (
                <Alert kind="success" title="تم إرسال عرضك">
                  يمكنك متابعة حالة العرض من صفحة <Link to="/dashboard/offers">عروضي</Link>.
                </Alert>
              ) : !user ? (
                <Alert kind="info" title="تحتاج إلى تسجيل الدخول">
                  <Link to={`/login?next=${encodeURIComponent(`/market/${listingId}`)}`}>سجّل الدخول</Link> أو{' '}
                  <Link to="/register">أنشئ حساباً</Link> لتقديم عرض.
                </Alert>
              ) : isOwner ? (
                <Alert kind="info">هذا طلبك، ويمكنك إدارة العروض الواردة من لوحة التحكم.</Alert>
              ) : listing.status !== 'active' ? (
                <Alert kind="warning">هذا الطلب لم يعد نشطاً ولا يستقبل عروضاً جديدة.</Alert>
              ) : (
                <form className="form-grid mt-3" onSubmit={submitOffer}>
                  {offerError ? (
                    <div className="span-2">
                      <Alert kind="error">{offerError}</Alert>
                    </div>
                  ) : null}
                  <Input
                    label={`السعر المقترح للوحدة (د.أ / ${unitName ?? 'وحدة'})`}
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={offerPrice}
                    onChange={(event) => setOfferPrice(event.target.value)}
                  />
                  <Input
                    label={`الكمية (${unitName ?? 'وحدة'})`}
                    type="number"
                    min={1}
                    step="1"
                    required
                    value={offerQuantity}
                    onChange={(event) => setOfferQuantity(event.target.value)}
                  />
                  <div className="span-2">
                    <Textarea
                      label="ملاحظات (اختياري)"
                      value={offerNotes}
                      onChange={(event) => setOfferNotes(event.target.value)}
                      maxLength={1000}
                      placeholder="مثال: متوفر لدينا الكمية المطلوبة ويمكن التسليم خلال 48 ساعة."
                    />
                  </div>
                  <div className="span-2">
                    <Button type="submit" loading={offerStatus === 'sending'}>
                      إرسال العرض
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          ) : null}

          <ReviewsCard listing={listing} onUpdated={() => void reloadListing()} />
        </div>

        <aside className="stack">
          <div className="price-box">
            <div className="label">السعر</div>
            <strong>{listing.priceType === 'at_contact' ? 'عند التواصل' : formatPrice(listing.price)}</strong>
            {listing.price !== null && listing.priceType !== 'at_contact' ? (
              <small> / {unitName ?? 'وحدة'}</small>
            ) : null}
            <div className="small mt-2" style={{ color: '#d7e6d3' }}>
              {priceTypeLabel[listing.priceType]}
            </div>
          </div>

          <Card pad className="owner-card">
            <div className="row">
              <Avatar name={listing.owner?.fullName ?? 'مستخدم'} size="lg" />
              <div className="grow">
                <div className="strong">{listing.owner?.businessName || listing.owner?.fullName || 'ناشر الإعلان'}</div>
                <div className="small muted">{listing.owner?.fullName}</div>
                <div className="row small muted mt-1" style={{ gap: '0.35rem' }}>
                  <BadgeCheck size={14} /> حساب موثّق
                </div>
                {listing.owner && listing.owner.ratingCount > 0 ? (
                  <div className="row small mt-1" style={{ gap: '0.3rem', color: 'var(--gold, #b8860b)' }}>
                    <Star size={14} fill="currentColor" />
                    <strong>{listing.owner.ratingAvg}</strong>
                    <span className="muted">({listing.owner.ratingCount} تقييم)</span>
                  </div>
                ) : null}
              </div>
            </div>

            {listing.owner?.specialties.length ? (
              <div className="chip-row">
                {listing.owner.specialties.map((specialty, index) => (
                  <span key={`${specialty.id ?? 'custom'}-${index}`} className="chip">
                    {specialty.name ?? specialty.customSpecialty}
                  </span>
                ))}
              </div>
            ) : null}

            {listing.owner?.area || governorateName ? (
              <div className="small muted row" style={{ gap: '0.35rem' }}>
                <MapPin size={14} /> {governorateName}
                {listing.owner?.area ? ` · ${listing.owner.area}` : ''}
              </div>
            ) : null}

            <div className="owner-actions">
              {isOwner ? (
                <>
                  <Alert kind="info">هذا إعلانك — يمكنك تعديله أو تغيير حالته من إعلاناتي.</Alert>
                  <Link to={`/dashboard/listings/${listing.id}/edit`} className={buttonClass('secondary')}>
                    <Pencil size={16} /> تعديل الإعلان
                  </Link>
                  <Link to="/dashboard/listings" className={buttonClass('ghost')}>
                    إدارة إعلاناتي
                  </Link>
                </>
              ) : (
                <>
                  {messagesEnabled ? (
                    <Button onClick={onMessage} loading={messaging} icon={<MessageSquare size={16} />}>
                      راسل الناشر
                    </Button>
                  ) : null}
                  {phoneVisible && listing.owner?.phone ? (
                    <a href={`tel:${listing.owner.phone}`} className={buttonClass('secondary')}>
                      <Phone size={16} /> {listing.owner.phone}
                    </a>
                  ) : (
                    <div className="small muted">
                      <ShieldCheck size={14} /> رقم الهاتف مخفي حسب إعدادات الناشر. استخدم الرسائل الداخلية.
                    </div>
                  )}
                  {whatsappEnabled && listing.owner?.phone ? (
                    <a
                      href={whatsappLink(
                        listing.owner.phone,
                        `مرحباً، تواصلت معك عبر منصة فُرصة بخصوص إعلان «${listing.title}».`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClass('gold')}
                    >
                      واتساب
                    </a>
                  ) : null}
                </>
              )}
              <Button variant="secondary" onClick={onFavorite} icon={<Heart size={16} fill={favoriteIds.has(listing.id) ? 'currentColor' : 'none'} />}>
                {favoriteIds.has(listing.id) ? 'في المفضلة' : 'أضف للمفضلة'}
              </Button>
              <Button variant="ghost" onClick={onShare} icon={<Share2 size={16} />}>
                مشاركة الإعلان
              </Button>
            </div>
          </Card>

          <Card pad>
            <h3 className="row" style={{ gap: '0.4rem' }}>
              <Tag size={18} /> نصائح للتعامل الآمن
            </h3>
            <ul className="small muted" style={{ paddingInlineStart: '1.1rem', margin: '0.5rem 0 0', display: 'grid', gap: '0.35rem' }}>
              <li>تواصل عبر المنصة واحتفظ بسجل المحادثات.</li>
              <li>تحقق من جودة المنتج قبل إتمام الدفع.</li>
              <li>لا تشارك بياناتك البنكية مع أي طرف.</li>
            </ul>
          </Card>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="section" aria-labelledby="related-title">
          <SectionHead title="إعلانات مشابهة" />
          <h2 id="related-title" className="sr-only">
            إعلانات مشابهة
          </h2>
          <div className="grid grid-3">
            {related.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                unitName={unitMap.get(item.unitId)?.name}
                governorateName={item.governorateId ? governorateMap.get(item.governorateId)?.nameAr : undefined}
                categoryName={categoryMap.get(item.categoryId)?.name}
                isFavorite={favoriteIds.has(item.id)}
                onToggleFavorite={user ? (listingIdValue) => void toggleFavorite(listingIdValue) : undefined}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-4">
        <Link to="/market" className="row small" style={{ gap: '0.35rem' }}>
          <ArrowRight size={15} /> العودة إلى السوق
        </Link>
      </div>
    </div>
  );
}
