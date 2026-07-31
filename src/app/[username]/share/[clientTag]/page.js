import Header from '@/components/Header';
import { getFolderImages, getFolderDetails, getConfig, getOAuthClient } from '@/lib/drive';
import GalleryClient from '@/app/[username]/gallery/[id]/GalleryClient';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

export const revalidate = 60; // Cache page but revalidate every 60s for performance

async function getUserAndClient(username) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { accounts: { where: { provider: 'google' } } }
  });
  if (!user || !user.accounts[0]?.access_token) return null;
  return { user, oauthClient: getOAuthClient(user.accounts[0].access_token, user.accounts[0].refresh_token) };
}

export async function generateMetadata({ params }) {
  const { username, clientTag } = await params;
  const data = await getUserAndClient(username);
  if (!data) return { title: 'Client Gallery' };

  const folder = await getFolderDetails(data.oauthClient, clientTag);

  return {
    title: folder ? `${folder.name} | Client Gallery` : 'Client Gallery',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SharePage({ params }) {
  const { username, clientTag } = await params;
  const data = await getUserAndClient(username);
  if (!data) notFound();

  const { oauthClient, user } = data;

  const plan = user.plan || 'freelancer';
  if (plan === 'portfolio') notFound();

  const [{ images, subfolders }, folder] = await Promise.all([
    getFolderImages(oauthClient, username, clientTag),
    getFolderDetails(oauthClient, clientTag),
  ]);

  if (!folder) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-neutral-200 font-sans selection:bg-white/20 selection:text-white">
      <Header config={user} isAgency={plan === 'agency'} homeUrl={`/${username}`} />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-32 pb-24 min-h-screen">
        <div className="mb-8 flex flex-col items-start gap-4">
          <div className="inline-block px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-semibold tracking-widest uppercase">
            Private Client Gallery
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-[0.2em] uppercase">
            {folder?.name || 'Client Gallery'}
          </h1>
        </div>
        <GalleryClient
          initialImages={images}
          initialSubfolders={subfolders}
          basePath="/share"
          whatsapp={user.whatsapp}
        />
      </div>
    </main>
  );
}
