'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FolderCard from '@/components/FolderCard';

export default function HomeClient({ folders, heroTitle = 'Albums', username }) {
  const [hoveredFolder, setHoveredFolder] = useState(null);

  return (
    <>
      <AnimatePresence>
        {hoveredFolder && hoveredFolder.thumbnailUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-0 pointer-events-none"
          >
            <img
              src={hoveredFolder.thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-32 pb-24 min-h-screen flex flex-col relative z-10">
        <div className="mb-16 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight leading-tight uppercase">
            {heroTitle}
          </h1>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {folders.map(folder => (
            <div
              key={folder.id}
              onMouseEnter={() => setHoveredFolder(folder)}
              onMouseLeave={() => setHoveredFolder(null)}
            >
              <FolderCard folder={folder} basePath={`/${username}/gallery`} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
