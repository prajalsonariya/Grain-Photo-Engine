import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata = {
  referrer: 'no-referrer',
  title: "Grain Photo Engine — Professional Cloud Photo Studio",
  description: "A premium photography portfolio and client delivery platform powered by Google Drive.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Grain Studio",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111111",
};

function Footer() {
  return (
    <footer className="w-full py-4 flex items-center justify-center border-t border-white/5 bg-[#0e0e0e] text-neutral-500">
      <span className="text-[10px] uppercase tracking-[0.25em] font-mono">
        Grain Photo Engine • Google Drive Studio
      </span>
    </footer>
  );
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased dark`}
    >
      <head>
        <meta name="referrer" content="no-referrer" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration notice:', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#111111] text-[#e5e5e5] selection:bg-white/20 selection:text-white">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
