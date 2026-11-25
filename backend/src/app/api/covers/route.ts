import { NextRequest, NextResponse } from 'next/server';
import { isAllowedCoverHost } from '@/lib/coverUrl';

export const dynamic = 'force-dynamic';

const USER_AGENT = 'PageTurnerBookstore/1.0';
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVER_HOST = 'https://covers.openlibrary.org';

function cleanQuery(value: string | null, maxLength = 120): string {
  return (value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/**
 * Gutenberg's generated cover URLs are frequently unavailable. Open Library can
 * resolve a cover from the book title/author, which keeps real artwork on the
 * storefront instead of falling back to a text-only placeholder.
 */
function normalizeSearchAuthor(author: string): string {
  const match = author.match(/^\s*([^,]+),\s*(.+?)\s*$/);
  return match ? `${match[2].trim()} ${match[1].trim()}` : author;
}

function coverSearchVariants(title: string, author: string): Array<{ title: string; author: string }> {
  const normalizedAuthor = normalizeSearchAuthor(author);
  const variants: Array<{ title: string; author: string }> = [
    { title, author: normalizedAuthor },
    { title, author: '' },
  ];

  // Gutenberg titles often include volume/edition suffixes that Open Library
  // does not index, e.g. "Works of Shakespeare [Cambridge Edition] [Vol. 5 of 9]".
  const simplified = title
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[,;:].*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (simplified && simplified !== title) {
    variants.push({ title: simplified, author: '' });
  }

  const shortTitle = simplified.split(' ').slice(0, 4).join(' ').trim();
  if (shortTitle && shortTitle !== simplified && shortTitle !== title) {
    variants.push({ title: shortTitle, author: '' });
  }

  return variants.filter((variant, index) =>
    variants.findIndex((other) => other.title === variant.title && other.author === variant.author) === index
  );
}

function imageResponse(upstream: Response): NextResponse {
  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}

async function fetchCoverIds(title: string, author: string): Promise<number[]> {
  try {
    const params = new URLSearchParams({
      title,
      limit: '6',
      fields: 'title,author_name,cover_i',
    });
    if (author) {
      params.set('author', author);
    }

    const searchResponse = await fetch(`${OPEN_LIBRARY_SEARCH_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
    if (!searchResponse.ok) return [];

    const searchData = (await searchResponse.json()) as {
      docs?: Array<{ cover_i?: number | string }>;
    };

    return (searchData.docs || [])
      .map((doc) => Number(doc.cover_i))
      .filter((id) => Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
}

async function fetchOpenLibraryCover(title: string, author: string): Promise<Response | null> {
  for (const variant of coverSearchVariants(title, author)) {
    const coverIds = await fetchCoverIds(variant.title, variant.author);

    for (const coverId of coverIds) {
      try {
        const coverResponse = await fetch(
          `${OPEN_LIBRARY_COVER_HOST}/b/id/${coverId}-M.jpg?default=false`,
          {
            headers: { Accept: 'image/*', 'User-Agent': USER_AGENT },
            redirect: 'follow',
          }
        );
        if (coverResponse.ok) return coverResponse;
      } catch {
        // Try the next cover id / search variant.
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') || '';
  const title = cleanQuery(request.nextUrl.searchParams.get('title'));
  const author = cleanQuery(request.nextUrl.searchParams.get('author'));

  if (title) {
    const cover = await fetchOpenLibraryCover(title, author);
    if (cover) {
      return imageResponse(cover);
    }
  }

  if (!url) {
    return NextResponse.json(
      { success: false, message: 'Provide an image URL or book title.' },
      { status: 400 }
    );
  }

  if (!isAllowedCoverHost(url)) {
    return NextResponse.json({ success: false, message: 'Cover host is not allowed.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: 'image/*',
        'User-Agent': USER_AGENT,
      },
      redirect: 'follow',
    });
    if (!upstream.ok) {
      return NextResponse.json({ success: false, message: 'Cover was not available.' }, { status: 404 });
    }
    return imageResponse(upstream);
  } catch {
    return NextResponse.json({ success: false, message: 'Unable to load cover image.' }, { status: 502 });
  }
}
