import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCachedUserById } from "@/lib/userCache";
import { getValidOAuthClientForUser, getFolders, getPrivateFolders } from "@/lib/drive";
import { redirect } from "next/navigation";
import StudioClient from "./StudioClient";

export const revalidate = 0; // Real-time studio dashboard

export default async function StudioPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await getCachedUserById(session.user.id);

  if (!user?.username || !user?.publicFolderId || !user?.privateFolderId) {
    redirect("/onboarding");
  }

  let publicAlbums = [];
  let privateAlbums = [];

  try {
    const oauthClient = await getValidOAuthClientForUser(user.id);
    const [pubRes, privRes] = await Promise.all([
      getFolders(oauthClient, user.username, user.publicFolderId),
      getPrivateFolders(oauthClient, user.username, user.privateFolderId, null)
    ]);
    publicAlbums = pubRes || [];
    privateAlbums = privRes?.folders || [];
  } catch (err) {
    console.error("[Studio Page load error]:", err);
  }

  return (
    <StudioClient 
      user={user}
      publicAlbums={publicAlbums}
      privateAlbums={privateAlbums}
    />
  );
}
