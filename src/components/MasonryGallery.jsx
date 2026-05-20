'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export default function MasonryGallery({ images, onImageClick, selectionMode, selectedIds, onToggleSelect }) {
  if (!images || images.length === 0) {
    return <div className="text-center text-neutral-500 py-32 tracking-[0.2em] text-[10px] sm:text-xs uppercase">No images found</div>;
  }

  const handleClick = (index, image) => {
    if (selectionMode) {
      onToggleSelect(image.id);
    } else {
      onImageClick(index);
    }
  };

  return (
    <motion.div layout className="flex flex-wrap gap-2 sm:gap-4 after:content-[''] after:flex-grow-[10]">
      <AnimatePresence>
        {images.map((image, index) => {
          const width = image.imageMediaMetadata?.width || 300;
          const height = image.imageMediaMetadata?.height || 200;
          const aspectRatio = width / height;
          const isSelected = selectedIds?.has(image.id);

          return (
            <motion.div
              layout
              key={image.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`cursor-pointer group relative bg-neutral-900 overflow-hidden flex-grow h-[100px] sm:h-[130px] md:h-[180px] ${
                isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''
              }`}
              style={{ flexGrow: aspectRatio, width: `${aspectRatio * 150}px`, maxWidth: '100%' }}
              onClick={() => handleClick(index, image)}
            >
              <img 
                 src={image.cdnUrl || image.url}
                 alt={image.description || image.name}
                 loading={index < 6 ? "eager" : "lazy"}
                 decoding="async"
                 fetchPriority={index < 6 ? "high" : "auto"}
                 className={`absolute inset-0 w-full h-full object-cover transition-all duration-200 ease-out ${
                   isSelected 
                     ? 'brightness-75' 
                     : 'group-hover:opacity-75'
                 }`}
               />

              {/* Selection checkbox */}
              {selectionMode && (
                <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all duration-150 ${
                  isSelected 
                    ? 'bg-white border-white' 
                    : 'border-white/50 bg-black/30 backdrop-blur-sm group-hover:border-white/80'
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                </div>
              )}

              {/* Selected overlay badge */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 z-10 bg-white text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                >
                  Selected
                </motion.div>
              )}
              
              {image.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 sm:p-4 border border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white translate-x-[2px]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
