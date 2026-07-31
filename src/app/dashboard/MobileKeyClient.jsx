"use client"

import { useState } from "react"
import { generateMobileApiKey } from "./actions"
import { Key } from "lucide-react"

export default function MobileKeyClient({ user }) {
  const [token, setToken] = useState(user?.apiToken || "")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await generateMobileApiKey()
      if (res.token) {
        setToken(res.token)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl md:col-span-2">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
          <Key className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">Mobile App Access</h2>
          <p className="text-sm text-white/60 mb-6">
            Generate a secure API key to log into your Grain Admin Android app. Do not share this key with anyone.
          </p>

          {token ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full bg-black/40 border border-white/10 p-3 rounded-lg font-mono text-sm text-white/80 overflow-hidden text-ellipsis whitespace-nowrap">
                {token}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleCopy}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 transition rounded-lg text-sm font-medium whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy Key"}
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                >
                  Regenerate
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Mobile Key"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
