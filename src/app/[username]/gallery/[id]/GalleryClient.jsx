'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import MasonryGallery from '@/components/MasonryGallery';
import SortBar from '@/components/SortBar';
import FolderCard from '@/components/FolderCard';
import { MousePointerClick, ChevronRight, ArrowLeft } from 'lucide-react';
import {
  getCachedFolder,
  setCachedFolder,
  updateCachedFolderScroll,
  prefetchFolder,
  getNextFetchSeq,
  getCurrentFetchSeq
} from '@/lib/folderGraphStore';
import Lightbox from '@/components/Lightbox';

const SelectionBar = dynamic(() => import('@/components/SelectionBar'), { ssr: false });

export default function GalleryClient({ 
  initialFolder = null, 
  initialImages = [], 
  initialSubfolders = [], 
  basePath = '/gallery', 
  username = null,
  whatsapp = null 
}) {
  const [currentFolder, setCurrentFolder] = useState(initialFolder);
  const [images, setImages] = useState(initialImages);
  const [subfolders, setSubfolders] = useState(initialSubfolders);
  const [breadcrumbs, setBreadcrumbs] = useState(
    initialFolder ? [{ id: initialFolder.id, name: initialFolder.name }] : []
  );
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Seed initial folder into RAM cache
  useEffect(() => {
    if (initialFolder?.id) {
      setCachedFolder(initialFolder.id, {
        folder: initialFolder,
        images: initialImages,
        subfolders: initialSubfolders
      });
    }
  }, [initialFolder, initialImages, initialSubfolders]);

  // Idle prefetching for subfolders
  useEffect(() => {
    if (!username || subfolders.length === 0) return;
    const timer = setTimeout(() => {
      subfolders.forEach(sub => {
        prefetchFolder(sub.id, "gallery", username);
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [subfolders, username]);

  // 0ms Folder Drill-down
  const navigateToFolder = useCallback(async (targetId, targetName) => {
    if (currentFolder?.id) {
      updateCachedFolderScroll(currentFolder.id, window.scrollY);
    }

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
      window.history.pushState({ folderId: targetId }, '', `${basePath}/${targetId}`);
      window.scrollTo(0, cached.scrollY || 0);
      return;
    }

    setIsLoadingFolder(true);
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBreadcrumbs(prev => [...prev, { id: targetId, name: targetName }]);
    window.history.pushState({ folderId: targetId }, '', `${basePath}/${targetId}`);
    window.scrollTo(0, 0);

    try {
      const res = await fetch(`/api/gallery/${encodeURIComponent(username)}/${encodeURIComponent(targetId)}`);
      const json = await res.json();
      if (seq !== getCurrentFetchSeq()) return;
      if (json.success && json.data) {
        setCachedFolder(targetId, json.data);
        setCurrentFolder(json.data.folder);
        setImages(json.data.images || []);
        setSubfolders(json.data.subfolders || []);
      }
    } catch (err) {
      console.error('Failed to load gallery folder:', err);
    } finally {
      if (seq === getCurrentFetchSeq()) {
        setIsLoadingFolder(false);
      }
    }
  }, [currentFolder?.id, basePath, username]);

  // Listen to browser Back/Forward
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

  // Updates browser URL with ?img=... without triggering full-page router reloads
  const updateUrlForImage = useCallback((index, currentSortedImages) => {
    const params = new URLSearchParams(window.location.search);
    const targetImages = currentSortedImages || [];
    if (index !== null && targetImages[index]) {
      params.set('img', targetImages[index].id);
    } else {
      params.delete('img');
    }
    const newSearch = params.toString();
    const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    window.history.replaceState(null, '', newPath);
  }, []);

  const sortedSubfolders = useMemo(() => {
    return [...subfolders].sort((a, b) => {
      const valA = a.name.toLowerCase();
      const valB = b.name.toLowerCase();
      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });
  }, [subfolders]);

  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      const valA = a.name.toLowerCase();
      const valB = b.name.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [images, sortOrder]);

  // Sync state with URL search param on load or back/forward navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const imgId = params.get('img');
      if (imgId) {
        const idx = sortedImages.findIndex(img => img.id === imgId);
        if (idx !== -1) {
          setSelectedIndex(idx);
          return;
        }
      }
      setSelectedIndex(null);
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [sortedImages]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (next.size === 0) {
        setSelectionMode(false);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === sortedImages.length) {
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else {
      setSelectedIds(new Set(sortedImages.map(img => img.id)));
    }
  }, [selectedIds.size, sortedImages]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleDownloadZip = useCallback(async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const filesToDownload = sortedImages
      .filter(img => selectedIds.has(img.id))
      .map(img => ({ id: img.id, name: img.name, url: img.url }));

    try {
      const batchSize = 5;
      for (let i = 0; i < filesToDownload.length; i += batchSize) {
        const batch = filesToDownload.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (file) => {
            try {
              const res = await fetch(file.url);
              if (!res.ok) throw new Error(`Failed: ${file.name}`);
              const blob = await res.blob();
              return { name: file.name, blob };
            } catch (err) {
              console.error(`Failed to fetch ${file.name}:`, err);
              return null;
            }
          })
        );
        results.filter(Boolean).forEach(({ name, blob }) => zip.file(name, blob));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photos_${filesToDownload.length}_files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      handleClearSelection();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again with fewer files.');
    }
  }, [selectedIds, sortedImages, handleClearSelection]);

  const toggleSelectionMode = useCallback(() => {
    if (selectionMode) {
      handleClearSelection();
    } else {
      setSelectionMode(true);
    }
  }, [selectionMode, handleClearSelection]);

  return (
    <>
      {/* Subtle Top Loading Line */}
      {isLoadingFolder && (
        <div className="fixed top-0 left-0 right-0 h-[2px] bg-white/20 z-50 overflow-hidden">
          <div className="h-full bg-white w-1/3 animate-pulse" />
        </div>
      )}

      {/* Breadcrumb Hierarchy Navigation if drilled into subfolders */}
      {breadcrumbs.length > 1 && (
        <div className="mb-6 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-400">
          {breadcrumbs.map((b, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={b.id} className="flex items-center gap-2">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />}
                {isLast ? (
                  <span className="text-white font-bold">{b.name}</span>
                ) : (
                  <button
                    onClick={() => navigateToFolder(b.id, b.name)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {b.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-6 sm:gap-8 relative z-10">
        {sortedSubfolders.length > 0 && (
          <div className="mb-2 sm:mb-4">
            <h2 className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-[0.25em] sm:tracking-[0.3em] mb-3 sm:mb-4">
              Folders ({sortedSubfolders.length})
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
              {sortedSubfolders.map((f, index) => (
                <FolderCard 
                  key={f.id} 
                  folder={f} 
                  index={index} 
                  basePath={basePath} 
                  username={username}
                  onNavigate={navigateToFolder}
                />
              ))}
            </div>
          </div>
        )}

        {images.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-3 py-3 sm:py-4 border-y border-white/10 bg-neutral-950/95 sticky top-14 sm:top-20 z-40 -mx-3 px-3 sm:mx-0 sm:px-4 rounded-none sm:rounded-sm">
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium rounded-sm transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 ${
                  selectionMode
                    ? 'bg-white text-black hover:bg-neutral-200'
                    : 'border border-white/15 text-neutral-400 hover:text-white hover:border-white/30'
                }`}
              >
                <MousePointerClick className="w-3.5 h-3.5" />
                {selectionMode ? 'Cancel' : 'Select'}
              </button>
              <SortBar 
                sortOrder={sortOrder} 
                setSortOrder={setSortOrder} 
              />
            </div>

            <MasonryGallery 
              images={sortedImages} 
              onImageClick={(idx) => {
                setSelectedIndex(idx);
                updateUrlForImage(idx, sortedImages);
              }}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          </>
        )}

        {images.length === 0 && sortedSubfolders.length === 0 && (
          <div className="py-24 text-center border border-white/5 rounded-xl bg-neutral-900/20 text-neutral-500 text-xs font-mono tracking-widest uppercase">
            No media in this album yet.
          </div>
        )}

        {selectedIndex !== null && (
          <Lightbox 
            images={sortedImages}
            currentIndex={selectedIndex}
            onClose={() => {
              setSelectedIndex(null);
              updateUrlForImage(null, sortedImages);
            }} 
            onIndexChange={(newIdx) => {
              setSelectedIndex(newIdx);
              updateUrlForImage(newIdx, sortedImages);
            }}
            whatsapp={whatsapp}
          />
        )}

        <SelectionBar
          selectedCount={selectedIds.size}
          totalCount={sortedImages.length}
          onDownload={handleDownloadZip}
          onClear={handleClearSelection}
          onSelectAll={handleSelectAll}
        />
      </div>
    </>
  );
}
