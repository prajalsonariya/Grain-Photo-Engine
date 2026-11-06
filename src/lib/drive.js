import { google } from 'googleapis';
import { cache } from 'react';
import prisma from './prisma.js';
import { getCachedUserByUsername } from './userCache.js';

export function getOAuthClient(accessToken, refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ 
    access_token: accessToken,
    refresh_token: refreshToken
  });
  return oauth2Client;
}

const oauthClientCache = new Map();

export async function getValidOAuthClientForUser(userId) {
  const now = Date.now();
  const cached = oauthClientCache.get(userId);
  if (cached && cached.expiryDate > now + 5 * 60 * 1000) {
    return cached.client;
  }

  const account = await prisma.account.findFirst({
    where: { userId, provider: 'google' }
  });

  if (!account || !account.access_token) {
    throw new Error('No Google account linked');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  const expiryDate = account.expires_at ? account.expires_at * 1000 : now + 3600 * 1000;

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: expiryDate
  });

  // Attach auto-persistence on refresh
  oauth2Client.on('tokens', async (tokens) => {
    try {
      const newExpiry = tokens.expiry_date || (tokens.expires_in ? now + tokens.expires_in * 1000 : now + 3600 * 1000);
      oauthClientCache.set(userId, {
        client: oauth2Client,
        expiryDate: newExpiry
      });
      await prisma.account.updateMany({
        where: { id: account.id },
        data: {
          access_token: tokens.access_token,
          ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
          ...(tokens.expiry_date ? { expires_at: Math.floor(tokens.expiry_date / 1000) } : {}),
        }
      });
    } catch (err) {
      console.error('[Drive Token Vault] Failed to persist refreshed token:', err);
    }
  });

  // Proactively refresh if expired or expiring within 5 minutes
  const isExpiring = !account.expires_at || (account.expires_at * 1000 < now + 5 * 60 * 1000);
  if (isExpiring && account.refresh_token) {
    try {
      const refreshed = await oauth2Client.refreshAccessToken();
      const newTokens = refreshed.credentials;
      const newExpiry = newTokens.expiry_date || now + 3600 * 1000;
      oauthClientCache.set(userId, {
        client: oauth2Client,
        expiryDate: newExpiry
      });
      await prisma.account.updateMany({
        where: { id: account.id },
        data: {
          access_token: newTokens.access_token,
          ...(newTokens.refresh_token ? { refresh_token: newTokens.refresh_token } : {}),
          ...(newTokens.expiry_date ? { expires_at: Math.floor(newTokens.expiry_date / 1000) } : {}),
        }
      });
    } catch (err) {
      console.warn('[Drive Token Vault] Proactive token refresh notice:', err?.message);
    }
  } else {
    oauthClientCache.set(userId, {
      client: oauth2Client,
      expiryDate
    });
  }

  return oauth2Client;
}

export async function getValidOAuthClientForUsername(username) {
  const user = await getCachedUserByUsername(username);
  if (!user) throw new Error(`User not found: ${username}`);
  return getValidOAuthClientForUser(user.id);
}

function cdnProxy(baseCdnUrl, size) {
  if (!baseCdnUrl) return null;
  return `${baseCdnUrl}=${size}`;
}

// In-memory SWR response cache for Drive metadata queries (Fresh 60s, Stale up to 10m)
const driveCache = new Map();
const FRESH_TTL_MS = 60_000;
const STALE_TTL_MS = 10 * 60_000;

function getCached(key) {
  const item = driveCache.get(key);
  if (!item) return null;
  const now = Date.now();
  if (now > item.staleExpiry) {
    driveCache.delete(key);
    return null;
  }
  return {
    data: item.data,
    isStale: now > item.freshExpiry
  };
}

function setCached(key, data) {
  if (driveCache.size > 500) {
    const oldestKey = driveCache.keys().next().value;
    driveCache.delete(oldestKey);
  }
  const now = Date.now();
  driveCache.set(key, {
    data,
    freshExpiry: now + FRESH_TTL_MS,
    staleExpiry: now + STALE_TTL_MS
  });
}

export function invalidateDriveCache(folderId = null) {
  if (!folderId) {
    driveCache.clear();
    return;
  }
  for (const key of driveCache.keys()) {
    if (key.includes(folderId)) {
      driveCache.delete(key);
    }
  }
}

