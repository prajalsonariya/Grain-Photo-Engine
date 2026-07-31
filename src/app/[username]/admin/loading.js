export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="w-32 h-6 bg-white/10 rounded"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-full h-16 bg-white/5 rounded flex items-center px-4 justify-between">
            <div className="w-48 h-4 bg-white/10 rounded"></div>
            <div className="w-24 h-8 bg-white/10 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
