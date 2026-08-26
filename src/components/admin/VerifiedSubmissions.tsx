import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Download, CheckCircle, Trophy, Heart, Wallet, Globe, Eye, ExternalLink, Award } from "lucide-react";
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

interface VerifiedSubmission {
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
  // File URLs
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
  // Admin info
  verified_by_name?: string;
}

export function VerifiedSubmissions({ programId }: { programId?: string | null }) {
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<VerifiedSubmission[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"all" | ScholarshipCategory>("all");

  useEffect(() => {
    fetchVerified();
  }, [programId]);

  const fetchVerified = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("scholarship_submissions")
        .select(`
          id, full_name, email, phone, category, applicant_status, institution_name,
          token_id, submitted_at, verified_by, verified_at,
          kartu_pelajar_url, ktm_url, cv_url, sertifikat_prestasi_url,
          transkrip_nilai_url, khs_url, essay, bukti_penghasilan_url,
          bukti_listrik_url, surat_keterangan_yatim_url, sktm_url,
          video_tiktok_url, berkas_pendukung_url, bukti_struk_url
        `)
        .eq("status", "diverifikasi")
        .order("submitted_at", { ascending: false });

      if (programId) {
        query = query.eq("program_id", programId);
      }

      const { data: subs, error } = await query;

      if (error) throw error;

      // Get all tokens for mapping
      const { data: tokens } = await supabase
        .from("scholarship_tokens")
        .select("id, token_code");

      const tokenMap = new Map(tokens?.map(t => [t.id, t.token_code]) || []);

      // Get admin profiles for verified_by names
      const verifiedByIds = subs?.map(s => s.verified_by).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", verifiedByIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || p.email]) || []);

      // Add token_code and verified_by_name to submissions
      const subsWithDetails = subs?.map(s => ({
        ...s,
        token_code: tokenMap.get(s.token_id) || "Unknown",
        verified_by_name: s.verified_by ? profileMap.get(s.verified_by) || "Admin" : undefined
      })) || [];

      setSubmissions(subsWithDetails as VerifiedSubmission[]);
    } catch (error) {
      console.error("Error fetching verified:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const promoteToCandidate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scholarship_submissions")
        .update({ status: "kandidat_peraih" as any })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Berhasil", description: "Peserta dipromosikan ke Kandidat Peraih" });
      fetchVerified();
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  const filteredSubmissions = selectedCategory === "all" 
    ? submissions 
    : submissions.filter(s => s.category === selectedCategory);

  const exportToExcel = () => {
    if (filteredSubmissions.length === 0) {
      toast({ title: "Tidak ada data", description: "Tidak ada data untuk diexport", variant: "destructive" });
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
      "Tanggal Verifikasi": sub.verified_at ? new Date(sub.verified_at).toLocaleDateString("id-ID") : "-",
      // File URLs
      "Kartu Pelajar": sub.kartu_pelajar_url || "-",
      "KTM": sub.ktm_url || "-",
      "CV": sub.cv_url || "-",
      "Sertifikat Prestasi": sub.sertifikat_prestasi_url || "-",
      "Transkrip Nilai": sub.transkrip_nilai_url || "-",
      "KHS": sub.khs_url || "-",
      "Esai": sub.essay ? sub.essay.substring(0, 500) : "-",
      "Bukti Penghasilan": sub.bukti_penghasilan_url || "-",
      "Bukti Listrik": sub.bukti_listrik_url || "-",
      "Surat Keterangan Yatim": sub.surat_keterangan_yatim_url || "-",
      "SKTM": sub.sktm_url || "-",
      "Video TikTok": sub.video_tiktok_url || "-",
      "Berkas Pendukung": sub.berkas_pendukung_url || "-",
      "Bukti Struk": sub.bukti_struk_url || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    const sheetName = selectedCategory === "all" ? "Semua Kategori" : categoryConfig[selectedCategory].label;
    XLSX.utils.book_append_sheet(wb, ws, `Terverifikasi - ${sheetName}`);
    XLSX.writeFile(wb, `peserta_terverifikasi_${selectedCategory}_${new Date().toISOString().split("T")[0]}.xlsx`);
    
    toast({ title: "Export berhasil", description: `${filteredSubmissions.length} data berhasil diexport dengan link berkas` });
  };

  const categoryCounts = {
    all: submissions.length,
    prestasi: submissions.filter(s => s.category === "prestasi").length,
    yatim: submissions.filter(s => s.category === "yatim").length,
    ekonomi: submissions.filter(s => s.category === "ekonomi").length,
    umum: submissions.filter(s => s.category === "umum").length,
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
        <h1 className="text-2xl font-bold text-foreground">Peserta Terverifikasi</h1>
        <p className="text-muted-foreground">Daftar peserta yang sudah divalidasi dengan kode token</p>
      </div>

      {/* Stats */}
      <Card className="border-l-4 border-l-success">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Terverifikasi</p>
                <p className="text-3xl font-bold text-success">{submissions.length}</p>
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
              <CardTitle>Data Peserta Terverifikasi</CardTitle>
              <CardDescription>
                Menampilkan {filteredSubmissions.length} peserta 
                {selectedCategory !== "all" && ` kategori ${categoryConfig[selectedCategory].label}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {(Object.keys(categoryConfig) as ScholarshipCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {categoryConfig[cat].label} ({categoryCounts[cat]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportToExcel} className="gap-2">
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Belum ada peserta terverifikasi</p>
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
                    <TableHead>Korektor</TableHead>
                    <TableHead>Kode Token</TableHead>
                    <TableHead>Tanggal</TableHead>
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
                            {catConfig?.label || sub.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{sub.applicant_status?.replace("_", " ")}</TableCell>
                        <TableCell>
                          {sub.verified_by_name ? (
                            <div className="text-sm">
                              <p className="font-medium">{sub.verified_by_name}</p>
                              {sub.verified_at && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(sub.verified_at).toLocaleDateString("id-ID")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs bg-muted/50 rounded px-2">{sub.token_code}</TableCell>
                        <TableCell>{new Date(sub.submitted_at).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Lihat Berkas">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Berkas: {sub.full_name}</DialogTitle>
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
                                        {sub.verified_at && (
                                          <span className="text-muted-foreground ml-2">
                                            ({new Date(sub.verified_at).toLocaleString("id-ID")})
                                          </span>
                                        )}
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
                            <Button variant="ghost" size="icon" title="Jadikan Kandidat Peraih" onClick={() => promoteToCandidate(sub.id)}>
                              <Award className="w-4 h-4 text-amber-500" />
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
