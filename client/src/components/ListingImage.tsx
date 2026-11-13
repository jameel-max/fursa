import { useState } from 'react';

export function ListingImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const source = !src || failed ? '/placeholder-listing.svg' : src;
  return (
    <img
      src={source}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
