'use client';

import { X, Camera as CameraIcon, Calendar, Aperture, Clock, Settings2, Download, ChevronLeft, ChevronRight, Eye, Loader2, Info } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';

// Inline WhatsApp SVG icon
function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Lightbox({ images, currentIndex, onClose, onIndexChange, whatsapp, username: propUsername }) {
  const params = useParams() || {};
  const username = propUsername || params.username;
  const [mounted, setMounted] = useState(typeof window !== 'undefined');
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchCurrentY, setTouchCurrentY] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [originalLoaded, setOriginalLoaded] = useState(false);
  const [isOriginalLoading, setIsOriginalLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset states on index change
  useEffect(() => {
    setShowOriginal(false);
    setOriginalLoaded(false);
    setIsOriginalLoading(false);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    onIndexChange((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  const handlePrev = useCallback(() => {
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'i' || e.key === 'I') setShowInfoDrawer(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Preload adjacent neighbor images (N-1, N+1, N+2) in HD tier
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const indicesToPreload = [
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length,
      (currentIndex + 2) % images.length
    ];

    indicesToPreload.forEach(idx => {
      const neighbor = images[idx];
      if (neighbor?.baseCdnUrl) {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.src = `${neighbor.baseCdnUrl}=s1440-rw`;
      }
    });
  }, [currentIndex, images]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
      setTouchCurrentY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      setTouchCurrentY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || touchStartY === null || touchCurrentY === null) return;
    const diffX = touchStartX - (e.changedTouches[0]?.clientX || touchStartX);
    const diffY = (e.changedTouches[0]?.clientY || touchCurrentY) - touchStartY;

    // Swipe down to dismiss (like iOS Photos / Google Photos)
    if (diffY > 90 && Math.abs(diffX) < 80) {
      onClose();
      return;
    }

    // Horizontal swipe between photos
    if (Math.abs(diffX) > 45 && Math.abs(diffY) < 60) {
      if (diffX > 0) handleNext();
      else handlePrev();
    }

    setTouchStartX(null);
    setTouchStartY(null);
    setTouchCurrentY(null);
  };

  const image = images[currentIndex];
  if (!image) return null;

  // Single stable full-size image URL: Retina HD 1440p (or Original Master if requested)
  const hdUrl = image.tempUrl || (image.baseCdnUrl ? `${image.baseCdnUrl}=s1440-rw` : image.url);
  const originalMasterUrl = image.url;
  const currentImageUrl = showOriginal ? originalMasterUrl : hdUrl;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  
  // Build a universally accessible client share URL for the photo
  let shareablePath = currentPath;
  if (currentPath.includes('/studio/folder/')) {
    const studioFolderId = currentPath.split('/studio/folder/')[1]?.split('?')[0];
    if (username && studioFolderId) {
      shareablePath = `/${username}/share/${studioFolderId}`;
    }
  }

  const photoShareUrl = `${currentOrigin}${shareablePath}?img=${image.id}`;
  const whatsappShareHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(`📸 Check out this photo!\n${photoShareUrl}`)}`;

  const handleCopyAndShareWhatsApp = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`📸 Check out this photo!\n${photoShareUrl}`).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestOriginal = () => {
    setIsOriginalLoading(true);
    setShowOriginal(true);
  };

  const meta = image.imageMediaMetadata || {};
  const dateStr = meta.time ? new Date(meta.time).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const formatExposure = (exposureTime) => {
    if (!exposureTime) return '';
    if (exposureTime >= 1) return `${exposureTime}s`;
    return `1/${Math.round(1 / exposureTime)}`;
  };

  const content = (
    <div
      className="fixed inset-0 z-[9999] bg-[#0c0c0c] flex flex-col justify-between overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar with Safe Area Top padding */}
      <div 
        className={`fixed top-0 left-0 right-0 z-[10001] pt-[max(12px,env(safe-area-inset-top,12px))] pb-3 px-4 sm:px-8 flex items-center justify-between transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="text-xs font-mono text-white/70 bg-black/50 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-none">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          onClick={onClose}
          aria-label="Close full screen"
          className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 transition-all cursor-pointer shadow-lg active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Prev / Next Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 text-white/40 hover:text-white transition-all p-4 hidden sm:block active:scale-95 cursor-pointer"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 text-white/40 hover:text-white transition-all p-4 hidden sm:block active:scale-95 cursor-pointer"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Main Viewport Container */}
      <div 
        onClick={() => setShowControls(prev => !prev)}
        className="flex-1 w-full flex items-center justify-center p-2 sm:p-6 lg:p-12 h-full max-h-[100dvh] pt-14 sm:pt-16 pb-20 sm:pb-28 cursor-pointer relative"
      >
        <div className="relative w-full h-full flex items-center justify-center min-h-0">
          {image.type === 'embed' ? (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full h-full max-w-5xl max-h-[80vh] aspect-video drop-shadow-2xl bg-black"
            >
              <iframe
                src={image.embedUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : image.type === 'video' ? (
            <video
              src={image.url}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
          ) : (
            <img
              src={currentImageUrl}
              alt={image.description || image.name}
              referrerPolicy="no-referrer"
              onLoad={() => {
                if (showOriginal) {
                  setOriginalLoaded(true);
                  setIsOriginalLoading(false);
                }
              }}
              className="max-w-full max-h-full object-contain drop-shadow-2xl select-none"
              style={{ transform: 'translate3d(0,0,0)' }}
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NATIVE ACTION DOCK (sm:hidden) ─────────────────── */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[10001] bg-[#141414] border-t border-white/10 pb-[max(12px,env(safe-area-inset-bottom,12px))] pt-2.5 px-3 flex items-center justify-around transition-all duration-300 sm:hidden ${
          showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-12 pointer-events-none'
        }`}
      >
        {/* WhatsApp Share */}
        <a
          href={whatsappShareHref}
          target="_blank"
          rel="noreferrer"
          onClick={handleCopyAndShareWhatsApp}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-emerald-400 active:scale-90 transition-transform"
        >
          <WhatsAppIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono tracking-wider">{copied ? 'Copied!' : 'Share'}</span>
        </a>

        {/* Download Button */}
        <a
          href={(image.url || '').includes('?') ? `${image.url}&download=true` : `${image.url}?download=true`}
          download={image.name}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-white active:scale-90 transition-transform"
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px] font-mono tracking-wider">Save</span>
        </a>

        {/* 4K Original Master Toggle */}
        {image.type !== 'video' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleRequestOriginal(); }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 active:scale-90 transition-transform ${
              showOriginal && originalLoaded 
                ? 'text-emerald-400' 
                : isOriginalLoading 
                  ? 'text-amber-400' 
                  : 'text-neutral-300'
            }`}
          >
            {isOriginalLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
            <span className="text-[10px] font-mono tracking-wider">
              {showOriginal && originalLoaded ? '✓ 4K' : isOriginalLoading ? 'Loading' : '4K+'}
            </span>
          </button>
        )}

        {/* EXIF Info Drawer Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowInfoDrawer(prev => !prev); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 active:scale-90 transition-transform ${
            showInfoDrawer ? 'text-white' : 'text-neutral-400'
          }`}
        >
          <Info className="w-5 h-5" />
          <span className="text-[10px] font-mono tracking-wider">Info</span>
        </button>

        {/* RAW Download (if available) */}
        {image.rawFileId && (
          <a
            href={`/api/image/${username || 'guest'}/${image.rawFileId}?download=true&filename=${encodeURIComponent(image.rawFileName || 'RAW_file')}`}
            download={image.rawFileName || `RAW_${image.name}`}
            className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-amber-300 active:scale-90 transition-transform"
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px] font-mono tracking-wider">RAW</span>
          </a>
        )}
      </div>

      {/* ── MOBILE EXIF INFO DRAWER SHEET (sm:hidden) ────────────────────── */}
      {showInfoDrawer && (
        <div 
          onClick={() => setShowInfoDrawer(false)}
          className="fixed inset-0 z-[10002] bg-black/60 sm:hidden flex flex-col justify-end"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#181818] border-t border-white/15 rounded-t-2xl p-5 pb-[max(20px,env(safe-area-inset-bottom,20px))] space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-widest text-white font-bold">Photo Details</span>
              <button 
                onClick={() => setShowInfoDrawer(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-neutral-300">
              <div className="truncate text-white font-semibold">{image.name}</div>
              {image.description && (
                <p className="text-xs text-neutral-400 font-sans">{image.description}</p>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-neutral-400">
                {dateStr && <div>📅 {dateStr}</div>}
                {meta.cameraMake && <div>📷 {meta.cameraMake} {meta.cameraModel}</div>}
                {meta.focalLength && <div>🔭 {meta.focalLength}mm</div>}
                {meta.aperture && <div>⭕ f/{meta.aperture}</div>}
                {meta.exposureTime && <div>⏱️ {formatExposure(meta.exposureTime)}</div>}
                {meta.isoSpeed && <div>⚡ ISO {meta.isoSpeed}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP CONTROLS & EXIF BAR (hidden sm:flex) ─────────────────── */}
      <div 
        className={`hidden sm:flex flex-col items-center fixed bottom-0 left-0 right-0 z-[10001] pb-6 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent transition-all duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 mb-4 shrink-0 px-4 z-10 font-sans">
          {/* Download Master Button */}
          <a
            href={(image.url || '').includes('?') ? `${image.url}&download=true` : `${image.url}?download=true`}
            download={image.name}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-neutral-200 text-black text-xs uppercase tracking-[0.2em] font-medium transition-colors rounded-sm min-w-[180px] active:scale-95 cursor-pointer shadow"
          >
            <Download className="w-4 h-4" />
            {image.type === 'video' ? 'Download Video' : 'Download Photo'}
          </a>

          {/* Share to WhatsApp Native Link */}
          <a
            href={whatsappShareHref}
            target="_blank"
            rel="noreferrer"
            onClick={handleCopyAndShareWhatsApp}
            title="Share direct photo link via WhatsApp"
            className={`flex items-center justify-center gap-2 px-6 py-3 border text-xs uppercase tracking-[0.2em] font-medium transition-all rounded-sm min-w-[180px] active:scale-95 cursor-pointer shadow ${
              copied
                ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                : 'border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/50'
            }`}
          >
            <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
            {copied ? 'Link Copied!' : 'Share WhatsApp'}
          </a>

          {/* View Original Master Toggle */}
          {!showOriginal && image.type !== 'video' && (
            <button
              onClick={handleRequestOriginal}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/90 hover:text-white hover:bg-white/10 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors rounded-sm min-w-[180px] active:scale-95 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              View Original (4K+)
            </button>
          )}

          {showOriginal && isOriginalLoading && (
            <div className="flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/80 text-[10px] uppercase tracking-[0.2em] font-medium rounded-sm min-w-[180px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              Buffering Master...
            </div>
          )}

          {showOriginal && originalLoaded && (
            <div className="flex items-center justify-center gap-2 px-6 py-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-[0.2em] font-mono rounded-sm min-w-[180px]">
              ✓ Original Master
            </div>
          )}

          {/* Download RAW file if attached */}
          {image.rawFileId && (
            <a
              href={`/api/image/${username || 'guest'}/${image.rawFileId}?download=true&filename=${encodeURIComponent(image.rawFileName || 'RAW_file')}`}
              download={image.rawFileName || `RAW_${image.name}`}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-white/10 text-white/70 hover:text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-white/5 transition-colors rounded-sm min-w-[180px]"
            >
              <Download className="w-3 h-3" />
              Download RAW
            </a>
          )}
        </div>

        {/* Desktop EXIF Strip */}
        <div className="w-full shrink-0 border-t border-white/10 pt-3 pb-1 px-4 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400 z-10 font-mono">
          {image.description && (
            <div className="w-full text-center text-neutral-300 mb-1 tracking-[0.1em] font-sans font-light">
              {image.description}
            </div>
          )}

          {dateStr && <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 opacity-60" /> {dateStr}</span>}
          {meta.cameraMake && <span className="flex items-center gap-1.5"><CameraIcon className="w-3 h-3 opacity-60" /> {meta.cameraMake} {meta.cameraModel}</span>}
          {meta.focalLength && <span className="flex items-center gap-1.5"><Settings2 className="w-3 h-3 opacity-60" /> {meta.focalLength}mm</span>}
          {meta.aperture && <span className="flex items-center gap-1.5"><Aperture className="w-3 h-3 opacity-60" /> f/{meta.aperture}</span>}
          {meta.exposureTime && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 opacity-60" /> {formatExposure(meta.exposureTime)}</span>}
          {meta.isoSpeed && <span className="flex items-center gap-1.5">ISO {meta.isoSpeed}</span>}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
