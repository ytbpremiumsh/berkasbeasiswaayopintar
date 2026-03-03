import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Heart, Wallet, Globe, Award, GraduationCap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

const categoryConfig: Record<ScholarshipCategory, { label: string; icon: any; gradient: string; bg: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10" },
  yatim: { label: "Yatim", icon: Heart, gradient: "from-rose-500 to-pink-500", bg: "bg-rose-500/10" },
  ekonomi: { label: "Ekonomi", icon: Wallet, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10" },
  umum: { label: "Umum", icon: Globe, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-500/10" },
};

interface Recipient {
  id: string;
  full_name: string;
  category: ScholarshipCategory;
  applicant_status: string;
  institution_name: string | null;
}

const PeraihBeasiswa = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [activeCategory, setActiveCategory] = useState<"all" | ScholarshipCategory>("all");

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("scholarship_submissions")
        .select("id, full_name, category, applicant_status, institution_name")
        .eq("status", "kandidat_peraih")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setRecipients((data || []) as Recipient[]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = activeCategory === "all" ? recipients : recipients.filter(r => r.category === activeCategory);

  const categoryCounts: Record<string, number> = {
    all: recipients.length,
    prestasi: recipients.filter(r => r.category === "prestasi").length,
    yatim: recipients.filter(r => r.category === "yatim").length,
    ekonomi: recipients.filter(r => r.category === "ekonomi").length,
    umum: recipients.filter(r => r.category === "umum").length,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-background to-primary/5" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 rounded-full px-4 py-2 mb-6">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600">Pengumuman Resmi</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            Kandidat Peraih <span className="text-amber-500">Beasiswa</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selamat kepada para kandidat yang terpilih sebagai penerima beasiswa Ayo Pintar. 
            Berikut adalah daftar nama peserta yang telah lolos seleksi.
          </p>
        </div>
      </section>

      {/* Info Card */}
      <section className="container mx-auto px-4 -mt-6 mb-8">
        <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Informasi Penting</h3>
                <p className="text-sm text-muted-foreground">
                  Bagi para kandidat peraih beasiswa, silakan tunggu informasi selanjutnya yang akan disampaikan melalui 
                  email dan WhatsApp terkait proses pencairan dan kelengkapan dokumen tambahan. 
                  Pastikan nomor telepon dan email Anda aktif.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Semua ({categoryCounts.all})
          </button>
          {(Object.keys(categoryConfig) as ScholarshipCategory[]).map(cat => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="w-4 h-4" />
                {config.label} ({categoryCounts[cat]})
              </button>
            );
          })}
        </div>
      </section>

      {/* Recipients List */}
      <section className="container mx-auto px-4 pb-16 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Award className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground text-lg">Belum ada kandidat peraih untuk kategori ini</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((recipient, idx) => {
              const catConfig = categoryConfig[recipient.category];
              const Icon = catConfig?.icon || Globe;
              return (
                <Card key={recipient.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${catConfig.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                        <span className="text-white font-bold text-lg">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{recipient.full_name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{recipient.institution_name || "-"}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Icon className="w-3 h-3" />
                            {catConfig?.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {recipient.applicant_status?.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default PeraihBeasiswa;
