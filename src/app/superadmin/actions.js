'use server';

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { invalidateUserCache } from "@/lib/userCache";

export async function updateUserPlan(userId, newPlan) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    throw new Error("Unauthorized");
  }

  if (session.user.email !== process.env.SUPERADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  if (!['freelancer', 'agency', 'portfolio'].includes(newPlan)) {
    throw new Error("Invalid plan");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { plan: newPlan }
  });

  invalidateUserCache(userId);

  return { success: true };
}
