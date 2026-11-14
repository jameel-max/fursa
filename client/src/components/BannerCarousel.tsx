import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdBanner } from '../types';

const ROTATE_MS = 7000;

function AdSlide({ ad }: { ad: AdBanner }) {
  const inner = (
    <>
      <img src={ad.imageUrl} alt={ad.title} className="hero-ad-img" />
      <div className="hero-ad-overlay" />
      {ad.title ? <div className="hero-ad-caption">{ad.title}</div> : null}
    </>
  );
  if (ad.linkUrl) {
    const external = /^https?:\/\//i.test(ad.linkUrl);
    return (
      <a
        href={ad.linkUrl}
        className="hero-ad-slide"
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {inner}
      </a>
    );
  }
  return <div className="hero-ad-slide">{inner}</div>;
}

export function BannerCarousel({ ads }: { ads: AdBanner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = window.setInterval(() => setIndex((c) => (c + 1) % ads.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const current = index % ads.length;
  const go = (delta: number) => setIndex((c) => (c + delta + ads.length) % ads.length);

  return (
    <div className="hero-ads" aria-roledescription="carousel" aria-label="إعلانات">
      <div className="hero-ads-track" style={{ transform: `translateX(${-current * 100}%)` }}>
        {ads.map((ad) => (
          <AdSlide key={ad.id} ad={ad} />
        ))}
      </div>
      {ads.length > 1 ? (
        <>
          <button type="button" className="hero-ad-arrow hero-ad-arrow-prev" onClick={() => go(-1)} aria-label="الإعلان السابق">
            <ChevronRight size={22} />
          </button>
          <button type="button" className="hero-ad-arrow hero-ad-arrow-next" onClick={() => go(1)} aria-label="الإعلان التالي">
            <ChevronLeft size={22} />
          </button>
          <div className="hero-ad-dots">
            {ads.map((ad, i) => (
              <button
                key={ad.id}
                type="button"
                className={i === current ? 'active' : ''}
                onClick={() => setIndex(i)}
                aria-label={`إعلان ${i + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
