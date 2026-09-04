import { useEffect, useMemo, useState } from "react";
import { Award, CheckCircle2, Globe, GraduationCap, Heart, Loader2, Search, Trophy, Wallet } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

interface AdministrationRecipient {
  id: string;
  full_name: string;
  category: ScholarshipCategory;
  applicant_status: "pelajar" | "mahasiswa";
  institution_name: string | null;
  program_name: string;
}

const categoryConfig = {
  prestasi: { label: "Prestasi", icon: Trophy, className: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  yatim: { label: "Yatim", icon: Heart, className: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
  ekonomi: { label: "Ekonomi", icon: Wallet, className: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  umum: { label: "Umum", icon: Globe, className: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
} satisfies Record<ScholarshipCategory, { label: string; icon: typeof Trophy; className: string }>;

const AdministrationResults = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [recipients, setRecipients] = useState<AdministrationRecipient[]>([]);
  const [activeCategory, setActiveCategory] = useState<"all" | ScholarshipCategory>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const { data: setting, error: settingError } = await supabase
          .from("admin_settings")
          .select("setting_value")
          .eq("setting_key", "administration_results_page")
          .maybeSingle();

        if (settingError) throw settingError;

        const value = setting?.setting_value as { is_published?: boolean } | null;
        const published = value?.is_published === true;
        setIsPublished(published);

        if (!published) return;

        const { data, error } = await supabase.rpc("get_published_administration_results");
        if (error) throw error;
        setRecipients((data || []) as AdministrationRecipient[]);
      } catch (error) {
        console.error("Gagal memuat pengumuman administrasi:", error);
        setIsPublished(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

  const filteredRecipients = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("id-ID");
    return recipients.filter((recipient) => {
      if (activeCategory !== "all" && recipient.category !== activeCategory) return false;
      if (!keyword) return true;
      return [recipient.full_name, recipient.institution_name, recipient.program_name]
        .some((value) => value?.toLocaleLowerCase("id-ID").includes(keyword));
    });
  }, [activeCategory, recipients, search]);

  const categoryCounts = useMemo(() => ({
    all: recipients.length,
    prestasi: recipients.filter((recipient) => recipient.category === "prestasi").length,
    yatim: recipients.filter((recipient) => recipient.category === "yatim").length,
    ekonomi: recipients.filter((recipient) => recipient.category === "ekonomi").length,
    umum: recipients.filter((recipient) => recipient.category === "umum").length,
  }), [recipients]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-9 h-9 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPublished) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-lg text-center">
            <div className="w-20 h-20 rounded-3xl bg-muted mx-auto mb-6 flex items-center justify-center">
              <Award className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Pengumuman Belum Dipublikasikan</h1>
            <p className="text-muted-foreground">
              Hasil seleksi pengajuan administrasi masih dalam proses. Silakan periksa kembali halaman ini setelah pengumuman resmi dibuka.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-primary/10" />
          <div className="container relative mx-auto px-4 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Pengumuman Resmi</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Peserta Lolos <span className="text-emerald-600">Pengajuan Administrasi</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Selamat kepada peserta yang telah dinyatakan lolos verifikasi administrasi Program Beasiswa Pendidikan Ayo Pintar.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          <Card className="mb-8 border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/10">
            <CardContent className="p-5 md:p-6 flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold mb-1">Tahap Selanjutnya</h2>
                <p className="text-sm text-muted-foreground">
                  Peserta yang namanya tercantum dinyatakan lolos pengajuan administrasi. Informasi tahap berikutnya akan disampaikan melalui kanal resmi Ayo Pintar.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-8">
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <button onClick={() => setActiveCategory("all")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                Semua ({categoryCounts.all})
              </button>
              {(Object.keys(categoryConfig) as ScholarshipCategory[]).map((category) => {
                const config = categoryConfig[category];
                const Icon = config.icon;
                return (
                  <button key={category} onClick={() => setActiveCategory(category)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${activeCategory === category ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                    <Icon className="w-4 h-4" />
                    {config.label} ({categoryCounts[category]})
                  </button>
                );
              })}
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau institusi..." className="pl-9" />
            </div>
          </div>

          {filteredRecipients.length === 0 ? (
            <div className="text-center py-16">
              <Award className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">Tidak ada peserta yang sesuai dengan pencarian.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecipients.map((recipient, index) => {
                const config = categoryConfig[recipient.category];
                const Icon = config.icon;
                return (
                  <Card key={recipient.id} className="transition-all hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{recipient.full_name}</h3>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{recipient.institution_name || "Institusi belum dicantumkan"}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline" className={`gap-1 ${config.className}`}>
                            <Icon className="w-3 h-3" /> {config.label}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">{recipient.applicant_status}</Badge>
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Lolos</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdministrationResults;

