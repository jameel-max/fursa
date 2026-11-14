import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Handshake,
  Leaf,
  Pause,
  Pencil,
  Play,
  PlusCircle,
  Search,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useCatalog } from '../lib/catalog';
import { useToast } from '../context/ToastContext';
import type { Listing, ListingStatus } from '../types';
import { formatPrice, formatQuantity, listingStatusLabel, listingTypeLabel, timeAgo } from '../lib/format';
import { Button, buttonClass } from '../components/ui/Button';
import { Alert, EmptyState, LoadingBlock } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/Modal';
import { Badge, Card, PageHeader, Tabs } from '../components/ui/Surfaces';
import { ListingImage } from '../components/ListingImage';

const TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'paused', label: 'موقوف' },
  { key: 'closed', label: 'مغلق' },
  { key: 'expired', label: 'منتهي' },
];

export function MyListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'all';
  const { showToast } = useToast();
  const { unitMap, governorateMap, categoryMap } = useCatalog();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [closeTarget, setCloseTarget] = useState<Listing | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: Listing[] }>('/listings/me?status=all');
      setListings(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل إعلاناتك.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: listings.length };
    for (const listing of listings) {
      result[listing.status] = (result[listing.status] ?? 0) + 1;
    }
    return result;
  }, [listings]);

  const filtered = status === 'all' ? listings : listings.filter((listing) => listing.status === status);

  const changeStatus = async (listing: Listing, nextStatus: ListingStatus) => {
    setBusyId(listing.id);
    try {
      await api(`/listings/${listing.id}/status`, { method: 'POST', body: { status: nextStatus } });
      setListings((current) =>
        current.map((item) => (item.id === listing.id ? { ...item, status: nextStatus } : item)),
      );
      showToast(nextStatus === 'active' ? 'تم إعادة تفعيل الإعلان.' : nextStatus === 'paused' ? 'تم إيقاف الإعلان مؤقتاً.' : 'تم إغلاق الإعلان.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر تحديث حالة الإعلان.', 'error');
    } finally {
      setBusyId(null);
      setCloseTarget(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="إعلاناتي"
        description="أدر عروض البيع وطلبات الشراء التي نشرتها، وحدّث حالتها أو عدّلها."
        actions={
          <Link to="/dashboard/listings/new" className={buttonClass()}>
            <PlusCircle size={16} /> إعلان جديد
          </Link>
        }
      />

      <Tabs
        items={TABS.map((tab) => ({ ...tab, count: counts[tab.key] ?? 0 }))}
        value={status}
        onChange={(key) => {
          const params = new URLSearchParams(searchParams);
          if (key === 'all') params.delete('status');
          else params.set('status', key);
          setSearchParams(params);
        }}
        label="تصفية الإعلانات حسب الحالة"
      />

      {error ? (
        <Alert kind="error">
          {error}
          <div className="mt-2">
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              إعادة المحاولة
            </Button>
          </div>
        </Alert>
      ) : loading ? (
        <LoadingBlock label="جارٍ تحميل إعلاناتك…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Leaf size={26} />}
          title={listings.length === 0 ? 'لم تنشر أي إعلان بعد' : 'لا توجد إعلانات بهذه الحالة'}
          description={
            listings.length === 0
              ? 'ابدأ بنشر عرض بيع لمحصولك أو طلب شراء لما تحتاجه، وسيظهر إعلانك في السوق.'
              : 'جرّب اختيار حالة أخرى من التبويبات أعلاه.'
          }
          action={
            listings.length === 0 ? (
              <Link to="/dashboard/listings/new" className={buttonClass()}>
                <PlusCircle size={16} /> أضف إعلانك الأول
              </Link>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('status');
                  setSearchParams(params);
                }}
              >
                عرض كل الإعلانات
              </Button>
            )
          }
        />
      ) : (
        <div className="stack">
          {filtered.map((listing) => {
            const unitName = unitMap.get(listing.unitId)?.name;
            const governorateName = listing.governorateId ? governorateMap.get(listing.governorateId)?.nameAr : undefined;
            const categoryName = listing.categoryId ? categoryMap.get(listing.categoryId)?.name : undefined;
            return (
              <Card key={listing.id} className="card-pad" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="listing-row">
                  <Link to={`/market/${listing.id}`} className="listing-row-media" aria-label={listing.title}>
                    <ListingImage src={listing.images[0]?.imageUrl} alt={listing.title} />
                  </Link>
                  <div className="grow stack-sm" style={{ padding: '1rem' }}>
                    <div className="row wrap" style={{ gap: '0.4rem' }}>
                      <Badge tone={listing.listingType}>
                        {listingTypeLabel[listing.listingType]}
                      </Badge>
                      <Badge
                        tone={
                          listing.status === 'active'
                            ? 'offer'
                            : listing.status === 'paused'
                              ? 'warning'
                              : listing.status === 'expired'
                                ? 'danger'
                                : 'muted'
                        }
                      >
                        {listingStatusLabel[listing.status]}
                      </Badge>
                      {categoryName ? <Badge tone="muted">{categoryName}</Badge> : null}
                    </div>

                    <Link to={`/market/${listing.id}`} className="listing-title" style={{ fontSize: '1.05rem' }}>
                      {listing.title}
                    </Link>

                    <div className="listing-meta">
                      {governorateName ? <span>{governorateName}{listing.area ? ` · ${listing.area}` : ''}</span> : null}
                      <span>{formatQuantity(listing.quantity, unitName)}</span>
                      <span>{formatPrice(listing.price, listing.priceType)}</span>
                      <span>{listing.offerCount} عرض</span>
                      <span>آخر تحديث {timeAgo(listing.updatedAt)}</span>
                    </div>

                    <div className="row wrap" style={{ gap: '0.45rem' }}>
                      <Link to={`/market/${listing.id}`} className={buttonClass('secondary', 'sm')}>
                        <Eye size={15} /> عرض
                      </Link>
                      <Link to={`/dashboard/listings/${listing.id}/edit`} className={buttonClass('secondary', 'sm')}>
                        <Pencil size={15} /> تعديل
                      </Link>
                      {listing.status === 'active' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={busyId === listing.id}
                          icon={<Pause size={15} />}
                          onClick={() => void changeStatus(listing, 'paused')}
                        >
                          إيقاف مؤقت
                        </Button>
                      ) : null}
                      {listing.status === 'paused' || listing.status === 'expired' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={busyId === listing.id}
                          icon={<Play size={15} />}
                          onClick={() => void changeStatus(listing, 'active')}
                        >
                          إعادة تفعيل
                        </Button>
                      ) : null}
                      {listing.listingType === 'request' && listing.offerCount > 0 ? (
                        <Link to="/dashboard/offers" className={buttonClass('secondary', 'sm')}>
                          <Handshake size={15} /> العروض ({listing.offerCount})
                        </Link>
                      ) : null}
                      {listing.status !== 'closed' ? (
                        <Button
                          variant="danger-soft"
                          size="sm"
                          icon={<XCircle size={15} />}
                          onClick={() => setCloseTarget(listing)}
                        >
                          إغلاق
                        </Button>
                      ) : (
                        <Link to="/market" className={buttonClass('ghost', 'sm')}>
                          <Search size={15} /> ابحث عن بديل
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          <div className="row wrap mt-2">
            <Link to="/market" className="small row" style={{ gap: '0.3rem' }}>
              <ArrowLeft size={14} /> العودة إلى السوق
            </Link>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(closeTarget)}
        title="إغلاق الإعلان"
        message={
          closeTarget
            ? `سيتم إغلاق «${closeTarget.title}» وإخفاؤه من السوق. يمكنك إعادة تفعيله لاحقاً من نفس الصفحة. هل تريد المتابعة؟`
            : ''
        }
        confirmLabel="إغلاق الإعلان"
        danger
        loading={busyId === closeTarget?.id}
        onConfirm={() => closeTarget && void changeStatus(closeTarget, 'closed')}
        onClose={() => setCloseTarget(null)}
      />
    </div>
  );
}
