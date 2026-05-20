import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Professional Photography Gallery",
  description: "A premium multi-operator photography gallery platform.",
};

function Footer() {
  return (
    <footer className="w-full py-4 flex items-center justify-center border-t border-white/5 bg-[#1a1a1a]">
      <a
        href="https://www.instagram.com/prajal_sonariya/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-neutral-600 hover:text-neutral-400 transition-colors text-[9px] uppercase tracking-[0.25em] font-light"
      >
        Powered by Prajal Sonariya
      </a>
    </footer>
  );
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-primary-bg">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
