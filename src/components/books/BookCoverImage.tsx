'use client';

import { useEffect, useState } from 'react';

interface BookCoverImageProps {
  src?: string;
  title: string;
  author?: string;
  alt?: string;
  className?: string;
}

const COVER_COLORS = ['#49365f', '#3d5367', '#815a3d', '#48614f', '#75424b', '#3c496b'];

export default function BookCoverImage({
  src,
  title,
  author,
  alt,
  className = '',
}: BookCoverImageProps) {
  const [failed, setFailed] = useState(false);
  const displayTitle = title?.trim() || 'Untitled';

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={alt || `Cover of ${displayTitle}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }

  const colorIndex =
    Array.from(displayTitle).reduce((total, character) => total + character.charCodeAt(0), 0) %
    COVER_COLORS.length;

  return (
    <div
      role="img"
      aria-label={`Book cover of ${displayTitle}`}
      className={`relative flex items-center justify-center overflow-hidden rounded-md p-3 text-center text-white shadow-md ${className}`}
      style={{ backgroundColor: COVER_COLORS[colorIndex] }}
    >
      <div className="relative max-w-full">
        <div className="line-clamp-4 text-xs font-bold leading-snug">{displayTitle}</div>
        {author ? <div className="mt-2 line-clamp-1 text-[10px] text-white/75">{author}</div> : null}
      </div>
    </div>
  );
}
