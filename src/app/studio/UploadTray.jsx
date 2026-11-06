"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, CheckCircle2, AlertCircle, Loader2, X, UploadCloud } from "lucide-react";

export default function UploadTray({ uploads = [], onClearDone }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!uploads || uploads.length === 0) return null;

  const total = uploads.length;
  const completed = uploads.filter(u => u.status === "done").length;
  const failed = uploads.filter(u => u.status === "error").length;
  const inProgress = uploads.filter(u => u.status === "uploading").length;

  const overallPercent = Math.round(
    uploads.reduce((acc, curr) => acc + (curr.progress || 0), 0) / total
  );

  const isAllFinished = inProgress === 0;

  return (
    <aside
      aria-label="Upload Progress"
      className="fixed bottom-0 sm:bottom-6 left-0 right-0 sm:left-auto sm:right-6 z-50 w-full sm:w-96 studio-card bg-[#161616] border-t sm:border border-white/15 rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden font-sans text-xs pb-[max(0px,env(safe-area-inset-bottom,0px))]"
    >
      {/* Header bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-center justify-between cursor-pointer bg-[#1c1c1c] border-b border-white/10 hover:bg-[#222222] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {inProgress > 0 ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : failed > 0 ? (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="font-bold uppercase tracking-wider text-white">
            {inProgress > 0 
              ? `Uploading ${completed + 1}/${total}` 
              : `Uploads Complete (${completed}/${total})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-neutral-400 font-semibold">{overallPercent}%</span>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronUp className="w-4 h-4 text-neutral-400" />}
          {isAllFinished && onClearDone && (
            <button 
              onClick={(e) => { e.stopPropagation(); onClearDone(); }}
              className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#0e0e0e] h-1.5 overflow-hidden">
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${overallPercent}%` }}
        />
      </div>

      {/* Expanded File List */}
      {isExpanded && (
        <div className="max-h-60 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-[#141414]">
          {uploads.map(file => (
            <div key={file.id} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="truncate flex-1 text-neutral-300 font-mono">{file.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 font-mono">{Math.round(file.progress || 0)}%</span>
                {file.status === "uploading" && <Loader2 className="w-3 h-3 animate-spin text-white" />}
                {file.status === "done" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {file.status === "error" && <AlertCircle className="w-3 h-3 text-red-400" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
