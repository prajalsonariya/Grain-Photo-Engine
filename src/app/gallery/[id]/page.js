import Header from '@/components/Header';
import { getFolderImages, getFolderDetails, getConfig } from '@/lib/drive';
import GalleryClient from './GalleryClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const folder = await getFolderDetails(id);
  return {
    title: folder ? `${folder.name} | Gallery` : 'Gallery',
  };
}

export default async function GalleryPage({ params }) {
  const plan = process.env.NEXT_PUBLIC_CLIENT_PLAN || 'freelancer';
  if (plan === 'portfolio') notFound();

  const { id } = await params;

  const [{ images, subfolders }, folder, config] = await Promise.all([
    getFolderImages(id),
    getFolderDetails(id),
    getConfig(),
  ]);

  if (!folder) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-white/20 selection:text-white">
      <Header />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-32 pb-24 min-h-screen">
        <div className="mb-8 flex flex-col items-start gap-4">
          <Link href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-[10px] sm:text-xs uppercase tracking-[0.3em]">
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
          whatsapp={config.whatsapp}
        />
      </div>
    </main>
  );
}
