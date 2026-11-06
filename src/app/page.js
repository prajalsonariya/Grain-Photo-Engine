import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCachedUserById } from "@/lib/userCache";
import { redirect } from "next/navigation";
import SignInButton from "@/components/SignInButton";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const user = await getCachedUserById(session.user.id);

    if (user?.username && user?.publicFolderId && user?.privateFolderId) {
      redirect("/studio");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#e5e5e5] font-sans flex flex-col items-center justify-center p-6 sm:p-12 selection:bg-white/20 selection:text-white relative overflow-hidden">
      {/* Subtle background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full pointer-events-none blur-3xl" />

      <div className="max-w-2xl text-center space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] tracking-[0.25em] uppercase font-mono text-white/70">
          Professional Cloud Photo Studio
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight uppercase leading-none">
          Grain Photo Engine
        </h1>

        <p className="text-base sm:text-lg text-neutral-400 font-light leading-relaxed max-w-xl mx-auto">
          The high-speed, zero-compression portfolio and client delivery platform powered entirely by your own Google Drive.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignInButton />
        </div>

        <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">100%</div>
            <div className="text-[10px] tracking-widest text-neutral-500 uppercase mt-1">Your Google Drive</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">0 GB</div>
            <div className="text-[10px] tracking-widest text-neutral-500 uppercase mt-1">Platform Limits</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">4K/RAW</div>
            <div className="text-[10px] tracking-widest text-neutral-500 uppercase mt-1">Full Fidelity</div>
          </div>
        </div>
      </div>
    </div>
  );
}
