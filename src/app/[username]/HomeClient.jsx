'use client';

import { useEffect } from 'react';
import FolderCard from '@/components/FolderCard';
import { prefetchFolder } from '@/lib/folderGraphStore';

export default function HomeClient({ folders = [], heroTitle = 'Albums', username }) {
  // Idle prefetch the top collections
  useEffect(() => {
    if (!username || folders.length === 0) return;
    const timer = setTimeout(() => {
      folders.slice(0, 4).forEach(f => prefetchFolder(f.id, "gallery", username));
    }, 250);
    return () => clearTimeout(timer);
  }, [folders, username]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-32 pb-24 min-h-screen flex flex-col relative z-10">
      <div className="mb-12 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight uppercase">
          {heroTitle}
        </h1>
        <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] mt-2 font-mono">
          {folders.length} {folders.length === 1 ? 'Collection' : 'Collections'}
        </p>
      </div>

      {folders.length === 0 ? (
        <div className="py-28 text-center border border-white/5 rounded-lg bg-neutral-900/20">
          <p className="text-neutral-500 text-xs tracking-[0.25em] uppercase font-mono">No collections found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {folders.map(folder => (
            <FolderCard 
              key={folder.id} 
              folder={folder} 
              basePath={`/${username}/gallery`} 
              username={username}
            />
          ))}
        </div>
      )}
    </div>
  );
}
