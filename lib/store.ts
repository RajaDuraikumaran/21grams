import { create } from 'zustand';

interface AppState {
    step: 'upload' | 'configure' | 'generating' | 'results';
    file: File | null;
    preview: string | null;
    uploadedUrl: string | null;
    credits: number;
    selectedStyles: string[];
    selectedFilters: string[];
    gender: 'male' | 'female';
    generatedImages: string[];
    setFile: (file: File | null) => void;
    setPreview: (preview: string | null) => void;
    setUploadedUrl: (url: string | null) => void;
    setCredits: (credits: number) => void;
    setSelectedStyles: (styles: string[]) => void;
    setSelectedFilters: (filters: string[]) => void;
    setGender: (gender: 'male' | 'female') => void;
    setGeneratedImages: (images: string[]) => void;
    setStep: (step: 'upload' | 'configure' | 'generating' | 'results') => void;
}

export const useAppStore = create<AppState>((set) => ({
    step: 'upload',
    file: null,
    preview: null,
    uploadedUrl: null,
    credits: 10, // Default credits
    selectedStyles: ['studio_professional'], // Default selection (single style to avoid rate limits)
    selectedFilters: ["Smooth Skin", "Reduce Circles", "Smooth Hair", "Gentle Smile"], // Default filters
    gender: 'male',
    generatedImages: [],
    setFile: (file) => set({ file }),
    setPreview: (preview) => set({ preview }),
    setUploadedUrl: (uploadedUrl) => set({ uploadedUrl }),
    setCredits: (credits) => set({ credits }),
    setSelectedStyles: (selectedStyles) => set({ selectedStyles }),
    setSelectedFilters: (selectedFilters) => set({ selectedFilters }),
    setGender: (gender) => set({ gender }),
    setGeneratedImages: (generatedImages) => set({ generatedImages }),
    setStep: (step) => set({ step }),
}));