function extractId(str) {
  if (!str) return null;
  // If the user accidentally pasted a full Google Drive URL instead of the ID, extract the 33-char ID
  const match = str.match(/[-\w]{25,}/);
  return match ? match[0] : str;
}

async function fetchFoldersWithThumbnails(drive, username, rootFolderId, limit = null) {
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

  // Resolve covers in parallel with subfolder recursion fallback
  const folders = await Promise.all(
    filesToProcess.map(async (folder) => {
      let targetImage = null;

      try {
        const res = await drive.files.list({
          q: `'${folder.id}' in parents and trashed = false`,
          fields: 'files(id, name, mimeType, thumbnailLink, appProperties)',
          pageSize: 10,
        });
        const files = res.data.files || [];

        const mediaFiles = files.filter(f =>
          (f.mimeType && (f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/'))) ||
          /\.(jpg|jpeg|png|webp|mov|mp4|raf|cr2|cr3|nef|arw|dng)$/i.test(f.name)
        );

        targetImage = mediaFiles.find(f => f.appProperties?.isGrainCover === 'true')
          || mediaFiles.find(f => f.name.toLowerCase().includes('cover'))
          || mediaFiles[0];

        // If no direct image in folder root, inspect first subfolder for its cover
        if (!targetImage) {
          const subfolder = files.find(f => f.mimeType === 'application/vnd.google-apps.folder');
          if (subfolder) {
            const subRes = await drive.files.list({
              q: `'${subfolder.id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
              fields: 'files(id, name, mimeType, thumbnailLink, appProperties)',
              pageSize: 4,
            });
            const subMedia = subRes.data.files || [];
            targetImage = subMedia.find(f => f.appProperties?.isGrainCover === 'true')
              || subMedia.find(f => f.name.toLowerCase().includes('cover'))
              || subMedia[0];
          }
        }
      } catch (err) {
        console.warn(`[Cover lookup error for ${folder.id}]:`, err?.message);
      }

      let thumbnailUrl = null;
      let baseCdnUrl = null;
      let fallbackUrl = null;

      if (targetImage) {
        fallbackUrl = `/api/image/${username}/${targetImage.id}`;
        baseCdnUrl = targetImage.thumbnailLink ? targetImage.thumbnailLink.replace(/=[^=]*$/, '') : null;
        thumbnailUrl = baseCdnUrl ? cdnProxy(baseCdnUrl, 's400-rw') : fallbackUrl;
      }

      return {
        id: folder.id,
        name: folder.name,
        createdTime: folder.createdTime,
        thumbnailUrl,
        baseCdnUrl,
        fallbackUrl
      };
    })
  );

  return { folders, hasMore };
}

async function fetchFoldersInternal(oauthClient, username, rootFolderId) {
  const drive = google.drive({ version: 'v3', auth: oauthClient });
  
  const [rootImagesRes, subfoldersRes] = await Promise.all([
    drive.files.list({
      q: `'${rootFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name, thumbnailLink)',
      orderBy: 'createdTime desc',
      pageSize: 20,
    }).catch(err => {
      console.warn('[Root images error]:', err?.message);
      return { data: { files: [] } };
    }),
    fetchFoldersWithThumbnails(drive, username, rootFolderId),
  ]);

  const folders = [];

  if (rootImagesRes?.data?.files && rootImagesRes.data.files.length > 0) {
    const coverImage = rootImagesRes.data.files.find(f => f.name.toLowerCase().includes('cover')) || rootImagesRes.data.files[0];
    let fallbackUrl = `/api/image/${username}/${coverImage.id}`;
    let baseCdnUrl = coverImage.thumbnailLink ? coverImage.thumbnailLink.replace(/=[^=]*$/, '') : null;
    
    folders.push({
      id: rootFolderId,
      name: 'Main Collection',
      thumbnailUrl: baseCdnUrl ? cdnProxy(baseCdnUrl, 's400-rw') : fallbackUrl,
      baseCdnUrl,
      fallbackUrl
    });
  }

  const subfolders = subfoldersRes?.folders || [];
  return [...folders, ...subfolders].sort((a, b) => a.name.localeCompare(b.name));
}

export const getFolders = cache(async (oauthClient, username, rootFolderId) => {
  const cacheKey = `folders:${username}:${rootFolderId}`;
  const cached = getCached(cacheKey);
  if (cached) {
    if (cached.isStale) {
      fetchFoldersInternal(oauthClient, username, rootFolderId).then(fresh => {
        setCached(cacheKey, fresh);
      }).catch(() => {});
    }
    return cached.data;
  }

  const result = await fetchFoldersInternal(oauthClient, username, rootFolderId);
  setCached(cacheKey, result);
  return result;
});

export const getPrivateFolders = cache(async (oauthClient, username, rootFolderId, limit = null) => {
  const cacheKey = `privateFolders:${username}:${rootFolderId}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) {
    if (cached.isStale) {
      const drive = google.drive({ version: 'v3', auth: oauthClient });
      fetchFoldersWithThumbnails(drive, username, rootFolderId, limit).then(fresh => {
        setCached(cacheKey, fresh);
      }).catch(() => {});
    }
    return cached.data;
  }

  const drive = google.drive({ version: 'v3', auth: oauthClient });

  if (!rootFolderId || rootFolderId === 'your_private_folder_id_here') {
    return { folders: [], hasMore: false };
  }

  try {
    const result = await fetchFoldersWithThumbnails(drive, username, rootFolderId, limit);
    setCached(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Error fetching private folders:', err);
    return { folders: [], hasMore: false };
  }
});

async function fetchFolderImagesInternal(oauthClient, username, folderId) {
  const drive = google.drive({ version: 'v3', auth: oauthClient });
  
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
    
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
    const isVideo = (file.mimeType && file.mimeType.startsWith('video/')) || videoExtensions.includes(ext);
    
    // Group videos separately from images so they don't overwrite each other if they share a name
    const groupKey = isVideo ? `${baseName}_video` : baseName;
    
    if (!grouped[groupKey]) grouped[groupKey] = { viewable: null, raw: null };
    
    if (['cr2', 'cr3', 'nef', 'arw', 'dng', 'raf'].includes(ext)) {
      grouped[groupKey].raw = file;
    } else if (isVideo || (file.mimeType && file.mimeType.startsWith('image/'))) {
      grouped[groupKey].viewable = file;
    }
  }

  const images = [];
  for (const baseName in grouped) {
    const { viewable, raw } = grouped[baseName];
    if (viewable) {
      const viewableExt = viewable.name.split('.').pop().toLowerCase();
      const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
      const isVideo = (viewable.mimeType && viewable.mimeType.startsWith('video/')) || videoExtensions.includes(viewableExt);
      const baseCdnUrl = viewable.thumbnailLink ? viewable.thumbnailLink.replace(/=[^=]*$/, '') : null;
      
      // Parse description for YouTube or Vimeo links
      let embedUrl = null;
      let isEmbed = false;
      let cleanDescription = viewable.description;
      
      if (viewable.description) {
        const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i;
        const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/i;
        const ytMatch = viewable.description.match(ytRegex);
        const vimeoMatch = viewable.description.match(vimeoRegex);
        
        if (ytMatch) {
          isEmbed = true;
          embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
          cleanDescription = cleanDescription.replace(ytRegex, '').trim();
        } else if (vimeoMatch) {
          isEmbed = true;
          embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
          cleanDescription = cleanDescription.replace(vimeoRegex, '').trim();
        }
      }

      // High performance direct CDN thumbnail
      let cdnUrl = null;
      if (baseCdnUrl) {
        cdnUrl = cdnProxy(baseCdnUrl, 's400-rw');
      }
      if (!baseCdnUrl || isVideo) {
        cdnUrl = `/api/image/${username}/${viewable.id}`;
      }
      
      let type = 'image';
      if (isEmbed) type = 'embed';
      else if (isVideo) type = 'video';

      images.push({
        ...viewable,
        description: cleanDescription || null,
        type,
        embedUrl,
        url: `/api/image/${username}/${viewable.id}?mimeType=${encodeURIComponent(viewable.mimeType)}&filename=${encodeURIComponent(viewable.name)}`,
        cdnUrl,
        baseCdnUrl,
        rawFileId: raw ? raw.id : null,
        rawFileName: raw ? raw.name : null,
        imageMediaMetadata: isVideo ? viewable.videoMediaMetadata : viewable.imageMediaMetadata
      });
    }
  }

  // Parallel subfolder cover resolution with nested fallback
  const processedSubfolders = await Promise.all(
    rawSubfolders.map(async (folder) => {
      let targetImage = null;

      try {
        const res = await drive.files.list({
          q: `'${folder.id}' in parents and trashed = false`,
          fields: 'files(id, name, mimeType, thumbnailLink, appProperties)',
          pageSize: 10,
        });
        const files = res.data.files || [];

        const mediaFiles = files.filter(f =>
          (f.mimeType && (f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/'))) ||
          /\.(jpg|jpeg|png|webp|mov|mp4|raf|cr2|cr3|nef|arw|dng)$/i.test(f.name)
        );

        targetImage = mediaFiles.find(f => f.appProperties?.isGrainCover === 'true')
          || mediaFiles.find(f => f.name.toLowerCase().includes('cover'))
          || mediaFiles[0];

        if (!targetImage) {
          const subfolder = files.find(f => f.mimeType === 'application/vnd.google-apps.folder');
          if (subfolder) {
            const subRes = await drive.files.list({
              q: `'${subfolder.id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
              fields: 'files(id, name, mimeType, thumbnailLink, appProperties)',
              pageSize: 4,
            });
            const subMedia = subRes.data.files || [];
            targetImage = subMedia.find(f => f.appProperties?.isGrainCover === 'true')
              || subMedia.find(f => f.name.toLowerCase().includes('cover'))
              || subMedia[0];
          }
        }
      } catch (err) {
        console.warn(`[Subfolder cover lookup error for ${folder.id}]:`, err?.message);
      }

      let thumbnailUrl = null;
      let baseCdnUrl = null;
      let fallbackUrl = null;

      if (targetImage) {
        fallbackUrl = `/api/image/${username}/${targetImage.id}`;
        baseCdnUrl = targetImage.thumbnailLink ? targetImage.thumbnailLink.replace(/=[^=]*$/, '') : null;
        thumbnailUrl = baseCdnUrl ? cdnProxy(baseCdnUrl, 's400-rw') : fallbackUrl;
      }

      return {
        id: folder.id,
        name: folder.name,
        thumbnailUrl,
        baseCdnUrl,
        fallbackUrl
      };
    })
  );

  return {
    images,
    subfolders: processedSubfolders
  };
}

