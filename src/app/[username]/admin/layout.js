import Header from '@/components/Header';
import Link from 'next/link';
import AdminNavTabs from './AdminNavTabs';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminLayout({ children, params }) {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const { username } = await params;

  if (session.user.username !== username) {
    return <div className="p-8 text-white min-h-screen bg-[#1e1e1e]">Unauthorized: You do not own this portfolio.</div>;
  }

  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) notFound();

  const isAgency = user.plan === 'agency';

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-neutral-200 font-sans selection:bg-white/20 selection:text-white pb-24">
      <Header config={user} isAgency={isAgency} homeUrl={`/${username}`} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">
          Gallery Engine
        </h1>
        <p className="text-neutral-400 font-light tracking-wide text-sm mt-2">
          Securely deliver cinematic asset streams.
        </p>

        <AdminNavTabs username={username} isSuperAdmin={session.user.email === process.env.SUPERADMIN_EMAIL} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {children}
      </div>
    </main>
  );
}
