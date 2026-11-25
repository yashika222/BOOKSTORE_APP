'use client';

import { useEffect, useState } from 'react';
import { libraryService, normalizeApiAssetUrl } from '@/lib/api';

interface BookCoverImageProps {
  src?: string;
  title: string;
  author?: string;
  alt?: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

type CoverStage = 'source' | 'lookup' | 'unavailable';

const COVER_COLORS = ['#49365f', '#3d5367', '#815a3d', '#48614f', '#75424b', '#3c496b'];

export default function BookCoverImage({
  src,
  title,
  author,
  alt,
  className = '',
  loading = 'lazy',
}: BookCoverImageProps) {
  const displayTitle = title?.trim() || 'Untitled';
  const sourceUrl = normalizeApiAssetUrl(src);
  const lookupUrl = displayTitle !== 'Untitled' ? libraryService.coverLookupUrl(displayTitle, author) : '';

  // Store books already receive a title/author lookup URL from the API. Retrying
  // that same URL after a failure would leave a broken <img> showing alt text,
  // so treat it as the lookup stage and fall straight back to the placeholder.
  const sourceIsLookup = Boolean(sourceUrl && sourceUrl.includes('/api/covers?'));
  const initialStage: CoverStage = sourceUrl
    ? sourceIsLookup
      ? 'lookup'
      : 'source'
    : lookupUrl
      ? 'lookup'
      : 'unavailable';

  const [stage, setStage] = useState<CoverStage>(initialStage);

  useEffect(() => {
    setStage(initialStage);
  }, [initialStage]);

  const resolvedSrc =
    stage === 'source' ? sourceUrl : stage === 'lookup' ? lookupUrl : undefined;

  const handleImageError = () => {
    if (stage === 'source' && lookupUrl && !sourceIsLookup) {
      setStage('lookup');
      return;
    }
    setStage('unavailable');
  };

  if (resolvedSrc) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={resolvedSrc}
        alt={alt || `Cover of ${displayTitle}`}
        loading={loading}
        referrerPolicy="no-referrer"
        onError={handleImageError}
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
