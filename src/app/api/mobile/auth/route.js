import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: "No token provided" }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { apiToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        publicFolderId: true,
        privateFolderId: true,
      }
    })

    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    
    const isSuperAdmin = user.email === process.env.SUPERADMIN_EMAIL

    return NextResponse.json({ user, isSuperAdmin })
  } catch (err) {
    console.error("Mobile Auth Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
