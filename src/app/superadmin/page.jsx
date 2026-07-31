import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import SuperAdminClient from "./SuperAdminClient";

export const revalidate = 0; // Never cache this page

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return notFound();
  }

  // Ensure only the designated superadmin can access this
  if (session.user.email !== process.env.SUPERADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-white">
        Unauthorized. You are not the Super Admin.
      </div>
    );
  }

  // Fetch all users on the platform
  const users = await prisma.user.findMany({
    orderBy: {
      id: 'desc'
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      plan: true,
      publicFolderId: true,
    }
  });

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-neutral-200 font-sans selection:bg-white/20 selection:text-white pb-24">
      {/* Basic header placeholder so it looks consistent */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1e1e1e]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-center">
          <span className="text-sm tracking-[0.3em] font-light uppercase text-white">
            Super Admin Control Panel
          </span>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-32">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">
            Platform Users
          </h1>
          <p className="text-neutral-400 font-light tracking-wide text-sm">
            Manage photographer memberships and access limits across the engine.
          </p>
        </div>

        <SuperAdminClient initialUsers={users} />
      </div>
    </main>
  );
}
