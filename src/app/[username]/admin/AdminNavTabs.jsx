'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNavTabs({ username, isSuperAdmin }) {
  const pathname = usePathname();
  
  const isProfile = pathname.endsWith('/profile');
  const isGallery = !isProfile;

  return (
    <nav className="flex space-x-8 mt-10 border-b border-white/10">
      <Link 
        href={`/${username}/admin`}
        className={`pb-3 text-sm uppercase tracking-wider font-semibold transition-colors border-b-2 ${
          isGallery 
            ? "text-white border-white" 
            : "text-neutral-500 hover:text-white border-transparent"
        }`}
      >
        Gallery
      </Link>
      <Link 
        href={`/${username}/admin/profile`}
        className={`pb-3 text-sm uppercase tracking-wider font-semibold transition-colors border-b-2 ${
          isProfile 
            ? "text-white border-white" 
            : "text-neutral-500 hover:text-white border-transparent"
        }`}
      >
        Profile
      </Link>
      
      {isSuperAdmin && (
        <Link 
          href="/superadmin"
          className="pb-3 text-sm uppercase tracking-wider font-bold text-amber-500 hover:text-amber-400 transition-colors border-b-2 border-transparent"
        >
          Super Admin
        </Link>
      )}
    </nav>
  );
}
