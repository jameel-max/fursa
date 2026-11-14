import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ImagePlus,
  Leaf,
  Loader2,
  Save,
  ShoppingBasket,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { api } from '../lib/api';
import { compressImage } from '../lib/image';
import { flattenCategories, useCatalog } from '../lib/catalog';
import { useToast } from '../context/ToastContext';
import type { Listing, ListingImage, ListingType, PriceType } from '../types';
import { getErrorMessage, getFieldErrors } from '../lib/validation';
import { Button, buttonClass } from '../components/ui/Button';
import { Alert, LoadingBlock } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/Modal';
import { Card, PageHeader } from '../components/ui/Surfaces';
import { Field, Input, Select, Textarea } from '../components/ui/Form';

interface SelectedFile {
  file: File;
  url: string;
}

const priceTypes: Array<{ value: PriceType; label: string; hint: string }> = [
  { value: 'fixed', label: 'سعر ثابت', hint: 'اعرض السعر النهائي للوحدة' },
  { value: 'negotiable', label: 'قابل للتفاوض', hint: 'سعر مبدئي مع إمكانية النقاش' },
  { value: 'at_contact', label: 'السعر عند التواصل', hint: 'اترك السعر فارغاً وحدده لاحقاً' },
];

export function ListingFormPage() {
  const { id } = useParams();
  const listingId = id ? Number(id) : null;
  const isEdit = Boolean(listingId);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { categories, units, governorates, loading: catalogLoading, error: catalogError } = useCatalog();

  const [listingType, setListingType] = useState<ListingType>('offer');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitId, setUnitId] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('fixed');
  const [price, setPrice] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');

  const [existingImages, setExistingImages] = useState<ListingImage[]>([]);
  const [newFiles, setNewFiles] = useState<SelectedFile[]>([]);
  const [removeImageTarget, setRemoveImageTarget] = useState<ListingImage | null>(null);
  const [removingImage, setRemovingImage] = useState(false);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const urlsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (!isEdit || !listingId) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api<Listing>(`/listings/${listingId}`);
        if (!active) return;
        setListingType(data.listingType);
        setTitle(data.title);
        setCategoryId(String(data.categoryId));
        setQuantity(String(data.quantity));
        setUnitId(String(data.unitId));
        setPriceType(data.priceType);
        setPrice(data.price === null ? '' : String(data.price));
        setGovernorateId(data.governorateId ? String(data.governorateId) : '');
        setArea(data.area ?? '');
        setDescription(data.description ?? '');
        setExistingImages(data.images);
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'تعذّر تحميل بيانات الإعلان.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isEdit, listingId]);

  const categoryOptions = useMemo(() => {
    const flat = flattenCategories(categories);
    const depthMap = new Map<number, number>();
    const walk = (nodes: typeof categories, depth: number) => {
      for (const node of nodes) {
        depthMap.set(node.id, depth);
        walk(node.children, depth + 1);
      }
    };
    walk(categories, 0);
    return flat.map((category) => ({
      value: category.id,
      label: `${'— '.repeat(depthMap.get(category.id) ?? 0)}${category.name}`,
    }));
  }, [categories]);

  const totalImages = existingImages.length + newFiles.length;
  const remainingImages = Math.max(0, 5 - totalImages);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const accepted = Array.from(fileList).filter((file) => file.type.startsWith('image/'));
    if (accepted.length === 0) return;
    const available = 5 - (existingImages.length + newFiles.length);
    if (available <= 0) {
      showToast('يمكنك إضافة 5 صور كحد أقصى.', 'error');
      return;
    }
    const slice = accepted.slice(0, available);
    void (async () => {
      const selected: SelectedFile[] = [];
      let skipped = 0;
      for (const file of slice) {
        const compressed = await compressImage(file);
        if (!compressed) {
          skipped += 1;
          continue;
        }
        const url = URL.createObjectURL(compressed);
        urlsRef.current.push(url);
        selected.push({ file: compressed, url });
      }
      setNewFiles((current) => [...current, ...selected]);
      if (skipped > 0) {
        showToast('بعض الصور بصيغة غير مدعومة (مثل HEIC). حوّلها إلى JPG ثم أعد المحاولة.', 'error');
      }
    })();
    if (accepted.length > available) {
      showToast(`تمت إضافة ${available} صورة فقط. الحد الأقصى 5 صور.`, 'error');
    }
  };

  const removeNewFile = (url: string) => {
    URL.revokeObjectURL(url);
    urlsRef.current = urlsRef.current.filter((item) => item !== url);
    setNewFiles((current) => current.filter((item) => item.url !== url));
  };

  const removeExistingImage = async () => {
    if (!removeImageTarget || !listingId) return;
    setRemovingImage(true);
    try {
      await api(`/listings/${listingId}/images/${removeImageTarget.id}`, { method: 'DELETE' });
      setExistingImages((current) => current.filter((image) => image.id !== removeImageTarget.id));
      showToast('تم حذف الصورة.');
    } catch (err) {
      showToast(getErrorMessage(err, 'تعذّر حذف الصورة.'), 'error');
    } finally {
      setRemovingImage(false);
      setRemoveImageTarget(null);
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    if (title.trim().length < 3) errors.title = 'عنوان الإعلان يجب أن يكون 3 أحرف على الأقل.';
    if (!categoryId) errors.categoryId = 'اختر تصنيف الإعلان.';
    if (!quantity || Number(quantity) < 1) errors.quantity = 'أدخل كمية صحيحة أكبر من صفر.';
    if (!unitId) errors.unitId = 'اختر وحدة القياس.';
    if (!governorateId) errors.governorateId = 'اختر المحافظة.';
    if (priceType !== 'at_contact' && listingType === 'offer' && price.trim() === '') {
      errors.price = 'السعر مطلوب لعرض البيع، أو اختر «السعر عند التواصل».';
    }
    if (price.trim() !== '' && (Number.isNaN(Number(price)) || Number(price) < 0)) {
      errors.price = 'أدخل سعراً صحيحاً.';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('categoryId', categoryId);
    formData.append('quantity', quantity);
    formData.append('unitId', unitId);
    formData.append('priceType', priceType);
    formData.append('governorateId', governorateId);
    if (area.trim()) formData.append('area', area.trim());
    if (description.trim()) formData.append('description', description.trim());
    if (priceType !== 'at_contact' && price.trim() !== '') formData.append('price', price);
    if (!isEdit) formData.append('listingType', listingType);
    for (const item of newFiles) formData.append('images', item.file);

    try {
      if (isEdit && listingId) {
        await api(`/listings/${listingId}`, { method: 'PATCH', body: formData });
        showToast('تم حفظ تعديلات الإعلان.');
        navigate('/dashboard/listings');
      } else {
        const result = await api<{ id: number }>('/listings', { method: 'POST', body: formData });
        showToast('تم نشر الإعلان بنجاح.');
        navigate(`/market/${result.id}`, { replace: true });
      }
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'تعذّر حفظ الإعلان.'));
      setSaving(false);
    }
  };

  if (loading || (catalogLoading && categories.length === 0)) {
    return (
      <div className="stack">
        <LoadingBlock label="جارٍ تحضير نموذج الإعلان…" />
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow={
          <Link to="/dashboard/listings" className="small row" style={{ gap: '0.35rem' }}>
            <ArrowRight size={15} /> إعلاناتي
          </Link>
        }
        title={isEdit ? 'تعديل الإعلان' : 'إعلان جديد'}
        description={
          isEdit
            ? 'حدّث تفاصيل إعلانك أو أضف صوراً جديدة. التعديلات تظهر مباشرة في السوق.'
            : 'املأ تفاصيل الإعلان بدقة لزيادة فرص التواصل مع الأطراف المناسبة.'
        }
      />

      {catalogError ? <Alert kind="error">{catalogError}</Alert> : null}
      {error ? <Alert kind="error">{error}</Alert> : null}

      <form className="stack" onSubmit={onSubmit} noValidate>
        <Card pad className="stack">
          <h2 style={{ fontSize: '1.1rem' }}>نوع الإعلان</h2>
          <div className="grid grid-2">
            <button
              type="button"
              className={listingType === 'offer' ? 'type-choice active' : 'type-choice'}
              onClick={() => setListingType('offer')}
              aria-pressed={listingType === 'offer'}
              disabled={isEdit}
            >
              <span className="type-choice-icon">
                <Leaf size={21} />
              </span>
              <span>
                <strong>عرض بيع</strong>
                <small>لديّ محصول أو منتج أو خدمة أريد بيعها.</small>
              </span>
            </button>
            <button
              type="button"
              className={listingType === 'request' ? 'type-choice active' : 'type-choice'}
              onClick={() => setListingType('request')}
              aria-pressed={listingType === 'request'}
              disabled={isEdit}
            >
              <span className="type-choice-icon">
                <ShoppingBasket size={21} />
              </span>
              <span>
                <strong>طلب شراء</strong>
                <small>أبحث عن كمية محددة وأريد استقبال عروض.</small>
              </span>
            </button>
          </div>
          {isEdit ? <p className="small muted">لا يمكن تغيير نوع الإعلان بعد النشر.</p> : null}
        </Card>

        <Card pad className="stack">
          <h2 style={{ fontSize: '1.1rem' }}>تفاصيل الإعلان</h2>

          <Input
            label="عنوان الإعلان"
            required
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            error={fieldErrors.title}
            placeholder={listingType === 'offer' ? 'مثال: طماطم بيضاء طازجة - عروة أولى' : 'مثال: مطلوب 2 طن بصل أحمر'}
            hint={`${title.length}/120`}
          />

          <div className="form-grid">
            <Select
              label="التصنيف"
              required
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              options={categoryOptions}
              placeholder="اختر التصنيف"
              error={fieldErrors.categoryId}
            />
            <Select
              label="وحدة القياس"
              required
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
              options={units.map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.abbreviation})` }))}
              placeholder="اختر الوحدة"
              error={fieldErrors.unitId}
            />
          </div>

          <div className="form-grid">
            <Input
              label="الكمية"
              type="number"
              min={1}
              step={1}
              required
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              error={fieldErrors.quantity}
              placeholder="مثال: 500"
            />
            <Select
              label="المحافظة"
              required
              value={governorateId}
              onChange={(event) => setGovernorateId(event.target.value)}
              options={governorates.map((governorate) => ({ value: governorate.id, label: governorate.nameAr }))}
              placeholder="اختر المحافظة"
              error={fieldErrors.governorateId}
            />
          </div>

          <Input
            label="المنطقة (اختياري)"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            error={fieldErrors.area}
            maxLength={120}
            placeholder="مثال: وادي الأردن / دير علا"
          />

          <div className="field">
            <span className="label">طريقة السعر</span>
            <div className="chip-row">
              {priceTypes.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={priceType === option.value ? 'chip active' : 'chip'}
                  aria-pressed={priceType === option.value}
                  onClick={() => setPriceType(option.value)}
                  title={option.hint}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="field-hint">{priceTypes.find((option) => option.value === priceType)?.hint}</span>
          </div>

          <div className="form-grid">
            <Input
              label={priceType === 'at_contact' ? 'السعر (غير مطلوب)' : 'السعر للوحدة الواحدة (د.أ)'}
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={priceType === 'at_contact' ? '' : price}
              disabled={priceType === 'at_contact'}
              onChange={(event) => setPrice(event.target.value)}
              error={fieldErrors.price}
              placeholder={priceType === 'at_contact' ? 'سيُحدد عند التواصل' : '0.00'}
            />
          </div>

          <Textarea
            label="الوصف"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            error={fieldErrors.description}
            maxLength={3000}
            rows={6}
            placeholder="اذكر نوع المنتج، الجودة، موعد الحصاد أو التسليم، وأي تفاصيل تساعد الطرف الآخر."
            hint={`${description.length}/3000`}
          />
        </Card>

        <Card pad className="stack">
          <div className="between">
            <div>
              <h2 style={{ fontSize: '1.1rem' }}>صور الإعلان</h2>
              <p className="small muted mt-1">
                حتى 5 صور بصيغة JPG أو PNG أو WebP أو AVIF، بحد أقصى 5 ميجابايت للصورة.
              </p>
            </div>
            <span className="badge badge-muted">{totalImages} / 5</span>
          </div>

          <div className="upload-grid">
            {existingImages.map((image) => (
              <div key={image.id} className="upload-tile">
                <img src={image.imageUrl} alt={`صورة الإعلان ${image.sortOrder + 1}`} />
                <button type="button" onClick={() => setRemoveImageTarget(image)} aria-label="حذف الصورة">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {newFiles.map((item) => (
              <div key={item.url} className="upload-tile">
                <img src={item.url} alt="صورة جديدة" />
                <button type="button" onClick={() => removeNewFile(item.url)} aria-label="إزالة الصورة المحددة">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            {remainingImages > 0 ? (
              <button
                type="button"
                className="upload-add"
                onClick={() => fileInputRef.current?.click()}
                aria-label="إضافة صور"
              >
                <UploadCloud size={22} />
                <span>إضافة صور</span>
                <small>متبقٍ {remainingImages}</small>
              </button>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            hidden
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = '';
            }}
          />

          {totalImages === 0 ? (
            <p className="small muted row" style={{ gap: '0.4rem' }}>
              <ImagePlus size={15} /> الإعلانات التي تحتوي صوراً واضحة تحصل على تفاعل أكبر.
            </p>
          ) : null}
        </Card>

        <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
          <Link to="/dashboard/listings" className={buttonClass('secondary')}>
            إلغاء
          </Link>
          <Button
            type="submit"
            loading={saving}
            icon={saving ? <Loader2 size={16} /> : <Save size={16} />}
          >
            {isEdit ? 'حفظ التعديلات' : 'نشر الإعلان'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={Boolean(removeImageTarget)}
        title="حذف الصورة"
        message="سيتم حذف هذه الصورة من الإعلان نهائياً. هل تريد المتابعة؟"
        confirmLabel="حذف الصورة"
        danger
        loading={removingImage}
        onConfirm={() => void removeExistingImage()}
        onClose={() => setRemoveImageTarget(null)}
      />
    </div>
  );
}
