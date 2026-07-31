'use client';

import { useState } from 'react';
import { Copy, Check, Folder, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createDriveFolder, deleteDriveFile } from '@/lib/driveClient';

function FolderRow({ folder, handleCopy, copiedId, basePath, username, handleDelete, publicFolderId, privateFolderId }) {
  return (
    <div className="flex items-center justify-between p-4 border border-white/10 bg-black/20 rounded-sm hover:bg-black/40 transition-colors group">
      <Link href={`/${username}/admin/folder/${folder.id}`} className="flex items-center gap-4 flex-1 cursor-pointer">
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
          <span className="text-white font-semibold tracking-wide hover:underline">{folder.name}</span>
          <span className="text-neutral-500 text-xs mt-1">
            Created: {folder.createdTime ? new Date(folder.createdTime).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        {folder.id !== publicFolderId && folder.id !== privateFolderId && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(folder.id);
            }}
            className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 transition-colors rounded-sm opacity-0 group-hover:opacity-100"
            title="Delete Folder"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleCopy(folder.id, basePath);
          }}
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
    </div>
  );
}

export default function AdminClient({ publicFolders, privateFolders, isLimitReached, limit, username, accessToken, publicFolderId, privateFolderId }) {
  const [copiedId, setCopiedId] = useState(null);
  const [creating, setCreating] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderTypeToCreate, setFolderTypeToCreate] = useState(null);
  
  const router = useRouter();

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

  const openCreateModal = (type) => {
    setFolderTypeToCreate(type);
    setNewFolderName('');
    setIsModalOpen(true);
  };

  const handleCreateFolderSubmit = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    setIsModalOpen(false);
    setCreating(true);
    
    try {
      const parentId = folderTypeToCreate === 'public' ? publicFolderId : privateFolderId;
      await createDriveFolder(accessToken, newFolderName.trim(), parentId);
      // Wait a moment for drive API to sync
      setTimeout(() => {
        router.refresh();
        setCreating(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to create folder');
      setCreating(false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm('Are you sure you want to delete this folder? All contents will be moved to your Google Drive Trash.')) return;
    
    setCreating(true); // Re-using this state for loading
    try {
      await deleteDriveFile(accessToken, folderId);
      setTimeout(() => {
        router.refresh();
        setCreating(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to delete folder');
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
          <h2 className="text-xl font-bold text-white tracking-wider uppercase">Public Folders</h2>
          <button 
            onClick={() => openCreateModal('public')}
            disabled={creating}
            className="text-xs uppercase tracking-wider font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : '+ New Folder'}
          </button>
        </div>
        
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
                basePath={`/${username}/gallery`}
                username={username}
                handleDelete={handleDeleteFolder}
                publicFolderId={publicFolderId}
                privateFolderId={privateFolderId}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
          <h2 className="text-xl font-bold text-white tracking-wider uppercase flex items-center">
            Private Folders
            {limit && (
              <span className="ml-3 text-sm font-medium text-neutral-500 normal-case tracking-normal">
                ({privateFolders.length}/{limit})
              </span>
            )}
          </h2>
          <button 
            onClick={() => openCreateModal('private')}
            disabled={creating || (isLimitReached && limit !== null)}
            className="text-xs uppercase tracking-wider font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : '+ New Folder'}
          </button>
        </div>
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
                basePath={`/${username}/share`}
                username={username}
                handleDelete={handleDeleteFolder}
                publicFolderId={publicFolderId}
                privateFolderId={privateFolderId}
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

      {/* Create Folder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-white/10 p-6 rounded-sm w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-4 uppercase tracking-wider">
              New {folderTypeToCreate} Folder
            </h3>
            <form onSubmit={handleCreateFolderSubmit}>
              <input
                type="text"
                autoFocus
                placeholder="Folder Name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white rounded-sm px-4 py-3 mb-6 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-600"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors text-sm uppercase tracking-wider font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-6 py-2 bg-white text-black hover:bg-neutral-200 transition-colors rounded-sm text-sm uppercase tracking-wider font-bold disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
