'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import MasonryGallery from '@/components/MasonryGallery';
import SortBar from '@/components/SortBar';
import FolderCard from '@/components/FolderCard';
import { MousePointerClick } from 'lucide-react';

const Lightbox = dynamic(() => import('@/components/Lightbox'), { ssr: false });
const SelectionBar = dynamic(() => import('@/components/SelectionBar'), { ssr: false });

export default function GalleryClient({ initialImages, initialSubfolders = [], basePath = '/gallery', whatsapp = null }) {
  const [images] = useState(initialImages);
  const [hoveredFolder, setHoveredFolder] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Updates the browser URL with ?img=... without triggering page refreshes
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
    return [...initialSubfolders].sort((a, b) => {
      const valA = a.name.toLowerCase();
      const valB = b.name.toLowerCase();
      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });
  }, [initialSubfolders]);

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
      // Exit selection mode if nothing is selected
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
      // Fetch all files in parallel (batches of 5 to avoid overwhelming)
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
      <AnimatePresence>
        {hoveredFolder && hoveredFolder.thumbnailUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-0 pointer-events-none"
          >
            <img
              src={hoveredFolder.thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-8 relative z-10">
        {sortedSubfolders.length > 0 && (
        <div className="mb-4">
          <h2 className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-[0.3em] mb-4">Folders</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {sortedSubfolders.map((folder, index) => (
              <div 
                key={folder.id}
                onMouseEnter={() => setHoveredFolder(folder)}
                onMouseLeave={() => setHoveredFolder(null)}
              >
                <FolderCard folder={folder} index={index} basePath={basePath} />
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-4 py-4 border-y border-white/10 bg-neutral-950/80 backdrop-blur-md sticky top-[80px] z-40 -mx-4 px-4 sm:mx-0 sm:px-4 rounded-none sm:rounded-sm">
            <button
              onClick={toggleSelectionMode}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium rounded-sm transition-all duration-200 whitespace-nowrap ${
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
