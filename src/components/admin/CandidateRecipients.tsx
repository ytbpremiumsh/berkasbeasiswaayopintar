import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Download, Trophy, Heart, Wallet, Globe, Eye, ExternalLink, Award, UserCheck, Undo2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { SubmissionFiles } from "@/components/admin/SubmissionFiles";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

const categoryConfig: Record<ScholarshipCategory, { label: string; icon: any; gradient: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, gradient: "from-amber-500 to-orange-500" },
  yatim: { label: "Yatim", icon: Heart, gradient: "from-rose-500 to-pink-500" },
  ekonomi: { label: "Ekonomi", icon: Wallet, gradient: "from-emerald-500 to-teal-500" },
  umum: { label: "Umum", icon: Globe, gradient: "from-blue-500 to-indigo-500" },
};

interface CandidateSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  category: ScholarshipCategory;
  applicant_status: string;
  institution_name: string | null;
  token_id: string;
  token_code?: string;
  submitted_at: string;
  verified_by: string | null;
  verified_at: string | null;
  admin_notes: string | null;
  kartu_pelajar_url: string | null;
  ktm_url: string | null;
  cv_url: string | null;
  sertifikat_prestasi_url: string | null;
  transkrip_nilai_url: string | null;
  khs_url: string | null;
  essay: string | null;
  bukti_penghasilan_url: string | null;
  bukti_listrik_url: string | null;
  surat_keterangan_yatim_url: string | null;
  sktm_url: string | null;
  video_tiktok_url: string | null;
  berkas_pendukung_url: string | null;
  bukti_struk_url: string | null;
  verified_by_name?: string;
}

