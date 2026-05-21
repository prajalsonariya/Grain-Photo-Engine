'use client';

import Link from 'next/link';

export default function FolderCard({ folder, basePath = '/gallery' }) {
  return (
    <Link href={`${basePath}/${folder.id}`} className="group relative block overflow-hidden rounded-sm bg-[#1e1e1e] aspect-square sm:aspect-[4/3]">
      {folder.thumbnailUrl && (
        <img 
          src={folder.thumbnailUrl}
          alt={folder.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] group-hover:blur-sm"
        />
      )}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[4px] group-hover:bg-black/10 group-hover:backdrop-blur-0 transition-all duration-300" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <h3 className="text-white text-base sm:text-lg font-semibold tracking-[0.1em] sm:tracking-[0.2em] opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 drop-shadow-xl text-center px-4">
          {folder.name}
        </h3>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-950/80 to-transparent pointer-events-none" />
    </Link>
  );
}
