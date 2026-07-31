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
    const { token, action, payload } = await req.json()
    if (!token) return NextResponse.json({ error: "No token provided" }, { status: 400, headers: corsHeaders })

    const adminUser = await prisma.user.findUnique({
      where: { apiToken: token },
    })

    if (!adminUser || adminUser.email !== process.env.SUPERADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })
    }

    if (action === "list") {
      const users = await prisma.user.findMany({
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          plan: true,
        }
      })
      return NextResponse.json({ users }, { headers: corsHeaders })
    }

    if (action === "update") {
      const { userId, plan } = payload
      if (!['freelancer', 'agency', 'portfolio'].includes(plan)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400, headers: corsHeaders })
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { plan }
      })
      return NextResponse.json({ success: true, user: updatedUser }, { headers: corsHeaders })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: corsHeaders })
  } catch (err) {
    console.error("Mobile Superadmin Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders })
  }
}
