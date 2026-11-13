import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CheckCircle2,
  Circle,
  Handshake,
  Heart,
  Leaf,
  MessageSquare,
  PlusCircle,
  User,
  Wallet,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import type { Conversation, Listing, MySubscription, NotificationItem, Offer } from '../types';
import { accountStatusLabel, formatDate, formatNumber, formatPrice, offerStatusLabel, timeAgo } from '../lib/format';
import { buttonClass } from '../components/ui/Button';
import { Alert, LoadingBlock } from '../components/ui/Feedback';
import { Badge, Card, PageHeader, SectionHead, StatCard } from '../components/ui/Surfaces';

export function DashboardHomePage() {
  const { user } = useAuth();
  const { items: favorites } = useFavorites();

  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [subData, listingsData, offersData, notificationsData, conversationsData] = await Promise.all([
          api<MySubscription>('/subscriptions/me'),
          api<{ items: Listing[] }>('/listings/me?status=all'),
          api<{ items: Offer[] }>('/offers/mine/received'),
          api<{ items: NotificationItem[]; unreadCount: number }>('/notifications'),
          api<{ items: Conversation[] }>('/messages'),
        ]);
        if (!active) return;
        setSubscription(subData);
        setListings(listingsData.items);
        setOffers(offersData.items);
        setNotifications(notificationsData.items);
        setConversations(conversationsData.items);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'تعذّر تحميل بيانات لوحة التحكم.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const activeListings = listings.filter((listing) => listing.status === 'active').length;
    const pendingOffers = offers.filter((offer) => offer.status === 'new' || offer.status === 'negotiation').length;
    const unreadMessages = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
    const unreadNotifications = notifications.filter((item) => !item.isRead).length;
    return { activeListings, pendingOffers, unreadMessages, unreadNotifications };
  }, [listings, offers, conversations, notifications]);

  const usage = subscription?.usage;
  const usagePercent = usage && usage.monthlyPostLimit > 0 ? Math.min(100, Math.round((usage.usedPosts / usage.monthlyPostLimit) * 100)) : 0;

  const profileSteps = useMemo(() => {
    if (!user) return [];
    return [
      { label: 'رقم الهاتف موثّق', done: user.accountStatus === 'active' },
      { label: 'اسم النشاط التجاري مضاف', done: Boolean(user.profile?.businessName) },
      { label: 'المحافظة محددة', done: Boolean(user.profile?.governorateId) },
      { label: 'تخصص واحد على الأقل', done: user.specialties.length > 0 },
      { label: 'نبذة تعريفية مضافة', done: Boolean(user.profile?.description) },
    ];
  }, [user]);

  const completedSteps = profileSteps.filter((step) => step.done).length;

  if (loading) {
    return (
      <div className="stack">
        <LoadingBlock label="جارٍ تحميل لوحة التحكم…" />
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow={
          <span className="eyebrow">
            <BadgeCheck size={15} /> لوحة التحكم
          </span>
        }
        title={`مرحباً، ${user?.fullName?.split(' ')[0] ?? ''}`}
        description="ملخص نشاطك على منصة فُرصة، مع روابط سريعة إلى المهام اليومية."
        actions={
          <>
            <Link to="/dashboard/listings/new" className={buttonClass()}>
              <PlusCircle size={16} /> إعلان جديد
            </Link>
            <Link to="/market" className={buttonClass('secondary')}>
              تصفح السوق
            </Link>
          </>
        }
      />

      {error ? <Alert kind="error">{error}</Alert> : null}

      {user && user.accountStatus !== 'active' ? (
        <Alert kind="warning" title="حسابك غير مفعّل">
          يرجى تأكيد رقم هاتفك لتفعيل الحساب. بعض الميزات مثل النشر والتواصل تبقى محدودة حتى التفعيل.
        </Alert>
      ) : null}

      <div className="grid grid-4">
        <StatCard icon={<Leaf size={20} />} value={formatNumber(stats.activeListings)} label="إعلانات نشطة" />
        <StatCard icon={<Handshake size={20} />} value={formatNumber(stats.pendingOffers)} label="عروض تحتاج متابعة" />
        <StatCard icon={<MessageSquare size={20} />} value={formatNumber(stats.unreadMessages)} label="رسائل غير مقروءة" />
        <StatCard icon={<Bell size={20} />} value={formatNumber(stats.unreadNotifications)} label="إشعارات جديدة" />
      </div>

      <div className="grid grid-2">
        <Card pad className="stack-sm">
          <div className="between">
            <h3 className="row" style={{ gap: '0.4rem' }}>
              <Wallet size={18} /> اشتراكك الحالي
            </h3>
            <Badge tone={subscription?.subscription.planName === 'professional' ? 'gold' : 'muted'}>
              {subscription?.subscription.planName === 'professional' ? 'الخطة المهنية' : 'الخطة المجانية'}
            </Badge>
          </div>

          {subscription ? (
            <>
              <p className="small muted">
                {subscription.subscription.planName === 'professional'
                  ? `اشتراك نشط حتى ${formatDate(subscription.subscription.endsAt)}.`
                  : 'أنت على الخطة المجانية. يمكنك الترقية لزيادة حد النشر الشهري.'}
              </p>
              <div className="between small">
                <span className="muted">الاستهلاك الشهري</span>
                <span className="strong">
                  {formatNumber(usage?.usedPosts ?? 0)} / {formatNumber(usage?.monthlyPostLimit ?? 0)} إعلان
                </span>
              </div>
              <div className="meter" role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100} aria-label="استهلاك حد النشر">
                <span style={{ width: `${usagePercent}%` }} />
              </div>
              <div className="between">
                <span className="small muted">متبقٍ {formatNumber(usage?.remainingPosts ?? 0)} إعلان هذا الشهر</span>
                <Link to="/subscription" className="small row" style={{ gap: '0.3rem' }}>
                  إدارة الاشتراك <ArrowLeft size={14} />
                </Link>
              </div>
            </>
          ) : (
            <p className="muted small">تعذّر تحميل بيانات الاشتراك.</p>
          )}
        </Card>

        <Card pad className="stack-sm">
          <div className="between">
            <h3 className="row" style={{ gap: '0.4rem' }}>
              <User size={18} /> اكتمال الملف الشخصي
            </h3>
            <Badge tone={completedSteps === profileSteps.length ? 'offer' : 'warning'}>
              {completedSteps} / {profileSteps.length}
            </Badge>
          </div>
          <div className="stack-sm">
            {profileSteps.map((step) => (
              <div key={step.label} className="row small" style={{ gap: '0.5rem' }}>
                {step.done ? (
                  <CheckCircle2 size={17} style={{ color: 'var(--success)' }} aria-hidden="true" />
                ) : (
                  <Circle size={17} className="muted" aria-hidden="true" />
                )}
                <span className={step.done ? '' : 'muted'}>{step.label}</span>
              </div>
            ))}
          </div>
          <Link to="/dashboard/profile" className="small row" style={{ gap: '0.3rem' }}>
            تحديث الملف الشخصي <ArrowLeft size={14} />
          </Link>
        </Card>
      </div>

      <Card pad>
        <div className="between">
          <h3 className="row" style={{ gap: '0.4rem' }}>
            <Handshake size={18} /> أحدث العروض الواردة
          </h3>
          <Link to="/dashboard/offers" className="small">
            كل العروض
          </Link>
        </div>
        {offers.length === 0 ? (
          <p className="muted small mt-2">لا توجد عروض واردة بعد. انشر طلب شراء لاستقبال عروض من المزارعين والتجار.</p>
        ) : (
          <div className="table-wrap mt-2">
            <table className="table">
              <thead>
                <tr>
                  <th>الطلب</th>
                  <th>مقدّم العرض</th>
                  <th>السعر المقترح</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {offers.slice(0, 4).map((offer) => (
                  <tr key={offer.id}>
                    <td>
                      <Link to={`/market/${offer.listingId}`}>{offer.listingTitle}</Link>
                    </td>
                    <td>{offer.buyerName}</td>
                    <td>
                      {formatPrice(offer.proposedPrice)} × {formatNumber(offer.proposedQuantity)}
                    </td>
                    <td>
                      <Badge tone={offer.status === 'accepted' ? 'offer' : offer.status === 'rejected' ? 'danger' : 'muted'}>
                        {offerStatusLabel[offer.status]}
                      </Badge>
                    </td>
                    <td className="small muted">{timeAgo(offer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-2">
        <Card pad className="stack-sm">
          <div className="between">
            <h3 className="row" style={{ gap: '0.4rem' }}>
              <Bell size={18} /> آخر الإشعارات
            </h3>
            <Link to="/dashboard/notifications" className="small">
              عرض الكل
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="muted small mt-2">لا توجد إشعارات حالياً.</p>
          ) : (
            <div className="stack-sm">
              {notifications.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={item.targetUrl || '/dashboard/notifications'}
                  className="card card-pad"
                  style={{ boxShadow: 'none', background: item.isRead ? 'var(--surface)' : 'var(--green-50)' }}
                >
                  <div className="between">
                    <span className="strong small">{item.title}</span>
                    {!item.isRead ? <Badge tone="gold">جديد</Badge> : null}
                  </div>
                  <p className="small muted mt-1">{item.body}</p>
                  <span className="small muted">{timeAgo(item.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card pad className="stack-sm">
          <h3 className="row" style={{ gap: '0.4rem' }}>
            <Heart size={18} /> المفضلة
          </h3>
          {favorites.length === 0 ? (
            <>
              <p className="muted small mt-2">لم تُضف أي إعلان إلى المفضلة بعد.</p>
              <Link to="/market" className={buttonClass('secondary', 'sm')}>
                ابحث في السوق
              </Link>
            </>
          ) : (
            <>
              <p className="muted small mt-2">لديك {formatNumber(favorites.length)} إعلاناً محفوظاً للرجوع إليه لاحقاً.</p>
              <Link to="/dashboard/favorites" className={buttonClass('secondary', 'sm')}>
                عرض المفضلة
              </Link>
            </>
          )}
          <hr className="divider" />
          <h3 className="row" style={{ gap: '0.4rem' }}>
            <MessageSquare size={18} /> الرسائل
          </h3>
          <p className="muted small">{stats.unreadMessages > 0 ? `لديك ${formatNumber(stats.unreadMessages)} رسالة غير مقروءة.` : 'لا توجد رسائل غير مقروءة.'}</p>
          <Link to="/dashboard/messages" className={buttonClass('secondary', 'sm')}>
            فتح الرسائل
          </Link>
        </Card>
      </div>

      <Card pad>
        <SectionHead title="اختصارات سريعة" />
        <div className="grid grid-4">
          <Link to="/dashboard/listings/new" className="tile">
            <span className="tile-icon">
              <PlusCircle size={19} />
            </span>
            <span className="grow">أضف إعلاناً</span>
            <ArrowLeft size={15} />
          </Link>
          <Link to="/dashboard/offers" className="tile">
            <span className="tile-icon">
              <Handshake size={19} />
            </span>
            <span className="grow">راجع العروض</span>
            <ArrowLeft size={15} />
          </Link>
          <Link to="/subscription" className="tile">
            <span className="tile-icon">
              <Wallet size={19} />
            </span>
            <span className="grow">الاشتراك</span>
            <ArrowLeft size={15} />
          </Link>
          <Link to="/dashboard/profile" className="tile">
            <span className="tile-icon">
              <User size={19} />
            </span>
            <span className="grow">ملفي الشخصي</span>
            <ArrowLeft size={15} />
          </Link>
        </div>
      </Card>

      {user && user.accountStatus !== 'active' ? (
        <p className="small muted">
          حالة الحساب: {accountStatusLabel[user.accountStatus] ?? user.accountStatus}
          {' · '}
          <Link to="/dashboard/profile">إعدادات الحساب</Link>
        </p>
      ) : null}
    </div>
  );
}
