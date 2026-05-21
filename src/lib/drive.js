import { google } from 'googleapis';
import { cache } from 'react';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
}

function cdnProxy(baseCdnUrl, size) {
  const cdnUrl = `${baseCdnUrl}=${size}`;
  return `/api/thumbnail?url=${encodeURIComponent(cdnUrl)}`;
}

async function fetchFoldersWithThumbnails(drive, rootFolderId, limit = null) {
  const options = {
    q: `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name, createdTime)',
    orderBy: 'createdTime',
  };
  if (limit) {
    options.pageSize = limit + 1;
  } else {
    options.pageSize = 1000;
  }
  const foldersRes = await drive.files.list(options);

  const rawFiles = foldersRes.data.files || [];
  const hasMore = limit ? rawFiles.length > limit : false;
  const filesToProcess = limit ? rawFiles.slice(0, limit) : rawFiles;

  const folders = [];

  for (const folder of filesToProcess) {
    let targetImage = null;

    // First, search specifically for a file named "cover"
    const coverRes = await drive.files.list({
      q: `'${folder.id}' in parents and name contains 'cover' and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
      fields: 'files(id, name, thumbnailLink)',
      pageSize: 1,
    });
    
    if (coverRes.data.files && coverRes.data.files.length > 0) {
      targetImage = coverRes.data.files[0];
    }

    // If no cover found, use the first image
    if (!targetImage) {
      const imagesRes = await drive.files.list({
        q: `'${folder.id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
        fields: 'files(id, name, thumbnailLink)',
        orderBy: 'name',
        pageSize: 1, 
      });
      if (imagesRes.data.files && imagesRes.data.files.length > 0) {
        targetImage = imagesRes.data.files[0];
      }
    }

    // If still nothing, check subfolders
    if (!targetImage) {
      const subRes = await drive.files.list({
        q: `'${folder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
        pageSize: 1,
      });
      if (subRes.data.files && subRes.data.files.length > 0) {
        // Check subfolder for cover image first
        const subCoverRes = await drive.files.list({
          q: `'${subRes.data.files[0].id}' in parents and name contains 'cover' and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
          fields: 'files(id, name, thumbnailLink)',
          pageSize: 1,
        });
        if (subCoverRes.data.files && subCoverRes.data.files.length > 0) {
          targetImage = subCoverRes.data.files[0];
        } else {
          const subImagesRes = await drive.files.list({
            q: `'${subRes.data.files[0].id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
            fields: 'files(id, name, thumbnailLink)',
            orderBy: 'name',
            pageSize: 1,
          });
          if (subImagesRes.data.files && subImagesRes.data.files.length > 0) {
            targetImage = subImagesRes.data.files[0];
          }
        }
      }
    }
    
    let thumbnailUrl = null;
    let baseCdnUrl = null;
    let fallbackUrl = null;

    if (targetImage) {
      fallbackUrl = `/api/image/${targetImage.id}`;
      baseCdnUrl = targetImage.thumbnailLink ? targetImage.thumbnailLink.replace(/=[^=]*$/, '') : null;
      thumbnailUrl = baseCdnUrl ? cdnProxy(baseCdnUrl, 's200-rw') : fallbackUrl;
    }

    folders.push({
      id: folder.id,
      name: folder.name,
      createdTime: folder.createdTime,
      thumbnailUrl,
      baseCdnUrl,
      fallbackUrl
    });
  }

  return { folders, hasMore };
}

