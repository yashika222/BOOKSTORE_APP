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

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={alt || `Cover of ${title}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }

  const colorIndex = Array.from(title).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  ) % COVER_COLORS.length;

  return (
    <div
      role="img"
      aria-label={`Book cover of ${title}`}
      className={`relative flex h-full w-full min-h-32 items-center justify-center overflow-hidden rounded-md p-4 text-center text-white shadow-md ${className}`}
      style={{ backgroundColor: COVER_COLORS[colorIndex] }}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-white/20" />
      <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full border border-white/20" />
      <div className="relative max-w-full">
        <div className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/70">
          PageTurner Editions
        </div>
        <div className="line-clamp-3 text-sm font-bold leading-snug">{title}</div>
        {author && <div className="mt-3 line-clamp-1 text-[10px] text-white/75">{author}</div>}
      </div>
    </div>
  );
}
