import { useEffect, useMemo, useState } from 'react';
import { CreditCard, RefreshCw, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { AdminSubscription } from '../../types';
import { formatDate, formatNumber, formatPrice, subscriptionStatusLabel } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Alert, EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { Badge, Card, PageHeader, Tabs } from '../../components/ui/Surfaces';

function planLabel(name: string): string {
  if (name === 'free') return 'الخطة المجانية';
  if (name === 'professional') return 'الخطة المهنية';
  return name;
}

export function AdminSubscriptionsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'active' | 'canceled' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState<AdminSubscription | null>(null);
  const [canceling, setCanceling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: AdminSubscription[] }>('/admin/subscriptions');
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل الاشتراكات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => {
    const result = { all: items.length, active: 0, canceled: 0, expired: 0 };
    for (const item of items) {
      if (item.status === 'active') result.active += 1;
      else if (item.status === 'canceled') result.canceled += 1;
      else if (item.status === 'expired') result.expired += 1;
    }
    return result;
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (tab !== 'all' && item.status !== tab) return false;
      if (!query) return true;
      return item.userName.toLowerCase().includes(query) || String(item.userId).includes(query);
    });
  }, [items, tab, search]);

  const totalRevenue = useMemo(
    () => items.filter((item) => item.status === 'active').reduce((sum, item) => sum + item.amount, 0),
    [items],
  );

  const cancelSubscription = async () => {
    if (!cancelTarget) return;
    setCanceling(true);
    try {
      await api(`/admin/subscriptions/${cancelTarget.id}/cancel`, { method: 'POST' });
      setItems((current) =>
        current.map((item) => (item.id === cancelTarget.id ? { ...item, status: 'canceled', autoRenew: false } : item)),
      );
      showToast('تم إلغاء الاشتراك.');
      setCancelTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر إلغاء الاشتراك.', 'error');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="الاشتراكات"
        description="سجل الاشتراكات المسجلة على المنصة وحالتها. هذه الصفحة للعرض فقط."
        actions={
          <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={() => void load()} loading={loading}>
            تحديث
          </Button>
        }
      />

      <div className="grid grid-3">
        <Card pad className="stat-card">
          <span>اشتراكات نشطة</span>
          <strong>{formatNumber(counts.active)}</strong>
        </Card>
        <Card pad className="stat-card">
          <span>قيمة الاشتراكات النشطة</span>
          <strong>{formatPrice(totalRevenue)}</strong>
        </Card>
        <Card pad className="stat-card">
          <span>إجمالي السجلات</span>
          <strong>{formatNumber(items.length)}</strong>
        </Card>
      </div>

      <Tabs
        items={[
          { key: 'all', label: 'الكل', count: counts.all },
          { key: 'active', label: 'نشط', count: counts.active },
          { key: 'canceled', label: 'ملغي', count: counts.canceled },
          { key: 'expired', label: 'منتهي', count: counts.expired },
        ]}
        value={tab}
        onChange={(key) => setTab(key as 'all' | 'active' | 'canceled' | 'expired')}
        label="تصفية الاشتراكات"
      />

      <input
        className="input"
        type="search"
        placeholder="ابحث باسم المستخدم أو رقمه"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label="بحث في الاشتراكات"
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
        <LoadingBlock label="جارٍ تحميل الاشتراكات…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={26} />}
          title="لا توجد اشتراكات مطابقة"
          description={search || tab !== 'all' ? 'جرّب تغيير البحث أو الفلتر.' : 'لم يشترك أي مستخدم في خطة مدفوعة بعد.'}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>الخطة</th>
                <th>القيمة</th>
                <th>الحالة</th>
                <th>البداية</th>
                <th>النهاية</th>
                <th>تجديد تلقائي</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.userName}</strong>
                    <div className="small muted">#{item.userId}</div>
                  </td>
                  <td>{planLabel(item.planName)}</td>
                  <td>{item.amount > 0 ? formatPrice(item.amount) : 'مجاناً'}</td>
                  <td>
                    <Badge
                      tone={item.status === 'active' ? 'offer' : item.status === 'canceled' ? 'warning' : 'muted'}
                    >
                      {subscriptionStatusLabel[item.status] ?? item.status}
                    </Badge>
                  </td>
                  <td className="small">{formatDate(item.startsAt)}</td>
                  <td className="small">{item.endsAt ? formatDate(item.endsAt) : '—'}</td>
                  <td className="small">{item.autoRenew ? 'نعم' : 'لا'}</td>
                  <td>
                    {item.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="danger-soft"
                        icon={<XCircle size={14} />}
                        onClick={() => setCancelTarget(item)}
                      >
                        إلغاء
                      </Button>
                    ) : (
                      <span className="small muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card pad className="small muted">
        يمكنك إلغاء أي اشتراك نشط من الجدول أعلاه. الإلغاء يوقف التجديد التلقائي ويعيد المستخدم إلى الخطة المجانية في
        نهاية فترة الاشتراك الحالية.
      </Card>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="إلغاء الاشتراك"
        message={`سيتم إلغاء اشتراك ${cancelTarget?.userName ?? ''} في خطة ${cancelTarget ? planLabel(cancelTarget.planName) : ''} وإيقاف التجديد التلقائي. هل تريد المتابعة؟`}
        confirmLabel="إلغاء الاشتراك"
        danger
        loading={canceling}
        onConfirm={() => void cancelSubscription()}
        onClose={() => {
          if (!canceling) setCancelTarget(null);
        }}
      />
    </div>
  );
}
