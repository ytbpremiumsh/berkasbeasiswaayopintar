import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle, Clock, FileText, Loader2 } from "lucide-react";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";

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

const CheckStatus = () => {
  const [tokenCode, setTokenCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    hasSubmission: boolean;
    submission?: any;
    token?: any;
  } | null>(null);

  const handleCheck = async () => {
    if (!tokenCode.trim()) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      // First, find the token
      const { data: token, error: tokenError } = await supabase
        .from("scholarship_tokens")
        .select("*")
        .eq("token_code", tokenCode.toUpperCase().trim())
        .maybeSingle();

      if (tokenError) throw tokenError;

      if (!token) {
        setResult({ found: false, hasSubmission: false });
        return;
      }

      // Check if there's a submission for this token
      const { data: submission, error: subError } = await supabase
        .from("scholarship_submissions")
        .select("*")
        .eq("token_id", token.id)
        .maybeSingle();

      if (subError) throw subError;

      setResult({
        found: true,
        hasSubmission: !!submission,
        submission,
        token,
      });
    } catch (error) {
      console.error("Error checking status:", error);
      setResult({ found: false, hasSubmission: false });
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Cek Status Pengiriman</h1>
            <p className="text-muted-foreground">
              Masukkan kode token untuk mengecek status pengiriman berkas beasiswa Anda
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
                  {!result.found ? (
                    <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                          <XCircle className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                          <p className="font-semibold text-destructive">Token Tidak Ditemukan</p>
                          <p className="text-sm text-muted-foreground">Pastikan kode token yang Anda masukkan benar</p>
                        </div>
                      </div>
                    </div>
                  ) : !result.hasSubmission ? (
                    <div className="p-6 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-amber-700">Belum Mengirimkan Berkas</p>
                          <p className="text-sm text-amber-600">Token valid tapi Anda belum mengirimkan berkas beasiswa</p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 rounded-lg bg-amber-100/50">
                        <p className="text-sm text-amber-700">
                          <strong>Kategori:</strong> {categoryLabels[result.token?.category] || result.token?.category}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {result.submission.status === "ditolak" ? (
                        <div className="p-6 rounded-xl bg-red-100 border border-red-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                              <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-red-600">Pengajuan Ditolak</p>
                              <p className="text-sm text-red-500">Silakan hubungi admin untuk informasi lebih lanjut</p>
                            </div>
                          </div>
                        </div>
                      ) : (
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
                      )}

                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Nama:</span>
                          <span className="font-medium">{result.submission.full_name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Kategori:</span>
                          <span className="font-medium">{categoryLabels[result.submission.category] || result.submission.category}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tanggal Kirim:</span>
                          <span className="font-medium">
                            {new Date(result.submission.submitted_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
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
      </main>

      <Footer />
    </div>
  );
};

export default CheckStatus;