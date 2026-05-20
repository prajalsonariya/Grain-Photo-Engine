import Header from '@/components/Header';
import HomeClient from './HomeClient';
import { getFolders, getConfig } from '@/lib/drive';

export const revalidate = 60;

export default async function Home() {
  const [folders, config] = await Promise.all([
    getFolders(),
    getConfig(),
  ]);

  return (
    <main className="min-h-screen bg-[#1e1e1e] text-neutral-200 font-sans selection:bg-white/20 selection:text-white relative overflow-hidden">
      <Header />
      <HomeClient folders={folders} heroTitle={config.heroTitle} />
    </main>
  );
}
