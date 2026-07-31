import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage({ params }) {
  const { username } = await params;
  
  // Layout already verified session, but good to be safe
  const session = await getServerSession(authOptions);
  if (!session || session.user.username !== username) {
    return notFound();
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      heroTitle: true,
      businessName: true,
      logoUrl: true,
      phone: true,
      whatsapp: true,
      instagram: true,
      facebook: true,
      snapchat: true,
      portfolio: true,
      plan: true,
    }
  });

  if (!user) notFound();

  return (
    <div className="pb-24">
      <ProfileClient initialData={user} username={username} />
    </div>
  );
}
