import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, RotateCw, Send } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { Input } from '../components/ui/Form';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { getErrorMessage, getFieldErrors } from '../lib/validation';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devCode, setDevCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const result = await api<{ phone: string; devCode?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { phone: phone.trim() },
      });
      if (result.devCode) {
        setDevCode(result.devCode);
        setCode(result.devCode);
      }
      setStep(2);
      showToast('تم إرسال رمز إعادة تعيين كلمة المرور.');
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'تعذّر إرسال رمز إعادة التعيين.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'كلمتا المرور غير متطابقتين.' });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { phone: phone.trim(), code: code.trim(), newPassword, confirmPassword },
      });
      showToast('تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.');
      navigate('/login', { replace: true });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'تعذّر إعادة تعيين كلمة المرور.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? 'نسيت كلمة المرور؟' : 'إعادة تعيين كلمة المرور'}
      subtitle={
        step === 1
          ? 'أدخل رقم هاتفك وسنرسل رمز تحقق لإعادة تعيين كلمة المرور.'
          : `أدخل رمز التحقق المرسل إلى ${phone} ثم اختر كلمة مرور جديدة.`
      }
      asideTitle="استعد الوصول إلى حسابك بأمان."
      asideText="لن نكشف بيانات حسابك لأي طرف. رمز التحقق صالح لفترة محدودة ويُستخدم مرة واحدة فقط."
      benefits={['رمز تحقق لمرة واحدة', 'كلمة مرور مشفّرة', 'حماية بيانات حسابك']}
      footer={
        <>
          تذكرت كلمة المرور؟ <Link to="/login">تسجيل الدخول</Link>
        </>
      }
    >
      {step === 1 ? (
        <form className="stack" onSubmit={requestCode} noValidate>
          {error ? <Alert kind="error">{error}</Alert> : null}
          <Input
            label="رقم الهاتف"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={fieldErrors.phone}
            placeholder="07XXXXXXXX"
          />
          <Button type="submit" size="lg" block loading={loading} icon={<Send size={18} />}>
            إرسال رمز التحقق
          </Button>
        </form>
      ) : (
        <form className="stack" onSubmit={resetPassword} noValidate>
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
            error={fieldErrors.code}
            maxLength={6}
            placeholder="------"
            style={{ letterSpacing: '0.4em', fontSize: '1.2rem', textAlign: 'center' }}
          />

          <Input
            label="كلمة المرور الجديدة"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={fieldErrors.newPassword}
            hint="8 أحرف على الأقل وتحتوي أحرفاً وأرقاماً."
          />

          <Input
            label="تأكيد كلمة المرور"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
          />

          <Button type="submit" size="lg" block loading={loading} icon={<KeyRound size={18} />}>
            حفظ كلمة المرور الجديدة
          </Button>

          <div className="between">
            <Button
              type="button"
              variant="ghost"
              icon={<RotateCw size={15} />}
              onClick={() => {
                setStep(1);
                setError(null);
                setFieldErrors({});
              }}
            >
              تغيير رقم الهاتف
            </Button>
            <Button
              type="button"
              variant="ghost"
              icon={<RotateCw size={15} />}
              onClick={(event) => void requestCode(event)}
              loading={loading}
            >
              إعادة إرسال الرمز
            </Button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
