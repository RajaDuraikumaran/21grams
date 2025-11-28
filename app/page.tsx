"use client";

import { useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { UploadHero } from "@/components/UploadHero";
import { ConfigurationPanel } from "@/components/ConfigurationPanel";
import { LoadingView } from "@/components/LoadingView";
import { ResultsGallery } from "@/components/ResultsGallery";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const { step, setStep, setFile, setPreview, setSelectedStyles, setGeneratedImages } = useAppStore();

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
