import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Leaf, RefreshCw, Save, Settings, Wallet } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../../lib/validation';
import { Button } from '../../components/ui/Button';
import { Alert, LoadingBlock } from '../../components/ui/Feedback';
import { Card, PageHeader } from '../../components/ui/Surfaces';
import { Input } from '../../components/ui/Form';

interface SettingsResponse {
  items: Record<string, string>;
}

const DEFAULTS: Record<string, string> = {
  free_post_limit: '5',
  professional_post_limit: '50',
  professional_price: '4.97',
  listing_expiry_days: '30',
};

export function AdminSettingsPage() {
  const { showToast } = useToast();

  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [savedValues, setSavedValues] = useState<Record<string, string>>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<SettingsResponse>('/admin/settings');
      const next = { ...DEFAULTS, ...data.items };
      setValues(next);
      setSavedValues(next);
    } catch (err) {
      setError(getErrorMessage(err, 'تعذّر تحميل إعدادات المنصة.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const dirty = useMemo(
    () => Object.keys(DEFAULTS).some((key) => (values[key] ?? '') !== (savedValues[key] ?? '')),
    [values, savedValues],
  );

  const setValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    const integerKeys = ['free_post_limit', 'professional_post_limit', 'listing_expiry_days'];
    for (const key of integerKeys) {
      const numeric = Number(values[key]);
      if (!values[key]?.trim() || !Number.isInteger(numeric) || numeric < 1 || numeric > 3650) {
        errors[key] = 'أدخل عدداً صحيحاً بين 1 و3650.';
      }
    }
    const price = Number(values.professional_price);
    if (!values.professional_price?.trim() || !Number.isFinite(price) || price < 0.01 || price > 10000) {
      errors.professional_price = 'أدخل سعراً صحيحاً أكبر من صفر.';
    }
    if (!errors.free_post_limit && !errors.professional_post_limit) {
      if (Number(values.free_post_limit) >= Number(values.professional_post_limit)) {
        errors.free_post_limit = 'حد الخطة المجانية يجب أن يكون أقل من حد الخطة المهنية.';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string> = {};
      for (const key of Object.keys(DEFAULTS)) payload[key] = String(Number(values[key]));
      await api('/admin/settings', { method: 'PATCH', body: payload });
      setSavedValues(payload);
      setValues(payload);
      showToast('تم حفظ إعدادات المنصة وتطبيقها.');
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'تعذّر حفظ إعدادات المنصة.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingBlock label="جارٍ تحميل إعدادات المنصة…" />;
  }

  return (
    <div className="stack">
      <PageHeader
        title="إعدادات المنصة"
        description="تحكم في حدود النشر وسعر الخطة المهنية ومدة صلاحية الإعلانات. تُطبّق التغييرات على العمليات الجديدة مباشرة."
        actions={
          <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={() => void load()} loading={loading}>
            إعادة التحميل
          </Button>
        }
      />

      {error ? <Alert kind="error">{error}</Alert> : null}

      <form className="stack" onSubmit={save} noValidate>
        <Card pad className="stack">
          <div className="row" style={{ gap: '0.45rem' }}>
            <span className="tile-icon">
              <Settings size={18} />
            </span>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>حدود النشر الشهرية</h2>
              <p className="small muted">عدد الإعلانات التي يمكن لكل حساب نشرها خلال دورة الاشتراك.</p>
            </div>
          </div>

          <div className="form-grid">
            <Input
              label="حد الخطة المجانية"
              type="number"
              min={1}
              max={3650}
              step={1}
              required
              value={values.free_post_limit ?? ''}
              onChange={(event) => setValue('free_post_limit', event.target.value)}
              error={fieldErrors.free_post_limit}
              hint="عدد الإعلانات شهرياً للحسابات المجانية."
            />
            <Input
              label="حد الخطة المهنية"
              type="number"
              min={1}
              max={3650}
              step={1}
              required
              value={values.professional_post_limit ?? ''}
              onChange={(event) => setValue('professional_post_limit', event.target.value)}
              error={fieldErrors.professional_post_limit}
              hint="عدد الإعلانات شهرياً للمشتركين في الخطة المهنية."
            />
          </div>

          {Number(values.free_post_limit) >= Number(values.professional_post_limit) ? (
            <Alert kind="warning">
              حد الخطة المجانية يجب أن يكون أقل من حد الخطة المهنية حتى تبقى الترقية ذات قيمة للمستخدمين.
            </Alert>
          ) : null}
        </Card>

        <Card pad className="stack">
          <div className="row" style={{ gap: '0.45rem' }}>
            <span className="tile-icon">
              <Wallet size={18} />
            </span>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>سعر الخطة المهنية</h2>
              <p className="small muted">السعر المعروض عند شراء الاشتراك، بالدينار الأردني.</p>
            </div>
          </div>

          <div className="form-grid">
            <Input
              label="سعر الخطة المهنية (د.أ)"
              type="number"
              min={0.01}
              max={10000}
              step="0.01"
              inputMode="decimal"
              required
              value={values.professional_price ?? ''}
              onChange={(event) => setValue('professional_price', event.target.value)}
              error={fieldErrors.professional_price}
              hint="يظهر هذا السعر في صفحة الاشتراك لجميع المستخدمين."
            />
          </div>

          <p className="small muted">
            ملاحظة: تُحتسب دورة الاشتراك 30 يوماً من تاريخ التفعيل، ولا يتأثر بها هذا الحقل.
          </p>
        </Card>

        <Card pad className="stack">
          <div className="row" style={{ gap: '0.45rem' }}>
            <span className="tile-icon">
              <Leaf size={18} />
            </span>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>صلاحية الإعلانات</h2>
              <p className="small muted">المدة التي يبقى فيها الإعلان الجديد ظاهراً قبل أن يُعد منتهياً.</p>
            </div>
          </div>

          <div className="form-grid">
            <Input
              label="مدة صلاحية الإعلان (أيام)"
              type="number"
              min={1}
              max={3650}
              step={1}
              required
              value={values.listing_expiry_days ?? ''}
              onChange={(event) => setValue('listing_expiry_days', event.target.value)}
              error={fieldErrors.listing_expiry_days}
              hint="تُطبق على الإعلانات التي تُنشر بعد حفظ الإعداد."
            />
          </div>

          <div className="notice small">
            <AlertTriangle size={15} style={{ display: 'inline', verticalAlign: '-3px', marginInlineEnd: '0.3rem' }} />
            تغيير المدة لا يعدّل تواريخ انتهاء الإعلانات المنشورة مسبقاً.
          </div>
        </Card>

        <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setValues(savedValues);
              setFieldErrors({});
              setError(null);
            }}
            disabled={!dirty || saving}
          >
            استعادة القيم المحفوظة
          </Button>
          <Button type="submit" loading={saving} disabled={!dirty} icon={<Save size={16} />}>
            حفظ الإعدادات
          </Button>
        </div>
      </form>

      <Card pad className="small muted">
        تُسجل كل عملية تحديث للإعدادات في سجل التدقيق مع اسم المشرف ووقت التعديل.
      </Card>
    </div>
  );
}
