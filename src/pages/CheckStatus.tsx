import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, XCircle, Clock, FileText, Loader2, AlertCircle } from "lucide-react";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { AdsenseAd } from "@/components/AdsenseAd";

type SubmissionStatus = "menunggu" | "diverifikasi" | "ditolak";

const statusConfig: Record<SubmissionStatus, { label: string; icon: any; color: string; bgColor: string }> = {
  menunggu: { label: "Menunggu Verifikasi", icon: Clock, color: "text-amber-600", bgColor: "bg-amber-100" },
  diverifikasi: { label: "Terverifikasi", icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  ditolak: { label: "Ditolak", icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" },
};

const categoryLabels: Record<string, string> = {
  prestasi: "Beasiswa Prestasi",
  yatim: "Beasiswa Yatim",
  ekonomi: "Beasiswa Ekonomi",
  umum: "Beasiswa Umum",
};

type CheckResult = {
  status: "not_found" | "valid_no_submission" | "has_submission";
  message?: string;
  submission?: any;
  token?: any;
  category?: string;
};

const CheckStatus = () => {
  const [tokenCode, setTokenCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const handleCheck = async () => {
    if (!tokenCode.trim()) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      const code = tokenCode.toUpperCase().trim();
      
      // Step 1: Check in local database first
      const { data: localToken, error: localError } = await supabase
        .from("scholarship_tokens")
        .select("*")
        .eq("token_code", code)
        .maybeSingle();

      if (localError) throw localError;

      // If token exists in local DB
      if (localToken) {
        // Check if there's a submission
        const { data: submission, error: subError } = await supabase
          .from("scholarship_submissions")
          .select("*")
          .eq("token_id", localToken.id)
          .maybeSingle();

        if (subError) throw subError;

        if (submission) {
          setResult({
            status: "has_submission",
            submission,
            token: localToken,
          });
        } else {
          setResult({
            status: "valid_no_submission",
            token: localToken,
            category: localToken.category,
            message: "Token valid dari lisensi Mayar, tetapi belum mengirimkan berkas",
          });
        }
        return;
      }

      // Step 2: Token not in local DB, verify with Mayar API
      // Note: We pass empty category since we just want to verify, not create with a specific category
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-license", {
        body: { licenseCode: code, checkOnly: true },
      });

      if (verifyError) {
        console.error("Verify license error:", verifyError);
        setResult({
          status: "not_found",
          message: "Gagal memverifikasi token, silakan coba lagi",
        });
        return;
      }

      if (verifyData?.valid) {
        // Token is valid in Mayar but no submission yet
        // The verify-license function creates the token in DB, so fetch it
        const { data: newToken } = await supabase
          .from("scholarship_tokens")
          .select("*")
          .eq("token_code", code)
          .maybeSingle();

        setResult({
          status: "valid_no_submission",
          token: newToken,
          category: newToken?.category,
          message: "Token valid dari lisensi Mayar, tetapi belum mengirimkan berkas",
        });
      } else {
        // Token not found in Mayar API
        setResult({
          status: "not_found",
          message: verifyData?.message || "Kode token tidak ditemukan di sistem Mayar",
        });
      }
    } catch (error) {
      console.error("Error checking status:", error);
      setResult({
        status: "not_found",
        message: "Terjadi kesalahan saat memeriksa token",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <SimpleHeader />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Cek Status Administrasi</h1>
            <p className="text-muted-foreground">
              Masukkan kode token untuk mengecek status administrasi berkas beasiswa Anda
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Masukkan Kode Token</CardTitle>
              <CardDescription>
                Kode token yang Anda dapatkan saat pembelian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Contoh: ABC123XYZ"
                  value={tokenCode}
                  onChange={(e) => setTokenCode(e.target.value.toUpperCase())}
                  className="font-mono text-lg tracking-wider"
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                />
                <Button onClick={handleCheck} disabled={isLoading || !tokenCode.trim()}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {result && (
                <div className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
                  {result.status === "not_found" ? (
                    <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                          <XCircle className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                          <p className="font-semibold text-destructive">Token Tidak Ditemukan</p>
                          <p className="text-sm text-muted-foreground">
                            {result.message || "Pastikan kode token yang Anda masukkan benar"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : result.status === "valid_no_submission" ? (
                    <div className="p-6 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-amber-700">Belum Mengirimkan Berkas</p>
                          <p className="text-sm text-amber-600">
                            Token valid dari lisensi Mayar, tetapi Anda belum mengirimkan berkas beasiswa
                          </p>
                        </div>
                      </div>
                      
                      {/* Ad between content and button */}
                      <AdsenseAd placement="between_sections" className="my-4" />
                      
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                          onClick={() => window.location.href = "/"}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Kirim Berkas Sekarang
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-6 rounded-xl bg-emerald-100 border border-emerald-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-emerald-600">Berkas Sudah Terkirim</p>
                            <p className="text-sm text-emerald-500">Pengajuan beasiswa Anda telah berhasil dikirim</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Nama:</span>
                          <span className="font-medium">{result.submission?.full_name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Kategori:</span>
                          <span className="font-medium">{categoryLabels[result.submission?.category] || result.submission?.category}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tanggal & Waktu Kirim:</span>
                          <span className="font-medium">
                            {new Date(result.submission?.submitted_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}{" "}
                            {new Date(result.submission?.submitted_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Content Bottom Ad */}
        <AdsenseAd placement="content_bottom" className="mt-8 max-w-md mx-auto" />
      </main>

      {/* Footer Ad */}
      <AdsenseAd placement="footer" className="container mx-auto px-4 mb-4" />
      
      <Footer />
    </div>
  );
};

export default CheckStatus;