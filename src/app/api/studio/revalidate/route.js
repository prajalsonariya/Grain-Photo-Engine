import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { invalidateDriveCache } from "@/lib/drive";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tag, folderId } = await request.json().catch(() => ({}));
    if (tag) {
      revalidateTag(tag);
    }
    if (folderId) {
      invalidateDriveCache(folderId);
      revalidateTag(`folder-images-${folderId}`);
    } else {
      invalidateDriveCache();
    }
    if (session.user.username) {
      revalidateTag(`user-folders-${session.user.username}`);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
