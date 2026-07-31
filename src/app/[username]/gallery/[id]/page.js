import Header from '@/components/Header';
import { getFolderImages, getFolderDetails, getConfig, getOAuthClient } from '@/lib/drive';
import GalleryClient from './GalleryClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

export const revalidate = 60;

async function getUserAndClient(username) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { accounts: { where: { provider: 'google' } } }
  });
  if (!user || !user.accounts[0]?.access_token) return null;
  return { user, oauthClient: getOAuthClient(user.accounts[0].access_token, user.accounts[0].refresh_token) };
}

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

  const [{ images, subfolders }, folder] = await Promise.all([
    getFolderImages(oauthClient, username, id),
    getFolderDetails(oauthClient, id),
  ]);

  if (!folder) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-white/20 selection:text-white">
      <Header config={user} isAgency={plan === 'agency'} homeUrl={`/${username}`} />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-32 pb-24 min-h-screen">
        <div className="mb-8 flex flex-col items-start gap-4">
          <Link href={`/${username}`} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-[10px] sm:text-xs uppercase tracking-[0.3em]">
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>
          <h1 className="text-2xl sm:text-3xl font-light text-white tracking-[0.2em] uppercase">
            {folder?.name || 'Gallery'}
          </h1>
        </div>
        <GalleryClient
          initialImages={images}
          initialSubfolders={subfolders}
          whatsapp={user.whatsapp}
        />
      </div>
    </main>
  );
}
