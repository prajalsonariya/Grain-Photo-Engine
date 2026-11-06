import Header from '@/components/Header';
import HomeClient from './HomeClient';
import { getFolders, getValidOAuthClientForUser } from '@/lib/drive';
import { getCachedUserByUsername } from '@/lib/userCache';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Cache page but revalidate every 60s for performance

export default async function Home({ params }) {
  const { username } = await params;

  let user = null;
  try {
    user = await getCachedUserByUsername(username);
  } catch (err) {
    console.error(`[DB error fetching user ${username}]:`, err?.message || err);
    notFound();
  }

  if (!user || !user.publicFolderId || !user.accounts[0]?.access_token) {
    notFound();
  }

  let folders = [];
  try {
    const oauthClient = await getValidOAuthClientForUser(user.id);
    folders = await getFolders(oauthClient, username, user.publicFolderId);
  } catch (error) {
    console.error(`[Drive error for ${username}]:`, error?.message || error);
  }

  const isAgency = user.plan === 'agency';

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-neutral-200 font-sans selection:bg-white/20 selection:text-white relative overflow-hidden">
      <Header config={user} isAgency={isAgency} homeUrl={`/${username}`} />
      <HomeClient folders={folders} heroTitle={user.heroTitle} username={username} />
    </main>
  );
}
