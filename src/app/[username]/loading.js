export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-[#1e1e1e] text-neutral-200 font-sans relative overflow-hidden">
      {/* Mock Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1e1e1e]/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-center">
        <div className="w-24 h-4 bg-white/10 rounded animate-pulse"></div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-24 min-h-screen flex flex-col justify-center">
        <div className="text-center mb-16 sm:mb-24 mt-8 sm:mt-12 animate-pulse">
          <div className="h-16 sm:h-24 md:h-32 bg-white/5 w-3/4 max-w-2xl mx-auto rounded-lg mb-4"></div>
          <div className="h-4 bg-white/5 w-1/3 mx-auto rounded"></div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="group cursor-wait">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-white/5 animate-pulse">
                {/* Image placeholder */}
              </div>
              <div className="mt-4 flex flex-col items-center">
                <div className="h-4 bg-white/10 w-1/2 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-white/5 w-1/4 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
