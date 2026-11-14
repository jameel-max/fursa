import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { Checkbox, Input } from '../components/ui/Form';
import { useAuth } from '../context/AuthContext';
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

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const nextErrors: Record<string, string> = {};

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
