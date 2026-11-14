import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BadgeDollarSign,
  CreditCard,
  Handshake,
  Leaf,
  RefreshCw,
  Settings,
  Sprout,
  Users,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { AdminStats, SectionRequest } from '../../types';
import { auditActionLabel, formatDateTime, formatNumber, formatPrice, timeAgo } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Alert, LoadingBlock } from '../../components/ui/Feedback';
import { Card, PageHeader, SectionHead, StatCard } from '../../components/ui/Surfaces';

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="between small" style={{ padding: '0.45rem 0', borderBottom: '1px solid var(--line)' }}>
      <span className="muted">{label}</span>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [sectionRequests, setSectionRequests] = useState<SectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, sections] = await Promise.all([
        api<AdminStats>('/admin/stats'),
        api<{ items: SectionRequest[] }>('/admin/section-requests').catch(() => ({ items: [] })),
      ]);
      setStats(data);
      setSectionRequests(sections.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل إحصائيات المنصة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return <LoadingBlock label="جارٍ تحميل لوحة الإدارة…" />;
  }

  return (
    <div className="stack">
      <PageHeader
        title="لوحة الإدارة"
        description="نظرة شاملة على المستخدمين والإعلانات والعروض والاشتراكات وأحدث العمليات على المنصة."
        actions={
          <Button variant="secondary" onClick={() => void load()} loading={loading} icon={<RefreshCw size={15} />}>
            تحديث البيانات
          </Button>
        }
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
      ) : null}

      {stats ? (
        <>
          <div className="grid grid-4">
            <StatCard icon={<Users size={20} />} value={formatNumber(stats.users.total)} label="إجمالي المستخدمين" />
            <StatCard icon={<Sprout size={20} />} value={formatNumber(stats.farmers ?? 0)} label="حسابات المزارعين" />
            <StatCard icon={<Leaf size={20} />} value={formatNumber(stats.listings.total)} label="إجمالي الإعلانات" />
            <StatCard icon={<Handshake size={20} />} value={formatNumber(stats.offers.total)} label="إجمالي العروض" />
          </div>

          <div className="grid grid-3">
            <StatCard
              icon={<CreditCard size={20} />}
              value={formatNumber(stats.subscriptions.active)}
              label="اشتراكات نشطة"
            />
            <StatCard
              icon={<BadgeDollarSign size={20} />}
              value={formatPrice(stats.revenue.total)}
              label="إجمالي المدفوعات المسجلة"
            />
            <StatCard
              icon={<Users size={20} />}
              value={formatNumber(stats.users.pending)}
              label="حسابات بانتظار التحقق"
            />
          </div>

          <div className="grid grid-2">
            <Card pad className="stack-sm">
              <SectionHead title="المستخدمون" description="توزيع الحسابات حسب الحالة" />
              <BreakdownRow label="نشط" value={stats.users.active} />
              <BreakdownRow label="بانتظار التحقق" value={stats.users.pending} />
              <BreakdownRow label="موقوف أو محظور" value={stats.users.suspended} />
              <BreakdownRow label="مسجلون هذا الشهر" value={stats.users.newThisMonth} />
              <Link to="/admin/users" className="small" style={{ color: 'var(--green-700)', fontWeight: 700 }}>
                إدارة المستخدمين ←
              </Link>
            </Card>

            <Card pad className="stack-sm">
              <SectionHead title="الإعلانات" description="توزيع الإعلانات حسب النوع والحالة" />
              <BreakdownRow label="عروض بيع" value={stats.listings.offers} />
              <BreakdownRow label="طلبات شراء" value={stats.listings.requests} />
              <BreakdownRow label="نشطة" value={stats.listings.active} />
              <BreakdownRow label="موقوفة مؤقتاً" value={stats.listings.paused} />
              <BreakdownRow label="مغلقة أو منتهية" value={stats.listings.closed + stats.listings.expired} />
              <Link to="/admin/listings" className="small" style={{ color: 'var(--green-700)', fontWeight: 700 }}>
                إدارة الإعلانات ←
              </Link>
            </Card>

            <Card pad className="stack-sm">
              <SectionHead title="العروض" description="حالة العروض المقدمة على طلبات الشراء" />
              <BreakdownRow label="جديدة" value={stats.offers.new} />
              <BreakdownRow label="قيد التفاوض" value={stats.offers.negotiation} />
              <BreakdownRow label="مقبولة" value={stats.offers.accepted} />
              <BreakdownRow label="مرفوضة" value={stats.offers.rejected} />
              <BreakdownRow label="ملغاة" value={stats.offers.cancelled} />
            </Card>

            <Card pad className="stack-sm">
              <SectionHead title="الاشتراكات والمدفوعات" description="حالة الاشتراكات والمدفوعات المسجلة" />
              <BreakdownRow label="اشتراكات نشطة" value={stats.subscriptions.active} />
              <BreakdownRow label="اشتراكات ملغاة" value={stats.subscriptions.canceled} />
              <BreakdownRow label="اشتراكات منتهية" value={stats.subscriptions.expired} />
              <BreakdownRow label="مدفوعات ناجحة" value={stats.revenue.successful} />
              <BreakdownRow label="مدفوعات معلّقة" value={stats.revenue.pending} />
              <Link to="/admin/subscriptions" className="small" style={{ color: 'var(--green-700)', fontWeight: 700 }}>
                عرض الاشتراكات ←
              </Link>
            </Card>
          </div>

          {sectionRequests.length > 0 ? (
            <Card pad className="stack-sm">
              <SectionHead
                title="أقسام «أخرى» المطلوبة"
                description="أوصاف كتبها المستخدمون عند اختيارهم قسم «أخرى» — قد تكون أقساماً جديدة تستحق الإضافة."
              />
              <div className="chip-row">
                {sectionRequests.map((item) => (
                  <span key={item.sectionOther} className="chip" title={`${item.count} إعلان — آخرها ${timeAgo(item.latestAt)}`}>
                    {item.sectionOther} ({item.count})
                  </span>
                ))}
              </div>
              <Link to="/admin/listings?section=other" className="small" style={{ color: 'var(--green-700)', fontWeight: 700 }}>
                عرض إعلانات قسم «أخرى» ←
              </Link>
            </Card>
          ) : null}

          <section>
            <SectionHead
              title="أحدث العمليات"
              description="آخر 10 عمليات مسجلة في سجل التدقيق."
              action={
                <Link
                  to="/admin/settings"
                  className="small row"
                  style={{ gap: '0.3rem', color: 'var(--green-700)', fontWeight: 700 }}
                >
                  <Settings size={14} /> إعدادات المنصة
                </Link>
              }
            />

            {stats.recentOperations.length === 0 ? (
              <Card pad className="small muted">
                لا توجد عمليات مسجلة بعد.
              </Card>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>العملية</th>
                      <th>النوع</th>
                      <th>المعرّف</th>
                      <th>الوقت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOperations.map((operation) => (
                      <tr key={operation.id}>
                        <td>
                          <span className="row" style={{ gap: '0.35rem' }}>
                            <Activity size={15} className="muted" />
                            {auditActionLabel[operation.action] ?? operation.action}
                          </span>
                        </td>
                        <td>{operation.entityType}</td>
                        <td>{operation.entityId ?? '—'}</td>
                        <td title={formatDateTime(operation.createdAt)}>{timeAgo(operation.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