export const getFolders = cache(async () => {
  const rootFolderId = process.env.GOOGLE_DRIVE_PUBLIC_ROOT_ID;

  // Guard: if no valid root ID, return empty (build will succeed, runtime will populate)
  if (!rootFolderId || rootFolderId.includes('.') || rootFolderId.length < 10) {
    console.warn('[getFolders] GOOGLE_DRIVE_PUBLIC_ROOT_ID is missing or invalid.');
    return [];
  }

  try {
    const drive = google.drive({ version: 'v3', auth: getAuth() });

    // Check if root folder has direct images
    const rootImagesRes = await drive.files.list({
      q: `'${rootFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name, thumbnailLink)',
      orderBy: 'createdTime desc',
      pageSize: 20,
    });

    const folders = [];

    if (rootImagesRes.data.files && rootImagesRes.data.files.length > 0) {
      const coverImage = rootImagesRes.data.files.find(f => f.name.toLowerCase().includes('cover')) || rootImagesRes.data.files[0];
      let fallbackUrl = `/api/image/${coverImage.id}`;
      let baseCdnUrl = coverImage.thumbnailLink ? coverImage.thumbnailLink.replace(/=[^=]*$/, '') : null;
      
      folders.push({
        id: rootFolderId,
        name: 'Main Collection',
        thumbnailUrl: baseCdnUrl ? cdnProxy(baseCdnUrl, 's200-rw') : fallbackUrl,
        baseCdnUrl,
        fallbackUrl
      });
    }

    const { folders: subfolders } = await fetchFoldersWithThumbnails(drive, rootFolderId);
    return [...folders, ...subfolders].sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('[getFolders] Failed to fetch folders from Drive:', err.message);
    return [];
  }
});

export const getPrivateFolders = cache(async (limit = null) => {
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  const rootFolderId = process.env.GOOGLE_DRIVE_PRIVATE_ROOT_ID;

  if (!rootFolderId || rootFolderId === 'your_private_folder_id_here') {
    return { folders: [], hasMore: false };
  }

  try {
    return await fetchFoldersWithThumbnails(drive, rootFolderId, limit);
  } catch (err) {
    console.error('Error fetching private folders:', err);
    return { folders: [], hasMore: false };
  }
});

export const getFolderImages = cache(async (folderId) => {
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  
  const filesRes = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, description, imageMediaMetadata, videoMediaMetadata, thumbnailLink)',
    orderBy: 'createdTime desc',
    pageSize: 1000,
  });

  const allFiles = filesRes.data.files || [];
  const grouped = {};
  const rawSubfolders = [];
  
  for (const file of allFiles) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      rawSubfolders.push(file);
      continue;
    }

    const parts = file.name.split('.');
    const baseName = parts.length > 1 ? parts.slice(0, -1).join('.') : file.name;
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
    
    if (!grouped[baseName]) grouped[baseName] = { viewable: null, raw: null };
    
    if (['cr2', 'cr3', 'nef', 'arw', 'dng', 'raf'].includes(ext)) {
      grouped[baseName].raw = file;
    } else if (file.mimeType && (file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/'))) {
      grouped[baseName].viewable = file;
    }
  }

  const images = [];
  for (const baseName in grouped) {
    const { viewable, raw } = grouped[baseName];
    if (viewable) {
      const isVideo = viewable.mimeType.startsWith('video/');
      const baseCdnUrl = viewable.thumbnailLink ? viewable.thumbnailLink.replace(/=[^=]*$/, '') : null;
      const cdnUrl = baseCdnUrl ? cdnProxy(baseCdnUrl, 's400-rw') : `/api/image/${viewable.id}`;
      images.push({
        ...viewable,
        type: isVideo ? 'video' : 'image',
        url: `/api/image/${viewable.id}?mimeType=${encodeURIComponent(viewable.mimeType)}&filename=${encodeURIComponent(viewable.name)}`,
        cdnUrl,
        baseCdnUrl,
        rawFileId: raw ? raw.id : null,
        rawFileName: raw ? raw.name : null,
        imageMediaMetadata: isVideo ? viewable.videoMediaMetadata : viewable.imageMediaMetadata
      });
    }
  }

  const processedSubfolders = [];
  for (const folder of rawSubfolders) {
    let targetImage = null;

    // Search for cover image first
    const coverRes = await drive.files.list({
      q: `'${folder.id}' in parents and name contains 'cover' and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
      fields: 'files(id, name, thumbnailLink)',
      pageSize: 1,
    });
    if (coverRes.data.files && coverRes.data.files.length > 0) {
      targetImage = coverRes.data.files[0];
    }

    // Fall back to first image
    if (!targetImage) {
      const imagesRes = await drive.files.list({
        q: `'${folder.id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
        fields: 'files(id, name, thumbnailLink)',
        orderBy: 'name',
        pageSize: 1, 
      });
      if (imagesRes.data.files && imagesRes.data.files.length > 0) {
        targetImage = imagesRes.data.files[0];
      }
    }
    
    let thumbnailUrl = null;
    let baseCdnUrl = null;
    let fallbackUrl = null;
    if (targetImage) {
      fallbackUrl = `/api/image/${targetImage.id}`;
      baseCdnUrl = targetImage.thumbnailLink ? targetImage.thumbnailLink.replace(/=[^=]*$/, '') : null;
      thumbnailUrl = baseCdnUrl ? cdnProxy(baseCdnUrl, 's200-rw') : fallbackUrl;
    }

    processedSubfolders.push({
      id: folder.id,
      name: folder.name,
      thumbnailUrl,
      baseCdnUrl,
      fallbackUrl
    });
  }

  return {
    images,
    subfolders: processedSubfolders
  };
});

export const getImageStream = cache(async (fileId) => {
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return response.data;
});

export async function getFolderDetails(folderId) {

  const drive = google.drive({ version: 'v3', auth: getAuth() });
  try {
    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, parents'
    });
    return res.data;
  } catch (err) {
    console.error('Error fetching folder details:', err);
    return { id: folderId, name: 'Gallery' };
  }
}

// ---------------------------------------------------------------------------
// Config service — reads config.json from the private Drive root folder
// ---------------------------------------------------------------------------

function getDefaultConfig() {
  return {
    photographers: ['Studio'],
    businessName: null,
    heroTitle: 'Albums',
    whatsapp: null,
    socials: {},
  };
}

export const getConfig = cache(async () => {
  const rootFolderId = process.env.GOOGLE_DRIVE_PRIVATE_ROOT_ID;

  if (!rootFolderId || rootFolderId === 'your_private_folder_id_here') {
    return getDefaultConfig();
  }

  try {
    const drive = google.drive({ version: 'v3', auth: getAuth() });

    // Locate the file named exactly "config.json" within GOOGLE_DRIVE_PRIVATE_ROOT_ID
    const searchRes = await drive.files.list({
      q: `'${rootFolderId}' in parents and name = 'config.json' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 1,
    });

    const files = searchRes.data.files || [];
    if (files.length === 0) {
      console.warn('[getConfig] config.json not found in private root. Using default fallback.');
      return getDefaultConfig();
    }

    const fileId = files[0].id;

    // Fetch the file content stream
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // Consume the stream
    const chunks = [];
    for await (const chunk of response.data) {
      chunks.push(chunk);
    }
    const text = Buffer.concat(chunks).toString('utf-8');
    
    // Strip '//' comments to support user notes in the Drive config
    const sanitizedText = text.replace(/^\s*\/\/.*$/gm, '');
    const raw = JSON.parse(sanitizedText);

    return {
      photographers: Array.isArray(raw.photographers) && raw.photographers.length > 0
        ? raw.photographers
        : ['Studio'],
      businessName: typeof raw.businessName === 'string' && raw.businessName.trim()
        ? raw.businessName.trim()
        : null,
      heroTitle: typeof raw.heroTitle === 'string' && raw.heroTitle.trim()
        ? raw.heroTitle.trim()
        : 'Albums',
      whatsapp: typeof raw.whatsapp === 'string' && raw.whatsapp.trim()
        ? raw.whatsapp.trim()
        : null,
      phone: typeof raw.phone === 'string' && raw.phone.trim()
        ? raw.phone.trim()
        : null,
      socials: raw.socials && typeof raw.socials === 'object' ? raw.socials : {},
    };
  } catch (err) {
    console.error('[getConfig] Failed to load config.json from Drive:', err.message);
    return getDefaultConfig();
  }
});

// ---------------------------------------------------------------------------
// Check if a folder ID exists anywhere inside the private root.
// Uses a recursive Drive query — reliable, single API call, no parent traversal.
export async function isFolderInPrivateRoot(folderId) {
  const rootId = process.env.GOOGLE_DRIVE_PRIVATE_ROOT_ID;
  if (!rootId) return false;
  // Direct child of private root
  if (folderId === rootId) return false; // root itself is not a valid gallery

  const drive = google.drive({ version: 'v3', auth: getAuth() });
  try {
    // Walk up parents until we hit the private root or run out of parents
    let currentId = folderId;
    for (let i = 0; i < 10; i++) {
      const res = await drive.files.get({
        fileId: currentId,
        fields: 'parents',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const parents = res.data.parents;
      if (!parents || parents.length === 0) return false;
      if (parents.includes(rootId)) return true;
      currentId = parents[0];
    }
  } catch (err) {
    console.error('isFolderInPrivateRoot error:', err.message);
    // On error, fail closed for security
    return false;
  }
  return false;
}