export const getFolderImages = cache(async (oauthClient, username, folderId) => {
  const cacheKey = `folderImages:${username}:${folderId}`;
  const cached = getCached(cacheKey);
  if (cached) {
    if (cached.isStale) {
      fetchFolderImagesInternal(oauthClient, username, folderId).then(fresh => {
        setCached(cacheKey, fresh);
      }).catch(() => {});
    }
    return cached.data;
  }

  const result = await fetchFolderImagesInternal(oauthClient, username, folderId);
  setCached(cacheKey, result);
  return result;
});

export const getImageStream = cache(async (oauthClient, fileId, rangeHeader = null) => {
  const drive = google.drive({ version: 'v3', auth: oauthClient });
  
  const fetchOptions = { responseType: 'stream' };
  if (rangeHeader) {
    fetchOptions.headers = { Range: rangeHeader };
  }

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    fetchOptions
  );
  
  return {
    stream: response.data,
    headers: response.headers,
    status: response.status
  };
});

export const getFolderDetails = cache(async (oauthClient, folderId) => {
  const cacheKey = `folderDetails:${folderId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached.data;

  const drive = google.drive({ version: 'v3', auth: oauthClient });
  try {
    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, parents'
    });
    setCached(cacheKey, res.data, 5 * 60_000);
    return res.data;
  } catch (err) {
    console.error('Error fetching folder details:', err);
    return { id: folderId, name: 'Gallery' };
  }
});

// ---------------------------------------------------------------------------
// Check if a folder ID exists anywhere inside the private root.
// Uses a recursive Drive query — reliable, single API call, no parent traversal.
export async function isFolderInPrivateRoot(oauthClient, privateRootId, folderId) {
  const rootId = privateRootId;
  if (!rootId) return false;
  // Direct child of private root
  if (folderId === rootId) return false; // root itself is not a valid gallery

  const drive = google.drive({ version: 'v3', auth: oauthClient });
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
