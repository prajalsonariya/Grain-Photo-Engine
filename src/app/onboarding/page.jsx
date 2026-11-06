import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      businessName: true,
      heroTitle: true,
      whatsapp: true,
      publicFolderId: true,
      privateFolderId: true,
      onboardingCompleted: true,
    }
  });

  // If already fully set up, skip onboarding directly to studio
  if (user?.username && user?.publicFolderId && user?.privateFolderId && user?.onboardingCompleted) {
    redirect("/studio");
  }

  return <OnboardingClient user={user} />;
}
