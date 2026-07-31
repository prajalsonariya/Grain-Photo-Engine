"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DashboardClient({ user, initializeAction }) {
  const [username, setUsername] = useState(user?.username || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleInitialize = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await initializeAction(username)
      if (res.error) {
        setError(res.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl max-w-xl">
      <h2 className="text-2xl font-bold mb-4">Complete Setup</h2>
      <p className="text-white/70 mb-6">
        To create your portfolio, we need to pick a custom URL and automatically set up your folders in Google Drive.
      </p>

      <form onSubmit={handleInitialize} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Your Custom URL
          </label>
          <div className="flex bg-black/40 rounded-lg overflow-hidden border border-white/20 focus-within:border-white/50 transition">
            <span className="px-4 py-3 text-white/50 bg-black/20 select-none">grainphoto.com/</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="username"
              className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder-white/20"
            />
          </div>
          <p className="text-xs text-white/40 mt-2">Only letters, numbers, and dashes.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !username}
          className="w-full py-4 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? "Connecting to Google Drive..." : "Set up my Portfolio"}
        </button>
      </form>
    </div>
  )
}
