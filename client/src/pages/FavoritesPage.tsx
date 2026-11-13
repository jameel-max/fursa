import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, HeartOff, Search, Trash2 } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import type { FavoriteItem } from '../types';
import { formatPrice, formatQuantity, listingStatusLabel, listingTypeLabel, timeAgo } from '../lib/format';
import { Button, buttonClass } from '../components/ui/Button';
import { EmptyState, LoadingBlock } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/Modal';
import { Badge, Card, PageHeader } from '../components/ui/Surfaces';
import { ListingImage } from '../components/ListingImage';

export function FavoritesPage() {
  const { items, loading, toggle } = useFavorites();
  const { showToast } = useToast();
  const [removeTarget, setRemoveTarget] = useState<FavoriteItem | null>(null);
  const [removing, setRemoving] = useState(false);

  const removeFavorite = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await toggle(removeTarget.listingId);
      showToast('تمت إزالة الإعلان من المفضلة.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذّر إزالة الإعلان من المفضلة.', 'error');
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="المفضلة"
        description="الإعلانات التي حفظتها للرجوع إليها لاحقاً في مكان واحد."
        actions={
          <Link to="/market" className={buttonClass('secondary')}>
            <Search size={16} /> تصفح السوق
          </Link>
        }
      />

      {loading ? (
        <LoadingBlock label="جارٍ تحميل المفضلة…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart size={26} />}
          title="قائمة المفضلة فارغة"
          description="اضغط على رمز القلب في أي إعلان لحفظه هنا ومتابعته بسهولة."
          action={
            <Link to="/market" className={buttonClass()}>
              <Search size={16} /> ابحث عن إعلانات
            </Link>
          }
        />
      ) : (
        <>
          <p className="small muted">{items.length} إعلان محفوظ</p>
          <div className="grid grid-3">
            {items.map((item) => (
              <Card key={item.id} hover className="stack-sm" style={{ overflow: 'hidden' }}>
                <Link to={`/market/${item.listingId}`} aria-label={item.title} style={{ display: 'block', aspectRatio: '4 / 3', background: 'var(--surface-2)' }}>
                  <ListingImage src={item.imageUrl} alt={item.title} className="listing-cover" />
                </Link>
                <div className="listing-body" style={{ paddingTop: 0 }}>
                  <div className="row wrap" style={{ gap: '0.35rem' }}>
                    <Badge tone={item.listingType === 'offer' ? 'offer' : 'request'}>
                      {listingTypeLabel[item.listingType]}
                    </Badge>
                    <Badge
                      tone={
                        item.status === 'active'
                          ? 'offer'
                          : item.status === 'paused'
                            ? 'warning'
                            : item.status === 'expired'
                              ? 'danger'
                              : 'muted'
                      }
                    >
                      {listingStatusLabel[item.status]}
                    </Badge>
                  </div>
                  <Link to={`/market/${item.listingId}`} className="listing-title">
                    {item.title}
                  </Link>
                  <div className="listing-meta">
                    <span>{formatQuantity(item.quantity)}</span>
                    <span>حُفظ {timeAgo(item.createdAt)}</span>
                  </div>
                  <div className="listing-price">
                    <span className="price-value">{formatPrice(item.price)}</span>
                  </div>
                  <div className="row wrap" style={{ gap: '0.4rem' }}>
                    <Link to={`/market/${item.listingId}`} className={buttonClass('secondary', 'sm')}>
                      عرض الإعلان
                    </Link>
                    <Button
                      variant="danger-soft"
                      size="sm"
                      icon={<Trash2 size={15} />}
                      onClick={() => setRemoveTarget(item)}
                    >
                      إزالة
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="إزالة من المفضلة"
        message={removeTarget ? `سيتم حذف «${removeTarget.title}» من قائمة المفضلة. هل تريد المتابعة؟` : ''}
        confirmLabel="إزالة"
        danger
        loading={removing}
        onConfirm={() => void removeFavorite()}
        onClose={() => setRemoveTarget(null)}
      />

      {items.length > 0 ? (
        <p className="small muted row" style={{ gap: '0.35rem' }}>
          <HeartOff size={14} /> لن يؤثر حذف الإعلان من المفضلة على الإعلان نفسه.
        </p>
      ) : null}
    </div>
  );
}
