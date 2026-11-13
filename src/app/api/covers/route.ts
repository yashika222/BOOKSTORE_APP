import { NextRequest, NextResponse } from 'next/server';
import { isAllowedCoverHost } from '@/lib/coverUrl';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') || '';
  if (!isAllowedCoverHost(url)) {
    return NextResponse.json({ success: false, message: 'Cover host is not allowed.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: 'image/*',
        'User-Agent': 'PageTurnerBookstore/1.0',
      },
      redirect: 'follow',
    });
    if (!upstream.ok) {
      return NextResponse.json({ success: false, message: 'Cover was not available.' }, { status: 404 });
    }
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const bytes = new Uint8Array(await upstream.arrayBuffer());
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Unable to load cover image.' }, { status: 502 });
  }
}
