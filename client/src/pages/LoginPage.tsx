import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { Input } from '../components/ui/Form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../lib/api';
import { getErrorMessage } from '../lib/validation';

function safeNext(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/dashboard';
}

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get('next'));

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(phone.trim(), password);
      showToast(`مرحباً ${user.fullName}`);
      navigate(next, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ACCOUNT_NOT_VERIFIED') {
        navigate(`/verify?phone=${encodeURIComponent(phone.trim())}&next=${encodeURIComponent(next)}`, { replace: true });
        return;
      }
      setError(getErrorMessage(err, 'تعذّر تسجيل الدخول.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="أدخل رقم هاتفك وكلمة المرور للوصول إلى حسابك."
      asideTitle="مرحباً بعودتك إلى فُرصة."
      asideText="تابع إعلاناتك، عروضك، رسائلك، واشتراكك من لوحة تحكم واحدة."
      footer={
        <>
          ليس لديك حساب؟{' '}
          <Link to={`/register${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`}>
            أنشئ حساباً جديداً
          </Link>
        </>
      }
    >
      <form className="stack" onSubmit={onSubmit} noValidate>
        {error ? <Alert kind="error">{error}</Alert> : null}

        <Input
          label="رقم الهاتف"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="07XXXXXXXX"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          hint="رقم أردني يبدأ بـ 07"
        />

        <Input
          label="كلمة المرور"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div className="between">
          <Link to="/forgot-password" className="small">
            نسيت كلمة المرور؟
          </Link>
        </div>

        <Button type="submit" size="lg" block loading={loading} icon={<LogIn size={18} />}>
          تسجيل الدخول
        </Button>
      </form>

      {import.meta.env.DEV ? (
        <details className="mt-4">
          <summary className="small muted" style={{ cursor: 'pointer' }}>
            حسابات تجريبية (بيانات البذرة)
          </summary>
          <div className="small muted mt-2" style={{ display: 'grid', gap: '0.35rem' }}>
            <span>مشرف: 0790000000 / Admin1234</span>
            <span>مزارع: 0790000001 / FURSA123</span>
            <span>تاجر: 0790000002 / FURSA123</span>
            <span>ناقل: 0790000003 / FURSA123</span>
          </div>
        </details>
      ) : null}
    </AuthShell>
  );
}
