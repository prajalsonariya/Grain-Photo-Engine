'use client';

import { ArrowDownUp } from 'lucide-react';

export default function SortBar({ sortOrder, setSortOrder }) {
  return (
    <button 
      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
      className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-white/10 rounded-sm text-neutral-400 hover:text-white hover:border-white/30 transition-colors group"
    >
      <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em]">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
      <ArrowDownUp className={`w-3.5 h-3.5 transition-transform duration-300 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
    </button>
  );
}
