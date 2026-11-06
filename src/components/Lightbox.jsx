'use client';

import { X, Camera as CameraIcon, Calendar, Aperture, Clock, Settings2, Download, ChevronLeft, ChevronRight, Eye, Loader2, Info, RotateCw, RotateCcw, Zap } from 'lucide-react';
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

  // Viewport and Phone Rotation States
  const [viewportDims, setViewportDims] = useState({ width: 0, height: 0 });
  const [isManualRotated, setIsManualRotated] = useState(false);
  const [isAutoDeviceRotated, setIsAutoDeviceRotated] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(90);
  const [naturalAspect, setNaturalAspect] = useState(null);

  useEffect(() => {
    setMounted(true);
    const updateDims = () => {
      if (typeof window === 'undefined') return;
      setViewportDims({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    window.addEventListener('orientationchange', updateDims);
    return () => {
      window.removeEventListener('resize', updateDims);
      window.removeEventListener('orientationchange', updateDims);
    };
  }, []);

  // Reset states on index change
  useEffect(() => {
    setShowOriginal(false);
    setOriginalLoaded(false);
    setIsOriginalLoading(false);
    setIsManualRotated(false);
    setIsAutoDeviceRotated(false);
    setRotationAngle(90);
    setNaturalAspect(null);
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
      if (e.key === 'r' || e.key === 'R') setIsManualRotated(prev => !prev);
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

  const image = images[currentIndex];

  const meta = image?.imageMediaMetadata || {};
  const isLandscapePhoto = (meta.width && meta.height)
    ? (meta.width > meta.height)
    : (naturalAspect ? naturalAspect > 1.05 : false);

  // Mobile landscape: viewport width > height and short height (typical phone in landscape: 360-480px)
  const isMobileLandscape = viewportDims.width > viewportDims.height && viewportDims.height > 0 && viewportDims.height <= 550;
  // If OS rotated to landscape, cancel manual/device CSS rotation
  const isRotated = !isMobileLandscape && (isManualRotated || isAutoDeviceRotated);

  // Accelerometer / Gyroscope auto-rotation detection (when Portrait Lock is on)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timer;
    const handleOrientation = (e) => {
      // If OS already rotated the viewport into landscape, don't do CSS rotation
      if (window.innerWidth > window.innerHeight) {
        setIsAutoDeviceRotated(false);
        return;
      }
      if (!isLandscapePhoto) {
        setIsAutoDeviceRotated(false);
        return;
      }

      const gamma = e.gamma;
      const beta = e.beta;
      if (gamma === null || beta === null) return;

      // Phone turned sideways: |gamma| > 55 deg and |beta| < 65 deg
      const isSidewaysRight = gamma > 55 && Math.abs(beta) < 65;
      const isSidewaysLeft = gamma < -55 && Math.abs(beta) < 65;
      // Phone held upright: |gamma| < 30 deg and beta > 25 deg
      const isUpright = Math.abs(gamma) < 30 && beta > 25;

      if (isSidewaysRight) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          setRotationAngle(90);
          setIsAutoDeviceRotated(true);
        }, 200);
      } else if (isSidewaysLeft) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          setRotationAngle(-90);
          setIsAutoDeviceRotated(true);
        }, 200);
      } else if (isUpright) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          setIsAutoDeviceRotated(false);
        }, 200);
      }
    };

    try {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } catch {}

    return () => {
      clearTimeout(timer);
      try {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      } catch {}
    };
  }, [isLandscapePhoto]);

  // Auto-hide controls in mobile landscape or rotated fullscreen for immersive view
  useEffect(() => {
    if (!isMobileLandscape && !isRotated) return;
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, [isMobileLandscape, isRotated, currentIndex]);

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
    const clientX = e.changedTouches[0]?.clientX || touchStartX;
    const clientY = e.changedTouches[0]?.clientY || touchCurrentY;
    const diffX = touchStartX - clientX;
    const diffY = clientY - touchStartY;

    if (isRotated) {
      // Physical horizontal swipe translates to vertical motion on rotated screen
      const physicalDiffX = rotationAngle === 90 ? (touchStartY - clientY) : (clientY - touchStartY);
      if (Math.abs(physicalDiffX) > 45) {
        if (physicalDiffX > 0) handleNext();
        else handlePrev();
      }
    } else {
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
    }

    setTouchStartX(null);
    setTouchStartY(null);
    setTouchCurrentY(null);
  };

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
  
  const formatExifDate = (timeStr) => {
    if (!timeStr) return '';
    try {
      let normalized = String(timeStr).trim();
      if (/^\d{4}:\d{2}:\d{2}/.test(normalized)) {
        normalized = normalized.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T');
      }
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const dateStr = formatExifDate(meta.time);

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
      {/* ── ROTATED FULLSCREEN OVERLAY (Phone held sideways with Portrait Lock) ── */}
      {isRotated && (
        <div 
          onClick={() => setShowControls(prev => !prev)}
          className="fixed inset-0 z-[10005] bg-[#0c0c0c] flex items-center justify-center overflow-hidden cursor-pointer"
        >
          {/* Floating Controls Bar */}
          <div 
            className={`absolute top-0 left-0 right-0 z-[10010] pt-[max(12px,env(safe-area-inset-top,12px))] pb-3 px-4 flex items-center justify-between transition-opacity duration-200 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="text-xs font-mono text-white/70 bg-black/70 px-3 py-1 rounded-full border border-white/10">
              {currentIndex + 1} / {images.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsManualRotated(false);
                  setIsAutoDeviceRotated(false);
                }}
                className="bg-black/70 hover:bg-black text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5 active:scale-95 shadow-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Exit Rotate</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 rounded-full bg-black/70 text-white hover:text-black hover:bg-white border border-white/20 active:scale-90"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rotated Image Container matching 100dvh x 100dvw */}
          <div
            style={{
              width: viewportDims.height ? `${viewportDims.height}px` : '100dvh',
              height: viewportDims.width ? `${viewportDims.width}px` : '100dvw',
              transform: `rotate(${rotationAngle}deg)`,
              transformOrigin: 'center center',
            }}
            className="flex items-center justify-center min-w-0 min-h-0"
          >
            <img
              src={currentImageUrl}
              alt={image.description || image.name}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain drop-shadow-2xl select-none"
              style={{ transform: 'translate3d(0,0,0)' }}
              draggable={false}
            />
          </div>
        </div>
      )}

      {/* ── TOP HEADER (SHRINK-0 or FLOATING IN MOBILE LANDSCAPE) ── */}
      <header 
        className={`${
          isMobileLandscape 
            ? 'absolute top-0 left-0 right-0 z-50 pt-[max(8px,env(safe-area-inset-top,8px))] pb-2 px-4 sm:px-8 bg-gradient-to-b from-black/85 via-black/40 to-transparent' 
            : 'w-full shrink-0 z-50 pt-[max(12px,env(safe-area-inset-top,12px))] pb-2.5 px-4 sm:px-8 bg-[#0c0c0c] border-b border-white/5'
        } flex items-center justify-between transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-xs font-mono text-white/70 bg-black/60 px-3 py-1 rounded-full border border-white/10">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          onClick={onClose}
          aria-label="Close full screen"
          className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 transition-all cursor-pointer shadow-lg active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* ── MAIN VIEWPORT CANVAS (FLEX-1 OR FULLSCREEN IN MOBILE LANDSCAPE) ── */}
      <main 
        onClick={() => setShowControls(prev => !prev)}
        className={`${
          isMobileLandscape
            ? 'absolute inset-0 w-full h-full p-0 z-40 bg-[#0c0c0c]'
            : 'flex-1 min-h-0 min-w-0 w-full p-2 sm:p-4 md:p-6'
        } flex items-center justify-center relative overflow-hidden cursor-pointer`}
      >
        {/* Desktop Prev / Next Navigation Arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-40 text-white/60 hover:text-white transition-all p-3 sm:p-4 hidden sm:block active:scale-95 cursor-pointer bg-black/40 hover:bg-black/80 rounded-full border border-white/10 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 text-white/60 hover:text-white transition-all p-3 sm:p-4 hidden sm:block active:scale-95 cursor-pointer bg-black/40 hover:bg-black/80 rounded-full border border-white/10 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Quick Floating Rotate to Fullscreen Pill on Mobile Portrait for Landscape Photos */}
        {!isMobileLandscape && isLandscapePhoto && !isRotated && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRotationAngle(90);
              setIsManualRotated(true);
            }}
            className="absolute bottom-3 right-3 z-40 bg-black/75 hover:bg-black text-white/90 hover:text-white border border-white/20 px-3 py-1.5 rounded-full text-[11px] font-mono flex items-center gap-1.5 shadow-xl active:scale-95 md:hidden"
            title="Rotate photo to fill screen"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Rotate Fullscreen</span>
          </button>
        )}

        <div className="w-full h-full flex items-center justify-center min-h-0 min-w-0">
          {image.type === 'embed' ? (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full h-full max-w-5xl aspect-video drop-shadow-2xl bg-black"
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
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;
                if (naturalWidth && naturalHeight) {
                  setNaturalAspect(naturalWidth / naturalHeight);
                }
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
      </main>

      {/* ── MOBILE EXIF INFO DRAWER SHEET (md:hidden) ────────────────────── */}
      {showInfoDrawer && (
        <div 
          onClick={() => setShowInfoDrawer(false)}
          className="fixed inset-0 z-[10002] bg-black/70 md:hidden flex flex-col justify-end"
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
                <p className="text-xs text-neutral-400 font-sans pb-1">{image.description}</p>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {dateStr && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-mono">Date</div>
                      <div className="text-xs text-neutral-200 font-mono truncate">{dateStr}</div>
                    </div>
                  </div>
                )}
                {(meta.cameraMake || meta.cameraModel) && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
                    <CameraIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-mono">Camera</div>
                      <div className="text-xs text-neutral-200 font-mono truncate">{meta.cameraMake} {meta.cameraModel}</div>
                    </div>
                  </div>
                )}
                {meta.focalLength && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
                    <Settings2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-mono">Focal</div>
                      <div className="text-xs text-neutral-200 font-mono">{meta.focalLength}mm</div>
                    </div>
                  </div>
                )}
                {meta.aperture && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
                    <Aperture className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-mono">Aperture</div>
                      <div className="text-xs text-neutral-200 font-mono">f/{meta.aperture}</div>
                    </div>
                  </div>
                )}
                {meta.exposureTime && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-mono">Shutter</div>
                      <div className="text-xs text-neutral-200 font-mono">{formatExposure(meta.exposureTime)}</div>
                    </div>
                  </div>
                )}
                {meta.isoSpeed && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
                    <Zap className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500 font-mono">ISO</div>
                      <div className="text-xs text-neutral-200 font-mono">ISO {meta.isoSpeed}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM DOCK (SHRINK-0 OR FLOATING IN MOBILE LANDSCAPE) ── */}
      <footer 
        className={`${
          isMobileLandscape
            ? 'absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/85 via-black/40 to-transparent pb-[max(8px,env(safe-area-inset-bottom,8px))] pt-2 px-4 flex flex-col items-center'
            : 'w-full shrink-0 z-50 bg-[#121212] border-t border-white/10'
        } transition-all duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* MOBILE COMPACT DOCK (< md or Mobile Landscape) - Ergonomic Right-Thumb Clustered */}
        <div className={`flex ${isMobileLandscape ? 'flex' : 'md:hidden'} items-center justify-end gap-1.5 sm:gap-2 w-full py-2 px-3 sm:px-6 pb-[max(10px,env(safe-area-inset-bottom,10px))]`}>
          {/* Subtle Left Details on wider screens */}
          <div className="mr-auto min-w-0 pr-2 truncate">
            <div className="text-[11px] font-mono text-neutral-400 truncate max-w-[120px] sm:max-w-[200px]">
              {image.name}
            </div>
          </div>

          {/* Rotate to Fullscreen (if in portrait and photo is landscape) */}
          {!isMobileLandscape && isLandscapePhoto && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRotationAngle(90);
                setIsManualRotated(prev => !prev);
              }}
              className="flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-neutral-300 hover:text-white active:scale-90 transition-all"
              title="Rotate photo to fill screen"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[10px] font-mono tracking-wider">Rotate</span>
            </button>
          )}

          {/* 5. EXIF Info Drawer Toggle (5th from right) */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowInfoDrawer(prev => !prev); }}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl border transition-all active:scale-90 ${
              showInfoDrawer 
                ? 'bg-white/20 border-white/40 text-white' 
                : 'bg-white/[0.05] border-white/10 text-neutral-400 hover:text-white'
            }`}
            title="Photo Details"
          >
            <Info className="w-4 h-4" />
            <span className="text-[10px] font-mono tracking-wider">Info</span>
          </button>

          {/* 4. RAW Download (4th from right, if available) */}
          {image.rawFileId && (
            <a
              href={`/api/image/${username || 'guest'}/${image.rawFileId}?download=true&filename=${encodeURIComponent(image.rawFileName || 'RAW_file')}`}
              download={image.rawFileName || `RAW_${image.name}`}
              className="flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 active:scale-90 transition-all"
              title="Download RAW Master"
            >
              <Download className="w-4 h-4" />
              <span className="text-[10px] font-mono tracking-wider">RAW</span>
            </a>
          )}

          {/* 3. 4K Original Master Toggle (3rd from right) */}
          {image.type !== 'video' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleRequestOriginal(); }}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl border active:scale-90 transition-all ${
                showOriginal && originalLoaded 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : isOriginalLoading 
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' 
                    : 'bg-white/[0.05] border-white/10 text-neutral-300 hover:text-white'
              }`}
              title="View 4K Master"
            >
              {isOriginalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="text-[10px] font-mono tracking-wider">
                {showOriginal && originalLoaded ? '✓ 4K' : isOriginalLoading ? '...' : '4K+'}
              </span>
            </button>
          )}

          {/* 2. Download Image (Save) (2nd from right) */}
          <a
            href={(image.url || '').includes('?') ? `${image.url}&download=true` : `${image.url}?download=true`}
            download={image.name}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-90 transition-all"
            title="Download Photo"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-mono tracking-wider">Save</span>
          </a>

          {/* 1. WhatsApp Share (Rightmost hero item, closest to right thumb) */}
          <a
            href={whatsappShareHref}
            target="_blank"
            rel="noreferrer"
            onClick={handleCopyAndShareWhatsApp}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 active:scale-90 transition-all shadow-sm"
            title="Share on WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span className="text-[10px] font-mono tracking-wider font-semibold">{copied ? 'Copied!' : 'Share'}</span>
          </a>
        </div>

        {/* DESKTOP EXPANDED DOCK (>= md and strictly NOT in mobile landscape) */}
        {!isMobileLandscape && (
          <div className="hidden md:flex flex-col items-center py-3 px-4 w-full">
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-2 shrink-0 font-sans max-w-5xl">
            {/* Download Master Button */}
            <a
              href={(image.url || '').includes('?') ? `${image.url}&download=true` : `${image.url}?download=true`}
              download={image.name}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs uppercase tracking-[0.15em] font-medium transition-colors rounded-sm active:scale-95 cursor-pointer shadow whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{image.type === 'video' ? 'Download Video' : 'Download Photo'}</span>
            </a>

            {/* Share to WhatsApp Native Link */}
            <a
              href={whatsappShareHref}
              target="_blank"
              rel="noreferrer"
              onClick={handleCopyAndShareWhatsApp}
              title="Share direct photo link via WhatsApp"
              className={`flex items-center justify-center gap-2 px-5 py-2.5 border text-xs uppercase tracking-[0.15em] font-medium transition-all rounded-sm active:scale-95 cursor-pointer shadow whitespace-nowrap ${
                copied
                  ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                  : 'border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/50'
              }`}
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0" />
              <span>{copied ? 'Link Copied!' : 'Share WhatsApp'}</span>
            </a>

            {/* View Original Master Toggle */}
            {!showOriginal && image.type !== 'video' && (
              <button
                onClick={handleRequestOriginal}
                className="flex items-center justify-center gap-2 px-5 py-2.5 border border-white/20 text-white/90 hover:text-white hover:bg-white/10 text-[11px] uppercase tracking-[0.15em] font-medium transition-colors rounded-sm active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span>View Original (4K+)</span>
              </button>
            )}

            {showOriginal && isOriginalLoading && (
              <div className="flex items-center justify-center gap-2 px-5 py-2.5 border border-white/20 text-white/80 text-[11px] uppercase tracking-[0.15em] font-medium rounded-sm whitespace-nowrap">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                <span>Buffering Master...</span>
              </div>
            )}

            {showOriginal && originalLoaded && (
              <div className="flex items-center justify-center gap-2 px-5 py-2.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] uppercase tracking-[0.15em] font-mono rounded-sm whitespace-nowrap">
                <span>✓ Original Master</span>
              </div>
            )}

            {/* Download RAW file if attached */}
            {image.rawFileId && (
              <a
                href={`/api/image/${username || 'guest'}/${image.rawFileId}?download=true&filename=${encodeURIComponent(image.rawFileName || 'RAW_file')}`}
                download={image.rawFileName || `RAW_${image.name}`}
                className="flex items-center justify-center gap-2 px-5 py-2.5 border border-white/10 text-white/70 hover:text-white text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-white/5 transition-colors rounded-sm whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Download RAW</span>
              </a>
            )}
          </div>

          {/* Desktop EXIF Strip */}
          <div className="w-full shrink-0 border-t border-white/5 pt-2 px-4 flex flex-wrap justify-center items-center gap-x-6 gap-y-1.5 text-[10px] uppercase tracking-[0.18em] text-neutral-400 font-mono">
            {image.description && (
              <div className="w-full text-center text-neutral-300 mb-0.5 tracking-[0.1em] font-sans font-light text-xs truncate max-w-2xl mx-auto">
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
        )}
      </footer>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
