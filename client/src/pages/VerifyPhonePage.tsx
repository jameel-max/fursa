import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, RotateCw, ShieldCheck } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/ui/Button';
import { Alert, EmptyState } from '../components/ui/Feedback';
import { Input } from '../components/ui/Form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/validation';

function safeNext(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/dashboard';
}

export function VerifyPhonePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPhone } = useAuth();
  const { showToast } = useToast();

  const phone = (searchParams.get('phone') ?? '').trim();
  const next = safeNext(searchParams.get('next'));
  const initialDevCode = searchParams.get('devCode') ?? '';

  const [code, setCode] = useState(initialDevCode);
  const [devCode, setDevCode] = useState(initialDevCode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  if (!phone) {
    return (
      <div className="page container">
        <EmptyState
          icon={<ShieldCheck size={26} />}
          title="رقم الهاتف غير محدد"
          description="ابدأ بإنشاء حساب جديد أو سجّل الدخول، وسنرسل رمز التحقق إلى رقمك."
          action={
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <Link to="/register" className="btn">
                إنشاء حساب
              </Link>
              <Link to="/login" className="btn btn-secondary">
                تسجيل الدخول
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyPhone(phone, code.trim());
      showToast('تم تأكيد رقم الهاتف وتفعيل حسابك.');
      navigate(next, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'تعذّر تأكيد رمز التحقق.'));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setResending(true);
    try {
      const result = await api<{ phone: string; devCode?: string }>('/auth/resend-otp', {
        method: 'POST',
        body: { phone },
      });
      setCooldown(60);
      if (result.devCode) {
        setDevCode(result.devCode);
        setCode(result.devCode);
      }
      showToast('تم إرسال رمز تحقق جديد.');
    } catch (err) {
      setError(getErrorMessage(err, 'تعذّر إرسال رمز التحقق.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="تأكيد رقم الهاتف"
      subtitle={`أرسلنا رمز تحقق مكوّناً من 6 أرقام إلى الرقم ${phone}.`}
      asideTitle="خطوة واحدة تفصلك عن السوق."
      asideText="تأكيد رقم الهاتف يحمي حسابك ويزيد ثقة بقية المستخدمين عند التعامل معك."
      benefits={['حساب موثّق وشارة ثقة', 'استلام إشعارات العروض والرسائل', 'إمكانية نشر الإعلانات والتواصل']}
      footer={
        <>
          أدخلت رقماً خاطئاً؟ <Link to="/register">ابدأ من جديد</Link>
        </>
      }
    >
      <form className="stack" onSubmit={onSubmit} noValidate>
        {error ? <Alert kind="error">{error}</Alert> : null}

        {devCode ? (
          <div className="notice">
            <strong>وضع التطوير: </strong> رمز التحقق الحالي هو <code className="code-hint">{devCode}</code>
          </div>
        ) : null}

        <Input
          label="رمز التحقق"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          hint="أدخل الأرقام الستة المرسلة إلى هاتفك."
          placeholder="------"
          style={{ letterSpacing: '0.4em', fontSize: '1.2rem', textAlign: 'center' }}
          maxLength={6}
        />

        <Button type="submit" size="lg" block loading={loading} icon={<ShieldCheck size={18} />}>
          تأكيد وتفعيل الحساب
        </Button>

        <div className="between">
          <Button
            type="button"
            variant="ghost"
            onClick={onResend}
            loading={resending}
            disabled={cooldown > 0}
            icon={<RotateCw size={15} />}
          >
            {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : 'إعادة إرسال الرمز'}
          </Button>
          <Link to="/login" className="small row" style={{ gap: '0.35rem' }}>
            <KeyRound size={15} /> تسجيل الدخول
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
