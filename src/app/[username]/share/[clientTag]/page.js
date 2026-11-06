import Header from '@/components/Header';
import { getFolderImages, getFolderDetails, getValidOAuthClientForUser } from '@/lib/drive';
import GalleryClient from '@/app/[username]/gallery/[id]/GalleryClient';
import { notFound } from 'next/navigation';
import { getCachedUserByUsername } from '@/lib/userCache';
import { cache } from 'react';

export const revalidate = 60; // Cache page but revalidate every 60s for performance

const getUserAndClient = cache(async (username) => {
  try {
    const user = await getCachedUserByUsername(username);
    if (!user || !user.accounts[0]?.access_token) return null;
    const oauthClient = await getValidOAuthClientForUser(user.id);
    return { user, oauthClient };
  } catch (err) {
    console.error(`[getUserAndClient error for ${username}]:`, err?.message || err);
    return null;
  }
});

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

  let images = [];
  let subfolders = [];
  let folder = null;

  try {
    const [res, folderRes] = await Promise.all([
      getFolderImages(oauthClient, username, clientTag),
      getFolderDetails(oauthClient, clientTag),
    ]);
    images = res.images || [];
    subfolders = res.subfolders || [];
    folder = folderRes;
  } catch (err) {
    console.error(`[Share error for ${username}/${clientTag}]:`, err?.message || err);
  }

  if (!folder) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-neutral-200 font-sans selection:bg-white/20 selection:text-white">
      <Header config={user} isAgency={plan === 'agency'} homeUrl={`/${username}`} />
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 pt-18 sm:pt-28 md:pt-32 pb-24 min-h-screen">
        <div className="mb-6 sm:mb-8 flex flex-col items-start gap-3 sm:gap-4">
          <div className="inline-block px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-semibold tracking-widest uppercase">
            Private Client Gallery
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase truncate max-w-full">
            {folder?.name || 'Client Gallery'}
          </h1>
        </div>
        <GalleryClient
          initialFolder={folder}
          initialImages={images}
          initialSubfolders={subfolders}
          basePath={`/${username}/share`}
          username={username}
          whatsapp={user.whatsapp}
        />
      </div>
    </main>
  );
}
