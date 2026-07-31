'use client';

import { useState } from 'react';
import { updateProfile } from './actions';
import { Save, Check } from 'lucide-react';

export default function ProfileClient({ initialData, username }) {
  const [formData, setFormData] = useState({
    heroTitle: initialData.heroTitle || '',
    businessName: initialData.businessName || '',
    logoUrl: initialData.logoUrl || '',
    phone: initialData.phone || '',
    whatsapp: initialData.whatsapp || '',
    instagram: initialData.instagram || '',
    facebook: initialData.facebook || '',
    snapchat: initialData.snapchat || '',
    portfolio: initialData.portfolio || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isAgency = initialData.plan === 'agency';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(initialData.id, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12 max-w-2xl">
      <section>
        <h2 className="text-xl font-bold text-white mb-6 tracking-wider uppercase border-b border-white/10 pb-2">
          General Settings
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2">
              Public Gallery Title
            </label>
            <input 
              type="text" 
              name="heroTitle"
              value={formData.heroTitle}
              onChange={handleChange}
              placeholder="e.g. Albums or Collections"
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-white/30 outline-none transition-colors"
            />
            <p className="text-xs text-neutral-500 mt-2">The large text shown at the top of your public gallery.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2">
              Business Name <span className={!isAgency ? "text-amber-500/50" : ""}>{!isAgency && "(Agency Plan Only)"}</span>
            </label>
            <input 
              type="text" 
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              disabled={!isAgency}
              placeholder={isAgency ? "Your Studio Name" : "Upgrade to Agency to unlock"}
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-white/30 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2">
              Logo Image URL <span className={!isAgency ? "text-amber-500/50" : ""}>{!isAgency && "(Agency Plan Only)"}</span>
            </label>
            <input 
              type="text" 
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              disabled={!isAgency}
              placeholder={isAgency ? "https://..." : "Upgrade to Agency to unlock"}
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-white/30 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isAgency && formData.logoUrl && (
              <div className="mt-4 p-4 bg-white/5 rounded-sm inline-block">
                <img src={formData.logoUrl} alt="Logo Preview" className="h-10 object-contain" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-6 tracking-wider uppercase border-b border-white/10 pb-2">
          Contact Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2">
              WhatsApp Number
            </label>
            <input 
              type="text" 
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="e.g. +1234567890"
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-white/30 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2">
              Phone Number
            </label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +1234567890"
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-white/30 outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      <section className={!isAgency ? "opacity-50 pointer-events-none relative" : ""}>
        {!isAgency && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-sm border border-white/5">
            <span className="text-white font-bold tracking-widest uppercase text-sm mb-2">Agency Plan Required</span>
            <span className="text-neutral-400 text-xs text-center px-8">Upgrade to the Agency plan to display social media links in your header.</span>
          </div>
        )}
        
        <h2 className="text-xl font-bold text-white mb-6 tracking-wider uppercase border-b border-white/10 pb-2">
          Social Links
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2">Instagram URL</label>
            <input 
              type="text" 
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              placeholder="https://instagram.com/..."
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-white/30 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2">Facebook URL</label>
            <input 
              type="text" 
              name="facebook"
              value={formData.facebook}
              onChange={handleChange}
              placeholder="https://facebook.com/..."
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-white/30 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2">Snapchat URL</label>
            <input 
              type="text" 
              name="snapchat"
              value={formData.snapchat}
              onChange={handleChange}
              placeholder="https://snapchat.com/add/..."
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-white/30 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2">Portfolio Website</label>
            <input 
              type="text" 
              name="portfolio"
              value={formData.portfolio}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
              className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-white/30 outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      <div className="pt-8 border-t border-white/10 flex items-center justify-between">
        <div className="text-sm text-neutral-400">
          Changes apply instantly to your public profile.
        </div>
        <button 
          type="submit"
          disabled={isSaving || saved}
          className={`flex items-center gap-2 px-8 py-3 rounded-sm text-sm uppercase tracking-wider font-bold transition-all ${
            saved 
              ? 'bg-green-500 text-white'
              : 'bg-white text-black hover:bg-neutral-200'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : isSaving ? (
            'Saving...'
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          )}
        </button>
      </div>
    </form>
  );
}
