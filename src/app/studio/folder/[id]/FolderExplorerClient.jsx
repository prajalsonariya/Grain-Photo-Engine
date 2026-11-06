"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, UploadCloud, Folder, Plus, Trash2, Star, Check, 
  Share2, Copy, CheckCheck, Loader2, Video, MoreVertical, MessageCircle, ExternalLink 
} from "lucide-react";
import { processUploadQueue, extractDroppedEntries } from "@/lib/driveUploadEngine";
import UploadTray from "@/app/studio/UploadTray";
import { useTouchLongPress } from "@/lib/useTouchLongPress";
import {
  getCachedFolder,
  setCachedFolder,
  updateCachedFolderScroll,
  prefetchFolder,
  getNextFetchSeq,
  getCurrentFetchSeq
} from "@/lib/folderGraphStore";
import Lightbox from "@/components/Lightbox";

export default function FolderExplorerClient({ folder: initialFolder, initialSubfolders = [], initialImages = [], username }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [currentFolder, setCurrentFolder] = useState(initialFolder);
  const [images, setImages] = useState(initialImages);
  const [subfolders, setSubfolders] = useState(initialSubfolders);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: initialFolder.id, name: initialFolder.name }]);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [coverSuccessId, setCoverSuccessId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  // New subfolder modal
  const [isSubfolderModalOpen, setIsSubfolderModalOpen] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState("");
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false);

  // Seed initial folder into RAM cache
  useEffect(() => {
    setCachedFolder(initialFolder.id, {
      folder: initialFolder,
      images: initialImages,
      subfolders: initialSubfolders
    });
  }, [initialFolder, initialImages, initialSubfolders]);

  // Navigate to subfolder with 0ms RAM hit
  const navigateToFolder = useCallback(async (targetId, targetName) => {
    updateCachedFolderScroll(currentFolder.id, window.scrollY);

    const cached = getCachedFolder(targetId);
    const seq = getNextFetchSeq();

    if (cached) {
      setCurrentFolder(cached.folder || { id: targetId, name: targetName });
      setImages(cached.images || []);
      setSubfolders(cached.subfolders || []);
      setSelectionMode(false);
      setSelectedIds(new Set());
      setBreadcrumbs(prev => {
        const existingIdx = prev.findIndex(b => b.id === targetId);
        if (existingIdx !== -1) return prev.slice(0, existingIdx + 1);
        return [...prev, { id: targetId, name: targetName }];
      });
      window.history.pushState({ folderId: targetId }, '', `/studio/folder/${targetId}`);
      window.scrollTo(0, cached.scrollY || 0);
      return;
    }

    setIsLoadingFolder(true);
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBreadcrumbs(prev => [...prev, { id: targetId, name: targetName }]);
    window.history.pushState({ folderId: targetId }, '', `/studio/folder/${targetId}`);
    window.scrollTo(0, 0);

    try {
      const res = await fetch(`/api/studio/folders?folderId=${encodeURIComponent(targetId)}`);
      const json = await res.json();
      if (seq !== getCurrentFetchSeq()) return;
      if (json.success && json.data) {
        setCachedFolder(targetId, json.data);
        setCurrentFolder(json.data.folder);
        setImages(json.data.images || []);
        setSubfolders(json.data.subfolders || []);
      }
    } catch (err) {
      console.error('Failed to load folder:', err);
    } finally {
      if (seq === getCurrentFetchSeq()) {
        setIsLoadingFolder(false);
      }
    }
  }, [currentFolder.id]);

  const handleBack = useCallback(() => {
    if (breadcrumbs.length > 1) {
      const parent = breadcrumbs[breadcrumbs.length - 2];
      navigateToFolder(parent.id, parent.name);
    } else {
      router.push("/studio");
    }
  }, [breadcrumbs, navigateToFolder, router]);

  // Listen to browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = (e) => {
      const targetId = e.state?.folderId;
      if (targetId) {
        const cached = getCachedFolder(targetId);
        if (cached) {
          setCurrentFolder(cached.folder);
          setImages(cached.images || []);
          setSubfolders(cached.subfolders || []);
          setBreadcrumbs(prev => {
            const idx = prev.findIndex(b => b.id === targetId);
            if (idx !== -1) return prev.slice(0, idx + 1);
            return [{ id: targetId, name: cached.folder?.name || 'Folder' }];
          });
          window.scrollTo(0, cached.scrollY || 0);
        } else {
          navigateToFolder(targetId, 'Folder');
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigateToFolder]);

  // Idle prefetching for subfolders
  useEffect(() => {
    if (subfolders.length === 0) return;
    const timer = setTimeout(() => {
      subfolders.forEach(sub => {
        prefetchFolder(sub.id, "studio");
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [subfolders]);

  // Acquire fresh token & start upload queue
  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return;

    // 1. Get fresh short-lived OAuth access token from server vault
    let accessToken;
    try {
      const res = await fetch("/api/studio/token");
      const data = await res.json();
      if (!data.success || !data.data?.accessToken) {
        throw new Error(data.error?.message || "Failed to acquire token");
      }
      accessToken = data.data.accessToken;
    } catch (err) {
      alert("Authentication error: " + err.message + ". Please reconnect Google Drive.");
      return;
    }

    // 2. Prepare items for queue
    const queueItems = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      folderId: currentFolder.id,
      accessToken,
      name: file.name,
      progress: 0,
      status: "uploading"
    }));

    setUploads(prev => [...prev, ...queueItems]);

    // 3. Process concurrently (3 parallel)
    await processUploadQueue(
      queueItems,
      3,
      (itemId, percent) => {
        setUploads(prev => prev.map(u => u.id === itemId ? { ...u, progress: percent } : u));
      },
      (itemId, err, result) => {
        if (err) {
          setUploads(prev => prev.map(u => u.id === itemId ? { ...u, status: "error" } : u));
        } else {
          setUploads(prev => prev.map(u => u.id === itemId ? { ...u, status: "done", progress: 100 } : u));
          // Optimistically add to image grid
          const isVideo = result?.mimeType?.startsWith("video/") || false;
          setImages(prev => [{
            id: result.id,
            name: result.name,
            isVideo,
            url: `/api/image/${username}/${result.id}`,
            cdnUrl: null,
            tempUrl: URL.createObjectURL(queueItems.find(q => q.id === itemId)?.file)
          }, ...prev]);
        }
      }
    );

    // Notify cache revalidation
    fetch("/api/studio/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: currentFolder.id })
    }).catch(() => {});
  };

  // Drag & drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.items) {
      const extracted = await extractDroppedEntries(e.dataTransfer.items);
      const files = extracted.map(item => item.file);
      handleUploadFiles(files);
    } else if (e.dataTransfer?.files) {
      handleUploadFiles(Array.from(e.dataTransfer.files));
    }
  }, [currentFolder.id]);

  // Set Album Cover (optimistic in-place indicator, zero blocking popup)
  const handleSetCover = async (fileId) => {
    setCoverSuccessId(fileId);
    setTimeout(() => {
      setCoverSuccessId(prev => (prev === fileId ? null : prev));
    }, 2500);

    try {
      const res = await fetch("/api/studio/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_cover", fileId, folderId: currentFolder.id })
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Failed to set cover:", data.error?.message);
        setCoverSuccessId(null);
      }
    } catch (err) {
      console.error("Error setting cover:", err);
      setCoverSuccessId(null);
    }
  };

  // Delete single file
  const handleDeleteFile = async (fileId) => {
    if (!confirm("Move this file to Google Drive Trash?")) return;

    // Optimistic removal
    setImages(prev => prev.filter(img => img.id !== fileId));

    try {
      await fetch("/api/studio/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", fileId })
      });
    } catch (err) {
      alert("Delete failed.");
      router.refresh();
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Move ${selectedIds.size} files to Google Drive Trash?`)) return;

    setIsDeletingBatch(true);
    const ids = Array.from(selectedIds);

    // Optimistic removal
    setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
    setSelectedIds(new Set());
    setSelectionMode(false);

    try {
      await fetch("/api/studio/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "batch_delete", fileIds: ids })
      });
    } catch (err) {
      alert("Batch delete failed.");
      router.refresh();
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // Create Subfolder
  const handleCreateSubfolder = async (e) => {
    e.preventDefault();
    if (!newSubfolderName.trim()) return;

    setIsCreatingSubfolder(true);
    try {
      const res = await fetch("/api/studio/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: newSubfolderName.trim(),
          parentId: currentFolder.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubfolders(prev => [...prev, data.data]);
        setIsSubfolderModalOpen(false);
        setNewSubfolderName("");
      } else {
        alert(data.error?.message || "Failed to create subfolder");
      }
    } catch (err) {
      alert("Error creating subfolder");
    } finally {
      setIsCreatingSubfolder(false);
    }
  };

  // Toggle selection for an image
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Share links
  const targetFolderId = currentFolder?.id || initialFolder?.id || "";
  const targetFolderName = currentFolder?.name || initialFolder?.name || "Album";
  const clientShareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${username}/share/${targetFolderId}`;
  const whatsappAlbumHref = targetFolderId
    ? `https://api.whatsapp.com/send?text=${encodeURIComponent(`Hi! Your photo gallery "${targetFolderName}" is ready to view here:\n${clientShareUrl}`)}`
    : "#";

  const copyShareLink = () => {
    if (!targetFolderId) return;
    navigator.clipboard.writeText(clientShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#e5e5e5] font-sans pb-32">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="border-b border-white/10 bg-[#141414] sticky top-0 z-40 relative">
        {isLoadingFolder && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20 overflow-hidden">
            <div className="h-full bg-white w-1/3 animate-pulse" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs font-mono truncate">
              <Link href="/studio" className="text-neutral-500 hover:text-neutral-300">Studio</Link>
              {breadcrumbs.map((b, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                const crumbKey = b.id || `crumb-${idx}`;
                return (
                  <div key={crumbKey} className="flex items-center gap-2 truncate">
                    <span className="text-neutral-600">/</span>
                    {isLast ? (
                      <span className="text-white font-bold truncate">{b.name}</span>
                    ) : (
                      <button 
                        onClick={() => navigateToFolder(b.id, b.name)}
                        className="text-neutral-400 hover:text-white transition-colors truncate cursor-pointer"
                      >
                        {b.name}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSubfolderModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Subfolder</span>
            </button>

            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? "Copied" : "Copy Link"}</span>
            </button>

            <a
              href={whatsappAlbumHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wider text-emerald-400 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <a
              href={`/${username}/gallery/${targetFolderId}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
              title="View Public Presentation"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging 
              ? "border-white bg-white/10" 
              : "border-white/15 bg-[#161616] hover:border-white/30 hover:bg-[#1a1a1a]"
          }`}
        >
          <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? "text-white" : "text-neutral-400"}`} />
          <h3 className="text-white font-bold tracking-wider uppercase text-sm sm:text-base mb-1">
            Drag & Drop Photos or Entire Folders Here
          </h3>
          <p className="text-xs text-neutral-400">
            or click to browse from your device. Streams directly into Google Drive with zero compression.
          </p>
          <input 
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files) handleUploadFiles(Array.from(e.target.files));
            }}
          />
        </div>

        {/* Subfolders Section (if any exist) */}
        {subfolders.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-bold">
              Subfolders ({subfolders.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {subfolders.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => navigateToFolder(sub.id, sub.name)}
                  onMouseEnter={() => prefetchFolder(sub.id, "studio")}
                  onTouchStart={() => prefetchFolder(sub.id, "studio")}
                  className="flex items-center gap-3 p-3.5 bg-[#161616] border border-white/10 hover:border-white/25 rounded-lg transition-colors group cursor-pointer active:scale-[0.98]"
                >
                  <Folder className="w-5 h-5 text-neutral-400 group-hover:text-white flex-shrink-0" />
                  <span className="text-xs font-semibold text-neutral-200 group-hover:text-white truncate">
                    {sub.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Grid Header & Multi-select trigger */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
              Photos & Media ({images.length})
            </h4>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                selectionMode ? "bg-white text-black font-bold" : "bg-white/5 text-neutral-400 hover:text-white border border-white/10"
              }`}
            >
              {selectionMode ? "Cancel Select" : "Select"}
            </button>
          </div>
        </div>

        {/* Media Grid */}
        {images.length === 0 ? (
          <div className="py-24 text-center border border-white/5 rounded-xl bg-neutral-900/20 text-neutral-500 text-xs font-mono tracking-widest uppercase">
            No media in this album yet. Drop photos above to start uploading.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((img, index) => {
              const isSelected = selectedIds.has(img.id);

              return (
                <div 
                  key={img.id}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelect(img.id);
                    } else {
                      setLightboxIndex(index);
                    }
                  }}
                  className={`group relative aspect-square rounded-lg overflow-hidden bg-[#161616] border transition-all cursor-pointer ${
                    isSelected ? "border-white ring-2 ring-white" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  {img.isVideo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/60 text-white">
                      <Video className="w-8 h-8 opacity-60 mb-2" />
                      <span className="text-[10px] font-mono truncate px-2 text-neutral-400 max-w-full">
                        {img.name}
                      </span>
                    </div>
                  ) : (
                    <img 
                      src={img.tempUrl || img.cdnUrl || img.url}
                      alt={img.name || "Photo"}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Multi-Select Checkbox Badge */}
                  {selectionMode && (
                    <div className={`absolute top-2.5 left-2.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      isSelected ? "bg-white border-white text-black" : "bg-black/60 border-white/40 text-transparent"
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Overlay Controls */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-white/80 truncate pr-2">
                      {img.name}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetCover(img.id); }}
                        className={`p-1.5 rounded transition-all cursor-pointer ${
                          coverSuccessId === img.id
                            ? "bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50"
                            : "bg-black/70 hover:bg-white hover:text-black text-white"
                        }`}
                        title={coverSuccessId === img.id ? "Album cover updated!" : "Set as Album Cover"}
                      >
                        {coverSuccessId === img.id ? (
                          <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                        ) : (
                          <Star className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFile(img.id); }}
                        className="p-1.5 bg-black/70 hover:bg-red-500 text-white rounded transition-colors"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Multi-Select Bottom Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-[#1c1c1c] border border-white/20 rounded-full shadow-2xl font-sans">
          <span className="text-xs font-mono font-bold text-white">
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleBatchDelete}
            disabled={isDeletingBatch}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Subfolder Creation Modal */}
      {isSubfolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#1c1c1c] border border-white/15 p-6 rounded-xl w-full max-w-sm shadow-2xl space-y-4 font-sans">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">
              Create Subfolder in {currentFolder.name}
            </h3>
            <form onSubmit={handleCreateSubfolder} className="space-y-4">
              <input 
                type="text"
                autoFocus
                required
                placeholder="Type your folder name here..."
                value={newSubfolderName}
                onChange={(e) => setNewSubfolderName(e.target.value)}
                className="w-full bg-[#111111] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSubfolderModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSubfolder || !newSubfolderName.trim()}
                  className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 disabled:opacity-50"
                >
                  {isCreatingSubfolder ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Preview */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          username={username}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}

      {/* Floating Upload Tray */}
      <UploadTray 
        uploads={uploads} 
        onClearDone={() => setUploads(prev => prev.filter(u => u.status !== "done"))}
      />
    </div>
  );
}
