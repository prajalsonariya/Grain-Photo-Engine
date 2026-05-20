'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera as CameraIcon, Calendar, Aperture, Clock, Settings2, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

// Inline WhatsApp SVG icon
function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Lightbox({ images, currentIndex, onClose, onIndexChange, whatsapp }) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNext = useCallback(() => {
    setShowOriginal(false);
    onIndexChange((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  const handlePrev = useCallback(() => {
    setShowOriginal(false);
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
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

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
  };

  // Share to WhatsApp — copies formatted message + page URL to clipboard
  const handleShareToWhatsApp = useCallback(async () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const currentImage = images[currentIndex];
    const shareUrl = currentImage ? `${baseUrl}?img=${currentImage.id}` : window.location.href;
    const message = `📸 Check out this gallery!\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard API
      const ta = document.createElement('textarea');
      ta.value = message;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [images, currentIndex]);

  const image = images[currentIndex];
  if (!image) return null;

  const previewUrl = image.baseCdnUrl ? `/api/thumbnail?url=${encodeURIComponent(`${image.baseCdnUrl}=s2000-rw`)}` : image.url;
  const currentImageUrl = showOriginal ? image.url : previewUrl;

  const meta = image.imageMediaMetadata || {};
  const dateStr = meta.time ? new Date(meta.time).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const formatExposure = (exposureTime) => {
    if (!exposureTime) return '';
    if (exposureTime >= 1) return `${exposureTime}s`;
    return `1/${Math.round(1 / exposureTime)}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed inset-0 z-[100] bg-neutral-950/95 backdrop-blur-xl flex flex-col overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

        <button
          onClick={handlePrev}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 text-white/30 hover:text-white transition-all duration-150 p-4 hidden sm:block"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 text-white/30 hover:text-white transition-all duration-150 p-4 hidden sm:block"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 h-full max-h-[100dvh]">
          <motion.div
            key={image.id}
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full flex-1 flex items-center justify-center min-h-0 mb-6 mt-12 sm:mt-0 group"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[60] bg-black/60 hover:bg-black/90 text-white p-2 sm:p-3 rounded-full backdrop-blur-md transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 shadow-xl"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            {image.type === 'video' ? (
              <video
                src={image.url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
              />
            ) : (
              <img
                key={currentImageUrl}
                src={currentImageUrl}
                alt={image.description || image.name}
                className="max-w-full max-h-full object-contain drop-shadow-2xl select-none"
                style={{ transform: 'translate3d(0,0,0)' }}
                draggable={false}
              />
            )}
          </motion.div>

          {/* Action row */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.15, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-6 shrink-0 w-full sm:w-auto px-4 z-10"
          >
            {/* Download */}
            <a
              href={`${image.url}&download=true`}
              download={image.name}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-white/90 hover:bg-white text-black text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium transition-colors rounded-sm sm:min-w-[180px]"
            >
              <Download className="w-4 h-4" />
              Download Image
            </a>

            {/* Share to WhatsApp — copies message + page URL to clipboard */}
            <button
              onClick={handleShareToWhatsApp}
              title="Copy gallery link to share on WhatsApp"
              className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 border text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium transition-all rounded-sm sm:min-w-[180px] ${
                copied
                  ? 'border-green-500/60 bg-green-500/10 text-green-400'
                  : 'border-green-500/30 text-green-400/80 hover:text-green-400 hover:bg-green-500/10 hover:border-green-500/50'
              }`}
            >
              <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
              {copied ? 'Link Copied!' : 'Share via WhatsApp'}
            </button>

            {/* View Original */}
            {!showOriginal && image.type !== 'video' && (
              <button
                onClick={() => setShowOriginal(true)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 border border-white/20 text-white/90 hover:text-white hover:bg-white/10 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-medium transition-colors rounded-sm sm:min-w-[180px]"
              >
                <Eye className="w-4 h-4" />
                View Original
              </button>
            )}

            {/* Download RAW */}
            {image.rawFileId && (
              <a
                href={`/api/image/${image.rawFileId}?download=true&filename=${encodeURIComponent(image.rawFileName || 'RAW_file')}`}
                download={image.rawFileName || `RAW_${image.name}`}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 border border-white/10 text-white/70 hover:text-white text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-white/5 transition-colors rounded-sm sm:min-w-[180px]"
              >
                <Download className="w-3 h-3" />
                Download RAW
              </a>
            )}
          </motion.div>

          {/* EXIF metadata strip */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.15, ease: "easeOut" }}
            className="w-full shrink-0 border-t border-white/5 pt-4 pb-2 px-4 flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-neutral-500 z-10"
          >
            {image.description && (
              <div className="w-full text-center text-neutral-400 mb-1 tracking-[0.1em] font-light">
                {image.description}
              </div>
            )}

            {dateStr && <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 opacity-50" /> {dateStr}</span>}
            {meta.cameraMake && <span className="flex items-center gap-1.5"><CameraIcon className="w-3 h-3 opacity-50" /> {meta.cameraMake} {meta.cameraModel}</span>}
            {meta.focalLength && <span className="flex items-center gap-1.5"><Settings2 className="w-3 h-3 opacity-50" /> {meta.focalLength}mm</span>}
            {meta.aperture && <span className="flex items-center gap-1.5"><Aperture className="w-3 h-3 opacity-50" /> f/{meta.aperture}</span>}
            {meta.exposureTime && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 opacity-50" /> {formatExposure(meta.exposureTime)}</span>}
            {meta.isoSpeed && <span className="flex items-center gap-1.5">ISO {meta.isoSpeed}</span>}
          </motion.div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
