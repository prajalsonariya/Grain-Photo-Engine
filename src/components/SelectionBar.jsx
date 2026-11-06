'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckSquare } from 'lucide-react';
import { useState } from 'react';

export default function SelectionBar({ selectedCount, onDownload, onClear, onSelectAll, totalCount }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-[max(16px,env(safe-area-inset-bottom,16px))] left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-2 sm:gap-4 px-3.5 sm:px-6 py-2.5 sm:py-3.5 bg-[#181818] border border-white/20 rounded-full shadow-2xl shadow-black/90 w-[calc(100%-24px)] max-w-md"
        >
          <span className="text-white text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap pl-1">
            <span className="text-white font-bold">{selectedCount}</span>
            <span className="text-neutral-400 ml-1 hidden xs:inline sm:inline">selected</span>
          </span>

          <div className="w-px h-4 bg-white/10" />

          <button
            onClick={onSelectAll}
            className="flex items-center gap-1 text-neutral-400 hover:text-white text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-colors whitespace-nowrap active:scale-95"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{selectedCount === totalCount ? 'None' : 'All'}</span>
          </button>

          <div className="w-px h-4 bg-white/10" />

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2 bg-white hover:bg-neutral-200 disabled:bg-neutral-700 text-black disabled:text-neutral-400 text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.15em] font-bold rounded-full transition-colors whitespace-nowrap active:scale-95"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="hidden sm:inline">Preparing...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>ZIP</span>
              </>
            )}
          </button>

          <button
            onClick={onClear}
            className="text-neutral-400 hover:text-white transition-colors p-1.5 active:scale-90"
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
