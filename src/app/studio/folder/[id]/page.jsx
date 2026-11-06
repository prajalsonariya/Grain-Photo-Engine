import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getValidOAuthClientForUser, getFolderDetails, getFolderImages } from "@/lib/drive";
import { notFound, redirect } from "next/navigation";
import FolderExplorerClient from "./FolderExplorerClient";

export const revalidate = 0; // Real-time studio explorer

export default async function StudioFolderPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await params;

  try {
    const oauthClient = await getValidOAuthClientForUser(session.user.id);

    const [folder, { images, subfolders }] = await Promise.all([
      getFolderDetails(oauthClient, id),
      getFolderImages(oauthClient, session.user.username, id),
    ]);

    if (!folder) return notFound();

    return (
      <FolderExplorerClient
        folder={folder}
        initialImages={images || []}
        initialSubfolders={subfolders || []}
        username={session.user.username}
      />
    );
  } catch (err) {
    console.error("[Studio Folder Page error]:", err);
    return notFound();
  }
}
