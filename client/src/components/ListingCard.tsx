import { Link } from 'react-router-dom';
import { Heart, MapPin, Package, Star } from 'lucide-react';
import type { Listing } from '../types';
import { formatPrice, formatQuantity, listingTypeLabel, timeAgo } from '../lib/format';
import { ListingImage } from './ListingImage';
import { Badge } from './ui/Surfaces';

export function ListingCard({
  listing,
  unitName,
  governorateName,
  categoryName,
  isFavorite,
  onToggleFavorite,
}: {
  listing: Listing;
  unitName?: string;
  governorateName?: string;
  categoryName?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (listingId: number) => void;
}) {
  const image = listing.images?.[0]?.imageUrl ?? null;
  return (
    <article className="listing-card">
      <div className="listing-media">
        <Link to={`/market/${listing.id}`} aria-label={listing.title}>
          <ListingImage src={image} alt={listing.title} />
        </Link>
        <span className="badge-type">
          <Badge tone={listing.listingType === 'offer' ? 'offer' : 'request'}>{listingTypeLabel[listing.listingType]}</Badge>
        </span>
        {onToggleFavorite ? (
          <button
            type="button"
            className={isFavorite ? 'favorite-btn active' : 'favorite-btn'}
            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            aria-pressed={Boolean(isFavorite)}
            onClick={() => onToggleFavorite(listing.id)}
          >
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        ) : null}
      </div>
      <div className="listing-body">
        <div className="row wrap" style={{ justifyContent: 'space-between', gap: '0.35rem' }}>
          {categoryName ? <span className="badge badge-muted">{categoryName}</span> : <span />}
          <span className="muted small">{timeAgo(listing.createdAt)}</span>
        </div>
        <Link className="listing-title" to={`/market/${listing.id}`}>
          {listing.title}
        </Link>
        <div className="listing-meta">
          {governorateName ? (
            <span>
              <MapPin size={14} /> {governorateName}
              {listing.area ? ` · ${listing.area}` : ''}
            </span>
          ) : null}
          <span>
            <Package size={14} /> {formatQuantity(listing.quantity, unitName)}
          </span>
          {listing.owner && listing.owner.ratingCount > 0 ? (
            <span className="rating-badge" title={`${listing.owner.ratingCount} تقييم`}>
              <Star size={13} fill="currentColor" /> {listing.owner.ratingAvg} ({listing.owner.ratingCount})
            </span>
          ) : null}
        </div>
        <div className="listing-price">
          <div>
            <div className="price-value">
              {listing.priceType === 'at_contact' ? 'السعر عند التواصل' : formatPrice(listing.price)}
            </div>
            {listing.price !== null && listing.priceType !== 'at_contact' ? (
              <div className="price-unit">للوحدة{unitName ? ` (${unitName})` : ''}</div>
            ) : null}
          </div>
          <Link to={`/market/${listing.id}`} className="btn btn-sm btn-secondary">
            التفاصيل
          </Link>
        </div>
      </div>
    </article>
  );
}
