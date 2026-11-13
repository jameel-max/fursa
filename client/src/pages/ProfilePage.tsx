import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  Eye,
  KeyRound,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCatalog } from '../lib/catalog';
import { accountStatusLabel, formatDate, roleLabel } from '../lib/format';
import { getErrorMessage, getFieldErrors } from '../lib/validation';
import { Button, buttonClass } from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { Input, Select, Switch, Textarea } from '../components/ui/Form';
import { Avatar, Badge, Card, PageHeader } from '../components/ui/Surfaces';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { specialties: catalogSpecialties, governorates } = useCatalog();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<Array<string | number>>([]);
  const [customSpecialty, setCustomSpecialty] = useState('');

  const [showPhone, setShowPhone] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [internalMessagesEnabled, setInternalMessagesEnabled] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});
  const [contactError, setContactError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setBusinessName(user.profile?.businessName ?? '');
    setGovernorateId(user.profile?.governorateId ? String(user.profile.governorateId) : '');
    setArea(user.profile?.area ?? '');
    setDescription(user.profile?.description ?? '');
    setSelectedSpecialties(
      user.specialties
        .map((specialty) => specialty.id ?? specialty.customSpecialty ?? '')
        .filter((value): value is string | number => value !== ''),
    );
    setShowPhone(Boolean(user.contactPreferences.showPhone));
    setWhatsappEnabled(Boolean(user.contactPreferences.whatsappEnabled));
    setInternalMessagesEnabled(Boolean(user.contactPreferences.internalMessagesEnabled));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) {
    return (
      <div className="page container">
        <Alert kind="warning">يرجى تسجيل الدخول للوصول إلى الملف الشخصي.</Alert>
      </div>
    );
  }

  const toggleSpecialty = (specialtyId: number) => {
    setSelectedSpecialties((current) => {
      if (current.includes(specialtyId)) return current.filter((item) => item !== specialtyId);
      if (current.length >= 3) return current;
      return [...current, specialtyId];
    });
    setProfileFieldErrors((current) => ({ ...current, specialties: '' }));
  };

  const addCustomSpecialty = () => {
    const value = customSpecialty.trim();
    if (!value) return;
    if (selectedSpecialties.length >= 3) {
      setProfileFieldErrors((current) => ({ ...current, specialties: 'يمكنك اختيار 3 تخصصات كحد أقصى.' }));
      return;
    }
    if (selectedSpecialties.some((item) => typeof item === 'string' && item === value)) return;
    setSelectedSpecialties((current) => [...current, value]);
    setCustomSpecialty('');
    setProfileFieldErrors((current) => ({ ...current, specialties: '' }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    if (fullName.trim().length < 3) {
      setProfileFieldErrors({ fullName: 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل.' });
      return;
    }
    setProfileFieldErrors({});
    setSavingProfile(true);
    try {
      await api('/users/me', {
        method: 'PATCH',
        body: {
          fullName: fullName.trim(),
          businessName: businessName.trim(),
          description: description.trim(),
          area: area.trim(),
          governorateId: governorateId ? Number(governorateId) : undefined,
          specialties: selectedSpecialties,
        },
      });
      await refreshUser();
      showToast('تم حفظ بيانات الملف الشخصي.');
    } catch (err) {
      setProfileFieldErrors(getFieldErrors(err));
      setProfileError(getErrorMessage(err, 'تعذّر حفظ الملف الشخصي.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const saveContact = async (event: React.FormEvent) => {
    event.preventDefault();
    setContactError(null);
    setSavingContact(true);
    try {
      await api('/users/me/contact', {
        method: 'PATCH',
        body: {
          showPhone,
          whatsappEnabled,
          internalMessagesEnabled,
        },
      });
      await refreshUser();
      showToast('تم حفظ تفضيلات التواصل.');
    } catch (err) {
      setContactError(getErrorMessage(err, 'تعذّر حفظ تفضيلات التواصل.'));
    } finally {
      setSavingContact(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordFieldErrors({ confirmPassword: 'كلمتا المرور الجديدتان غير متطابقتين.' });
      return;
    }
    setPasswordFieldErrors({});
    setSavingPassword(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword, confirmPassword },
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('تم تغيير كلمة المرور بنجاح.');
    } catch (err) {
      setPasswordFieldErrors(getFieldErrors(err));
      setPasswordError(getErrorMessage(err, 'تعذّر تغيير كلمة المرور.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const customSpecialties = selectedSpecialties.filter((item): item is string => typeof item === 'string');

  return (
    <div className="stack">
      <PageHeader
        title="الملف الشخصي"
        description="حدّث بياناتك وتفضيلات التواصل وكلمة المرور. تظهر بياناتك للآخرين في الإعلانات والمحادثات."
      />

      <Card pad className="stack-sm">
        <div className="row wrap" style={{ gap: '1rem' }}>
          <Avatar name={user.fullName} size="lg" />
          <div className="grow">
            <h2 style={{ fontSize: '1.25rem' }}>{user.fullName}</h2>
            <div className="row wrap small muted mt-1" style={{ gap: '0.75rem' }}>
              <span className="row" style={{ gap: '0.3rem' }}>
                <Phone size={14} /> {user.phone}
              </span>
              <span className="row" style={{ gap: '0.3rem' }}>
                <BadgeCheck size={14} /> عضو منذ {formatDate(user.createdAt)}
              </span>
              <span>{roleLabel[user.role]}</span>
            </div>
          </div>
          <div className="row wrap">
            <Badge tone={user.accountStatus === 'active' ? 'offer' : 'warning'}>
              {accountStatusLabel[user.accountStatus] ?? user.accountStatus}
            </Badge>
            <Badge tone="muted">{user.accountStatus === 'active' ? 'هاتف موثّق' : 'هاتف غير موثّق'}</Badge>
          </div>
        </div>
        {user.profile?.businessName ? (
          <div className="row small" style={{ gap: '0.35rem' }}>
            <Building2 size={15} className="muted" /> {user.profile.businessName}
          </div>
        ) : null}
        {user.profile?.governorateId ? (
          <div className="row small" style={{ gap: '0.35rem' }}>
            <MapPin size={15} className="muted" />{' '}
            {governorates.find((governorate) => governorate.id === user.profile?.governorateId)?.nameAr ??
              `محافظة #${user.profile.governorateId}`}
            {user.profile.area ? ` · ${user.profile.area}` : ''}
          </div>
        ) : null}
        <div className="row wrap">
          <Link to="/subscription" className={buttonClass('secondary', 'sm')}>
            إدارة الاشتراك
          </Link>
          <Link to="/dashboard/listings" className={buttonClass('ghost', 'sm')}>
            إعلاناتي
          </Link>
        </div>
      </Card>

      <form className="stack" onSubmit={saveProfile} noValidate>
        <Card pad className="stack">
          <div>
            <h2 className="row" style={{ gap: '0.4rem', fontSize: '1.1rem' }}>
              <User size={18} /> البيانات الأساسية
            </h2>
            <p className="small muted mt-1">اسمك ورقم هاتفك يظهران للآخرين حسب إعداداتك.</p>
          </div>

          {profileError ? <Alert kind="error">{profileError}</Alert> : null}

          <div className="form-grid">
            <Input
              label="الاسم الكامل"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={profileFieldErrors.fullName}
              maxLength={80}
            />
            <Input
              label="رقم الهاتف"
              value={user.phone}
              readOnly
              disabled
              hint="لتغيير رقم الهاتف يرجى التواصل مع الدعم."
            />
          </div>

          <div className="form-grid">
            <Input
              label="اسم النشاط التجاري (اختياري)"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              error={profileFieldErrors.businessName}
              maxLength={120}
              placeholder="مثال: مزرعة الوادي الأخضر"
            />
            <Select
              label="المحافظة (اختياري)"
              value={governorateId}
              onChange={(event) => setGovernorateId(event.target.value)}
              options={governorates.map((governorate) => ({ value: governorate.id, label: governorate.nameAr }))}
              placeholder="اختر المحافظة"
              error={profileFieldErrors.governorateId}
            />
          </div>

          <Input
            label="المنطقة (اختياري)"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            error={profileFieldErrors.area}
            maxLength={120}
            placeholder="مثال: وادي الأردن / دير علا"
          />

          <Textarea
            label="نبذة عن نشاطك (اختياري)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            error={profileFieldErrors.description}
            maxLength={2000}
            rows={5}
            placeholder="عرّف بنشاطك ومنتجاتك أو خدماتك."
            hint={`${description.length}/2000`}
          />

          <div className="field">
            <span className="label">التخصصات (حتى 3)</span>
            <div className="chip-row">
              {catalogSpecialties.map((specialty) => {
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
              {customSpecialties.map((value) => (
                <span key={value} className="chip active">
                  {value}
                  <button
                    type="button"
                    onClick={() => setSelectedSpecialties((current) => current.filter((item) => item !== value))}
                    aria-label={`إزالة ${value}`}
                    style={{ border: 0, background: 'transparent', padding: 0, color: 'inherit', display: 'inline-flex', marginInlineStart: '0.25rem' }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            {profileFieldErrors.specialties ? <span className="field-error">{profileFieldErrors.specialties}</span> : null}
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

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button type="submit" loading={savingProfile} icon={<Save size={16} />}>
              حفظ البيانات
            </Button>
          </div>
        </Card>
      </form>

      <form className="stack" onSubmit={saveContact} noValidate>
        <Card pad className="stack">
          <div>
            <h2 className="row" style={{ gap: '0.4rem', fontSize: '1.1rem' }}>
              <Eye size={18} /> تفضيلات التواصل
            </h2>
            <p className="small muted mt-1">تحكم في كيفية ظهور بيانات التواصل الخاصة بك للآخرين.</p>
          </div>

          {contactError ? <Alert kind="error">{contactError}</Alert> : null}

          <Switch
            label="إظهار رقم الهاتف في الإعلانات"
            description="عند التفعيل يظهر رقمك لمن يشاهد إعلاناتك."
            checked={showPhone}
            onChange={(event) => setShowPhone(event.target.checked)}
          />
          <Switch
            label="تفعيل التواصل عبر واتساب"
            description="يظهر زر واتساب في صفحتك ويستخدم رقمك المعلن."
            checked={whatsappEnabled}
            onChange={(event) => setWhatsappEnabled(event.target.checked)}
          />
          <Switch
            label="استقبال الرسائل الداخلية"
            description="السماح للمستخدمين ببدء محادثة معك داخل المنصة."
            checked={internalMessagesEnabled}
            onChange={(event) => setInternalMessagesEnabled(event.target.checked)}
          />

          {!showPhone && whatsappEnabled ? (
            <p className="small muted">ملاحظة: تفعيل واتساب دون إظهار رقم الهاتف قد يمنع الآخرين من رؤية رقمك.</p>
          ) : null}

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button type="submit" loading={savingContact} icon={<MessageSquare size={16} />}>
              حفظ تفضيلات التواصل
            </Button>
          </div>
        </Card>
      </form>

      <form className="stack" onSubmit={changePassword} noValidate>
        <Card pad className="stack">
          <div>
            <h2 className="row" style={{ gap: '0.4rem', fontSize: '1.1rem' }}>
              <KeyRound size={18} /> تغيير كلمة المرور
            </h2>
            <p className="small muted mt-1">استخدم كلمة مرور قوية تحتوي أحرفاً وأرقاماً، لا تقل عن 8 أحرف.</p>
          </div>

          {passwordError ? <Alert kind="error">{passwordError}</Alert> : null}

          <div className="form-grid">
            <Input
              label="كلمة المرور الحالية"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              error={passwordFieldErrors.currentPassword}
            />
            <Input
              label="كلمة المرور الجديدة"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              error={passwordFieldErrors.newPassword}
            />
          </div>

          <Input
            label="تأكيد كلمة المرور الجديدة"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={passwordFieldErrors.confirmPassword}
          />

          <div className="row wrap" style={{ justifyContent: 'space-between' }}>
            <span className="small muted row" style={{ gap: '0.35rem' }}>
              <ShieldCheck size={14} /> كلمات المرور تُخزَّن مشفّرة ولا يمكن لأي موظف الاطلاع عليها.
            </span>
            <Button type="submit" loading={savingPassword} icon={<KeyRound size={16} />}>
              تحديث كلمة المرور
            </Button>
          </div>
        </Card>
      </form>

      <Card pad className="small muted">
        يمكنك إدارة تفضيلات الإشعارات من صفحة الإشعارات، وإدارة الخطة من صفحة الاشتراك.
      </Card>
    </div>
  );
}
