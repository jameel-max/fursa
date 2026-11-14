import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Handshake,
  MessageSquare,
  RefreshCw,
  ShoppingBasket,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import type { Offer, OfferStatus } from '../types';
import {
  formatDateTime,
  formatPrice,
  formatQuantity,
  listingTypeLabel,
  offerStatusLabel,
  timeAgo,
} from '../lib/format';
import { Button, buttonClass } from '../components/ui/Button';
import { Alert, EmptyState, LoadingBlock } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/Modal';
import { Badge, Card, PageHeader, Tabs } from '../components/ui/Surfaces';

const STATUS_FILTERS: Array<{ key: 'all' | OfferStatus; label: string }> = [
  { key: 'all', label: 'كل الحالات' },
  { key: 'new', label: 'جديد' },
  { key: 'negotiation', label: 'قيد التفاوض' },
  { key: 'accepted', label: 'مقبول' },
  { key: 'rejected', label: 'مرفوض' },
  { key: 'cancelled', label: 'ملغي' },
];

interface PendingAction {
  offer: Offer;
  status: OfferStatus;
  title: string;
  message: string;
  danger?: boolean;
  confirmLabel: string;
}

export function OffersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'made' ? 'made' : 'received';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [received, setReceived] = useState<Offer[]>([]);
  const [made, setMade] = useState<Offer[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | OfferStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [receivedData, madeData] = await Promise.all([
        api<{ items: Offer[] }>('/offers/mine/received'),
        api<{ items: Offer[] }>('/offers/mine/made'),
      ]);
      setReceived(receivedData.items);
      setMade(madeData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل العروض.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const current = tab === 'received' ? received : made;

  const counts = useMemo(() => {
    const build = (items: Offer[]) => {
      const result: Record<string, number> = { all: items.length };
      for (const item of items) result[item.status] = (result[item.status] ?? 0) + 1;
      return result;
    };
    return { received: build(received), made: build(made) };
  }, [received, made]);

  const filtered = statusFilter === 'all' ? current : current.filter((offer) => offer.status === statusFilter);

  const updateOfferLocally = (offerId: number, status: OfferStatus) => {
    const update = (items: Offer[]) => items.map((item) => (item.id === offerId ? { ...item, status } : item));
    setReceived(update);
    setMade(update);
  };

  const runAction = async (action: PendingAction) => {
    setBusyId(action.offer.id);
    try {
      await api(`/offers/${action.offer.id}/status`, {
        method: 'POST',
        body: { status: action.status },
      });
      updateOfferLocally(action.offer.id, action.status);
      showToast(
        action.status === 'accepted'
          ? 'تم قبول العرض.'
          : action.status === 'rejected'
            ? 'تم رفض العرض.'
            : action.status === 'negotiation'
              ? 'تم تحويل العرض إلى قيد التفاوض.'
              : 'تم إلغاء العرض.',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر تحديث حالة العرض.', 'error');
    } finally {
      setBusyId(null);
      setPendingAction(null);
    }
  };

  const openBuyerConversation = async (offer: Offer) => {
    setBusyId(offer.id);
    try {
      const result = await api<{ conversationId: number }>('/messages', {
        method: 'POST',
        body: { recipientId: offer.buyerId, listingId: offer.listingId },
      });
      navigate(`/dashboard/messages/${result.conversationId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر بدء المحادثة.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="العروض"
        description="راجع العروض الواردة على طلبات الشراء، أو تابع العروض التي قدّمتها على طلبات الآخرين."
        actions={
          <Button variant="secondary" onClick={() => void load()} loading={loading} icon={<RefreshCw size={15} />}>
            تحديث
          </Button>
        }
      />

      <Tabs
        items={[
          { key: 'received', label: 'عروض واردة', count: received.length },
          { key: 'made', label: 'عروض قدّمتها', count: made.length },
        ]}
        value={tab}
        onChange={(key) => {
          const params = new URLSearchParams(searchParams);
          params.set('tab', key);
          setSearchParams(params);
          setStatusFilter('all');
        }}
        label="تصفية العروض حسب النوع"
      />

      <div className="chip-row">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={statusFilter === filter.key ? 'chip active' : 'chip'}
            aria-pressed={statusFilter === filter.key}
            onClick={() => setStatusFilter(filter.key)}
          >
            {filter.label}
            {counts[tab][filter.key] !== undefined ? ` (${counts[tab][filter.key]})` : ''}
          </button>
        ))}
      </div>

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
        <LoadingBlock label="جارٍ تحميل العروض…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Handshake size={26} />}
          title={current.length === 0 ? (tab === 'received' ? 'لا توجد عروض واردة' : 'لم تقدّم أي عرض بعد') : 'لا توجد عروض بهذه الحالة'}
          description={
            current.length === 0
              ? tab === 'received'
                ? 'انشر طلب شراء في السوق، وعندما يقدّم المزارعون أو التجار عروضهم ستظهر هنا.'
                : 'تصفح طلبات الشراء في السوق وقدّم عرضاً بالسعر والكمية المناسبين.'
              : 'جرّب اختيار حالة أخرى من الفلاتر أعلاه.'
          }
          action={
            current.length === 0 ? (
              <Link to={tab === 'received' ? '/dashboard/listings/new' : '/market?type=request'} className={buttonClass()}>
                {tab === 'received' ? 'نشر طلب شراء' : 'تصفح طلبات الشراء'}
              </Link>
            ) : (
              <Button variant="secondary" onClick={() => setStatusFilter('all')}>
                عرض كل الحالات
              </Button>
            )
          }
        />
      ) : (
        <div className="stack">
          {filtered.map((offer) => {
            const canOwnerAct = tab === 'received' && (offer.status === 'new' || offer.status === 'negotiation');
            const canBuyerCancel = tab === 'made' && (offer.status === 'new' || offer.status === 'negotiation');
            return (
              <Card key={offer.id} pad className="stack-sm">
                <div className="between wrap">
                  <div className="row wrap" style={{ gap: '0.4rem' }}>
                    <Badge tone={offer.listingType === 'request' ? 'request' : 'offer'}>
                      {listingTypeLabel[offer.listingType]}
                    </Badge>
                    <Badge
                      tone={
                        offer.status === 'accepted'
                          ? 'offer'
                          : offer.status === 'rejected'
                            ? 'danger'
                            : offer.status === 'negotiation'
                              ? 'gold'
                              : 'muted'
                      }
                    >
                      {offerStatusLabel[offer.status]}
                    </Badge>
                    <span className="small muted">{timeAgo(offer.createdAt)}</span>
                  </div>
                  <span className="small muted">عرض #{offer.id}</span>
                </div>

                <h3 style={{ fontSize: '1.05rem' }}>
                  <Link to={`/market/${offer.listingId}`}>{offer.listingTitle}</Link>
                </h3>

                <div className="grid grid-3">
                  <div>
                    <span className="small muted">السعر المقترح</span>
                    <div className="strong">{formatPrice(offer.proposedPrice)}</div>
                  </div>
                  <div>
                    <span className="small muted">الكمية المقترحة</span>
                    <div className="strong">{formatQuantity(offer.proposedQuantity)}</div>
                  </div>
                  <div>
                    <span className="small muted">{tab === 'received' ? 'مقدّم العرض' : 'تاريخ التقديم'}</span>
                    <div className="strong">{tab === 'received' ? offer.buyerName : formatDateTime(offer.createdAt)}</div>
                  </div>
                </div>

                {offer.notes ? (
                  <div className="notice" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink-soft)' }}>
                    <strong className="small">ملاحظات مقدّم العرض: </strong>
                    <span className="small">{offer.notes}</span>
                  </div>
                ) : null}

                <div className="row wrap">
                  <Link to={`/market/${offer.listingId}`} className={buttonClass('secondary', 'sm')}>
                    <ArrowLeft size={15} /> عرض الإعلان
                  </Link>

                  {canOwnerAct ? (
                    <>
                      <Button
                        size="sm"
                        loading={busyId === offer.id && pendingAction?.status === 'accepted'}
                        icon={<Check size={15} />}
                        onClick={() =>
                          setPendingAction({
                            offer,
                            status: 'accepted',
                            title: 'قبول العرض',
                            message: `سيتم قبول عرض ${offer.buyerName} بسعر ${formatPrice(offer.proposedPrice)}. هل تريد المتابعة؟`,
                            confirmLabel: 'قبول العرض',
                          })
                        }
                      >
                        قبول
                      </Button>
                      {offer.status === 'new' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<RefreshCw size={15} />}
                          onClick={() =>
                            setPendingAction({
                              offer,
                              status: 'negotiation',
                              title: 'فتح التفاوض',
                              message: 'سيتحول العرض إلى حالة «قيد التفاوض»، ويمكنك التواصل مع مقدّم العرض لمناقشة السعر والكمية.',
                              confirmLabel: 'بدء التفاوض',
                            })
                          }
                        >
                          تفاوض
                        </Button>
                      ) : null}
                      <Button
                        variant="danger-soft"
                        size="sm"
                        icon={<X size={15} />}
                        onClick={() =>
                          setPendingAction({
                            offer,
                            status: 'rejected',
                            title: 'رفض العرض',
                            message: `سيتم رفض عرض ${offer.buyerName}. يمكنه تقديم عرض جديد لاحقاً. هل تريد المتابعة؟`,
                            danger: true,
                            confirmLabel: 'رفض العرض',
                          })
                        }
                      >
                        رفض
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<MessageSquare size={15} />}
                        loading={busyId === offer.id && pendingAction === null}
                        onClick={() => void openBuyerConversation(offer)}
                      >
                        مراسلة مقدّم العرض
                      </Button>
                    </>
                  ) : null}

                  {canBuyerCancel ? (
                    <Button
                      variant="danger-soft"
                      size="sm"
                      icon={<X size={15} />}
                      onClick={() =>
                        setPendingAction({
                          offer,
                          status: 'cancelled',
                          title: 'إلغاء العرض',
                          message: 'سيتم إلغاء عرضك على هذا الطلب. هل تريد المتابعة؟',
                          danger: true,
                          confirmLabel: 'إلغاء العرض',
                        })
                      }
                    >
                      إلغاء العرض
                    </Button>
                  ) : null}

                  {tab === 'received' && offer.status === 'accepted' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<MessageSquare size={15} />}
                      loading={busyId === offer.id && pendingAction === null}
                      onClick={() => void openBuyerConversation(offer)}
                    >
                      تواصل مع مقدّم العرض
                    </Button>
                  ) : null}

                  {tab === 'made' && offer.status === 'accepted' ? (
                    <span className="small row" style={{ gap: '0.35rem', color: 'var(--success)' }}>
                      <Check size={15} /> تم قبول عرضك — تواصل مع صاحب الطلب عبر صفحة الإعلان.
                    </span>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="row wrap">
        <Link to={tab === 'received' ? '/market?type=request' : '/market?type=request'} className="small row" style={{ gap: '0.3rem' }}>
          <ShoppingBasket size={14} /> استكشف طلبات الشراء
        </Link>
      </div>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title ?? ''}
        message={pendingAction?.message ?? ''}
        confirmLabel={pendingAction?.confirmLabel}
        danger={pendingAction?.danger}
        loading={busyId === pendingAction?.offer.id}
        onConfirm={() => pendingAction && void runAction(pendingAction)}
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
}
