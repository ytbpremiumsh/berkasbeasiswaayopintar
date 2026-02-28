import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DocumentRequirements } from "./DocumentRequirements";
import { AdsenseAd } from "./AdsenseAd";

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
      {/* Document Preparation Notes - Now with clear separation by applicant type */}
      <DocumentRequirements category={category} />

      {/* Ad before token input */}
      <AdsenseAd placement="content_top" className="my-4" />

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

        {/* Ad after validation button */}
        <AdsenseAd placement="between_sections" className="mt-4" />
      </div>
    </div>
  );
}
