import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getValidOAuthClientForUser } from "@/lib/drive";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const oauthClient = await getValidOAuthClientForUser(session.user.id);
    const drive = google.drive({ version: "v3", auth: oauthClient });

    const about = await drive.about.get({
      fields: "storageQuota, user"
    });

    const quota = about.data.storageQuota || {};
    const limit = parseInt(quota.limit || "0", 10);
    const usage = parseInt(quota.usage || "0", 10);
    const usageInDrive = parseInt(quota.usageInDrive || "0", 10);

    return NextResponse.json({
      success: true,
      data: {
        limit,
        usage,
        usageInDrive,
        limitFormatted: limit > 0 ? `${(limit / (1024 ** 3)).toFixed(1)} GB` : "Unlimited",
        usageFormatted: `${(usage / (1024 ** 3)).toFixed(2)} GB`,
        percentUsed: limit > 0 ? Math.round((usage / limit) * 100) : null,
        user: about.data.user
      }
    });
  } catch (error) {
    console.error("[API /api/studio/quota error]:", error);
    return NextResponse.json(
      { success: false, error: { code: "DRIVE_ERROR", message: error.message || "Failed to fetch storage quota" } },
      { status: 500 }
    );
  }
}
