"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { getValidOAuthClientForUser } from "@/lib/drive"
import { google } from "googleapis"

export async function initializeDrive(username) {
  const session = await getServerSession(authOptions)
  if (!session) return { error: "Unauthorized" }

  const userId = session.user.id

  // 1. Check if username is taken
  const existingUser = await prisma.user.findUnique({ where: { username } })
  if (existingUser && existingUser.id !== userId) {
    return { error: "That username is already taken. Please choose another." }
  }

  try {
    const oauthClient = await getValidOAuthClientForUser(userId)
    const drive = google.drive({ version: 'v3', auth: oauthClient })

    // 3. Create Root Folder
    const rootRes = await drive.files.create({
      requestBody: {
        name: 'Grain Photo Engine',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    })
    const rootFolderId = rootRes.data.id

    // 4. Create Public and Private subfolders
    const publicRes = await drive.files.create({
      requestBody: {
        name: 'Public',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId]
      },
      fields: 'id',
    })
    const publicFolderId = publicRes.data.id

    const privateRes = await drive.files.create({
      requestBody: {
        name: 'Private',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId]
      },
      fields: 'id',
    })
    const privateFolderId = privateRes.data.id

    // 5. Save to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        publicFolderId,
        privateFolderId
      }
    })

    return { success: true }
  } catch (err) {
    console.error("Drive Initialization Error:", err)
    return { error: "Failed to create folders in Google Drive. Ensure you granted permissions." }
  }
}

import crypto from 'crypto';

export async function generateMobileApiKey() {
  const session = await getServerSession(authOptions)
  if (!session) return { error: "Unauthorized" }

  const token = crypto.randomBytes(24).toString('hex');
  
  await prisma.user.update({
    where: { id: session.user.id },
    data: { apiToken: token }
  })

  return { token }
}
