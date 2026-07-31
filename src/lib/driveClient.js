/**
 * Client-side Google Drive API interactions.
 * These functions execute directly in the browser to bypass Next.js 4MB payload limits.
 */

export async function createDriveFolder(accessToken, name, parentId) {
  const metadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  };

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    throw new Error('Failed to create folder');
  }

  return response.json();
}

export async function deleteDriveFile(accessToken, fileId) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete file');
  }

  return true;
}

export async function uploadDriveFile(accessToken, file, parentId, onProgress) {
  // We use multipart upload for Google Drive API v3
  // Construct the multipart body manually
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    parents: [parentId]
  };

  // Convert file to ArrayBuffer
  const fileData = await file.arrayBuffer();

  const bodyParts = [
    new Blob([delimiter, 'Content-Type: application/json\r\n\r\n', JSON.stringify(metadata), delimiter, 'Content-Type: ', metadata.mimeType, '\r\n\r\n']),
    fileData,
    new Blob([close_delim])
  ];

  const requestBody = new Blob(bodyParts);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    // Do NOT set Content-Type header with xhr, we must set it properly with boundary
    xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText} - ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.send(requestBody);
  });
}
