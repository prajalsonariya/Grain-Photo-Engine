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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3 sm:py-4 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50"
        >
          <span className="text-white text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap">
            <span className="text-white font-semibold">{selectedCount}</span>
            <span className="text-neutral-400 ml-1">selected</span>
          </span>

          <div className="w-px h-5 bg-white/10" />

          <button
            onClick={onSelectAll}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-[10px] sm:text-xs uppercase tracking-[0.15em] transition-colors whitespace-nowrap"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
          </button>

          <div className="w-px h-5 bg-white/10" />

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-white hover:bg-neutral-200 disabled:bg-neutral-600 text-black disabled:text-neutral-400 text-[10px] sm:text-xs uppercase tracking-[0.15em] font-medium rounded-full transition-colors whitespace-nowrap"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Preparing...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Download ZIP
              </>
            )}
          </button>

          <button
            onClick={onClear}
            className="text-neutral-500 hover:text-white transition-colors p-1"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
