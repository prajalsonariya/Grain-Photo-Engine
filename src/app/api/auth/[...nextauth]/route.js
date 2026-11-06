import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { getCachedUserById } from "@/lib/userCache"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days rolling session
    updateAge: 24 * 60 * 60,   // Extend every 24h of active use
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/drive"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && account?.access_token) {
        try {
          await prisma.account.updateMany({
            where: {
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
            data: {
              access_token: account.access_token,
              expires_at: account.expires_at,
              ...(account.refresh_token ? { refresh_token: account.refresh_token } : {}),
              ...(account.id_token ? { id_token: account.id_token } : {}),
              scope: account.scope,
              token_type: account.token_type,
            }
          });
        } catch (error) {
          console.error("[NextAuth] Error updating account tokens on signIn:", error);
        }
      }
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      
      const dbUser = await getCachedUserById(user.id);

      session.user.username = dbUser?.username || null;
      session.user.plan = dbUser?.plan || 'freelancer';
      session.user.onboardingCompleted = dbUser?.onboardingCompleted || false;
      session.user.rootFolderId = dbUser?.rootFolderId || null;
      session.user.publicFolderId = dbUser?.publicFolderId || null;
      session.user.privateFolderId = dbUser?.privateFolderId || null;
      
      return session;
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
