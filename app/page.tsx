"use client";

import { useCallback, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { UploadHero } from "@/components/UploadHero";
import { ConfigurationPanel } from "@/components/ConfigurationPanel";
import { LoadingView } from "@/components/LoadingView";
import { ResultsGallery } from "@/components/ResultsGallery";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const { step, setStep, setFile, setPreview, setSelectedStyles, setGeneratedImages, setCredits } = useAppStore();

  // Fetch user credits on mount
  useEffect(() => {
    const fetchCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCredits(profile.credits || 24); // Default to 24 if null
        }
      }
    };
    fetchCredits();
  }, [setCredits]);

  const handleUpload = useCallback(() => setStep('configure'), [setStep]);
  const handleGenerate = useCallback(() => setStep('generating'), [setStep]);
  const handleGenerationComplete = useCallback(() => setStep('results'), [setStep]);
  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setSelectedStyles([]);
    setGeneratedImages([]);
    setStep('upload');
  }, [setFile, setPreview, setSelectedStyles, setGeneratedImages, setStep]);

  return (
    <main className="min-h-screen w-full max-w-7xl mx-auto pt-24 pb-24 px-6 md:px-12 text-zinc-50 selection:bg-white/20">
      <Navbar />

      {step === 'upload' ? (
        <UploadHero onNext={handleUpload} />
      ) : step === 'configure' ? (
        <ConfigurationPanel onGenerate={handleGenerate} />
      ) : step === 'generating' ? (
        <LoadingView onComplete={handleGenerationComplete} onCancel={() => setStep('configure')} />
      ) : (
        <ResultsGallery onReset={handleReset} />
      )}

      {/* Background Grid Pattern (Optional but adds to the premium feel) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>
    </main>
  );
}
