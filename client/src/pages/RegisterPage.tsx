import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, UserPlus, X } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { Checkbox, Input, Select, Textarea } from '../components/ui/Form';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../lib/catalog';
import { getErrorMessage, getFieldErrors } from '../lib/validation';

function safeNext(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/dashboard';
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const { specialties: catalogSpecialties, governorates, loading: catalogLoading } = useCatalog();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [area, setArea] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<Array<number | string>>([]);
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const customSpecialties = useMemo(
    () => selectedSpecialties.filter((item): item is string => typeof item === 'string'),
    [selectedSpecialties],
  );

  const toggleSpecialty = (specialtyId: number) => {
    setSelectedSpecialties((current) => {
      if (current.includes(specialtyId)) return current.filter((item) => item !== specialtyId);
      if (current.length >= 3) return current;
      return [...current, specialtyId];
    });
    setFieldErrors((current) => ({ ...current, specialties: '' }));
  };

  const addCustomSpecialty = () => {
    const value = customSpecialty.trim();
    if (!value) return;
    if (selectedSpecialties.length >= 3) {
      setFieldErrors((current) => ({ ...current, specialties: 'يمكنك اختيار 3 تخصصات كحد أقصى.' }));
      return;
    }
    if (selectedSpecialties.some((item) => typeof item === 'string' && item === value)) return;
    setSelectedSpecialties((current) => [...current, value]);
    setCustomSpecialty('');
    setFieldErrors((current) => ({ ...current, specialties: '' }));
  };

  const removeSpecialty = (value: number | string) => {
    setSelectedSpecialties((current) => current.filter((item) => item !== value));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const nextErrors: Record<string, string> = {};

    if (selectedSpecialties.length === 0) nextErrors.specialties = 'اختر تخصصاً واحداً على الأقل.';
    if (password !== passwordConfirm) nextErrors.passwordConfirm = 'كلمتا المرور غير متطابقتين.';
    if (!termsAccepted) nextErrors.termsAccepted = 'يجب الموافقة على الشروط والأحكام.';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const result = await register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
        passwordConfirm,
        termsAccepted,
        specialties: selectedSpecialties,
        businessName: businessName.trim() || undefined,
        description: description.trim() || undefined,
        governorateId: governorateId ? Number(governorateId) : undefined,
        area: area.trim() || undefined,
      });
      const params = new URLSearchParams({ phone: phone.trim(), next });
      if (result.devCode) params.set('devCode', result.devCode);
      navigate(`/verify?${params.toString()}`, { replace: true });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'تعذّر إنشاء الحساب.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="إنشاء حساب جديد"
      subtitle="سجّل بياناتك الأساسية، ثم أكّد رقم هاتفك برمز التحقق."
      asideTitle="انضم إلى سوق فُرصة الزراعي."
      asideText="سواء كنت مزارعاً أو تاجراً أو مقدم خدمة نقل أو مستلزمات، ستجد في فُرصة مساحة لعرض ما لديك والوصول إلى ما تحتاجه."
      benefits={['نشر عروض وطلبات شراء', 'تقديم عروض على طلبات التجار', 'رسائل داخلية وتواصل مباشر']}
      footer={
        <>
          لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
        </>
      }
    >
      <form className="stack" onSubmit={onSubmit} noValidate>
        {error ? <Alert kind="error">{error}</Alert> : null}

        <div className="auth-steps" aria-hidden="true">
          <span className="auth-step done" />
          <span className="auth-step" />
          <span className="auth-step" />
        </div>

        <Input
          label="الاسم الكامل"
          autoComplete="name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={fieldErrors.fullName}
          placeholder="مثال: أحمد محمود العلي"
        />

        <Input
          label="رقم الهاتف"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={fieldErrors.phone}
          hint="سيُستخدم لتسجيل الدخول واستلام رمز التحقق."
          placeholder="07XXXXXXXX"
        />

        <div className="form-grid">
          <Input
            label="كلمة المرور"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            hint="8 أحرف على الأقل وتحتوي أحرفاً وأرقاماً."
          />
          <Input
            label="تأكيد كلمة المرور"
            type="password"
            autoComplete="new-password"
            required
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            error={fieldErrors.passwordConfirm}
          />
        </div>

        <div className="field">
          <span className="label">
            التخصصات <span className="muted small">(حتى 3)</span>
          </span>
          <div className="chip-row">
            {catalogLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <span key={index} className="skeleton" style={{ width: 92, height: 32, borderRadius: 999 }} />
                ))
              : catalogSpecialties.map((specialty) => {
                  const active = selectedSpecialties.includes(specialty.id);
                  return (
                    <button
                      key={specialty.id}
                      type="button"
                      className={active ? 'chip active' : 'chip'}
                      aria-pressed={active}
                      onClick={() => toggleSpecialty(specialty.id)}
                    >
                      {specialty.name}
                    </button>
                  );
                })}
          </div>
          {customSpecialties.length > 0 ? (
            <div className="chip-row">
              {customSpecialties.map((value) => (
                <span key={value} className="chip active">
                  {value}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(value)}
                    aria-label={`إزالة ${value}`}
                    style={{ border: 0, background: 'transparent', padding: 0, color: 'inherit', display: 'inline-flex' }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          {fieldErrors.specialties ? (
            <span className="field-error" role="alert">
              {fieldErrors.specialties}
            </span>
          ) : null}
          <div className="row mt-1" style={{ gap: '0.4rem' }}>
            <input
              className="input"
              value={customSpecialty}
              onChange={(event) => setCustomSpecialty(event.target.value)}
              placeholder="تخصص آخر غير موجود بالقائمة"
              aria-label="تخصص آخر"
              maxLength={60}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCustomSpecialty();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addCustomSpecialty} icon={<Plus size={16} />}>
              إضافة
            </Button>
          </div>
        </div>

        <div className="form-grid">
          <Input
            label="اسم النشاط التجاري (اختياري)"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            error={fieldErrors.businessName}
            placeholder="مثال: مزرعة الوادي الأخضر"
          />
          <Select
            label="المحافظة (اختياري)"
            value={governorateId}
            onChange={(event) => setGovernorateId(event.target.value)}
            error={fieldErrors.governorateId}
            options={governorates.map((governorate) => ({ value: governorate.id, label: governorate.nameAr }))}
            placeholder="اختر المحافظة"
          />
        </div>

        <div className="form-grid">
          <Input
            label="المنطقة (اختياري)"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            error={fieldErrors.area}
            placeholder="مثال: وادي الأردن / دير علا"
          />
        </div>

        <Textarea
          label="نبذة عن نشاطك (اختياري)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={fieldErrors.description}
          maxLength={2000}
          placeholder="عرّف بنشاطك، منتجاتك، أو الخدمات التي تقدمها."
        />

        <div>
          <Checkbox
            label={
              <>
                أوافق على <Link to="/about#terms">الشروط والأحكام</Link> و<Link to="/about#privacy">سياسة الخصوصية</Link>.
              </>
            }
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            error={fieldErrors.termsAccepted}
          />
        </div>

        <Button type="submit" size="lg" block loading={loading} icon={<UserPlus size={18} />}>
          إنشاء الحساب
        </Button>
      </form>
    </AuthShell>
  );
}
