'use client';

import { useState, useCallback, useRef } from 'react';
import { UploadCloud, Trash2, Loader2, X, Image as ImageIcon, Video } from 'lucide-react';
import { uploadDriveFile, deleteDriveFile } from '@/lib/driveClient';

export default function FolderClient({ initialImages, folderId, accessToken, username }) {
  const [images, setImages] = useState(initialImages || []);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // { id, name, progress, status: 'uploading' | 'error' | 'done' }
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    files.forEach(file => {
      // Basic validation
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert(`${file.name} is not an image or video.`);
        return;
      }
      uploadFile(file);
    });
  };

  const uploadFile = async (file) => {
    const uploadId = Math.random().toString(36).substring(7);
    
    setUploads(prev => [...prev, { id: uploadId, name: file.name, progress: 0, status: 'uploading' }]);

    try {
      const result = await uploadDriveFile(accessToken, file, folderId, (progress) => {
        setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, progress } : u));
      });

      // Optimistically add the file to the grid
      const isVideo = file.type.startsWith('video/');
      const newImage = {
        id: result.id,
        name: result.name,
        // Since we don't immediately have a thumbnail from Drive until it processes, we can use an object URL temporarily
        tempUrl: URL.createObjectURL(file),
        isVideo
      };

      setImages(prev => [newImage, ...prev]);
      
      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'done', progress: 100 } : u));
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.id !== uploadId));
      }, 2000);
      
    } catch (error) {
      console.error(error);
      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error' } : u));
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm('Are you sure you want to delete this file? It will be moved to your Google Drive Trash.')) {
      return;
    }

    // Optimistically remove
    const originalImages = [...images];
    setImages(prev => prev.filter(img => img.id !== imageId));

    try {
      await deleteDriveFile(accessToken, imageId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete file.');
      setImages(originalImages); // Revert on failure
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-white/20 bg-black/20 hover:border-white/40 hover:bg-black/40'
        }`}
      >
        <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-amber-500' : 'text-neutral-400'}`} />
        <h3 className="text-white font-bold tracking-widest uppercase text-lg mb-2">Upload Media</h3>
        <p className="text-neutral-500 text-sm">Drag and drop images or videos here, or click to browse.</p>
        <p className="text-neutral-600 text-xs mt-2 font-mono">Uploads bypass limits and sync directly to Google Drive.</p>
        <input 
          type="file" 
          multiple 
          accept="image/*,video/*"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="bg-black/30 border border-white/10 p-4 rounded-sm space-y-3">
          <h4 className="text-xs uppercase tracking-widest font-bold text-neutral-400 border-b border-white/10 pb-2">Active Uploads</h4>
          {uploads.map(u => (
            <div key={u.id} className="flex items-center gap-4 text-sm">
              <span className="text-white flex-1 truncate">{u.name}</span>
              <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${u.status === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} 
                  style={{ width: `${u.progress}%` }}
                ></div>
              </div>
              <span className="text-xs font-mono w-12 text-right text-neutral-400">
                {u.status === 'error' ? 'Failed' : `${Math.round(u.progress)}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* File Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm uppercase tracking-widest font-bold text-neutral-400">Files in Folder ({images.length})</h2>
        </div>
        
        {images.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 border border-white/10 rounded-sm bg-black/20">
            This folder is empty. Drop some files above to get started.
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
            {images.map(img => (
              <div key={img.id} className="relative group rounded-sm overflow-hidden bg-neutral-900 aspect-square">
                {img.isVideo ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black/50 text-white">
                    <Video className="w-8 h-8 opacity-50 mb-2" />
                    <span className="text-xs font-mono truncate px-2 max-w-full">{img.name}</span>
                  </div>
                ) : (
                  <img 
                    src={img.tempUrl || img.cdnUrl} 
                    alt={img.name || 'Image'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                
                {/* Delete Button Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => handleDelete(img.id)}
                    className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transform scale-75 group-hover:scale-100 transition-all shadow-lg"
                    title="Delete permanently (Move to Trash)"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
