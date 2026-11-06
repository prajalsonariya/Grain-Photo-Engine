import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getValidOAuthClientForUser } from "@/lib/drive";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not logged in" } },
        { status: 401 }
      );
    }

    const oauthClient = await getValidOAuthClientForUser(session.user.id);
    const tokenResponse = await oauthClient.getAccessToken();

    if (!tokenResponse?.token) {
      return NextResponse.json(
        { success: false, error: { code: "TOKEN_ERROR", message: "Failed to retrieve access token" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        accessToken: tokenResponse.token,
        expiresAt: oauthClient.credentials.expiry_date || (Date.now() + 3600 * 1000)
      }
    });
  } catch (error) {
    console.error("[API /api/studio/token error]:", error);
    return NextResponse.json(
      { success: false, error: { code: "AUTH_EXPIRED", message: error.message || "Session expired. Please reconnect." } },
      { status: 401 }
    );
  }
}
