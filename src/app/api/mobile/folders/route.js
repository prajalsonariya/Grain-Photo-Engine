import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getFolders, getPrivateFolders, getFolderImages, getOAuthClient } from "@/lib/drive"

export async function POST(req) {
  try {
    const { token, folderId } = await req.json()
    if (!token) return NextResponse.json({ error: "No token provided" }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { apiToken: token },
      include: { accounts: true }
    })

    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const account = user.accounts.find(a => a.provider === 'google')
    if (!account) return NextResponse.json({ error: "No Google account linked" }, { status: 400 })

    const oauthClient = getOAuthClient(account.access_token, account.refresh_token)

    if (folderId) {
      // Get contents of a specific folder
      const data = await getFolderImages(oauthClient, user.username, folderId)
      return NextResponse.json(data)
    } else {
      // Get root level collections
      const publicFolders = await getFolders(oauthClient, user.username, user.publicFolderId)
      const privateData = await getPrivateFolders(oauthClient, user.username, user.privateFolderId)
      
      return NextResponse.json({
        publicCollections: publicFolders,
        privateCollections: privateData.folders || []
      })
    }
  } catch (err) {
    console.error("Mobile Folders Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
