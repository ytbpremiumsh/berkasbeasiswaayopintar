import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, FileText, Image, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FileUploadProps {
  label: string;
  accept?: string;
  onUpload: (url: string) => void;
  value?: string;
  required?: boolean;
  description?: string;
  folder: string;
}

export function FileUpload({
  label,
  accept = ".pdf,.jpg,.jpeg,.png",
  onUpload,
  value,
  required = false,
  description,
  folder,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("scholarship-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("scholarship-documents")
        .getPublicUrl(fileName);

      onUpload(urlData.publicUrl);
      toast({
        title: "Berhasil",
        description: "File berhasil diunggah",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Gagal mengunggah",
        description: "Terjadi kesalahan saat mengunggah file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    onUpload("");
  };

  const isImage = value?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {value ? (
        <div className="relative rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            {isImage ? (
              <Image className="w-8 h-8 text-primary" />
            ) : (
              <FileText className="w-8 h-8 text-primary" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">File terunggah</p>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Lihat file
              </a>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            isUploading && "pointer-events-none opacity-60"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center py-8 px-4">
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="mt-2 text-sm text-muted-foreground">Mengunggah...</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Klik atau seret file ke sini
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, JPG, PNG (maks. 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
