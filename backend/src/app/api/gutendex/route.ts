import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

const DEFAULT_GUTENDEX_URL = 'https://gutendex.com/books/?languages=en';
const GUTENDEX_ORIGIN = 'https://gutendex.com';

export async function GET(request: NextRequest) {
  const requestedUrl = request.nextUrl.searchParams.get('url') || DEFAULT_GUTENDEX_URL;

  let url: URL;
  try {
    url = new URL(requestedUrl);
  } catch {
    return NextResponse.json(
      { message: 'A valid Gutendex URL is required.' },
      { status: 400 }
    );
  }

  if (url.origin !== GUTENDEX_ORIGIN || !/^\/books(?:\/\d+)?\/?$/.test(url.pathname)) {
    return NextResponse.json(
      { message: 'Only Gutendex book catalog URLs are supported.' },
      { status: 400 }
    );
  }

  // Detect single book detail lookup, e.g. /books/5197 or /books/5197/
  const singleBookMatch = url.pathname.match(/^\/books\/(\d+)\/?$/);
  const singleBookId = singleBookMatch ? singleBookMatch[1] : null;

  // For single book details, gutendex.com/books/?ids=<id> is much faster, reliable, and avoids 301 redirects and timeouts
  const targetUrl = singleBookId
    ? `https://gutendex.com/books/?ids=${singleBookId}`
    : url.toString();

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 12000);

  const abortOnDisconnect = () => controller.abort();
  request.signal.addEventListener('abort', abortOnDisconnect, { once: true });
  if (request.signal.aborted) controller.abort();

  try {
    const response = await fetch(targetUrl, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PageTurner-Bookstore/1.0',
      },
    });

    if (!response.ok) {
      logger.warn(`Gutendex returned HTTP ${response.status} for ${url.pathname}`);
      return NextResponse.json(
        {
          message:
            response.status === 404
              ? 'This book was not found in the live catalog.'
              : 'The live book catalog is temporarily unavailable. Please try again.',
        },
        { status: response.status === 404 ? 404 : 502 }
      );
    }

    const payload = await response.json();

    // If this was a single book request converted to ?ids=<id>, unwrap the results[0]
    if (singleBookId) {
      if (payload && Array.isArray(payload.results) && payload.results.length > 0) {
        return NextResponse.json(payload.results[0], {
          headers: { 'Cache-Control': 'public, max-age=300' },
        });
      } else {
        return NextResponse.json(
          { message: 'This book was not found in the live catalog.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    if (request.signal.aborted && !timedOut) {
      return new NextResponse(null, { status: 499 });
    }
    const reason = timedOut ? 'timed out' : 'failed';
    logger.warn(
      `Gutendex request ${reason}. ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return NextResponse.json(
      {
        message:
          'The live book catalog could not be reached. Check your connection and try again.',
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
    request.signal.removeEventListener('abort', abortOnDisconnect);
  }
}
