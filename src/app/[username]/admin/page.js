import { getPrivateFolders, getFolders, getOAuthClient, getConfig } from '@/lib/drive';
import AdminClient from './AdminClient';
import Header from '@/components/Header';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const revalidate = 60; // Cache page but revalidate every 60s for performance

export default async function AdminPage({ params }) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: { accounts: { where: { provider: 'google' } } }
  });

  const plan = user?.plan || 'freelancer';
  if (plan === 'portfolio') notFound();
  
  const isAgency = plan === 'agency';

  if (!user || !user.accounts[0]?.access_token) notFound();
  const oauthClient = getOAuthClient(user.accounts[0].access_token, user.accounts[0].refresh_token);

  // We no longer need to call getConfig from drive here
  const [publicFolders, privateFoldersRes] = await Promise.all([
    getFolders(oauthClient, username, user.publicFolderId),
    getPrivateFolders(oauthClient, username, user.privateFolderId, isAgency ? null : 3),
  ]);

  const privateFolders = privateFoldersRes.folders || [];
  const isLimitReached = privateFoldersRes.hasMore || false;

  // Ensure we pass a completely fresh token to the client for uploading/creating
  const { token: freshAccessToken } = await oauthClient.getAccessToken();

  return (
    <div className="pb-24">
      <AdminClient 
        publicFolders={publicFolders} 
        privateFolders={privateFolders} 
        isLimitReached={isLimitReached}
        limit={isAgency ? null : 3}
        username={username}
        accessToken={freshAccessToken}
        publicFolderId={user.publicFolderId}
        privateFolderId={user.privateFolderId}
      />
    </div>
  );
}
