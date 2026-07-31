import { Readable } from 'stream';
import { getImageStream, getOAuthClient } from '@/lib/drive';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { username, id } = await params;
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === 'true';
    const mimeType = searchParams.get('mimeType') || 'image/jpeg';
    const filename = searchParams.get('filename') || 'download';

    const user = await prisma.user.findUnique({
      where: { username },
      include: { accounts: { where: { provider: 'google' } } }
    });

    if (!user || !user.accounts[0]?.access_token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const oauthClient = getOAuthClient(user.accounts[0].access_token, user.accounts[0].refresh_token);
    const rangeHeader = request.headers.get('range');
    const { stream, headers: upstreamHeaders, status } = await getImageStream(oauthClient, id, rangeHeader);
    
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=31536000');
    
    // Proxy necessary upstream headers for video streaming
    if (upstreamHeaders['content-length']) headers.set('Content-Length', upstreamHeaders['content-length']);
    if (upstreamHeaders['content-range']) headers.set('Content-Range', upstreamHeaders['content-range']);
    if (upstreamHeaders['accept-ranges']) headers.set('Accept-Ranges', upstreamHeaders['accept-ranges']);
    
    if (isDownload) {
      headers.set('Content-Type', 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      headers.set('Content-Type', mimeType);
      headers.set('Content-Disposition', `inline; filename="${filename}"`);
    }

    // Convert the Node.js stream into a Web ReadableStream for Next.js
    const webStream = stream instanceof ReadableStream ? stream : Readable.toWeb(stream);

    return new Response(webStream, { status, headers });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new Response('Image not found or error fetching', { status: 404 });
  }
}
