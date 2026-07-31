import { google } from 'googleapis';
import { cache } from 'react';

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

function cdnProxy(baseCdnUrl, size) {
  const cdnUrl = `${baseCdnUrl}=${size}`;
  return `/api/thumbnail?url=${encodeURIComponent(cdnUrl)}`;
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
  console.log(`[DEBUG] fetchFoldersWithThumbnails for rootFolderId: ${rootFolderId}`);
  console.log(`[DEBUG] Google Drive returned ${rawFiles.length} folders.`);
  if (rawFiles.length === 0) {
    // If 0, let's just do a generic search in this folder to see if ANY files exist
    const anyFilesRes = await drive.files.list({
      q: `'${rootFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)'
    });
    console.log(`[DEBUG] Generic search in ${rootFolderId} returned ${anyFilesRes.data.files?.length || 0} items. MimeTypes:`, anyFilesRes.data.files?.map(f => f.mimeType));
  }
  
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
      fallbackUrl = `/api/image/${username}/${targetImage.id}`;
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

export const getFolders = cache(async (oauthClient, username, rootFolderId) => {
  const drive = google.drive({ version: 'v3', auth: oauthClient });
  
  // Check if root folder has direct images
  const rootImagesRes = await drive.files.list({
    q: `'${rootFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: 'files(id, name, thumbnailLink)',
    orderBy: 'createdTime desc',
    pageSize: 20, // get a few to check for 'cover'
  });

  const folders = [];

  if (rootImagesRes.data.files && rootImagesRes.data.files.length > 0) {
    const coverImage = rootImagesRes.data.files.find(f => f.name.toLowerCase().includes('cover')) || rootImagesRes.data.files[0];
    let fallbackUrl = `/api/image/${username}/${coverImage.id}`;
    let baseCdnUrl = coverImage.thumbnailLink ? coverImage.thumbnailLink.replace(/=[^=]*$/, '') : null;
    
    folders.push({
      id: rootFolderId,
      name: 'Main Collection',
      thumbnailUrl: baseCdnUrl ? cdnProxy(baseCdnUrl, 's200-rw') : fallbackUrl,
      baseCdnUrl,
      fallbackUrl
    });
  }

  const { folders: subfolders } = await fetchFoldersWithThumbnails(drive, username, rootFolderId);
  return [...folders, ...subfolders].sort((a, b) => a.name.localeCompare(b.name));
});

export const getPrivateFolders = cache(async (oauthClient, username, rootFolderId, limit = null) => {
  const drive = google.drive({ version: 'v3', auth: oauthClient });

  if (!rootFolderId || rootFolderId === 'your_private_folder_id_here') {
    return { folders: [], hasMore: false };
  }

  try {
    return await fetchFoldersWithThumbnails(drive, username, rootFolderId, limit);
  } catch (err) {
    console.error('Error fetching private folders:', err);
    return { folders: [], hasMore: false };
  }
});

export const getFolderImages = cache(async (oauthClient, username, folderId) => {
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

      // If no thumbnail exists and it's a video, don't fall back to the raw file for the grid thumbnail
      // because an <img> tag cannot display an .mp4 file.
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
  const drive = google.drive({ version: 'v3', auth: oauthClient });
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
