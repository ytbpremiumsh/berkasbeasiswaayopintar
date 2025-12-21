import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TokenValidatorProps {
  category: "prestasi" | "yatim" | "ekonomi" | "umum";
  onValidToken: (tokenId: string, customerName?: string, customerEmail?: string) => void;
  value?: string;
}

export function TokenValidator({ category, onValidToken, value }: TokenValidatorProps) {
  const [tokenCode, setTokenCode] = useState(value || "");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<"valid" | "invalid" | null>(null);

  const handleValidate = async () => {
    if (!tokenCode.trim()) {
      toast({
        title: "Masukkan Kode Token",
        description: "Silakan masukkan kode token beasiswa Anda",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Call the edge function to verify license via Mayar API
      const { data, error } = await supabase.functions.invoke("verify-license", {
        body: {
          licenseCode: tokenCode.trim().toUpperCase(),
          category: category,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data.valid) {
        setValidationResult("invalid");
        toast({
          title: "Kode Token Tidak Valid",
          description: data.message || "Kode token tidak ditemukan, silakan klaim token terlebih dahulu",
          variant: "destructive",
        });
        return;
      }

      setValidationResult("valid");
      onValidToken(data.tokenId, data.customerName, data.customerEmail);
      toast({
        title: "Kode Token Valid",
        description: "Silakan lanjutkan mengisi form beasiswa",
      });
    } catch (error) {
      console.error("Token validation error:", error);
      toast({
        title: "Terjadi Kesalahan",
        description: "Gagal memvalidasi kode token. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Preparation Notes */}
      <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Berkas yang Harus Disiapkan
        </h4>
        <p className="text-sm text-muted-foreground">
          Sebelum melanjutkan, pastikan Anda telah menyiapkan berkas-berkas berikut dalam format <strong>PDF/JPG/PNG</strong> (maks. 5MB):
        </p>
        <ul className="text-sm text-muted-foreground space-y-1.5 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span><strong>Kartu Identitas</strong> - Kartu Pelajar (untuk Pelajar/Gap Year) atau KTM (untuk Mahasiswa)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span><strong>Bukti Struk/Pembayaran</strong> - Bukti telah memilih berkas beasiswa (wajib)</span>
          </li>
          {category === "prestasi" && (
            <>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span><strong>CV</strong> - Curriculum Vitae terbaru</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span><strong>Sertifikat Prestasi</strong> - Akademik atau Non-Akademik (opsional)</span>
              </li>
            </>
          )}
          {category === "yatim" && (
            <>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">•</span>
                <span><strong>Surat Keterangan Yatim</strong> - Dari kelurahan/RT/RW</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">•</span>
                <span><strong>Esai Pribadi</strong> - Maksimal 500 kata</span>
              </li>
            </>
          )}
          {category === "ekonomi" && (
            <>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span><strong>SKTM</strong> - Surat Keterangan Tidak Mampu</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span><strong>Esai Pribadi</strong> - Maksimal 500 kata</span>
              </li>
            </>
          )}
          {category === "umum" && (
            <>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span><strong>Esai Pribadi</strong> - 500-1000 kata</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span><strong>Video TikTok</strong> - Minimal 1 menit tentang Beasiswa Ayo Pintar (opsional)</span>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Token Input Section */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            Kode Token Beasiswa <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Masukkan kode token yang Anda terima dari Mayar
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Masukkan kode token..."
              value={tokenCode}
              onChange={(e) => {
                setTokenCode(e.target.value.toUpperCase());
                setValidationResult(null);
              }}
              className="uppercase"
              disabled={validationResult === "valid"}
            />
            {validationResult === "valid" && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
            )}
            {validationResult === "invalid" && (
              <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
            )}
          </div>
          <Button
            type="button"
            onClick={handleValidate}
            disabled={isValidating || validationResult === "valid"}
            className="shrink-0"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validasi...
              </>
            ) : validationResult === "valid" ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Tervalidasi
              </>
            ) : (
              "Validasi"
            )}
          </Button>
        </div>

        {validationResult === "invalid" && (
          <p className="text-sm text-destructive">
            Kode token tidak ditemukan atau tidak valid. Silakan klaim token terlebih dahulu.
          </p>
        )}
      </div>
    </div>
  );
}
