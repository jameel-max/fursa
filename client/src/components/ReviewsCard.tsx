import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Listing, ReviewList } from '../types';
import { timeAgo } from '../lib/format';
import { Button } from './ui/Button';
import { Alert } from './ui/Feedback';
import { Card } from './ui/Surfaces';
import { Textarea } from './ui/Form';

function Stars({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(value) ? 'star filled' : 'star'}
          fill={star <= Math.round(value) ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

export function ReviewsCard({ listing, onUpdated }: { listing: Listing; onUpdated?: () => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const owner = listing.owner;

  const [data, setData] = useState<ReviewList | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = Boolean(user && user.id === listing.userId);

  const load = useCallback(async () => {
    if (!owner) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await api<ReviewList>(`/reviews/user/${owner.id}?limit=10`);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    void load();
    if (listing.myReview) {
      setRating(listing.myReview.rating);
      setComment(listing.myReview.comment ?? '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [load, listing.myReview, listing.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (rating < 1) {
      setError('اختر عدد النجوم أولاً.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api('/reviews', {
        method: 'POST',
        body: { listingId: listing.id, rating, comment: comment.trim() || undefined },
      });
      showToast(listing.myReview ? 'تم تحديث تقييمك.' : 'شكراً لك — تم إرسال تقييمك.');
      await load();
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر إرسال التقييم.');
    } finally {
      setSubmitting(false);
    }
  };

  const summary = data?.summary;
  const activeStars = hovered || rating;

  return (
    <Card pad>
      <div className="between">
        <h2 style={{ fontSize: '1.1rem' }}>تقييمات البائع</h2>
        {summary && summary.count > 0 ? (
          <span className="row small" style={{ gap: '0.3rem' }}>
            <Stars value={summary.average} />
            <strong>{summary.average}</strong>
            <span className="muted">({summary.count} تقييم)</span>
          </span>
        ) : null}
      </div>

      {isOwner ? (
        <p className="small muted mt-2">هذه إعلاناتك — التقييمات تظهر هنا من عملائك.</p>
      ) : !user ? (
        <p className="small muted mt-2">
          <Link to={`/login?next=${encodeURIComponent(`/market/${listing.id}`)}`}>سجّل الدخول</Link> لتقييم هذا البائع.
        </p>
      ) : (
        <form className="mt-3" onSubmit={submit}>
          {error ? (
            <div className="mb-2">
              <Alert kind="error">{error}</Alert>
            </div>
          ) : null}
          <div className="row" style={{ gap: '0.25rem' }} role="radiogroup" aria-label="تقييمك">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="star-btn"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`${star} نجوم`}
                aria-pressed={rating === star}
              >
                <Star size={26} className={star <= activeStars ? 'star filled' : 'star'} fill={star <= activeStars ? 'currentColor' : 'none'} />
              </button>
            ))}
            <span className="small muted">{rating > 0 ? `${rating} من 5` : 'اضغط على النجوم للتقييم'}</span>
          </div>
          <div className="mt-2">
            <Textarea
              label="تعليق (اختياري)"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              placeholder="كيف كانت تجربتك مع هذا البائع؟"
            />
          </div>
          <p className="small muted mt-2">تقييمك يخص البائع ويظهر على جميع منتجاته — يمكنك تعديله من أي إعلان له.</p>
          <div className="mt-2">
            <Button type="submit" loading={submitting}>
              {listing.myReview ? 'تحديث التقييم' : 'إرسال التقييم'}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-3">
        {loading ? (
          <p className="small muted">جارٍ تحميل التقييمات…</p>
        ) : !data || data.items.length === 0 ? (
          <p className="small muted">لا توجد تقييمات بعد — كن أول من يقيّم هذا البائع.</p>
        ) : (
          <ul className="review-list">
            {data.items.map((review) => (
              <li key={review.id} className="review-item">
                <div className="row" style={{ justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div className="row small" style={{ gap: '0.4rem' }}>
                    <Stars value={review.rating} size={13} />
                    <strong>{review.reviewerName ?? 'مستخدم'}</strong>
                  </div>
                  <span className="small muted">{timeAgo(review.createdAt)}</span>
                </div>
                {review.comment ? <p className="small mt-1" style={{ whiteSpace: 'pre-wrap' }}>{review.comment}</p> : null}
                {review.listingTitle ? <p className="small muted mt-1">عن: {review.listingTitle}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
