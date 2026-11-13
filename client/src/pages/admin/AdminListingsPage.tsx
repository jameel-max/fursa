import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, PauseCircle, PlayCircle, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { api, toQuery } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { AdminListing, ListingStatus, ListingType } from '../../types';
import { formatDate, formatNumber, formatPrice, listingStatusLabel, listingTypeLabel } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Alert, EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { Badge, Card, PageHeader, Pagination } from '../../components/ui/Surfaces';

interface ListingsResponse {
  items: AdminListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PendingStatus {
  listing: AdminListing;
  status: ListingStatus;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
}

const statusOptions: Array<{ value: '' | ListingStatus; label: string }> = [
  { value: '', label: 'كل الحالات' },
  { value: 'active', label: 'نشط' },
  { value: 'paused', label: 'موقوف مؤقتاً' },
  { value: 'closed', label: 'مغلق' },
  { value: 'expired', label: 'منتهي' },
];

const typeOptions: Array<{ value: '' | ListingType; label: string }> = [
  { value: '', label: 'كل الأنواع' },
  { value: 'offer', label: 'عروض بيع' },
  { value: 'request', label: 'طلبات شراء' },
];

export function AdminListingsPage() {
  const { showToast } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | ListingStatus>('');
  const [type, setType] = useState<'' | ListingType>('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminListing | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api<ListingsResponse>(
        `/admin/listings${toQuery({ search: search || undefined, status: status || undefined, type: type || undefined, page, limit: 20 })}`,
      );
      setData(result);
      if (result.totalPages > 0 && page > result.totalPages) setPage(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل الإعلانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, type, page]);

  const activeFilters = useMemo(() => Boolean(search || status || type), [search, status, type]);

  const changeStatus = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      await api(`/admin/listings/${pending.listing.id}/status`, {
        method: 'PATCH',
        body: { status: pending.status },
      });
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === pending.listing.id ? { ...item, status: pending.status } : item,
              ),
            }
          : current,
      );
      showToast(
        pending.status === 'active'
          ? 'تم تفعيل الإعلان.'
          : pending.status === 'paused'
            ? 'تم إيقاف الإعلان مؤقتاً.'
            : pending.status === 'closed'
              ? 'تم إغلاق الإعلان.'
              : 'تم تعليم الإعلان كمنتهٍ.',
      );
      setPending(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر تحديث حالة الإعلان.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeListing = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/admin/listings/${deleteTarget.id}`, { method: 'DELETE' });
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== deleteTarget.id),
              total: current.total - 1,
            }
          : current,
      );
      showToast('تم حذف الإعلان نهائياً.');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر حذف الإعلان.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="إدارة الإعلانات"
        description="راجع الإعلانات المنشورة وأوقف أو أغلق الإعلانات المخالفة أو غير المناسبة."
        actions={
          <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={() => void load()} loading={loading}>
            تحديث
          </Button>
        }
      />

      <Card pad className="stack-sm">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="admin-listing-search">بحث</label>
            <input
              id="admin-listing-search"
              className="input"
              type="search"
              placeholder="عنوان الإعلان أو وصفه"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="admin-listing-status">الحالة</label>
            <select
              id="admin-listing-status"
              className="select"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as '' | ListingStatus);
                setPage(1);
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="admin-listing-type">النوع</label>
            <select
              id="admin-listing-type"
              className="select"
              value={type}
              onChange={(event) => {
                setType(event.target.value as '' | ListingType);
                setPage(1);
              }}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

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
        <LoadingBlock label="جارٍ تحميل الإعلانات…" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<XCircle size={26} />}
          title="لا توجد إعلانات مطابقة"
          description={activeFilters ? 'جرّب تعديل كلمات البحث أو الفلاتر.' : 'لم يتم نشر أي إعلان بعد.'}
          action={
            activeFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setStatus('');
                  setType('');
                  setPage(1);
                }}
              >
                مسح الفلاتر
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="between wrap">
            <span className="small muted">
              {formatNumber(data.total)} إعلان — الصفحة {data.page} من {data.totalPages}
            </span>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الإعلان</th>
                  <th>الناشر</th>
                  <th>النوع</th>
                  <th>الحالة</th>
                  <th>السعر</th>
                  <th>النشر</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link to={`/market/${item.id}`} className="strong">
                        {item.title}
                      </Link>
                      <div className="small muted">#{item.id}</div>
                    </td>
                    <td>{item.ownerName}</td>
                    <td>
                      <Badge tone={item.listingType === 'offer' ? 'offer' : 'request'}>
                        {listingTypeLabel[item.listingType]}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        tone={
                          item.status === 'active'
                            ? 'offer'
                            : item.status === 'paused'
                              ? 'warning'
                              : item.status === 'expired'
                                ? 'danger'
                                : 'muted'
                        }
                      >
                        {listingStatusLabel[item.status]}
                      </Badge>
                    </td>
                    <td className="small">{formatPrice(item.price)}</td>
                    <td className="small">{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="row wrap" style={{ gap: '0.35rem' }}>
                        <Link
                          to={`/market/${item.id}`}
                          className="btn btn-sm btn-ghost"
                          aria-label={`عرض الإعلان ${item.title}`}
                        >
                          <ExternalLink size={14} />
                        </Link>
                        {item.status !== 'active' ? (
                          <Button
                            size="sm"
                            icon={<PlayCircle size={14} />}
                            onClick={() =>
                              setPending({
                                listing: item,
                                status: 'active',
                                title: 'تفعيل الإعلان',
                                message: `سيصبح إعلان «${item.title}» مرئياً في السوق. هل تريد المتابعة؟`,
                                confirmLabel: 'تفعيل الإعلان',
                              })
                            }
                          >
                            تفعيل
                          </Button>
                        ) : null}
                        {item.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<PauseCircle size={14} />}
                            onClick={() =>
                              setPending({
                                listing: item,
                                status: 'paused',
                                title: 'إيقاف الإعلان',
                                message: `سيتم إخفاء إعلان «${item.title}» من السوق مؤقتاً. هل تريد المتابعة؟`,
                                confirmLabel: 'إيقاف مؤقت',
                              })
                            }
                          >
                            إيقاف
                          </Button>
                        ) : null}
                        {item.status !== 'closed' ? (
                          <Button
                            size="sm"
                            variant="danger-soft"
                            icon={<XCircle size={14} />}
                            onClick={() =>
                              setPending({
                                listing: item,
                                status: 'closed',
                                title: 'إغلاق الإعلان',
                                message: `سيتم إغلاق إعلان «${item.title}» نهائياً. هل تريد المتابعة؟`,
                                confirmLabel: 'إغلاق الإعلان',
                                danger: true,
                              })
                            }
                          >
                            إغلاق
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<Trash2 size={14} />}
                          onClick={() => setDeleteTarget(item)}
                        >
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.title ?? ''}
        message={pending?.message ?? ''}
        confirmLabel={pending?.confirmLabel}
        danger={pending?.danger}
        loading={saving}
        onConfirm={() => void changeStatus()}
        onClose={() => {
          if (!saving) setPending(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الإعلان"
        message={`سيتم حذف إعلان «${deleteTarget?.title ?? ''}» نهائياً مع جميع بياناته. لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟`}
        confirmLabel="حذف نهائي"
        danger
        loading={deleting}
        onConfirm={() => void removeListing()}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
