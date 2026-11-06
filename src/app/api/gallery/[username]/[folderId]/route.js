import { getValidOAuthClientForUsername, getFolderDetails, getFolderImages } from "@/lib/drive";
import { getCachedUserByUsername } from "@/lib/userCache";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { username, folderId } = await params;
    if (!username || !folderId) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const user = await getCachedUserByUsername(username);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const oauthClient = await getValidOAuthClientForUsername(username);
    const [folder, { images, subfolders }] = await Promise.all([
      getFolderDetails(oauthClient, folderId),
      getFolderImages(oauthClient, username, folderId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        folder,
        images: images || [],
        subfolders: subfolders || [],
        user: {
          username: user.username,
          businessName: user.businessName,
          heroTitle: user.heroTitle,
          whatsapp: user.whatsapp
        }
      }
    }, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
        "Referrer-Policy": "no-referrer"
      }
    });
  } catch (error) {
    console.error("[API /api/gallery error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
