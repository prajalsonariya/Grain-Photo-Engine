'use server';

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function updateProfile(userId, formData) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  // Ensure they can only update their own profile
  const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
  if (userToUpdate.username !== session.user.username) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      heroTitle: formData.heroTitle,
      businessName: formData.businessName,
      logoUrl: formData.logoUrl,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      instagram: formData.instagram,
      facebook: formData.facebook,
      snapchat: formData.snapchat,
      portfolio: formData.portfolio,
    }
  });

  return { success: true };
}
