import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  CalendarDays,
  Check,
  CreditCard,
  HelpCircle,
  Info,
  Leaf,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import type { CheckoutResult, MySubscription, Plan } from '../types';
import { formatDate, formatNumber, formatPrice } from '../lib/format';
import { Button, buttonClass } from '../components/ui/Button';
import { Alert, EmptyState, LoadingBlock } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/Modal';
import { Badge, Card, PageHeader, SectionHead } from '../components/ui/Surfaces';

function planLabel(name: string): string {
  if (name === 'free') return 'الخطة المجانية';
  if (name === 'professional') return 'الخطة المهنية';
  return name;
}

function planFeatures(plan: Plan): string[] {
  return [
    `${formatNumber(plan.monthlyPostLimit)} إعلاناً شهرياً`,
    `مدة الدورة ${formatNumber(plan.durationDays)} يوماً`,
    'نشر عروض البيع وطلبات الشراء',
    'استقبال العروض والرسائل الداخلية',
    'جميع المحافظات والتصنيفات الزراعية',
  ];
}

export function SubscriptionPage() {
  const { showToast } = useToast();

  const [data, setData] = useState<MySubscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<Plan | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subscriptionData, plansData] = await Promise.all([
        api<MySubscription>('/subscriptions/me'),
        api<{ items: Plan[] }>('/subscriptions/plans'),
      ]);
      setData(subscriptionData);
      setPlans(plansData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل بيانات الاشتراك.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const currentPlanName = data?.subscription.planName ?? 'free';
  const isProfessional = currentPlanName === 'professional';

  const usagePercent = useMemo(() => {
    if (!data || data.usage.monthlyPostLimit <= 0) return 0;
    return Math.min(100, Math.round((data.usage.usedPosts / data.usage.monthlyPostLimit) * 100));
  }, [data]);

  const checkout = async () => {
    if (!checkoutTarget) return;
    setCheckingOut(true);
    setCheckoutMessage(null);
    try {
      const result = await api<CheckoutResult>('/subscriptions/checkout', {
        method: 'POST',
        body: { planId: checkoutTarget.id },
      });
      if (result.available) {
        showToast('تم تفعيل الاشتراك المهني بنجاح.');
        setCheckoutTarget(null);
        await load();
      } else {
        setCheckoutMessage(result.message ?? 'الدفع الإلكتروني غير متاح حالياً.');
      }
    } catch (err) {
      setCheckoutMessage(err instanceof Error ? err.message : 'تعذّر إتمام عملية الاشتراك.');
    } finally {
      setCheckingOut(false);
    }
  };

  const cancel = async () => {
    setCanceling(true);
    try {
      const result = await api<{ canceled: boolean; planName: string; endsAt: number | null }>('/subscriptions/cancel', {
        method: 'POST',
      });
      showToast(result.canceled ? 'تم إلغاء الاشتراك والعودة إلى الخطة المجانية.' : 'لا يوجد اشتراك مدفوع نشط.');
      setCancelOpen(false);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر إلغاء الاشتراك.', 'error');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="page container">
        <LoadingBlock label="جارٍ تحميل بيانات الاشتراك…" />
      </div>
    );
  }

  return (
    <div className="page container stack">
      <PageHeader
        eyebrow={
          <span className="eyebrow">
            <CreditCard size={15} /> الاشتراك والخطط
          </span>
        }
        title="خطتك في فُرصة"
        description="اختر الخطة التي تناسب حجم نشاطك. تُحسب حدود النشر لكل دورة مدتها 30 يوماً."
        actions={
          <Link to="/dashboard/listings/new" className={buttonClass('secondary')}>
            <Leaf size={16} /> إعلان جديد
          </Link>
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

      {data ? (
        <Card pad className="stack-sm">
          <div className="between wrap">
            <div>
              <span className="small muted">خطتك الحالية</span>
              <h2 style={{ fontSize: '1.4rem' }}>{planLabel(currentPlanName)}</h2>
            </div>
            <Badge tone={isProfessional ? 'gold' : 'muted'}>
              {isProfessional ? 'اشتراك مدفوع' : 'اشتراك أساسي'}
            </Badge>
          </div>

          <div className="grid grid-3">
            <div>
              <span className="small muted">حد النشر الشهري</span>
              <div className="strong">{formatNumber(data.usage.monthlyPostLimit)} إعلان</div>
            </div>
            <div>
              <span className="small muted">المستخدم هذا الشهر</span>
              <div className="strong">{formatNumber(data.usage.usedPosts)} إعلان</div>
            </div>
            <div>
              <span className="small muted">المتبقي</span>
              <div className="strong" style={{ color: data.usage.remainingPosts === 0 ? 'var(--danger)' : 'var(--success)' }}>
                {formatNumber(data.usage.remainingPosts)} إعلان
              </div>
            </div>
          </div>

          <div className="meter" role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100} aria-label="استهلاك حد النشر">
            <span style={{ width: `${usagePercent}%` }} />
          </div>

          <div className="between wrap">
            <span className="small muted row" style={{ gap: '0.35rem' }}>
              <CalendarDays size={14} />
              {isProfessional && data.subscription.endsAt
                ? `الدورة الحالية تنتهي في ${formatDate(data.subscription.endsAt)}`
                : 'الخطة المجانية لا تنتهي، وتتجدد حدودها كل 30 يوماً.'}
            </span>
            {isProfessional ? (
              <Button variant="danger-soft" size="sm" icon={<XCircle size={15} />} onClick={() => setCancelOpen(true)}>
                إلغاء الاشتراك والعودة للمجانية
              </Button>
            ) : null}
          </div>

          {data.usage.remainingPosts === 0 ? (
            <Alert kind="warning" title="استهلكت حد النشر لهذه الدورة">
              يمكنك الترقية إلى الخطة المهنية أو انتظار بداية الدورة القادمة لإضافة إعلانات جديدة.
            </Alert>
          ) : null}
        </Card>
      ) : null}

      <section>
        <SectionHead
          title="الخطط المتاحة"
          description="الأسعار بالدينار الأردني. الدورة 30 يوماً من تاريخ التفعيل."
        />

        {checkoutMessage ? (
          <Alert kind="info" title="الدفع الإلكتروني">
            {checkoutMessage}
            <div className="mt-2">
              <a href="mailto:info@fursa.jo" className="btn btn-sm btn-secondary">
                التواصل مع الدعم
              </a>
            </div>
          </Alert>
        ) : null}

        {plans.length === 0 ? (
          <EmptyState title="لا توجد خطط متاحة حالياً" description="يرجى المحاولة لاحقاً أو التواصل مع الدعم." />
        ) : (
          <div className="grid grid-2">
            {plans.map((plan) => {
              const isCurrent = plan.name === currentPlanName;
              const featured = plan.price > 0;
              const isFree = plan.price <= 0;
              return (
                <div key={plan.id} className={featured ? 'plan-card featured' : 'plan-card'}>
                  {featured ? (
                    <span className="badge badge-gold" style={{ position: 'absolute', top: '-0.8rem', insetInlineStart: '1.5rem' }}>
                      <Sparkles size={13} /> الأكثر ملاءمة للنشاط التجاري
                    </span>
                  ) : null}

                  <div className="between">
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{planLabel(plan.name)}</h3>
                    {isCurrent ? <Badge tone="offer">خطتك الحالية</Badge> : <Badge tone="muted">{isFree ? 'للبداية' : 'ترقية'}</Badge>}
                  </div>

                  <div className="plan-price">
                    {isFree ? 'مجاناً' : `${formatPrice(plan.price)}`}
                    {!isFree ? <small> / 30 يوماً</small> : null}
                  </div>

                  <ul className="plan-features">
                    {planFeatures(plan).map((feature) => (
                      <li key={feature}>
                        <Check size={16} /> {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="secondary" block disabled icon={<BadgeCheck size={16} />}>
                      أنت مشترك في هذه الخطة
                    </Button>
                  ) : isFree ? (
                    <Button variant="secondary" block disabled icon={<Info size={16} />}>
                      متاحة تلقائياً بعد انتهاء الاشتراك المدفوع
                    </Button>
                  ) : data?.paymentGatewayConfigured ? (
                    <Button
                      variant="gold"
                      block
                      icon={<CreditCard size={16} />}
                      onClick={() => {
                        setCheckoutMessage(null);
                        setCheckoutTarget(plan);
                      }}
                    >
                      الترقية إلى {planLabel(plan.name)}
                    </Button>
                  ) : (
                    <div className="stack-sm">
                      <Alert kind="warning">
                        الدفع الإلكتروني غير مفعّل حالياً. لتفعيل الخطة المهنية يدوياً، تواصل مع الدعم وسنؤكد الاشتراك بعد
                        استلام الرسوم.
                      </Alert>
                      <a href="mailto:info@fursa.jo?subject=تفعيل الخطة المهنية" className={buttonClass('secondary', 'md', 'btn-block')}>
                        التواصل مع الدعم
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Card pad className="stack-sm">
        <h3 className="row" style={{ gap: '0.4rem' }}>
          <HelpCircle size={18} /> أسئلة عن الاشتراك
        </h3>
        <details>
          <summary className="strong" style={{ cursor: 'pointer' }}>
            ماذا يحدث عند استهلاك حد النشر؟
          </summary>
          <p className="muted small mt-1">
            يمكنك تعديل إعلاناتك الحالية وإغلاقها، لكن لن تتمكن من نشر إعلان جديد حتى بداية دورة الاشتراك التالية أو ترقية
            خطتك.
          </p>
        </details>
        <details>
          <summary className="strong" style={{ cursor: 'pointer' }}>
            هل يمكنني إلغاء الاشتراك؟
          </summary>
          <p className="muted small mt-1">
            نعم، من هذه الصفحة. عند الإلغاء يعود حسابك إلى الخطة المجانية مباشرة، وتُطبّق حدودها على النشر.
          </p>
        </details>
        <details>
          <summary className="strong" style={{ cursor: 'pointer' }}>
            كيف يتم احتساب الدورة؟
          </summary>
          <p className="muted small mt-1">
            تُحتسب حدود النشر ضمن دورة مدتها 30 يوماً. عند الترقية يتم تحديث حد النشر المتبقي وفق الخطة الجديدة.
          </p>
        </details>
        <div className="row small muted" style={{ gap: '0.35rem' }}>
          <ShieldCheck size={14} /> لا نحتفظ ببيانات بطاقتك داخل المنصة. تُعالج المدفوعات عبر مزوّد الدفع عند تفعيله.
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(checkoutTarget)}
        title="تأكيد الاشتراك"
        message={
          checkoutTarget
            ? `سيتم تفعيل ${planLabel(checkoutTarget.name)} لمدة ${formatNumber(checkoutTarget.durationDays)} يوماً بسعر ${formatPrice(
                checkoutTarget.price,
              )}. هل تريد المتابعة؟`
            : ''
        }
        confirmLabel="تأكيد الاشتراك"
        loading={checkingOut}
        onConfirm={() => void checkout()}
        onClose={() => {
          if (!checkingOut) setCheckoutTarget(null);
        }}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="إلغاء الاشتراك"
        message="سيتم إلغاء الاشتراك المهني والعودة إلى الخطة المجانية مباشرة، مع تطبيق حد النشر الشهري للخطة المجانية. هل تريد المتابعة؟"
        confirmLabel="إلغاء الاشتراك"
        danger
        loading={canceling}
        onConfirm={() => void cancel()}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  );
}
