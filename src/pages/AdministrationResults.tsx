import { FormEvent, useEffect, useState } from "react";
import { Award, CheckCircle2, Clock3, KeyRound, Loader2, Search, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type SubmissionStatus = "menunggu" | "diverifikasi" | "ditolak" | "kandidat_peraih";

interface AdministrationResult {
  full_name: string;
  category: string;
  institution_name: string | null;
  program_name: string;
  status: SubmissionStatus;
}

const statusConfig = {
  menunggu: { title: "Pengajuan Sedang Diproses", description: "Berkas Anda masih dalam proses pemeriksaan oleh tim administrasi.", label: "Sedang Diproses", icon: Clock3, className: "border-amber-200 bg-amber-50 text-amber-700" },
  diverifikasi: { title: "Selamat, Anda Lolos Administrasi!", description: "Pengajuan Anda telah diverifikasi dan dinyatakan lolos tahap administrasi.", label: "Lolos Administrasi", icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  ditolak: { title: "Belum Lolos Administrasi", description: "Mohon maaf, pengajuan Anda belum dinyatakan lolos pada tahap administrasi.", label: "Belum Lolos", icon: XCircle, className: "border-rose-200 bg-rose-50 text-rose-700" },
  kandidat_peraih: { title: "Selamat, Anda Lolos Administrasi!", description: "Pengajuan Anda telah lolos administrasi dan masuk ke tahap seleksi berikutnya.", label: "Lolos Administrasi", icon: Award, className: "border-blue-200 bg-blue-50 text-blue-700" },
} satisfies Record<SubmissionStatus, { title: string; description: string; label: string; icon: typeof Award; className: string }>;

const AdministrationResults = () => {
  const [isCheckingPublication, setIsCheckingPublication] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [tokenCode, setTokenCode] = useState("");
  const [result, setResult] = useState<AdministrationResult | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPublicationStatus = async () => {
      try {
        const { data, error } = await supabase.from("admin_settings").select("setting_value").eq("setting_key", "administration_results_page").maybeSingle();
        if (error) throw error;
        const value = data?.setting_value as { is_published?: boolean } | null;
        setIsPublished(value?.is_published === true);
      } catch (error) {
        console.error("Gagal memuat status publikasi:", error);
        setIsPublished(false);
      } finally {
        setIsCheckingPublication(false);
      }
    };
    fetchPublicationStatus();
  }, []);

  const handleCheck = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedToken = tokenCode.trim().toUpperCase();
    if (!normalizedToken) {
      setMessage("Masukkan kode token lisensi terlebih dahulu.");
      return;
    }

    setIsChecking(true);
    setResult(null);
    setMessage("");
    try {
      const { data, error } = await supabase.rpc("get_administration_result_by_token", { p_token_code: normalizedToken });
      if (error) throw error;
      const submission = (data?.[0] || null) as AdministrationResult | null;
      if (!submission) {
        setMessage("Kode token tidak ditemukan atau belum memiliki pengajuan berkas.");
        return;
      }
      setResult(submission);
    } catch (error) {
      console.error("Gagal memeriksa hasil administrasi:", error);
      setMessage("Status belum dapat diperiksa. Silakan coba kembali beberapa saat lagi.");
    } finally {
      setIsChecking(false);
    }
  };

  if (isCheckingPublication) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>;
  }

  if (!isPublished) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted"><Award className="h-10 w-10 text-muted-foreground/40" /></div>
            <h1 className="mb-3 text-2xl font-bold md:text-3xl">Pengumuman Belum Dipublikasikan</h1>
            <p className="text-muted-foreground">Hasil seleksi administrasi masih dalam proses. Silakan periksa kembali setelah pengumuman resmi dibuka.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const config = result ? statusConfig[result.status] : null;
  const StatusIcon = config?.icon;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-primary/10" />
          <div className="container relative mx-auto px-4 py-14 text-center md:py-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /><span className="text-sm font-semibold text-emerald-700">Pengumuman Resmi</span>
            </div>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">Pengumuman <span className="text-emerald-600">Lolos Administrasi</span></h1>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">Masukkan kode token lisensi yang digunakan saat pendaftaran untuk melihat status pengajuan Anda.</p>
          </div>
        </section>

        <section className="container mx-auto max-w-2xl px-4 py-10">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><KeyRound className="h-7 w-7 text-primary" /></div>
              <CardTitle>Cek Status Administrasi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheck} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="license-token" className="text-sm font-medium">Kode Token Lisensi</label>
                  <Input id="license-token" value={tokenCode} onChange={(event) => setTokenCode(event.target.value.toUpperCase())} placeholder="Contoh: KP3P847291" className="h-12 text-center font-mono uppercase tracking-wider" autoComplete="off" />
                </div>
                <Button type="submit" className="h-12 w-full" disabled={isChecking}>
                  {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Lihat Status
                </Button>
              </form>

              {message && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">{message}</div>}

              {result && config && StatusIcon && (
                <div className={`mt-6 rounded-2xl border p-5 ${config.className}`}>
                  <div className="flex flex-col items-center text-center">
                    <StatusIcon className="mb-3 h-12 w-12" />
                    <Badge className="mb-3" variant="secondary">{config.label}</Badge>
                    <h2 className="text-xl font-bold">{config.title}</h2>
                    <p className="mt-2 text-sm opacity-90">{config.description}</p>
                  </div>
                  <div className="mt-5 grid gap-3 rounded-xl bg-white/70 p-4 text-sm sm:grid-cols-2">
                    <div><p className="text-xs text-muted-foreground">Nama Peserta</p><p className="font-semibold text-foreground">{result.full_name}</p></div>
                    <div><p className="text-xs text-muted-foreground">Program</p><p className="font-semibold text-foreground">{result.program_name}</p></div>
                    <div><p className="text-xs text-muted-foreground">Kategori</p><p className="font-semibold capitalize text-foreground">{result.category}</p></div>
                    <div><p className="text-xs text-muted-foreground">Asal Institusi</p><p className="font-semibold text-foreground">{result.institution_name || "Belum dicantumkan"}</p></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdministrationResults;
