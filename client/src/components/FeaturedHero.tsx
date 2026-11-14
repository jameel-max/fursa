import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react';
import type { Listing } from '../types';
import { ListingImage } from './ListingImage';
import { formatNumber, formatPrice, listingTypeLabel } from '../lib/format';
import { useCatalog } from '../lib/catalog';

const ROTATE_MS = 6000;

export function FeaturedHero({ listings }: { listings: Listing[] }) {
  const { governorateMap, unitMap } = useCatalog();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [listings.length]);

  useEffect(() => {
    if (listings.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % listings.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [listings.length]);

  if (listings.length === 0) return null;

  const listing = listings[index % listings.length];
  const image = listing.images?.[0]?.imageUrl ?? null;
  const ownerName = listing.owner?.businessName || listing.owner?.fullName || '';
  const governorate = listing.governorateId ? governorateMap.get(listing.governorateId) : null;
  const unit = listing.unitId ? unitMap.get(listing.unitId) : null;

  const go = (delta: number) => setIndex((current) => (current + delta + listings.length) % listings.length);

  return (
    <div className="featured-hero">
      <Link to={`/market/${listing.id}`} className="featured-hero-media" aria-label={listing.title}>
        <ListingImage src={image} alt={listing.title} className="featured-hero-img" />
        <span className="featured-hero-badge">
          <Star size={13} /> إعلان مميز
        </span>
      </Link>
      <div className="featured-hero-body">
        <div className="between">
          <span className="badge badge-offer">{listingTypeLabel[listing.listingType]}</span>
          <div className="featured-hero-nav">
            <button type="button" onClick={() => go(-1)} aria-label="السابق">
              <ChevronRight size={16} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="التالي">
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
        <Link to={`/market/${listing.id}`} className="featured-hero-title">
          {listing.title}
        </Link>
        <div className="featured-hero-meta">
          {ownerName ? <span>{ownerName}</span> : null}
          {governorate ? (
            <span>
              <MapPin size={13} /> {governorate.nameAr}
            </span>
          ) : null}
          <span>
            {formatNumber(listing.quantity)} {unit?.abbreviation ?? ''}
          </span>
        </div>
        <div className="between">
          <strong className="featured-hero-price">{formatPrice(listing.price)}</strong>
          <Link to={`/market/${listing.id}`} className="btn btn-sm">
            عرض الإعلان
          </Link>
        </div>
        {listings.length > 1 ? (
          <div className="featured-hero-dots" role="tablist" aria-label="الإعلانات المميزة">
            {listings.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                className={dotIndex === index % listings.length ? 'active' : ''}
                onClick={() => setIndex(dotIndex)}
                aria-label={`إعلان ${dotIndex + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
