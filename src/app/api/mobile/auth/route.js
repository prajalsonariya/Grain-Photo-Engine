import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: "No token provided" }, { status: 400, headers: corsHeaders })

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

    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401, headers: corsHeaders })
    
    const isSuperAdmin = user.email === process.env.SUPERADMIN_EMAIL

    return NextResponse.json({ user, isSuperAdmin }, { headers: corsHeaders })
  } catch (err) {
    console.error("Mobile Auth Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders })
  }
}
