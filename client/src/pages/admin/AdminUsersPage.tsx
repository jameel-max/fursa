import { useEffect, useMemo, useState } from 'react';
import { Eye, RefreshCw, ShieldAlert, Trash2, UserCheck, UserX } from 'lucide-react';
import { api, toQuery } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCatalog } from '../../lib/catalog';
import type { AccountStatus, AdminUser, AdminUserDetail } from '../../types';
import { accountStatusLabel, formatDate, formatNumber, roleLabel, subscriptionStatusLabel } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Alert, EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Badge, Card, PageHeader, Pagination } from '../../components/ui/Surfaces';

interface UsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PendingStatus {
  user: AdminUser;
  status: AccountStatus;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
}

const statusOptions: Array<{ value: '' | AccountStatus; label: string }> = [
  { value: '', label: 'كل الحالات' },
  { value: 'active', label: 'نشط' },
  { value: 'pending', label: 'بانتظار التحقق' },
  { value: 'suspended', label: 'موقوف' },
  { value: 'banned', label: 'محظور' },
];

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { specialties } = useCatalog();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | AccountStatus>('');
  const [specialty, setSpecialty] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
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
      const result = await api<UsersResponse>(
        `/admin/users${toQuery({ search: search || undefined, status: status || undefined, specialty: specialty || undefined, page, limit: 20 })}`,
      );
      setData(result);
      if (result.totalPages > 0 && page > result.totalPages) setPage(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل المستخدمين.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, specialty, page]);

  const activeFilters = useMemo(() => Boolean(search || status || specialty), [search, status, specialty]);

  const changeStatus = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      await api(`/admin/users/${pending.user.id}/status`, {
        method: 'PATCH',
        body: { status: pending.status },
      });
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === pending.user.id ? { ...item, accountStatus: pending.status } : item,
              ),
            }
          : current,
      );
      showToast(
        pending.status === 'active'
          ? 'تم تفعيل الحساب.'
          : pending.status === 'suspended'
            ? 'تم إيقاف الحساب.'
            : 'تم حظر الحساب.',
      );
      setPending(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر تحديث حالة المستخدم.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (item: AdminUser) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await api<AdminUserDetail>(`/admin/users/${item.id}`);
      setDetail(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر تحميل بيانات المستخدم.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const removeUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      setData((current) =>
        current
          ? { ...current, items: current.items.filter((item) => item.id !== deleteTarget.id), total: current.total - 1 }
          : current,
      );
      showToast('تم حذف حساب المستخدم نهائياً.');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر حذف المستخدم.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="إدارة المستخدمين"
        description="ابحث عن الحسابات وراجع حالتها، وأوقف أو فعّل أو احظر الحسابات المخالفة."
        actions={
          <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={() => void load()} loading={loading}>
            تحديث
          </Button>
        }
      />

      <Card pad className="stack-sm">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="admin-user-search">بحث</label>
            <input
              id="admin-user-search"
              className="input"
              type="search"
              placeholder="الاسم أو رقم الهاتف"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="admin-user-status">الحالة</label>
            <select
              id="admin-user-status"
              className="select"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as '' | AccountStatus);
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
            <label htmlFor="admin-user-specialty">التخصص</label>
            <select
              id="admin-user-specialty"
              className="select"
              value={specialty}
              onChange={(event) => {
                setSpecialty(event.target.value);
                setPage(1);
              }}
            >
              <option value="">كل التخصصات</option>
              {specialties.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
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
        <LoadingBlock label="جارٍ تحميل المستخدمين…" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<UserX size={26} />}
          title="لا يوجد مستخدمون مطابقون"
          description={activeFilters ? 'جرّب تعديل كلمات البحث أو الفلاتر.' : 'لم يسجل أي مستخدم بعد.'}
          action={
            activeFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setStatus('');
                  setSpecialty('');
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
              {data.total} مستخدم — الصفحة {data.page} من {data.totalPages}
            </span>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>الهاتف</th>
                  <th>الحالة</th>
                  <th>الدور</th>
                  <th>تاريخ الانضمام</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const isSelf = item.id === currentUser?.id;
                  const isAdmin = item.role === 'admin';
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.fullName}</strong>
                        <div className="small muted">#{item.id}</div>
                        {isSelf ? <Badge tone="gold">حسابك</Badge> : null}
                      </td>
                      <td dir="ltr" style={{ textAlign: 'start' }}>
                        {item.phone}
                      </td>
                      <td>
                        <Badge
                          tone={
                            item.accountStatus === 'active'
                              ? 'offer'
                              : item.accountStatus === 'pending'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {accountStatusLabel[item.accountStatus] ?? item.accountStatus}
                        </Badge>
                      </td>
                      <td>{roleLabel[item.role] ?? item.role}</td>
                      <td className="small">{formatDate(item.createdAt)}</td>
                      <td>
                        <div className="row wrap" style={{ gap: '0.35rem' }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Eye size={14} />}
                            onClick={() => void openDetail(item)}
                          >
                            تفاصيل
                          </Button>
                          {isSelf ? (
                            <span className="small muted">لا يمكنك تغيير حالة حسابك.</span>
                          ) : isAdmin ? (
                            <span className="small muted row" style={{ gap: '0.3rem' }}>
                              <ShieldAlert size={14} /> حساب مشرف
                            </span>
                          ) : (
                            <>
                              {item.accountStatus !== 'active' ? (
                              <Button
                                size="sm"
                                icon={<UserCheck size={14} />}
                                onClick={() =>
                                  setPending({
                                    user: item,
                                    status: 'active',
                                    title: 'تفعيل الحساب',
                                    message: `سيتم تفعيل حساب ${item.fullName} والسماح له بتسجيل الدخول. هل تريد المتابعة؟`,
                                    confirmLabel: 'تفعيل الحساب',
                                  })
                                }
                              >
                                تفعيل
                              </Button>
                            ) : null}
                            {item.accountStatus !== 'suspended' ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={<UserX size={14} />}
                                onClick={() =>
                                  setPending({
                                    user: item,
                                    status: 'suspended',
                                    title: 'إيقاف الحساب',
                                    message: `سيتم إيقاف حساب ${item.fullName} ومنعه من تسجيل الدخول مؤقتاً. هل تريد المتابعة؟`,
                                    confirmLabel: 'إيقاف الحساب',
                                  })
                                }
                              >
                                إيقاف
                              </Button>
                            ) : null}
                            {item.accountStatus !== 'banned' ? (
                              <Button
                                size="sm"
                                variant="danger-soft"
                                icon={<ShieldAlert size={14} />}
                                onClick={() =>
                                  setPending({
                                    user: item,
                                    status: 'banned',
                                    title: 'حظر الحساب',
                                    message: `سيتم حظر حساب ${item.fullName} نهائياً من استخدام المنصة. هل تريد المتابعة؟`,
                                    confirmLabel: 'حظر الحساب',
                                    danger: true,
                                  })
                                }
                              >
                                حظر
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      <Modal
        open={detailLoading || Boolean(detail)}
        title={detail ? `ملف ${detail.fullName}` : 'تفاصيل المستخدم'}
        onClose={() => {
          setDetail(null);
          setDetailLoading(false);
        }}
      >
        {detailLoading && !detail ? (
          <LoadingBlock label="جارٍ تحميل البيانات…" />
        ) : detail ? (
          <div className="stack-sm">
            <div className="between wrap">
              <div>
                <strong>{detail.fullName}</strong>
                <div className="small muted" dir="ltr" style={{ textAlign: 'start' }}>
                  {detail.phone}
                </div>
              </div>
              <Badge tone={detail.accountStatus === 'active' ? 'offer' : detail.accountStatus === 'pending' ? 'warning' : 'danger'}>
                {accountStatusLabel[detail.accountStatus] ?? detail.accountStatus}
              </Badge>
            </div>
            <div className="small muted">
              الدور: {roleLabel[detail.role] ?? detail.role} — انضم في {formatDate(detail.createdAt)}
            </div>
            {detail.profile ? (
              <div className="small">
                {detail.profile.businessName ? <div>النشاط: {detail.profile.businessName}</div> : null}
                {detail.profile.area ? <div>المنطقة: {detail.profile.area}</div> : null}
                {detail.profile.description ? <div className="muted">{detail.profile.description}</div> : null}
              </div>
            ) : null}
            {detail.specialties.length > 0 ? (
              <div className="row wrap" style={{ gap: '0.3rem' }}>
                {detail.specialties.map((item, index) => (
                  <Badge key={index} tone="muted">
                    {item.name ?? item.customSpecialty}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="grid grid-3">
              <Card pad className="stat-card"><span>الإعلانات</span><strong>{formatNumber(detail.counts.listings)}</strong></Card>
              <Card pad className="stat-card"><span>عروض مقدّمة</span><strong>{formatNumber(detail.counts.offersMade)}</strong></Card>
              <Card pad className="stat-card"><span>عروض مستلمة</span><strong>{formatNumber(detail.counts.offersReceived)}</strong></Card>
              <Card pad className="stat-card"><span>المفضلة</span><strong>{formatNumber(detail.counts.favorites)}</strong></Card>
              <Card pad className="stat-card"><span>المحادثات</span><strong>{formatNumber(detail.counts.conversations)}</strong></Card>
              <Card pad className="stat-card"><span>الاشتراك</span><strong className="small">{detail.subscription ? (subscriptionStatusLabel[detail.subscription.status] ?? detail.subscription.planName) : 'مجاني'}</strong></Card>
            </div>
            {detail.recentListings.length > 0 ? (
              <div>
                <div className="small muted mb-1">أحدث الإعلانات</div>
                <div className="stack-sm">
                  {detail.recentListings.map((listing) => (
                    <div key={listing.id} className="between small">
                      <span>{listing.title}</span>
                      <Badge tone="muted">{listing.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف حساب المستخدم"
        message={`سيتم حذف حساب ${deleteTarget?.fullName ?? ''} نهائياً مع جميع إعلاناته وبياناته. لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟`}
        confirmLabel="حذف نهائي"
        danger
        loading={deleting}
        onConfirm={() => void removeUser()}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
