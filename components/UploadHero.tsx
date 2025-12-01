import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Upload, X, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { StepIndicator } from "@/components/StepIndicator";
import { supabase } from "@/lib/supabase";

interface UploadHeroProps {
    onNext: () => void;
}

export function UploadHero({ onNext }: UploadHeroProps) {
    const { file, setFile, preview, setPreview, setUploadedUrl } = useAppStore();
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setIsUploading(true);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    throw new Error("User not authenticated. Please log in again.");
                }
                const user = session.user;
                console.log("Uploading as user:", user.id);

                const fileExt = selectedFile.name.split('.').pop();
                const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9]/g, '-');
                const fileName = `${Date.now()}-${sanitizedName}.${fileExt}`;

                const { data, error } = await supabase.storage
                    .from("user-uploads")
                    .upload(fileName, selectedFile);

                if (error) throw error;

                const { data: publicUrlData } = supabase.storage
                    .from("user-uploads")
                    .getPublicUrl(fileName);

                setUploadedUrl(publicUrlData.publicUrl);
                toast.success("Image uploaded successfully!");
            } catch (error: any) {
                console.error("Error uploading file:", error);
                toast.error(`Upload failed: ${error.message || "Please try again"}`);
                setFile(null);
                setPreview(null);
            } finally {
                setIsUploading(false);
            }
        }
    }, [setFile, setPreview, setUploadedUrl]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".webp"],
        },
        maxFiles: 1,
        disabled: isUploading,
    });

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setPreview(null);
        setUploadedUrl(null);
    };

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center">
            {/* Step Indicator */}
            <div className="mb-12">
                <StepIndicator currentStep="upload" />
            </div>

            {/* Headlines */}
            <div className="mb-12 text-center">
                <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-6xl">
                    The Weight of a{" "}
                    <span className="bg-gradient-to-r from-zinc-200 via-white to-zinc-400 bg-clip-text text-transparent">
                        Single Photo.
                    </span>
                </h1>
                <p className="mx-auto max-w-lg text-lg text-zinc-400">
                    Generative imagery that captures more than just your face.
                </p>
            </div>

            {/* Dropzone Portal */}
            <motion.div
                {...(getRootProps() as any)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // @ts-ignore - open is available on dropzone ref but not typed in getRootProps return sometimes
                        getRootProps().onClick?.(e as any);
                    }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                    boxShadow: isDragActive
                        ? "0 0 60px -10px rgba(34, 211, 238, 0.3)"
                        : "0 20px 40px -20px rgba(0, 0, 0, 0.5)",
                    borderColor: isDragActive
                        ? "rgba(34, 211, 238, 0.5)"
                        : "rgba(255, 255, 255, 0.1)"
                }}
                className={cn(
                    "group relative flex w-full max-w-xl cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-black",
                    isDragActive ? "bg-cyan-950/30" : "bg-white/5 hover:bg-white/10",
                    preview ? "h-auto p-0 border-none bg-transparent hover:bg-transparent" : "h-80"
                )}
            >
                <input {...getInputProps()} />

                {/* Ambient Glow (Only when no preview) */}
                {!preview && (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-50 transition-opacity duration-500 group-hover:opacity-100" />
                )}

                {preview ? (
                    <div className="relative flex w-full flex-col items-center p-8">
                        <motion.div
                            layoutId="user-image"
                            className="relative h-[50vh] max-h-[500px] w-auto aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                        >
                            <Image
                                src={preview}
                                alt="Preview"
                                fill
                                className="object-contain bg-black/50"
                            />

                            {/* Scanner Light Effect */}
                            {!isUploading && (
                                <motion.div
                                    initial={{ top: "-10%" }}
                                    animate={{ top: "110%" }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                        repeatDelay: 0.5
                                    }}
                                    className="absolute left-0 right-0 h-[2px] bg-cyan-400/80 shadow-[0_0_20px_2px_rgba(34,211,238,0.6)] blur-[1px] z-10"
                                />
                            )}

                            {!isUploading && (
                                <button
                                    onClick={clearFile}
                                    className="absolute top-4 right-4 z-20 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/70"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}

                            {isUploading && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                                        <p className="text-sm font-medium text-cyan-100">Analyzing...</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onNext();
                            }}
                            disabled={isUploading}
                            className="group/btn mt-6 relative flex w-full max-w-sm items-center justify-center gap-2 overflow-hidden rounded-xl bg-white py-4 text-sm font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isUploading ? "Uploading..." : "Continue to Studio"}
                                {!isUploading && <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />}
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="relative z-10 flex flex-col items-center gap-6 text-center p-8">
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/10 group-hover:ring-white/20">
                            <Upload className="h-8 w-8 text-zinc-400 transition-colors group-hover:text-white" />
                            {/* Pulse Effect */}
                            <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-white/5 opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xl font-medium text-white">
                                Drop your photo here
                            </p>
                            <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                                or click to open the portal. Supports JPG, PNG, WEBP.
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>
        </div >
    );
}

