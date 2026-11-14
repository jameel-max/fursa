import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/validation';
import { Button } from '../../components/ui/Button';
import { Alert, LoadingBlock } from '../../components/ui/Feedback';
import { Card, PageHeader } from '../../components/ui/Surfaces';

interface AdminSpecialty {
  id: number;
  name: string;
  code: string | null;
  nameEn: string | null;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  userCount: number;
  permissions: string[];
}

interface AdminPermission {
  code: string;
  labelAr: string;
  isBase: boolean;
}

interface SpecialtiesResponse {
  specialties: AdminSpecialty[];
  permissions: AdminPermission[];
}

export function AdminSpecialtiesPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<SpecialtiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSpec, setNewSpec] = useState({ name: '', nameEn: '', description: '', icon: '' });

  const createSpecialty = async () => {
    if (newSpec.name.trim().length < 2) {
      showToast('أدخل اسم التخصص.', 'error');
      return;
    }
    setBusy('create');
    try {
      await api('/admin/specialties', {
        method: 'POST',
        body: {
          name: newSpec.name.trim(),
          nameEn: newSpec.nameEn.trim() || undefined,
          description: newSpec.description.trim() || undefined,
          icon: newSpec.icon.trim() || undefined,
        },
      });
      showToast('تمت إضافة التخصص.');
      setNewSpec({ name: '', nameEn: '', description: '', icon: '' });
      setShowCreate(false);
      await load();
    } catch (err) {
      showToast(getErrorMessage(err, 'تعذّر إضافة التخصص.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api<SpecialtiesResponse>('/admin/specialties');
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, 'تعذّر تحميل التخصصات.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (specialty: AdminSpecialty) => {
    setBusy(`active-${specialty.id}`);
    try {
      await api(`/admin/specialties/${specialty.id}`, {
        method: 'PATCH',
        body: { isActive: !specialty.isActive },
      });
      showToast(specialty.isActive ? 'تم تعطيل التخصص.' : 'تم تفعيل التخصص.');
      await load();
    } catch (err) {
      showToast(getErrorMessage(err, 'تعذّر تحديث التخصص.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const togglePermission = async (specialty: AdminSpecialty, permissionCode: string, enabled: boolean) => {
    if (!specialty.code) return;
    setBusy(`perm-${specialty.code}-${permissionCode}`);
    try {
      await api(`/admin/specialties/${specialty.code}/permissions`, {
        method: 'PATCH',
        body: { permissionCode, enabled: !enabled },
      });
      await load();
    } catch (err) {
      showToast(getErrorMessage(err, 'تعذّر تحديث الصلاحية.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const nonBasePermissions = (data?.permissions ?? []).filter((p) => !p.isBase);

  return (
    <div className="stack">
      <PageHeader
        eyebrow={<span className="eyebrow"><ShieldCheck size={15} /> الصلاحيات</span>}
        title="التخصصات والصلاحيات"
        description="إدارة تخصصات المستخدمين ومصفوفة الصلاحيات المرتبطة بكل تخصص. التغييرات تسري فوراً على حسابات المستخدمين."
        actions={
          <div className="row" style={{ gap: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setShowCreate((v) => !v)} icon={<Plus size={16} />}>
              تخصص جديد
            </Button>
            <Button variant="secondary" onClick={() => void load()} loading={loading} icon={<RefreshCw size={16} />}>
              تحديث
            </Button>
          </div>
        }
      />

      {error ? <Alert kind="error">{error}</Alert> : null}
      {loading && !data ? <LoadingBlock label="جارٍ التحميل…" /> : null}

      {showCreate ? (
        <Card pad className="stack">
          <h2 className="row" style={{ gap: '0.4rem', fontSize: '1.05rem' }}>
            <Plus size={18} /> إضافة تخصص جديد
          </h2>
          <div className="grid-2">
            <label className="field">
              <span>الاسم بالعربية *</span>
              <input value={newSpec.name} onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })} placeholder="مثال: مستورد منتجات" />
            </label>
            <label className="field">
              <span>الاسم بالإنجليزية</span>
              <input value={newSpec.nameEn} onChange={(e) => setNewSpec({ ...newSpec, nameEn: e.target.value })} placeholder="Importer" dir="ltr" />
            </label>
          </div>
          <label className="field">
            <span>الوصف</span>
            <input value={newSpec.description} onChange={(e) => setNewSpec({ ...newSpec, description: e.target.value })} placeholder="وصف مختصر للتخصص" />
          </label>
          <label className="field">
            <span>الأيقونة (اسم أيقونة lucide)</span>
            <input value={newSpec.icon} onChange={(e) => setNewSpec({ ...newSpec, icon: e.target.value })} placeholder=" sprout" dir="ltr" />
          </label>
          <div className="row" style={{ gap: '0.5rem' }}>
            <Button onClick={() => void createSpecialty()} loading={busy === 'create'}>حفظ التخصص</Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>إلغاء</Button>
          </div>
        </Card>
      ) : null}

      {data ? (
        <div className="stack">
          <Card pad>
            <h2 className="row" style={{ gap: '0.4rem', fontSize: '1.05rem' }}>
              <ShieldCheck size={18} /> الصلاحيات الأساسية (تُمنح لكل الحسابات النشطة)
            </h2>
            <div className="chip-row mt-2">
              {data.permissions.filter((p) => p.isBase).map((p) => (
                <span key={p.code} className="chip">{p.labelAr}</span>
              ))}
            </div>
          </Card>

          {data.specialties.map((specialty) => (
            <Card key={specialty.id} pad className="stack">
              <div className="between">
                <div>
                  <div className="row" style={{ gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1.05rem' }}>{specialty.name}</strong>
                    {specialty.code ? <span className="badge badge-muted">{specialty.code}</span> : null}
                    {!specialty.isActive ? <span className="badge badge-danger">معطّل</span> : null}
                  </div>
                  {specialty.description ? <p className="small muted mt-1">{specialty.description}</p> : null}
                </div>
                <div className="row" style={{ gap: '0.75rem' }}>
                  <span className="small muted row" style={{ gap: '0.3rem' }}>
                    <Users size={14} /> {specialty.userCount}
                  </span>
                  <Button
                    variant={specialty.isActive ? 'secondary' : 'primary'}
                    onClick={() => void toggleActive(specialty)}
                    loading={busy === `active-${specialty.id}`}
                  >
                    {specialty.isActive ? 'تعطيل' : 'تفعيل'}
                  </Button>
                </div>
              </div>

              <div>
                <div className="small muted mb-1">الصلاحيات الإضافية لهذا التخصص:</div>
                <div className="chip-row">
                  {nonBasePermissions.map((perm) => {
                    const enabled = specialty.permissions.includes(perm.code);
                    const key = `perm-${specialty.code}-${perm.code}`;
                    return (
                      <button
                        key={perm.code}
                        type="button"
                        className={enabled ? 'chip active' : 'chip'}
                        aria-pressed={enabled}
                        disabled={!specialty.code || busy === key}
                        onClick={() => void togglePermission(specialty, perm.code, enabled)}
                        title={perm.code}
                      >
                        {perm.labelAr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
