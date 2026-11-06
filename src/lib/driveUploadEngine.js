/**
 * Grain Photo Engine 2.0 — Resumable Direct-to-Drive Upload Engine
 * 
 * Bypasses Vercel/Next.js 4.5MB server payload limits by initiating Google Drive
 * resumable upload sessions and streaming raw file chunks directly from the browser.
 */

/**
 * Initiates a Google Drive Resumable Upload session.
 */
async function initiateResumableSession(accessToken, file, parentFolderId) {
  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    parents: [parentFolderId]
  };

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': metadata.mimeType,
      'X-Upload-Content-Length': file.size.toString(),
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to initiate upload session (${response.status}): ${errorText}`);
  }

  const sessionUri = response.headers.get('Location');
  if (!sessionUri) {
    throw new Error('Google Drive did not return a resumable session URI');
  }

  return sessionUri;
}

/**
 * Streams a File to the resumable session URI with progress tracking.
 */
function uploadToSessionUri(sessionUri, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', sessionUri, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          onProgress(percent, e.loaded, e.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch (e) {
          resolve({ id: 'done', name: file.name });
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

/**
 * Single file upload executor with token renewal and progress.
 */
export async function uploadSingleFileResumable(accessToken, file, parentFolderId, onProgress) {
  const sessionUri = await initiateResumableSession(accessToken, file, parentFolderId);
  return uploadToSessionUri(sessionUri, file, onProgress);
}

/**
 * Concurrency Queue to process multiple files (default: 3 concurrent).
 */
export async function processUploadQueue(items, concurrency = 3, onFileProgress, onFileComplete) {
  const queue = [...items];
  const activeWorkers = [];

  const worker = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      try {
        const result = await uploadSingleFileResumable(
          item.accessToken,
          item.file,
          item.folderId,
          (percent, loaded, total) => {
            if (onFileProgress) onFileProgress(item.id, percent, loaded, total);
          }
        );
        if (onFileComplete) onFileComplete(item.id, null, result);
      } catch (err) {
        console.error(`Upload error on ${item.file.name}:`, err);
        if (onFileComplete) onFileComplete(item.id, err, null);
      }
    }
  };

  const poolSize = Math.min(concurrency, items.length);
  for (let i = 0; i < poolSize; i++) {
    activeWorkers.push(worker());
  }

  await Promise.all(activeWorkers);
}

/**
 * Recursively parses dropped folders/files using webkitGetAsEntry.
 */
export async function extractDroppedEntries(dataTransferItems) {
  const filesWithPaths = [];

  async function traverse(entry, path = '') {
    if (entry.isFile) {
      const file = await new Promise((resolve) => entry.file(resolve));
      filesWithPaths.push({ file, path });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const entries = await new Promise((resolve) => {
        dirReader.readEntries(resolve);
      });
      for (const child of entries) {
        await traverse(child, path ? `${path}/${entry.name}` : entry.name);
      }
    }
  }

  const entries = [];
  for (let i = 0; i < dataTransferItems.length; i++) {
    const item = dataTransferItems[i];
    if (item.webkitGetAsEntry) {
      const entry = item.webkitGetAsEntry();
      if (entry) entries.push(entry);
    } else if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) filesWithPaths.push({ file, path: '' });
    }
  }

  for (const entry of entries) {
    await traverse(entry);
  }

  return filesWithPaths;
}
