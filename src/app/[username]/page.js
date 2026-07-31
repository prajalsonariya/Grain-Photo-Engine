import Header from '@/components/Header';
import HomeClient from './HomeClient';
import { getFolders, getConfig, getOAuthClient } from '@/lib/drive';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Cache page but revalidate every 60s for performance

export default async function Home({ params }) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: { accounts: { where: { provider: 'google' } } }
  });

  if (!user || !user.publicFolderId || !user.accounts[0]?.access_token) {
    notFound();
  }

  const oauthClient = getOAuthClient(user.accounts[0].access_token, user.accounts[0].refresh_token);
  const folders = await getFolders(oauthClient, username, user.publicFolderId);

  const isAgency = user.plan === 'agency';

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-neutral-200 font-sans selection:bg-white/20 selection:text-white relative overflow-hidden">
      <Header config={user} isAgency={isAgency} homeUrl={`/${username}`} />
      <HomeClient folders={folders} heroTitle={user.heroTitle} username={username} />
    </main>
  );
}
