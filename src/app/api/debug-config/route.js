import { google } from 'googleapis';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
}

export async function GET() {
  try {
    const drive = google.drive({ version: 'v3', auth: getAuth() });
    const rootFolderId = process.env.GOOGLE_DRIVE_PRIVATE_ROOT_ID;

    let files = [];
    let searchRes;

    if (rootFolderId && rootFolderId !== 'your_private_folder_id_here') {
      searchRes = await drive.files.list({
        q: `'${rootFolderId}' in parents and name = 'config.json' and trashed = false`,
        fields: 'files(id, name, mimeType)',
        pageSize: 1,
      });
      files = searchRes.data.files || [];
    }

    if (files.length === 0 && process.env.GOOGLE_DRIVE_PUBLIC_ROOT_ID) {
      searchRes = await drive.files.list({
        q: `'${process.env.GOOGLE_DRIVE_PUBLIC_ROOT_ID}' in parents and name = 'config.json' and trashed = false`,
        fields: 'files(id, name, mimeType)',
        pageSize: 1,
      });
      files = searchRes.data.files || [];
    }

    if (files.length === 0) {
      return new Response('config.json not found in either public or private root', { status: 404 });
    }

    const file = files[0];
    const fileId = file.id;
    let response;

    if (file.mimeType === 'application/vnd.google-apps.document') {
      response = await drive.files.export(
        { fileId, mimeType: 'text/plain' },
        { responseType: 'stream' }
      );
    } else {
      response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );
    }

    const chunks = [];
    for await (const chunk of response.data) {
      chunks.push(chunk);
    }
    let text = Buffer.concat(chunks).toString('utf-8');

    return new Response(JSON.stringify({
      mimeType: file.mimeType,
      rawText: text,
      sanitizedText: text.replace(/[\u201C\u201D]/g, '"').replace(/^\s*\/\/.*$/gm, '')
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
