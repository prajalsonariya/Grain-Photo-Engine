import { redirect } from "next/navigation";

export default async function AdminFolderRedirect({ params }) {
  const { id } = await params;
  redirect(`/studio/folder/${id}`);
}
