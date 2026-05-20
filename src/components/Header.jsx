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
      <path d="M12.016 0C8.348 0 5.629 1.157 4.254 3.092 3.195 4.582 2.894 6.755 2.894 9.068c0 1.25-.098 2.257-.306 2.66-.073.14-.15.201-.226.241-.482.261-1.36.195-2.02.106-.118-.016-.217.1-.159.204.303.541 1.054 1.488 2.378 2.115 1.171.554 2.459.73 3.473.864a2.91 2.91 0 011.666.697c.504.469.754 1.1.754 1.9 0 .428-.106.84-.306 1.23a4.266 4.266 0 01-.84 1.1c-.244.22-.501.416-.763.587-.696.452-1.338.872-1.338 1.467 0 .126.04.249.122.355.204.265.599.412 1.085.412.338 0 .721-.061 1.134-.18a9.424 9.424 0 001.998-1c.42-.294.88-.673 1.44-.673.564 0 1.025.379 1.444.673a9.423 9.423 0 002.003 1c.411.119.794.18 1.132.18.485 0 .88-.147 1.084-.412.082-.106.123-.229.123-.355 0-.595-.642-1.015-1.338-1.467a7.514 7.514 0 01-.763-.587 4.265 4.265 0 01-.84-1.1 2.766 2.766 0 01-.306-1.23c0-.8.25-1.431.754-1.9.432-.403.999-.64 1.666-.697 1.014-.134 2.302-.31 3.473-.864 1.324-.627 2.075-1.574 2.378-2.115.058-.104-.041-.22-.159-.204-.66.089-1.538.155-2.02-.106-.076-.04-.153-.101-.226-.241-.208-.403-.306-1.41-.306-2.66 0-2.313-.301-4.486-1.36-5.976C18.403 1.157 15.684 0 12.016 0z"/>
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
              <span className="hidden sm:inline">Get in Touch</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
