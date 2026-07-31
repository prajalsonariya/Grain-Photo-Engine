export default function Loading() {
  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 opacity-50 animate-pulse">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <div className="text-white text-xs tracking-[0.3em] uppercase font-light">Loading Engine...</div>
      </div>
    </div>
  );
}
