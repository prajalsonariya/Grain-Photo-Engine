'use client';

import Link from 'next/link';
import { prefetchFolder } from '@/lib/folderGraphStore';

export default function FolderCard({ folder, basePath = '/gallery', username = null, onNavigate = null }) {
  const handleClick = (e) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(folder.id, folder.name);
    }
  };

  const handlePrefetch = () => {
    if (username) {
      prefetchFolder(folder.id, 'gallery', username);
    }
  };

  return (
    <Link
      href={`${basePath}/${folder.id}`}
      onClick={handleClick}
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      className="group relative block overflow-hidden rounded-md bg-neutral-900 aspect-square sm:aspect-[4/3] border border-white/5 hover:border-white/25 transition-all duration-300 shadow-xl cursor-pointer"
    >
      {folder.thumbnailUrl && (
        <img 
          src={folder.thumbnailUrl}
          alt={folder.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      )}

      {/* Elegant high-contrast vignette (0 blur, pure hardware acceleration) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 group-hover:from-black/75 group-hover:via-black/15 group-hover:to-transparent transition-opacity duration-300" />

      {/* Folder metadata */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 z-10 pointer-events-none">
        <h3 className="text-white text-sm sm:text-base md:text-lg font-bold tracking-[0.12em] uppercase transition-transform duration-300 drop-shadow-md group-hover:translate-x-1">
          {folder.name}
        </h3>
        <span className="text-[10px] text-white/50 tracking-[0.2em] uppercase font-mono mt-1 group-hover:text-white/90 transition-colors">
          View Album →
        </span>
      </div>
    </Link>
  );
}