export function CandidateRecipients({ programId }: { programId?: string | null }) {
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<CandidateSubmission[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"all" | ScholarshipCategory>("all");

  useEffect(() => {
    fetchCandidates();
  }, [programId]);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("scholarship_submissions")
        .select(`
          id, full_name, email, phone, category, applicant_status, institution_name,
          token_id, submitted_at, verified_by, verified_at, admin_notes,
          kartu_pelajar_url, ktm_url, cv_url, sertifikat_prestasi_url,
          transkrip_nilai_url, khs_url, essay, bukti_penghasilan_url,
          bukti_listrik_url, surat_keterangan_yatim_url, sktm_url,
          video_tiktok_url, berkas_pendukung_url, bukti_struk_url
        `)
        .eq("status", "kandidat_peraih")
        .order("submitted_at", { ascending: false });

      if (programId) {
        query = query.eq("program_id", programId);
      }

      const { data: subs, error } = await query;

      if (error) throw error;

      const { data: tokens } = await supabase.from("scholarship_tokens").select("id, token_code");
      const tokenMap = new Map(tokens?.map(t => [t.id, t.token_code]) || []);

      const verifiedByIds = subs?.map(s => s.verified_by).filter(Boolean) || [];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", verifiedByIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || p.email]) || []);

      const subsWithDetails = subs?.map(s => ({
        ...s,
        token_code: tokenMap.get(s.token_id) || "Unknown",
        verified_by_name: s.verified_by ? profileMap.get(s.verified_by) || "Admin" : undefined
      })) || [];

      setSubmissions(subsWithDetails as CandidateSubmission[]);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const revertToVerified = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scholarship_submissions")
        .update({ status: "diverifikasi" as any })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Status dikembalikan ke Terverifikasi" });
      fetchCandidates();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  const filteredSubmissions = selectedCategory === "all"
    ? submissions
    : submissions.filter(s => s.category === selectedCategory);

  const categoryCounts = {
    all: submissions.length,
    prestasi: submissions.filter(s => s.category === "prestasi").length,
    yatim: submissions.filter(s => s.category === "yatim").length,
    ekonomi: submissions.filter(s => s.category === "ekonomi").length,
    umum: submissions.filter(s => s.category === "umum").length,
  };

  const exportToExcel = () => {
    if (filteredSubmissions.length === 0) {
      toast({ title: "Tidak ada data", variant: "destructive" });
      return;
    }
    const exportData = filteredSubmissions.map(sub => ({
      "Nama Lengkap": sub.full_name,
      "Email": sub.email,
      "Telepon": sub.phone || "-",
      "Kategori": categoryConfig[sub.category]?.label || sub.category,
      "Status Pendaftar": sub.applicant_status?.replace("_", " ") || "-",
      "Universitas/Sekolah": sub.institution_name || "-",
      "Kode Token": sub.token_code,
      "Tanggal Submit": new Date(sub.submitted_at).toLocaleDateString("id-ID"),
      "Diverifikasi Oleh": sub.verified_by_name || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kandidat Peraih");
    XLSX.writeFile(wb, `kandidat_peraih_${selectedCategory}_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Export berhasil" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kandidat Peraih Beasiswa</h1>
        <p className="text-muted-foreground">Peserta terverifikasi yang terpilih sebagai kandidat penerima beasiswa</p>
      </div>

      {/* Stats */}
      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Award className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Kandidat Peraih</p>
                <p className="text-3xl font-bold text-amber-500">{submissions.length}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(categoryConfig) as ScholarshipCategory[]).map(cat => {
                const config = categoryConfig[cat];
                const Icon = config.icon;
                return (
                  <div key={cat} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{categoryCounts[cat]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter & Export */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Data Kandidat Peraih</CardTitle>
              <CardDescription>
                Menampilkan {filteredSubmissions.length} kandidat
                {selectedCategory !== "all" && ` kategori ${categoryConfig[selectedCategory].label}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="all">Semua ({categoryCounts.all})</SelectItem>
                  {(Object.keys(categoryConfig) as ScholarshipCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {categoryConfig[cat].label} ({categoryCounts[cat]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportToExcel} className="gap-2">
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Belum ada kandidat peraih</p>
              <p className="text-sm text-muted-foreground mt-1">Pilih peserta dari halaman Terverifikasi untuk dijadikan kandidat</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Institusi</TableHead>
                    <TableHead>Kode Token</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub, idx) => {
                    const catConfig = categoryConfig[sub.category];
                    const Icon = catConfig?.icon || Globe;
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{sub.full_name}</TableCell>
                        <TableCell>{sub.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Icon className="w-3 h-3" />
                            {catConfig?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{sub.applicant_status?.replace("_", " ")}</TableCell>
                        <TableCell>{sub.institution_name || "-"}</TableCell>
                        <TableCell className="font-mono text-xs bg-muted/50 rounded px-2">{sub.token_code}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Lihat Detail">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Detail Kandidat: {sub.full_name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-muted-foreground">Nama:</span> <strong>{sub.full_name}</strong></div>
                                    <div><span className="text-muted-foreground">Email:</span> <strong>{sub.email}</strong></div>
                                    <div><span className="text-muted-foreground">Telepon:</span> <strong>{sub.phone || "-"}</strong></div>
                                    <div><span className="text-muted-foreground">Kategori:</span> <strong>{catConfig?.label}</strong></div>
                                    <div><span className="text-muted-foreground">Status:</span> <strong className="capitalize">{sub.applicant_status?.replace("_", " ")}</strong></div>
                                    <div><span className="text-muted-foreground">Institusi:</span> <strong>{sub.institution_name || "-"}</strong></div>
                                    {sub.verified_by_name && (
                                      <div className="col-span-2">
                                        <span className="text-muted-foreground">Diverifikasi oleh:</span>{" "}
                                        <strong>{sub.verified_by_name}</strong>
                                      </div>
                                    )}
                                    {sub.admin_notes && (
                                      <div className="col-span-2">
                                        <span className="text-muted-foreground">Catatan Admin:</span>
                                        <p className="mt-1 bg-muted p-2 rounded text-sm">{sub.admin_notes}</p>
                                      </div>
                                    )}
                                  </div>
                                  <hr />
                                  <div className="space-y-2">
                                    <SubmissionFiles submission={sub} category={sub.category} />

                                    {sub.essay && (
                                      <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Esai</h4>
                                        <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">{sub.essay}</p>
                                      </div>
                                    )}
                                    {sub.video_tiktok_url && (
                                      <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Video TikTok</h4>
                                        <a href={sub.video_tiktok_url} target="_blank" className="text-primary hover:underline">{sub.video_tiktok_url}</a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="icon" title="Kembalikan ke Terverifikasi" onClick={() => revertToVerified(sub.id)}>
                              <Undo2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
