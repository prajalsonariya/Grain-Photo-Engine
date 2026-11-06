"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, checkUsernameAvailability } from "./actions";
import { Check, Loader2, ArrowRight, Sparkles, FolderLock } from "lucide-react";

export default function OnboardingClient({ user }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState(user?.username || "");
  const [businessName, setBusinessName] = useState(user?.businessName || user?.name || "");
  const [heroTitle, setHeroTitle] = useState(user?.heroTitle || "Selected Works");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || "");
  
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState(null); // { available, clean, error }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUsernameChange = async (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(clean);
    if (clean.length >= 3) {
      setCheckingSlug(true);
      const res = await checkUsernameAvailability(clean);
      setSlugStatus(res);
      setCheckingSlug(false);
    } else {
      setSlugStatus(null);
    }
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (slugStatus?.available) {
      setStep(2);
    }
  };

  const handleProvisionDrive = async () => {
    setLoading(true);
    setError(null);

    const res = await completeOnboarding({
      username,
      businessName,
      heroTitle,
      whatsapp,
    });

    if (res.success) {
      setStep(3);
      setTimeout(() => {
        router.push("/studio");
      }, 1500);
    } else {
      setError(res.error || "Failed to initialize Google Drive.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#e5e5e5] font-sans flex flex-col items-center justify-center p-6 selection:bg-white/20 selection:text-white">
      <div className="w-full max-w-lg">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 text-xs font-mono tracking-widest uppercase text-neutral-500">
          <span className={step >= 1 ? "text-white" : ""}>01 Brand & Handle</span>
          <span>→</span>
          <span className={step >= 2 ? "text-white" : ""}>02 Cloud Drive</span>
          <span>→</span>
          <span className={step >= 3 ? "text-white" : ""}>03 Launch</span>
        </div>

        {step === 1 && (
          <div className="studio-card p-8 border border-white/10 bg-[#161616] rounded-xl shadow-2xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Setup Studio Handle</h2>
              <p className="text-xs text-neutral-400 mt-1">This will be your permanent portfolio link.</p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 font-mono mb-2">
                  Portfolio URL
                </label>
                <div className="flex bg-[#0e0e0e] border border-white/15 rounded-lg overflow-hidden focus-within:border-white transition-colors">
                  <span className="px-3.5 py-3 text-xs font-mono text-neutral-500 select-none bg-black/40 border-r border-white/10 flex items-center">
                    grainphoto.com/
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="studio-name"
                    className="flex-1 bg-transparent px-3.5 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none font-mono"
                  />
                  <div className="px-3 flex items-center">
                    {checkingSlug ? (
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                    ) : slugStatus?.available ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : null}
                  </div>
                </div>
                {slugStatus?.error && (
                  <p className="text-[11px] text-red-400 mt-1.5 font-mono">{slugStatus.error}</p>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 font-mono mb-2">
                  Studio / Photographer Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Zara Visuals"
                  className="w-full bg-[#0e0e0e] border border-white/15 rounded-lg px-3.5 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 font-mono mb-2">
                  Homepage Title
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="e.g. Selected Works"
                  className="w-full bg-[#0e0e0e] border border-white/15 rounded-lg px-3.5 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 font-mono mb-2">
                  WhatsApp Number (Optional - for client booking)
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="e.g. 919876543210 (with country code)"
                  className="w-full bg-[#0e0e0e] border border-white/15 rounded-lg px-3.5 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={!slugStatus?.available}
                className="w-full mt-2 py-3.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue to Drive Setup <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="studio-card p-8 border border-white/10 bg-[#161616] rounded-xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <FolderLock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">Initialize Google Drive</h2>
                <p className="text-xs text-neutral-400">Your Google Drive will be your personal cloud storage.</p>
              </div>
            </div>

            <div className="p-4 bg-[#0e0e0e] border border-white/10 rounded-lg text-xs space-y-2 text-neutral-400">
              <p className="font-semibold text-white">We will automatically create these folders in your Drive:</p>
              <div className="font-mono text-[11px] space-y-1 pl-2 border-l border-white/20 text-neutral-300">
                <div>📁 Grain Photo Engine</div>
                <div className="pl-4">├── 📁 01. Public Portfolio</div>
                <div className="pl-4">└── 📁 02. Private Client Albums</div>
              </div>
              <p className="text-[10px] text-neutral-500 pt-2 border-t border-white/5">
                You never have to open drive.google.com directly. Grain Studio handles all uploads, deletes, and albums automatically.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleProvisionDrive}
              disabled={loading}
              className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Drive Workspace...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Initialize My Cloud Studio
                </>
              )}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="studio-card p-12 border border-white/10 bg-[#161616] rounded-xl shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Studio Ready!</h2>
            <p className="text-xs text-neutral-400">
              Your Google Drive workspace is configured. Redirecting to Grain Studio...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
