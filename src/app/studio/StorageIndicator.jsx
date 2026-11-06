"use client";

import { useEffect, useState } from "react";
import { HardDrive, Cloud, AlertCircle } from "lucide-react";

export default function StorageIndicator() {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/studio/quota")
      .then(res => res.json())
      .then(data => {
        if (active && data.success) {
          setQuota(data.data);
        }
      })
      .catch(err => console.warn("Quota fetch notice:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading || !quota) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-[11px] text-neutral-500 font-mono">
        <Cloud className="w-3.5 h-3.5 animate-pulse" />
        <span>Drive Storage: syncing...</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-[#161616] text-[11px] text-neutral-300 font-mono shadow-sm">
      <HardDrive className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
      <span className="whitespace-nowrap">
        {quota.usageFormatted} / {quota.limitFormatted}
      </span>
      {quota.percentUsed !== null && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
          quota.percentUsed > 90 ? "bg-red-500/20 text-red-400" : "bg-white/10 text-neutral-300"
        }`}>
          {quota.percentUsed}%
        </span>
      )}

      {/* Monochrome single-line bar at the bottom inside the pill */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
        <div 
          className="h-full bg-white transition-all duration-700 ease-out"
          style={{ width: `${Math.min(Math.max(quota.percentUsed || 0, 1), 100)}%` }}
        />
      </div>
    </div>
  );
}
