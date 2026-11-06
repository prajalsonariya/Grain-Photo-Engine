import Header from '@/components/Header';
import { getFolderImages, getFolderDetails, getValidOAuthClientForUser } from '@/lib/drive';
import GalleryClient from './GalleryClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getCachedUserByUsername } from '@/lib/userCache';
import { cache } from 'react';

export const revalidate = 60;

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
  const { username, id } = await params;
  const data = await getUserAndClient(username);
  if (!data) return { title: 'Gallery' };

  const folder = await getFolderDetails(data.oauthClient, id);
  return {
    title: folder ? `${folder.name} | Gallery` : 'Gallery',
  };
}

export default async function GalleryPage({ params }) {
  const { username, id } = await params;
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
      getFolderImages(oauthClient, username, id),
      getFolderDetails(oauthClient, id),
    ]);
    images = res.images || [];
    subfolders = res.subfolders || [];
    folder = folderRes;
  } catch (err) {
    console.error(`[Gallery error for ${username}/${id}]:`, err?.message || err);
  }

  if (!folder) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-white/20 selection:text-white">
      <Header config={user} isAgency={plan === 'agency'} homeUrl={`/${username}`} />
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 pt-18 sm:pt-28 md:pt-32 pb-24 min-h-screen">
        <div className="mb-6 sm:mb-8 flex flex-col items-start gap-3 sm:gap-4">
          <Link href={`/${username}`} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em]">
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>
          <h1 className="text-xl sm:text-3xl font-light text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase truncate max-w-full">
            {folder?.name || 'Gallery'}
          </h1>
        </div>
        <GalleryClient
          initialFolder={folder}
          initialImages={images}
          initialSubfolders={subfolders}
          basePath={`/${username}/gallery`}
          username={username}
          whatsapp={user.whatsapp}
        />
      </div>
    </main>
  );
}
