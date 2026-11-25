import { NextRequest, NextResponse } from 'next/server';
import { fileNameFromEbookUrl, isAllowedEbookHost } from '@/lib/ebookFormats';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('url') || '';
  const title = request.nextUrl.searchParams.get('title') || 'ebook';

  if (!isAllowedEbookHost(target)) {
    return NextResponse.json(
      { success: false, message: 'Only Project Gutenberg ebook files can be downloaded here.' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(target, {
      cache: 'no-store',
      headers: { Accept: '*/*' },
    });

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { success: false, message: 'This ebook file is not available right now.' },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const fileName = fileNameFromEbookUrl(target, title);

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    logger.warn(`Ebook download proxy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      { success: false, message: 'Unable to download this ebook right now.' },
      { status: 502 }
    );
  }
}
