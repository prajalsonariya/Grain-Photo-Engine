'use client';

import { Check } from 'lucide-react';

export default function MasonryGallery({ images, onImageClick, selectionMode, selectedIds, onToggleSelect }) {
  if (!images || images.length === 0) {
    return <div className="text-center text-neutral-500 py-32 tracking-[0.2em] text-[10px] sm:text-xs uppercase font-mono">No images found</div>;
  }

  const handleClick = (index, image) => {
    if (selectionMode) {
      onToggleSelect(image.id);
    } else {
      onImageClick(index);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 sm:gap-4 after:content-[''] after:flex-grow-[10]">
      {images.map((image, index) => {
        const width = image.imageMediaMetadata?.width || 300;
        const height = image.imageMediaMetadata?.height || 200;
        const aspectRatio = width / height;
        const isSelected = selectedIds?.has(image.id);

        return (
          <div
            key={image.id}
            className={`cursor-pointer group relative bg-neutral-900 overflow-hidden flex-grow-0 sm:flex-grow-[var(--ar)] w-[calc(100%/3-5.33px)] sm:w-[var(--w)] aspect-square sm:aspect-auto h-auto sm:h-[130px] md:h-[180px] transition-[transform,opacity] duration-200 ease-out active:scale-[0.98] ${
              isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''
            }`}
            style={{ 
              '--ar': aspectRatio, 
              '--w': `${aspectRatio * 150}px`, 
              maxWidth: '100%',
              contentVisibility: 'auto',
              containIntrinsicSize: '150px 150px'
            }}
            onClick={() => handleClick(index, image)}
          >
            {(image.cdnUrl || (image.type !== 'video' && image.url)) && (
              <img 
                src={image.cdnUrl || image.url}
                alt={image.description || image.name}
                referrerPolicy="no-referrer"
                loading={index < 8 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index < 8 ? "high" : "auto"}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ease-out ${
                  isSelected 
                    ? 'brightness-75' 
                    : 'group-hover:opacity-85'
                }`}
              />
            )}

            {/* Selection checkbox */}
            {selectionMode && (
              <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all duration-150 ${
                isSelected 
                  ? 'bg-white border-white' 
                  : 'border-white/50 bg-black/60 group-hover:border-white/80'
              }`}>
                {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
              </div>
            )}

            {/* Selected overlay badge */}
            {isSelected && (
              <div className="absolute top-2 right-2 z-10 bg-white text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-in zoom-in-50 duration-150">
                Selected
              </div>
            )}
            
            {(image.type === 'video' || image.type === 'embed') && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/70 rounded-full p-3 sm:p-4 border border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white translate-x-[2px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
