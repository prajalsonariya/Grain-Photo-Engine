import Link from 'next/link';
import { getConfig } from '@/lib/drive';

// Inline WhatsApp SVG — avoids any client-side icon library dependency
function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TwitterXIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.635 5.902-5.635Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function SnapchatIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.166 1.293c3.942 0 6.37 2.538 6.37 6.37 0 .403-.012.806-.036 1.197.163.077.32.116.473.116.28 0 .576-.12.886-.357a.372.372 0 01.232-.073c.18 0 .376.098.376.27 0 .456-.728.868-1.553 1.068-.03.455-.076.907-.137 1.345.498.176.998.378 1.498.605 2.016.913 3.023 1.935 3.023 3.038 0 .617-.36 1.148-.994 1.48-.357.187-.673.28-.943.28-.42 0-.745-.187-.965-.556-.28-.478-.625-.715-1.04-.715-.178 0-.367.04-.564.12-.63.247-1.207.37-1.73.37-.4 0-.78-.056-1.138-.168-.466 1.09-1.32 1.905-2.529 2.4-.397.16-.82.241-1.255.241s-.858-.08-1.255-.241c-1.208-.495-2.063-1.31-2.529-2.4-.358.112-.738.168-1.138.168-.524 0-1.1-.123-1.73-.37-.197-.08-.386-.12-.564-.12-.415 0-.76.237-1.04.715-.22.369-.545.556-.965.556-.27 0-.586-.093-.943-.28C1.36 15.763 1 15.232 1 14.615c0-1.103 1.007-2.125 3.023-3.038.5-.227 1-.429 1.498-.605a14.263 14.263 0 01-.137-1.345c-.825-.2-1.553-.612-1.553-1.068 0-.172.196-.27.376-.27.073 0 .159.025.232.073.31.237.606.357.886.357.153 0 .31-.039.473-.116a23.9 23.9 0 01-.036-1.197C5.762 3.83 8.19 1.293 12.166 1.293Z" />
    </svg>
  );
}

function PortfolioIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default async function Header() {
  const config = await getConfig();
  const isAgency = process.env.NEXT_PUBLIC_CLIENT_PLAN === 'agency';

  // ── Logo text resolution ──────────────────────────────────────────────────
  let displayName;
  if (isAgency && config.businessName) {
    displayName = config.businessName;
  } else if (isAgency) {
    displayName = config.photographers.join(' x ');
  } else {
    // freelancer: strictly first element only
    displayName = config.photographers[0] || 'Studio';
  }

  // ── WhatsApp CTA URL ──────────────────────────────────────────────────────
  const waUrl = config.whatsapp
    ? `https://wa.me/${config.whatsapp}?text=Hi!%20I%20saw%20your%20work%20on%20your%20gallery%20hub%20and%20wanted%20to%20inquire%20about%20booking%20a%20session.`
    : null;

  // ── Socials (agency-only) ─────────────────────────────────────────────────
  const socials = isAgency ? (config.socials || {}) : {};

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1e1e1e]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">

        {/* ── Left spacer ── */}
        <div className="flex-1" />

        {/* ── Center logo ── */}
        <Link
          href="/"
          className="flex items-center justify-center group absolute left-1/2 -translate-x-1/2"
        >
          {isAgency && config.logoUrl ? (
            <img 
              src={config.logoUrl} 
              alt={displayName} 
              className="h-8 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-sm tracking-[0.3em] font-light uppercase text-white hover:text-neutral-300 transition-colors whitespace-nowrap">
              {displayName}
            </span>
          )}
        </Link>

        {/* ── Right: social icons + WhatsApp action dock ── */}
        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">

          {/* Social icons — agency plan only */}
          {socials.instagram && (
            <a
              href={socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-neutral-500 hover:text-white transition-colors duration-200 hidden sm:flex"
            >
              <InstagramIcon className="w-[15px] h-[15px]" />
            </a>
          )}

          {socials.twitter && (
            <a
              href={socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              className="text-neutral-500 hover:text-white transition-colors duration-200 hidden sm:flex"
            >
              <TwitterXIcon className="w-[15px] h-[15px]" />
            </a>
          )}

          {socials.facebook && (
            <a
              href={socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-neutral-500 hover:text-white transition-colors duration-200 hidden sm:flex"
            >
              <FacebookIcon className="w-[15px] h-[15px]" />
            </a>
          )}

          {socials.snapchat && (
            <a
              href={socials.snapchat}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Snapchat"
              className="text-neutral-500 hover:text-white transition-colors duration-200 hidden sm:flex"
            >
              <SnapchatIcon className="w-[15px] h-[15px]" />
            </a>
          )}

          {socials.portfolio && (
            <a
              href={socials.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Portfolio website"
              className="text-neutral-500 hover:text-white transition-colors duration-200 hidden sm:flex"
            >
              <PortfolioIcon className="w-[15px] h-[15px]" />
            </a>
          )}

          {/* WhatsApp glassmorphic action dock */}
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="header-whatsapp-cta"
              className="flex items-center gap-2 px-4 py-2 rounded-full
                         bg-white/8 backdrop-blur-md border border-white/15
                         text-white hover:bg-white/15 hover:border-white/30
                         transition-all duration-200 shadow-lg
                         text-[10px] uppercase tracking-[0.15em] font-medium
                         group"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-green-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden sm:inline">Book a Session</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
