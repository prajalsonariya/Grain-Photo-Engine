import { getOAuthClient, getFolderDetails, getFolderImages } from '@/lib/drive';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import FolderClient from './FolderClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const revalidate = 0; // Folder management needs to be completely real-time

export default async function AdminFolderPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const { username, id } = await params;

  if (session.user.username !== username) {
    return <div className="p-8 text-white min-h-screen bg-[#1e1e1e]">Unauthorized.</div>;
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { accounts: { where: { provider: 'google' } } }
  });

  if (!user || !user.accounts[0]?.access_token) notFound();
  
  const accessToken = user.accounts[0].access_token;
  const refreshToken = user.accounts[0].refresh_token;
  const oauthClient = getOAuthClient(accessToken, refreshToken);

  const [{ images }, folder] = await Promise.all([
    getFolderImages(oauthClient, username, id),
    getFolderDetails(oauthClient, id),
  ]);

  if (!folder) notFound();

  // Ensure we pass a completely fresh token to the client for uploading/creating
  const { token: freshAccessToken } = await oauthClient.getAccessToken();

  return (
    <div className="pb-24 pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href={`/${username}/admin`} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs uppercase tracking-[0.2em] mb-2 font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">{folder.name}</h1>
        </div>
      </div>
      
      <FolderClient 
        initialImages={images} 
        folderId={id} 
        accessToken={freshAccessToken} 
        username={username}
      />
    </div>
  );
}
