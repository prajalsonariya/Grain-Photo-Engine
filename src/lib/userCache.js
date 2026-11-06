import prisma from './prisma.js';

// In-memory cache for user database lookups to prevent Prisma connection pool starvation
const cache = new Map();
const TTL_MS = 60_000; // 60 seconds

export async function getCachedUserByUsername(username) {
  if (!username) return null;
  const now = Date.now();
  const cached = cache.get(`user:u:${username}`);
  if (cached && cached.expiry > now) {
    return cached.data;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { accounts: { where: { provider: 'google' } } }
    });

    if (user) {
      cache.set(`user:u:${username}`, { data: user, expiry: now + TTL_MS });
      cache.set(`user:id:${user.id}`, { data: user, expiry: now + TTL_MS });
    }
    return user;
  } catch (err) {
    console.error(`[userCache error for username ${username}]:`, err?.message || err);
    // Return stale cache if DB error occurs
    if (cached) return cached.data;
    throw err;
  }
}

export async function getCachedUserById(id) {
  if (!id) return null;
  const now = Date.now();
  const cached = cache.get(`user:id:${id}`);
  if (cached && cached.expiry > now) {
    return cached.data;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { accounts: { where: { provider: 'google' } } }
    });

    if (user) {
      cache.set(`user:id:${id}`, { data: user, expiry: now + TTL_MS });
      if (user.username) {
        cache.set(`user:u:${user.username}`, { data: user, expiry: now + TTL_MS });
      }
    }
    return user;
  } catch (err) {
    console.error(`[userCache error for id ${id}]:`, err?.message || err);
    if (cached) return cached.data;
    throw err;
  }
}

export function invalidateUserCache(usernameOrId) {
  if (!usernameOrId) {
    cache.clear();
    return;
  }
  for (const [key, entry] of cache.entries()) {
    if (
      key.includes(usernameOrId) || 
      entry.data?.id === usernameOrId || 
      entry.data?.username === usernameOrId
    ) {
      cache.delete(key);
    }
  }
}
