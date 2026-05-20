'use client';

import { ArrowDownUp } from 'lucide-react';

export default function SortBar({ sortOrder, setSortOrder }) {
  return (
    <button 
      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
      className="select-action flex items-center gap-2 px-6 py-2 border border-transparent rounded-sm text-white hover:opacity-90 transition-opacity group"
    >
      <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em]">{sortOrder === 'asc' ? 'Sort | Newest First' : 'Sort | Oldest First'}</span>
      <ArrowDownUp className={`w-3.5 h-3.5 transition-transform duration-300 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
    </button>
  );
}
