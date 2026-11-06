import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { invalidateUserCache } from "@/lib/userCache";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { businessName, heroTitle, whatsapp } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(businessName !== undefined ? { businessName: businessName.trim() } : {}),
        ...(heroTitle !== undefined ? { heroTitle: heroTitle.trim() } : {}),
        ...(whatsapp !== undefined ? { whatsapp: whatsapp.trim() } : {}),
      }
    });

    // Invalidate user cache so the new branding is immediately reflected everywhere
    invalidateUserCache(session.user.id);
    if (session.user.username) {
      invalidateUserCache(session.user.username);
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (err) {
    console.error("[Profile update error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
