"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Folder, Plus, ExternalLink, Share2, Copy, CheckCheck, 
  Trash2, MessageCircle, Settings, HardDrive, RefreshCw, LogOut, Check, Pencil 
} from "lucide-react";
import StorageIndicator from "./StorageIndicator";
import { signOut, signIn } from "next-auth/react";
import { prefetchFolder } from "@/lib/folderGraphStore";

function AlbumCard({ album, basePath, onCopy, isCopied, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(album.name);

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (editName.trim() && editName !== album.name) {
      onRename(album.id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div 
      onMouseEnter={() => prefetchFolder(album.id, "studio")}
      onTouchStart={() => prefetchFolder(album.id, "studio")}
      className="studio-card p-3 sm:p-4 bg-[#161616] border border-white/10 hover:border-white/20 rounded-xl transition-all flex flex-col justify-between group shadow-sm active:scale-[0.99]"
    >
      <Link href={`/studio/folder/${album.id}`} className="block">
        <div className="aspect-[16/10] bg-[#0e0e0e] rounded-lg overflow-hidden relative mb-2.5 sm:mb-3 border border-white/5">
          {album.thumbnailUrl ? (
            <img 
              src={album.thumbnailUrl}
              alt={album.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600">
              <Folder className="w-7 h-7 sm:w-8 sm:h-8 opacity-40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>

        {isEditing ? (
          <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()}>
            <input 
              type="text"
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              className="w-full bg-[#0e0e0e] border border-white/30 rounded px-2 py-1 text-xs text-white focus:outline-none"
            />
          </form>
        ) : (
          <div className="flex items-center justify-between gap-1 mb-1">
            <h4 
              className="text-xs font-bold text-white uppercase tracking-wider truncate flex-1"
            >
              {album.name}
            </h4>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }}
              className="p-1 text-neutral-500 hover:text-white"
              title="Rename album"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </Link>

      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono text-neutral-400">
        <span className="text-[10px] text-neutral-500">
          {album.createdTime ? new Date(album.createdTime).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : ""}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onCopy(album.id, basePath)}
            className="p-2 sm:p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors active:scale-90"
            title="Copy share link"
          >
            {isCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onDelete(album.id)}
            className="p-2 sm:p-1.5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded transition-colors active:scale-90"
            title="Move to Trash"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudioClient({ user, publicAlbums = [], privateAlbums = [] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("albums"); // 'albums' | 'settings'
  const [publicList, setPublicList] = useState(publicAlbums);
  const [privateList, setPrivateList] = useState(privateAlbums);
  const [copiedId, setCopiedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshStudio = async () => {
    setIsRefreshing(true);
    try {
      await fetch("/api/studio/revalidate", { method: "POST" });
      router.refresh();
    } catch (e) {
      console.error("Refresh error:", e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  // New Album Modal
  const [modalType, setModalType] = useState(null); // 'public' | 'private'
  const [albumName, setAlbumName] = useState("");
  const [creating, setCreating] = useState(false);

  // Idle prefetch most recent albums
  useEffect(() => {
    const timer = setTimeout(() => {
      publicList.slice(0, 3).forEach(a => prefetchFolder(a.id, "studio"));
      privateList.slice(0, 3).forEach(a => prefetchFolder(a.id, "studio"));
    }, 500);
    return () => clearTimeout(timer);
  }, [publicList, privateList]);

  // Studio Settings form state
  const [businessName, setBusinessName] = useState(user.businessName || "");
  const [heroTitle, setHeroTitle] = useState(user.heroTitle || "");
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  useEffect(() => {
    if (user.businessName !== undefined) setBusinessName(user.businessName || "");
    if (user.heroTitle !== undefined) setHeroTitle(user.heroTitle || "");
    if (user.whatsapp !== undefined) setWhatsapp(user.whatsapp || "");
  }, [user.businessName, user.heroTitle, user.whatsapp]);

  const handleCopy = (id, basePath) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/${user.username}${basePath}/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!albumName.trim() || !modalType) return;

    setCreating(true);
    const parentId = modalType === "public" ? user.publicFolderId : user.privateFolderId;

    try {
      const res = await fetch("/api/studio/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: albumName.trim(), parentId })
      });
      const data = await res.json();
      if (data.success) {
        if (modalType === "public") setPublicList(prev => [data.data, ...prev]);
        else setPrivateList(prev => [data.data, ...prev]);
        setModalType(null);
        setAlbumName("");
      } else {
        alert(data.error?.message || "Failed to create album");
      }
    } catch (err) {
      alert("Error creating album");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlbum = async (id, isPublic) => {
    if (!confirm("Move this entire album to Google Drive Trash?")) return;

    if (isPublic) setPublicList(prev => prev.filter(a => a.id !== id));
    else setPrivateList(prev => prev.filter(a => a.id !== id));

    try {
      await fetch("/api/studio/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", fileId: id })
      });
    } catch (err) {
      alert("Delete failed.");
      router.refresh();
    }
  };

  const handleRenameAlbum = async (id, newName) => {
    setPublicList(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
    setPrivateList(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));

    try {
      await fetch("/api/studio/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", fileId: id, newName })
      });
    } catch (err) {
      router.refresh();
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSavedSettingsSuccess(false);

    try {
      const res = await fetch("/api/studio/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, heroTitle, whatsapp })
      });
      const data = await res.json();
      if (data.success) {
        setSavedSettingsSuccess(true);
        setTimeout(() => setSavedSettingsSuccess(false), 3000);
        router.refresh();
      } else {
        alert(data.error || "Failed to save settings");
      }
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#e5e5e5] font-sans pb-32">
      {/* Studio Header Bar */}
      <header className="border-b border-white/10 bg-[#141414] sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 truncate">
            <h1 className="text-sm sm:text-lg font-black tracking-tight uppercase text-white truncate">
              Grain Studio
            </h1>
            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono text-neutral-400">
              grainphoto.com/{user.username}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <StorageIndicator />

            <a
              href={`/${user.username}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <span>Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleRefreshStudio}
              disabled={isRefreshing}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer active:scale-90"
              title="Refresh Albums & Photos"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? "animate-spin text-white" : ""}`} />
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-red-400 transition-colors active:scale-90"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Subnavigation Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex gap-4 sm:gap-6 text-xs font-mono uppercase tracking-widest border-t border-white/5">
          <button
            onClick={() => setActiveTab("albums")}
            className={`py-2.5 sm:py-3 border-b-2 font-bold transition-colors cursor-pointer ${
              activeTab === "albums" ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Studio Albums
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-2.5 sm:py-3 border-b-2 font-bold transition-colors cursor-pointer ${
              activeTab === "settings" ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Branding & Settings
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 sm:pt-8">
        {activeTab === "albums" ? (
          <div className="space-y-8 sm:space-y-12">
            {/* Public Collections Section */}
            <section className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-xs sm:text-sm font-mono uppercase tracking-widest font-bold text-white">
                    01. Public Portfolio Collections ({publicList.length})
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
                    Visible to everyone on your public portfolio at grainphoto.com/{user.username}.
                  </p>
                </div>

                <button
                  onClick={() => { setModalType("public"); setAlbumName(""); }}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer shadow active:scale-95 w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Public Album</span>
                </button>
              </div>

              {publicList.length === 0 ? (
                <div className="py-12 sm:py-16 text-center border border-white/5 rounded-xl bg-neutral-900/20 text-neutral-500 text-xs font-mono uppercase tracking-widest">
                  No public albums yet. Click above to create your first portfolio collection.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {publicList.map(album => (
                    <AlbumCard 
                      key={album.id}
                      album={album}
                      basePath="/gallery"
                      onCopy={handleCopy}
                      isCopied={copiedId === album.id}
                      onDelete={(id) => handleDeleteAlbum(id, true)}
                      onRename={handleRenameAlbum}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Private Client Delivery Section */}
            <section className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-xs sm:text-sm font-mono uppercase tracking-widest font-bold text-white">
                    02. Private Client Delivery ({privateList.length})
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
                    Direct-to-client private albums with proofing, downloads, and WhatsApp delivery.
                  </p>
                </div>

                <button
                  onClick={() => { setModalType("private"); setAlbumName(""); }}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer shadow active:scale-95 w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Client Album</span>
                </button>
              </div>

              {privateList.length === 0 ? (
                <div className="py-12 sm:py-16 text-center border border-white/5 rounded-xl bg-neutral-900/20 text-neutral-500 text-xs font-mono uppercase tracking-widest">
                  No client albums yet. Create a private gallery to deliver photos to clients.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {privateList.map(album => (
                    <AlbumCard 
                      key={album.id}
                      album={album}
                      basePath="/share"
                      onCopy={handleCopy}
                      isCopied={copiedId === album.id}
                      onDelete={(id) => handleDeleteAlbum(id, false)}
                      onRename={handleRenameAlbum}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* Settings Tab */
          <div className="max-w-xl mx-auto studio-card p-8 bg-[#161616] border border-white/10 rounded-xl space-y-6">
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-white">Studio Branding</h3>
              <p className="text-xs text-neutral-400 mt-1">Configure your brand identity and client communication.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 font-mono mb-2">
                  Studio Name
                </label>
                <input 
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-[#0e0e0e] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 font-mono mb-2">
                  Hero Title (Homepage)
                </label>
                <input 
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full bg-[#0e0e0e] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 font-mono mb-2">
                  WhatsApp Contact
                </label>
                <input 
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-[#0e0e0e] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors font-mono"
                />
              </div>

              {savedSettingsSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <Check className="w-4 h-4" /> Settings updated successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingSettings ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Create Album Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#1c1c1c] border border-white/15 p-6 rounded-xl w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">
              New {modalType === "public" ? "Public Portfolio" : "Private Client"} Album
            </h3>
            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <input 
                type="text"
                autoFocus
                required
                placeholder="Type your folder name here..."
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                className="w-full bg-[#111111] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !albumName.trim()}
                  className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
