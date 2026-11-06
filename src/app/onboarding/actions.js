"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getValidOAuthClientForUser } from "@/lib/drive";
import { invalidateUserCache } from "@/lib/userCache";
import { google } from "googleapis";

export async function checkUsernameAvailability(username) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { available: false, error: "Unauthorized" };

  const clean = username.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (clean.length < 3) {
    return { available: false, error: "Username must be at least 3 characters" };
  }

  const existing = await prisma.user.findUnique({
    where: { username: clean },
    select: { id: true }
  });

  if (existing && existing.id !== session.user.id) {
    return { available: false, error: "Username already taken" };
  }

  return { available: true, clean };
}

export async function completeOnboarding(formData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to complete onboarding." };
  }

  const userId = session.user.id;
  const username = (formData.username || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const businessName = (formData.businessName || "").trim();
  const heroTitle = (formData.heroTitle || "Albums").trim();
  const whatsapp = (formData.whatsapp || "").replace(/\D/g, "");

  if (username.length < 3) {
    return { success: false, error: "Handle must be at least 3 characters." };
  }

  // Ensure unique username
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== userId) {
    return { success: false, error: "This studio handle is already taken." };
  }

  try {
    const oauthClient = await getValidOAuthClientForUser(userId);
    const drive = google.drive({ version: "v3", auth: oauthClient });

    // 1. Create or locate Root Folder "Grain Photo Engine"
    let rootFolderId = null;
    const existingRoot = await drive.files.list({
      q: "name = 'Grain Photo Engine' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id, name)",
      pageSize: 1
    });

    if (existingRoot.data.files && existingRoot.data.files.length > 0) {
      rootFolderId = existingRoot.data.files[0].id;
    } else {
      const rootRes = await drive.files.create({
        requestBody: {
          name: "Grain Photo Engine",
          mimeType: "application/vnd.google-apps.folder",
          description: "Root folder for Grain Photo Engine portfolio & client delivery."
        },
        fields: "id"
      });
      rootFolderId = rootRes.data.id;
    }

    // 2. Create "01. Public Portfolio"
    let publicFolderId = null;
    const existingPub = await drive.files.list({
      q: `'${rootFolderId}' in parents and name contains 'Public' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
      pageSize: 1
    });
    if (existingPub.data.files && existingPub.data.files.length > 0) {
      publicFolderId = existingPub.data.files[0].id;
    } else {
      const pubRes = await drive.files.create({
        requestBody: {
          name: "01. Public Portfolio",
          mimeType: "application/vnd.google-apps.folder",
          parents: [rootFolderId]
        },
        fields: "id"
      });
      publicFolderId = pubRes.data.id;
    }

    // 3. Create "02. Private Client Albums"
    let privateFolderId = null;
    const existingPriv = await drive.files.list({
      q: `'${rootFolderId}' in parents and name contains 'Private' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
      pageSize: 1
    });
    if (existingPriv.data.files && existingPriv.data.files.length > 0) {
      privateFolderId = existingPriv.data.files[0].id;
    } else {
      const privRes = await drive.files.create({
        requestBody: {
          name: "02. Private Client Albums",
          mimeType: "application/vnd.google-apps.folder",
          parents: [rootFolderId]
        },
        fields: "id"
      });
      privateFolderId = privRes.data.id;
    }

    // 4. Update Database
    await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        businessName: businessName || null,
        heroTitle: heroTitle || "Albums",
        whatsapp: whatsapp || null,
        rootFolderId,
        publicFolderId,
        privateFolderId,
        onboardingCompleted: true
      }
    });

    invalidateUserCache(userId);
    invalidateUserCache(username);

    return { success: true };
  } catch (err) {
    console.error("[Onboarding error]:", err);
    return {
      success: false,
      error: "Failed to connect to Google Drive. Please ensure you granted Google Drive permissions."
    };
  }
}
