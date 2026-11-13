import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import type { NotificationItem } from '../types';
import { timeAgo } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Alert, EmptyState, LoadingBlock } from '../components/ui/Feedback';
import { Badge, Card, PageHeader, Tabs } from '../components/ui/Surfaces';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: NotificationItem[]; unreadCount: number }>('/notifications');
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل الإشعارات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => (tab === 'unread' ? items.filter((item) => !item.isRead) : items),
    [items, tab],
  );

  const markRead = async (item: NotificationItem, navigateTo?: string | null) => {
    if (!item.isRead) {
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)));
      setUnreadCount((current) => Math.max(0, current - 1));
      try {
        await api(`/notifications/${item.id}/read`, { method: 'POST' });
      } catch {
        // The UI already reflects the change; a refresh will reconcile if it failed.
      }
    }
    if (navigateTo) navigate(navigateTo);
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await api('/notifications/read-all', { method: 'POST' });
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      showToast('تم تعليم جميع الإشعارات كمقروءة.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر تحديث الإشعارات.', 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="الإشعارات"
        description="تابع تحديثات العروض والرسائل وحالة حسابك واشتراكك."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<CheckCheck size={16} />}
              onClick={() => void markAllRead()}
              loading={markingAll}
              disabled={unreadCount === 0}
            >
              تعليم الكل كمقروء
            </Button>
            <Button variant="ghost" icon={<RefreshCw size={15} />} onClick={() => void load()} loading={loading}>
              تحديث
            </Button>
          </>
        }
      />

      <Tabs
        items={[
          { key: 'all', label: 'كل الإشعارات', count: items.length },
          { key: 'unread', label: 'غير المقروءة', count: unreadCount },
        ]}
        value={tab}
        onChange={(key) => setTab(key as 'all' | 'unread')}
        label="تصفية الإشعارات"
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
        <LoadingBlock label="جارٍ تحميل الإشعارات…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={tab === 'unread' ? <BellOff size={26} /> : <Bell size={26} />}
          title={tab === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات حالياً'}
          description={
            tab === 'unread'
              ? 'لقد اطّلعت على جميع إشعاراتك.'
              : 'ستصلك هنا إشعارات العروض الجديدة والرسائل وتحديثات الاشتراك والحساب.'
          }
          action={
            tab === 'unread' ? (
              <Button variant="secondary" onClick={() => setTab('all')}>
                عرض كل الإشعارات
              </Button>
            ) : (
              <Link to="/market" className="btn">
                تصفح السوق
              </Link>
            )
          }
        />
      ) : (
        <div className="stack-sm">
          {filtered.map((item) => {
            const content = (
              <>
                <div className="between wrap" style={{ gap: '0.5rem' }}>
                  <div className="row" style={{ gap: '0.45rem' }}>
                    <span className={item.isRead ? 'tile-icon' : 'tile-icon'} style={item.isRead ? undefined : { background: 'var(--gold-100)', color: '#8a5a06' }}>
                      <Bell size={17} />
                    </span>
                    <strong>{item.title}</strong>
                    {!item.isRead ? <Badge tone="gold">جديد</Badge> : null}
                  </div>
                  <span className="small muted">{timeAgo(item.createdAt)}</span>
                </div>
                <p className="muted small mt-1" style={{ marginInlineStart: '2.65rem' }}>
                  {item.body}
                </p>
                {item.targetUrl ? (
                  <span className="small row mt-1" style={{ gap: '0.3rem', marginInlineStart: '2.65rem', color: 'var(--green-700)' }}>
                    <ExternalLink size={13} /> الانتقال إلى التفاصيل
                  </span>
                ) : null}
              </>
            );

            return item.targetUrl ? (
              <button
                key={item.id}
                type="button"
                className="card card-pad"
                style={{
                  textAlign: 'start',
                  width: '100%',
                  background: item.isRead ? 'var(--surface)' : 'var(--green-50)',
                  borderColor: item.isRead ? 'var(--line)' : 'var(--green-200, #bcd7bf)',
                }}
                onClick={() => void markRead(item, item.targetUrl)}
              >
                {content}
              </button>
            ) : (
              <Card
                key={item.id}
                pad
                style={{ background: item.isRead ? 'var(--surface)' : 'var(--green-50)' }}
              >
                {content}
                {!item.isRead ? (
                  <div className="mt-2">
                    <Button variant="ghost" size="sm" onClick={() => void markRead(item)}>
                      تعليم كمقروء
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
