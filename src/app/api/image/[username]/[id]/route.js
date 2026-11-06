import { Readable } from 'stream';
import { getImageStream, getValidOAuthClientForUsername } from '@/lib/drive';

export async function GET(request, { params }) {
  try {
    const { username, id } = await params;
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === 'true';
    const mimeType = searchParams.get('mimeType') || 'image/jpeg';
    const filename = searchParams.get('filename') || 'download';

    let oauthClient;
    try {
      oauthClient = await getValidOAuthClientForUsername(username);
    } catch {
      return new Response('Unauthorized or user not found', { status: 401 });
    }

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

    return new Response(webStream, { status: status || 200, headers });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new Response('Image not found or error fetching', { status: 404 });
  }
}
