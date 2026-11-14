import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Megaphone, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { compressImage } from '../../lib/image';
import type { AdBanner } from '../../types';
import { formatDate } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Alert, EmptyState, LoadingBlock } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { Badge, Card, PageHeader } from '../../components/ui/Surfaces';
import { Field, Input } from '../../components/ui/Form';

interface AdsResponse {
  items: AdBanner[];
}

export function AdminAdsPage() {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [ads, setAds] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdBanner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api<AdsResponse>('/admin/ads');
      setAds(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل الإعلانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const pickFile = async (list: FileList | null) => {
    const picked = list?.[0];
    if (!picked) return;
    const compressed = await compressImage(picked);
    if (!compressed) {
      showToast('صيغة الصورة غير مدعومة. استخدم JPG أو PNG.', 'error');
      return;
    }
    setFile(compressed);
    setPreview(URL.createObjectURL(compressed));
  };

  const createAd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      showToast('اختر صورة الإعلان أولاً.', 'error');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (linkUrl.trim()) formData.append('linkUrl', linkUrl.trim());
      formData.append('sortOrder', sortOrder || '0');
      formData.append('isActive', 'true');
      formData.append('image', file);
      await api('/admin/ads', { method: 'POST', body: formData });
      showToast('تمت إضافة الإعلان. سيظهر في الصفحة الرئيسية.');
      setTitle('');
      setLinkUrl('');
      setSortOrder('0');
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر إضافة الإعلان.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad: AdBanner) => {
    try {
      await api(`/admin/ads/${ad.id}`, {
        method: 'PATCH',
        body: { isActive: !ad.isActive, title: ad.title, linkUrl: ad.linkUrl ?? '', sortOrder: ad.sortOrder },
      });
      setAds((current) => current.map((item) => (item.id === ad.id ? { ...item, isActive: !ad.isActive } : item)));
      showToast(ad.isActive ? 'تم إيقاف الإعلان.' : 'تم تفعيل الإعلان.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر تحديث الإعلان.', 'error');
    }
  };

  const removeAd = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/admin/ads/${deleteTarget.id}`, { method: 'DELETE' });
      setAds((current) => current.filter((item) => item.id !== deleteTarget.id));
      showToast('تم حذف الإعلان.');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر حذف الإعلان.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="إعلانات المنصة"
        description="بانرات خارجية تظهر في أعلى الصفحة الرئيسية وتتعرض تلقائياً. الأحدث بترتيب sort_order أولاً."
      />

      <Card pad>
        <h2 className="mb-3" style={{ fontSize: '1.05rem' }}>
          <Megaphone size={18} style={{ verticalAlign: '-3px', marginInlineEnd: '0.4rem' }} />
          إضافة إعلان جديد
        </h2>
        <form onSubmit={createAd} className="stack">
          <div className="grid grid-2">
            <Field label="عنوان الإعلان" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: خصم 20% على الأسمدة" maxLength={160} />
            </Field>
            <Field label="رابط الإعلان" hint="رابط خارجي (https) أو صفحة داخلية. اختياري.">
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" dir="ltr" />
            </Field>
            <Field label="ترتيب الظهور" hint="الأصغر يظهر أولاً.">
              <Input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </Field>
            <Field label="صورة الإعلان" required>
              <div className="row" style={{ gap: '0.6rem' }}>
                <Button type="button" variant="secondary" size="sm" icon={<ImagePlus size={15} />} onClick={() => fileRef.current?.click()}>
                  اختر صورة
                </Button>
                {preview ? <img src={preview} alt="معاينة" style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8 }} /> : null}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => void pickFile(e.target.files)} />
              </div>
            </Field>
          </div>
          <div>
            <Button type="submit" loading={saving} disabled={!file}>
              نشر الإعلان
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Alert kind="error">{error}</Alert>
      ) : ads.length === 0 ? (
        <EmptyState title="لا توجد إعلانات بعد" description="أضف أول إعلان من النموذج أعلاه ليظهر في الصفحة الرئيسية." />
      ) : (
        <div className="grid grid-2">
          {ads.map((ad) => (
            <Card key={ad.id} pad>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <strong>{ad.title}</strong>
                  <p className="small muted mt-1">
                    {ad.linkUrl ? ad.linkUrl : 'بدون رابط'} · ترتيب {ad.sortOrder} · {formatDate(ad.createdAt)}
                  </p>
                </div>
                <Badge tone={ad.isActive ? 'offer' : 'muted'}>{ad.isActive ? 'مفعّل' : 'موقوف'}</Badge>
              </div>
              <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: '0.75rem' }} />
              <div className="row mt-3" style={{ gap: '0.5rem' }}>
                <Button size="sm" variant="secondary" onClick={() => void toggleActive(ad)}>
                  {ad.isActive ? 'إيقاف' : 'تفعيل'}
                </Button>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => setDeleteTarget(ad)}>
                  حذف
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الإعلان"
        message={`سيتم حذف إعلان «${deleteTarget?.title ?? ''}» من الصفحة الرئيسية نهائياً.`}
        confirmLabel="حذف"
        danger
        loading={deleting}
        onConfirm={() => void removeAd()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
