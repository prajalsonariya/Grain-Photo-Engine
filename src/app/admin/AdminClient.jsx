'use client';

import { useState } from 'react';
import { Copy, Check, Folder } from 'lucide-react';

function FolderRow({ folder, handleCopy, copiedId, basePath }) {
  return (
    <div className="flex items-center justify-between p-4 glass-panel hover:bg-[rgba(26,26,29,0.3)] transition-colors">
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
        className="flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[36px] px-4 bg-white text-black hover:bg-neutral-200 transition-colors rounded-[4px] text-xs uppercase tracking-wider font-semibold"
      >
        {copiedId === folder.id ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy Link
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
          <div className="p-8 glass-panel text-center text-neutral-500">
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
          <div className="p-8 glass-panel text-center text-neutral-500">
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
              <div className="mt-4 p-4 glass-panel !border-yellow-500/30 text-center">
                <p className="text-yellow-500/90 text-[10px] sm:text-xs uppercase tracking-[0.15em] font-medium">
                  Gallery limit reached for Freelancer tier. Upgrade to Agency for unlimited active client galleries.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
