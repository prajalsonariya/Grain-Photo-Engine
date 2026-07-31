import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/drive"
        }
      }
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      
      // Look up the photographer's username (if they set one) and attach to session
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { username: true }
      });
      session.user.username = dbUser?.username || null;
      
      return session;
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
