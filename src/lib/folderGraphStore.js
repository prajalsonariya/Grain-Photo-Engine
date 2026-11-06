"use client";

// Client-Side In-Memory Folder Graph Store for Instant 0ms Navigation
const cache = new Map();
const inFlightRequests = new Map();
let currentFetchSeq = 0;

export function getNextFetchSeq() {
  currentFetchSeq += 1;
  return currentFetchSeq;
}

export function getCurrentFetchSeq() {
  return currentFetchSeq;
}

export function getCachedFolder(folderId) {
  if (!folderId) return null;
  const entry = cache.get(folderId);
  if (!entry) return null;
  // Keep cache valid for 10 minutes client-side
  if (Date.now() - entry.timestamp > 10 * 60 * 1000) {
    cache.delete(folderId);
    return null;
  }
  return entry;
}

export function setCachedFolder(folderId, data, scrollY = 0) {
  if (!folderId || !data) return;
  // Limit client cache to 100 folders
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(folderId, {
    ...data,
    scrollY,
    timestamp: Date.now()
  });
}

export function updateCachedFolderScroll(folderId, scrollY) {
  const entry = cache.get(folderId);
  if (entry) {
    entry.scrollY = scrollY;
  }
}

export function invalidateClientFolder(folderId = null) {
  if (!folderId) {
    cache.clear();
    return;
  }
  cache.delete(folderId);
}

// Prefetch a folder payload into client RAM during idle / hover
export async function prefetchFolder(folderId, type = "studio", username = null) {
  if (!folderId) return null;
  if (cache.has(folderId)) return cache.get(folderId);
  if (inFlightRequests.has(folderId)) return inFlightRequests.get(folderId);

  const url = type === "studio" 
    ? `/api/studio/folders?folderId=${encodeURIComponent(folderId)}`
    : `/api/gallery/${encodeURIComponent(username)}/${encodeURIComponent(folderId)}`;

  const promise = fetch(url, { priority: "low" })
    .then(res => res.json())
    .then(json => {
      if (json.success && json.data) {
        setCachedFolder(folderId, json.data);
        return json.data;
      }
      return null;
    })
    .catch(err => {
      console.warn(`[Prefetch notice for ${folderId}]:`, err?.message);
      return null;
    })
    .finally(() => {
      inFlightRequests.delete(folderId);
    });

  inFlightRequests.set(folderId, promise);
  return promise;
}
