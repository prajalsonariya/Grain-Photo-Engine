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

function PhoneIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
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
    <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M510.846 392.673c-5.211 12.157-27.239 21.089-67.36 27.318-2.064 2.786-3.775 14.686-6.507 23.956-1.625 5.566-5.623 8.869-12.128 8.869l-.297-.005c-9.395 0-19.203-4.323-38.852-4.323-26.521 0-35.662 6.043-56.254 20.588-21.832 15.438-42.771 28.764-74.027 27.399-31.646 2.334-58.025-16.908-72.871-27.404-20.714-14.643-29.828-20.582-56.241-20.582-18.864 0-30.736 4.72-38.852 4.72-8.073 0-11.213-4.922-12.422-9.04-2.703-9.189-4.404-21.263-6.523-24.13-20.679-3.209-67.31-11.344-68.498-32.15a10.627 10.627 0 0 1 8.877-11.069c69.583-11.455 100.924-82.901 102.227-85.934.074-.176.155-.344.237-.515 3.713-7.537 4.544-13.849 2.463-18.753-5.05-11.896-26.872-16.164-36.053-19.796-23.715-9.366-27.015-20.128-25.612-27.504 2.437-12.836 21.725-20.735 33.002-15.453 8.919 4.181 16.843 6.297 23.547 6.297 5.022 0 8.212-1.204 9.96-2.171-2.043-35.936-7.101-87.29 5.687-115.969C158.122 21.304 229.705 15.42 250.826 15.42c.944 0 9.141-.089 10.11-.089 52.148 0 102.254 26.78 126.723 81.643 12.777 28.65 7.749 79.792 5.695 116.009 1.582.872 4.357 1.942 8.599 2.139 6.397-.286 13.815-2.389 22.069-6.257 6.085-2.846 14.406-2.461 20.48.058l.029.01c9.476 3.385 15.439 10.215 15.589 17.87.184 9.747-8.522 18.165-25.878 25.018-2.118.835-4.694 1.655-7.434 2.525-9.797 3.106-24.6 7.805-28.616 17.271-2.079 4.904-1.256 11.211 2.46 18.748.087.168.166.342.239.515 1.301 3.03 32.615 74.46 102.23 85.934 6.427 1.058 11.163 7.877 7.725 15.859z"/>
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

export default async function Header({ config = null, isAgency = false, homeUrl = '/' }) {
  if (!config) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1e1e1e]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-center">
          <Link href={homeUrl} className="text-sm tracking-[0.3em] font-light uppercase text-white hover:text-neutral-300 transition-colors">
            Loading...
          </Link>
        </div>
      </header>
    );
  }

  // ── Logo text resolution ──────────────────────────────────────────────────
  let displayName;
  if (isAgency && config.businessName) {
    displayName = config.businessName;
  } else {
    displayName = config.name || 'Studio';
  }

  // ── Contact CTA URL ──────────────────────────────────────────────────────
  let contactUrl = null;
  let contactType = null;
  
  if (config.whatsapp) {
    contactUrl = `https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=Hi!%20I%20saw%20your%20work%20on%20your%20gallery%20hub%20and%20wanted%20to%20inquire%20about%20booking%20a%20session.`;
    contactType = 'whatsapp';
  } else if (config.phone) {
    contactUrl = `tel:${config.phone.replace(/\D/g, '')}`;
    contactType = 'phone';
  }

  // ── Socials (agency-only) ─────────────────────────────────────────────────
  const socials = isAgency ? {
    instagram: config.instagram,
    facebook: config.facebook,
    snapchat: config.snapchat,
    portfolio: config.portfolio
  } : {};

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1e1e1e]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">

        {/* ── Left spacer ── */}
        <div className="flex-1" />

        {/* ── Center logo ── */}
        <Link
          href={homeUrl}
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

          {/* Contact glassmorphic action dock */}
          {contactUrl && (
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="header-contact-cta"
              className="flex items-center gap-2 px-4 py-2 rounded-full
                         bg-white/8 backdrop-blur-md border border-white/15
                         text-white hover:bg-white/15 hover:border-white/30
                         transition-all duration-200 shadow-lg
                         text-[10px] uppercase tracking-[0.15em] font-medium
                         group"
            >
              {contactType === 'whatsapp' ? (
                <WhatsAppIcon className="w-3.5 h-3.5 text-green-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <PhoneIcon className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
              )}
              <span className="hidden sm:inline">Let's connect</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
