export default function GalleryLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans">
      {/* Mock Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1e1e1e]/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-center">
        <div className="w-24 h-4 bg-white/10 rounded animate-pulse"></div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-32 pb-24 min-h-screen">
        <div className="mb-8 flex flex-col items-start gap-4">
          <div className="w-24 h-3 bg-white/10 rounded animate-pulse"></div>
          <div className="w-64 h-10 bg-white/5 rounded animate-pulse"></div>
        </div>
        
        {/* Skeleton Masonry Grid Layout */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div 
              key={i} 
              className="w-full bg-white/5 rounded-sm animate-pulse"
              style={{ height: `${Math.floor(Math.random() * 200) + 200}px` }}
            ></div>
          ))}
        </div>
      </div>
    </main>
  );
}
