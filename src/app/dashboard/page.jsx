import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"
import MobileKeyClient from "./MobileKeyClient"
import { initializeDrive } from "./actions"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/")
  }

  // Fetch the user to check if they have folder IDs
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  // If missing username, publicFolderId, or privateFolderId, we need to initialize
  const needsInitialization = !user?.username || !user?.publicFolderId || !user?.privateFolderId

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center pb-8 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-white/60 mt-2">Welcome back, {session.user.name}</p>
          </div>
          {user?.username && (
            <a 
              href={`/${user.username}`} 
              target="_blank"
              className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-neutral-200 transition"
            >
              View Public Portfolio
            </a>
          )}
        </header>

        {needsInitialization ? (
          <DashboardClient user={user} initializeAction={initializeDrive} />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="text-xl font-semibold mb-2">Public Collection</h2>
              <p className="text-sm text-white/60 mb-6">Manage your main portfolio visible to everyone.</p>
              <div className="text-xs font-mono text-white/40 mb-4 truncate bg-black/30 p-2 rounded">
                ID: {user.publicFolderId}
              </div>
              <a href={`https://drive.google.com/drive/folders/${user.publicFolderId}`} target="_blank" className="text-blue-400 hover:text-blue-300 text-sm">Open in Google Drive →</a>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="text-xl font-semibold mb-2">Private Client Albums</h2>
              <p className="text-sm text-white/60 mb-6">Manage private albums sent directly to clients.</p>
              <div className="text-xs font-mono text-white/40 mb-4 truncate bg-black/30 p-2 rounded">
                ID: {user.privateFolderId}
              </div>
              <a href={`https://drive.google.com/drive/folders/${user.privateFolderId}`} target="_blank" className="text-blue-400 hover:text-blue-300 text-sm">Open in Google Drive →</a>
            </div>

            <MobileKeyClient user={user} />
          </div>
        )}
      </div>
    </div>
  )
}
