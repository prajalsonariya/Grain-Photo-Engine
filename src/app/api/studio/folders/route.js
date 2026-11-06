import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getValidOAuthClientForUser, getFolderDetails, getFolderImages, invalidateDriveCache } from "@/lib/drive";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    if (!folderId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "folderId query param is required" } },
        { status: 400 }
      );
    }

    const oauthClient = await getValidOAuthClientForUser(session.user.id);
    const [folder, { images, subfolders }] = await Promise.all([
      getFolderDetails(oauthClient, folderId),
      getFolderImages(oauthClient, session.user.username, folderId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        folder,
        images: images || [],
        subfolders: subfolders || [],
      }
    }, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=600"
      }
    });
  } catch (error) {
    console.error("[API /api/studio/folders GET error]:", error);
    return NextResponse.json(
      { success: false, error: { code: "DRIVE_ERROR", message: error.message || "Failed to load folder" } },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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
    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const { name, parentId } = body;
      if (!name || !parentId) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Name and parentId are required" } },
          { status: 400 }
        );
      }

      const res = await drive.files.create({
        requestBody: {
          name: name.trim(),
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId]
        },
        fields: "id, name, createdTime"
      });

      invalidateDriveCache(parentId);
      if (session.user.username) {
        try { revalidateTag(`user-folders-${session.user.username}`); } catch {}
      }

      return NextResponse.json({ success: true, data: res.data });
    }

    if (action === "rename") {
      const { fileId, newName } = body;
      if (!fileId || !newName) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "fileId and newName are required" } },
          { status: 400 }
        );
      }

      const res = await drive.files.update({
        fileId,
        requestBody: { name: newName.trim() },
        fields: "id, name"
      });

      invalidateDriveCache(fileId);
      if (session.user.username) {
        try { revalidateTag(`user-folders-${session.user.username}`); } catch {}
      }

      return NextResponse.json({ success: true, data: res.data });
    }

    if (action === "delete") {
      const { fileId } = body;
      if (!fileId) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "fileId is required" } },
          { status: 400 }
        );
      }

      // Move to Google Drive Trash (safe delete)
      await drive.files.update({
        fileId,
        requestBody: { trashed: true }
      });

      invalidateDriveCache(fileId);
      if (session.user.username) {
        try { revalidateTag(`user-folders-${session.user.username}`); } catch {}
      }

      return NextResponse.json({ success: true });
    }

    if (action === "batch_delete") {
      const { fileIds } = body;
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "fileIds array is required" } },
          { status: 400 }
        );
      }

      await Promise.all(
        fileIds.map(id => drive.files.update({ fileId: id, requestBody: { trashed: true } }))
      );

      invalidateDriveCache();
      if (session.user.username) {
        try { revalidateTag(`user-folders-${session.user.username}`); } catch {}
      }

      return NextResponse.json({ success: true, count: fileIds.length });
    }

    if (action === "set_cover") {
      const { fileId, folderId } = body;
      if (!fileId || !folderId) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "fileId and folderId required" } },
          { status: 400 }
        );
      }

      // Mark the selected file with appProperties: { isGrainCover: 'true' }
      await drive.files.update({
        fileId,
        requestBody: {
          appProperties: { isGrainCover: "true" }
        }
      });

      invalidateDriveCache(folderId);
      if (session.user.username) {
        try { revalidateTag(`user-folders-${session.user.username}`); } catch {}
      }

      return NextResponse.json({ success: true, coverId: fileId });
    }

    return NextResponse.json(
      { success: false, error: { code: "INVALID_ACTION", message: `Unknown action: ${action}` } },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API /api/studio/folders error]:", error);
    return NextResponse.json(
      { success: false, error: { code: "DRIVE_ERROR", message: error.message || "Drive operation failed" } },
      { status: 500 }
    );
  }
}
