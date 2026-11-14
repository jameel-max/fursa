import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdBanner } from '../types';

const ROTATE_MS = 10000;
const SWIPE_THRESHOLD = 40;

type Frame = { left: number; top: number; width: number; height: number };

function AdSlide({ ad }: { ad: AdBanner }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [frame, setFrame] = useState<Frame | null>(null);

  const compute = () => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img || !img.naturalWidth || !img.naturalHeight) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    if (!cw || !ch) return;
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    setFrame({
      left: (cw - w) / 2,
      top: (ch - h) / 2,
      width: w,
      height: h,
    });
  };

  useEffect(() => {
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  });

  const external = ad.linkUrl ? /^https?:\/\//i.test(ad.linkUrl) : false;
  const frameStyle = frame
    ? { left: frame.left, top: frame.top, width: frame.width, height: frame.height }
    : undefined;

  return (
    <div className="hero-ad-slide" ref={wrapRef}>
      <img ref={imgRef} src={ad.imageUrl} alt={ad.title} className="hero-ad-img" onLoad={compute} />
      {frame && ad.linkUrl ? (
        <a
          className="hero-ad-hit"
          style={frameStyle}
          href={ad.linkUrl}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          aria-label={ad.title || 'فتح الإعلان'}
        />
      ) : null}
      {frame ? (
        <div className="hero-ad-frame" style={frameStyle}>
          <div className="hero-ad-overlay" />
          {ad.title ? <div className="hero-ad-caption">{ad.title}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export function BannerCarousel({ ads }: { ads: AdBanner[] }) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

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

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null || ads.length <= 1) {
      touchX.current = null;
      return;
    }
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (dx <= -SWIPE_THRESHOLD) go(1);
    else if (dx >= SWIPE_THRESHOLD) go(-1);
  };

  return (
    <div
      className="hero-ads"
      aria-roledescription="carousel"
      aria-label="إعلانات"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="hero-ads-track" style={{ transform: `translateX(${-current * 100}%)` }}>
        {ads.map((ad) => (
          <AdSlide key={ad.id} ad={ad} />
        ))}
      </div>
      {ads.length > 1 ? (
        <>
          <button type="button" className="hero-ad-zone hero-ad-zone-prev" onClick={() => go(-1)} aria-label="الإعلان السابق" />
          <button type="button" className="hero-ad-zone hero-ad-zone-next" onClick={() => go(1)} aria-label="الإعلان التالي" />
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
