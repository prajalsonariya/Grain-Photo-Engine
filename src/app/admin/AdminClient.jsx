'use client';

import { useState } from 'react';
import { Copy, Check, Folder } from 'lucide-react';

function FolderRow({ folder, handleCopy, copiedId, basePath }) {
  return (
    <div className="flex items-center justify-between p-4 border border-white/10 bg-black/20 rounded-sm hover:bg-black/40 transition-colors">
      <div className="flex items-center gap-4">
        {folder.thumbnailUrl ? (
          <img 
            src={folder.thumbnailUrl} 
            alt={folder.name} 
            className="w-12 h-12 object-cover rounded-sm border border-white/10"
          />
        ) : (
          <div className="p-3 bg-white/5 rounded-full">
            <Folder className="w-5 h-5 text-neutral-300" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-white font-semibold tracking-wide">{folder.name}</span>
          <span className="text-neutral-500 text-xs mt-1">
            Created: {folder.createdTime ? new Date(folder.createdTime).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
      <button 
        onClick={() => handleCopy(folder.id, basePath)}
        className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-neutral-200 transition-colors rounded-sm text-xs uppercase tracking-wider font-semibold"
      >
        {copiedId === folder.id ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Share Link
          </>
        )}
      </button>
    </div>
  );
}

export default function AdminClient({ publicFolders, privateFolders, isLimitReached, limit }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = async (folderId, basePath) => {
    const url = `${window.location.origin}${basePath}/${folderId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(folderId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      alert('Failed to copy link.');
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-xl font-bold text-white mb-4 tracking-wider uppercase border-b border-white/10 pb-2">Public Folders</h2>
        {publicFolders.length === 0 ? (
          <div className="p-8 border border-white/10 rounded-sm bg-neutral-900/30 text-center text-neutral-500">
            No public folders found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {publicFolders.map(folder => (
              <FolderRow 
                key={`pub-${folder.id}`} 
                folder={folder} 
                handleCopy={handleCopy} 
                copiedId={copiedId} 
                basePath="/gallery"
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4 tracking-wider uppercase border-b border-white/10 pb-2 flex items-center">
          Private Folders
          {limit && (
            <span className="ml-3 text-sm font-medium text-neutral-500 normal-case tracking-normal">
              ({privateFolders.length}/{limit})
            </span>
          )}
        </h2>
        {privateFolders.length === 0 ? (
          <div className="p-8 border border-white/10 rounded-sm bg-neutral-900/30 text-center text-neutral-500">
            No private folders found. Ensure your private root ID is correct.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {privateFolders.map(folder => (
              <FolderRow 
                key={`priv-${folder.id}`} 
                folder={folder} 
                handleCopy={handleCopy} 
                copiedId={copiedId} 
                basePath="/share"
              />
            ))}
            
            {isLimitReached && (
              <div className="mt-4 p-4 border border-yellow-500/30 bg-yellow-500/5 rounded-sm text-center">
                <h3 className="text-yellow-500/90 text-sm font-bold uppercase tracking-wider mb-2">
                  Studio Volume Limit Reached.
                </h3>
                <p className="text-yellow-500/80 text-[10px] sm:text-xs uppercase tracking-[0.15em] font-medium">
                  Freelancer tier is active ({privateFolders.length}/{limit} private folders).<br/>
                  Uncap volume with the upgraded Studio Plan.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
