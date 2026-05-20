import { getPrivateFolders, getFolders } from '@/lib/drive';
import AdminClient from './AdminClient';
import Header from '@/components/Header';

export const revalidate = 0; // Never cache the admin page completely to ensure fresh list

export default async function AdminPage() {
  const plan = process.env.NEXT_PUBLIC_CLIENT_PLAN || 'freelancer';
  const isAgency = plan === 'agency';

  const [publicFolders, privateFoldersRes] = await Promise.all([
    getFolders(),
    getPrivateFolders(isAgency ? null : 3)
  ]);

  const privateFolders = privateFoldersRes.folders || [];
  const isLimitReached = privateFoldersRes.hasMore || false;

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-neutral-200 font-sans selection:bg-white/20 selection:text-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        <h1 className="text-3xl font-black text-white mb-8 tracking-tight uppercase">
          Private Admin Dashboard
        </h1>
        <p className="text-neutral-400 mb-8 font-light tracking-wide text-sm">
          Generate secure shareable links for your clients. Manage both public and private collections.
        </p>
        <AdminClient 
          publicFolders={publicFolders} 
          privateFolders={privateFolders} 
          isLimitReached={isLimitReached}
        />
      </div>
    </main>
  );
}
