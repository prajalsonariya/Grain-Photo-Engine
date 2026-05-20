import { getPrivateFolders, getFolders } from '@/lib/drive';
import AdminClient from './AdminClient';
import Header from '@/components/Header';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Never cache the admin page completely to ensure fresh list

export default async function AdminPage() {
  const plan = process.env.NEXT_PUBLIC_CLIENT_PLAN || 'freelancer';
  if (plan === 'portfolio') notFound();
  
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
        <h1 className="admin-title text-white mb-2 tracking-tight uppercase">
          Solnyter Media | Command Center
        </h1>
        <p className="admin-subtitle mb-8">
          Admin Panel | Centralize client delivery pipelines. Configure dynamic public collections and secure, high-speed private media assets.
        </p>
        <AdminClient 
          publicFolders={publicFolders} 
          privateFolders={privateFolders} 
          isLimitReached={isLimitReached}
          limit={isAgency ? null : 3}
        />
      </div>
    </main>
  );
}
