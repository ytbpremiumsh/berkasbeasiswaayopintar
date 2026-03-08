import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, CheckCircle, XCircle, Download, Trophy, Heart, Wallet, Globe, ExternalLink, FileText, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";
type SubmissionStatus = "menunggu" | "diverifikasi" | "ditolak" | "kandidat_peraih";

const categoryConfig: Record<ScholarshipCategory, { label: string; icon: any; gradient: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, gradient: "from-amber-500 to-orange-500" },
  yatim: { label: "Yatim", icon: Heart, gradient: "from-rose-500 to-pink-500" },
  ekonomi: { label: "Ekonomi", icon: Wallet, gradient: "from-emerald-500 to-teal-500" },
  umum: { label: "Umum", icon: Globe, gradient: "from-blue-500 to-indigo-500" },
};

const statusConfig: Record<SubmissionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  menunggu: { label: "Menunggu", variant: "secondary" },
  diverifikasi: { label: "Diverifikasi", variant: "default" },
  ditolak: { label: "Ditolak", variant: "destructive" },
  kandidat_peraih: { label: "Kandidat Peraih", variant: "outline" },
};

interface Submission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  category: ScholarshipCategory;
  applicant_status: string;
  institution_name: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  verified_by: string | null;
  verified_at: string | null;
  token_code?: string;
  verified_by_name?: string;
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
  scholarship_tokens?: { token_code: string };
}

interface AllSubmissionsProps {
  onStatusUpdate: () => void;
  programId?: string | null;
}

export function AllSubmissions({ onStatusUpdate, programId }: AllSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<"all" | ScholarshipCategory>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | SubmissionStatus>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [programId]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("scholarship_submissions")
        .select(`
          *,
          scholarship_tokens!token_id (token_code)
        `)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      const verifiedByIds = data?.map(s => s.verified_by).filter(Boolean) || [];
      let profileMap = new Map();
      
      if (verifiedByIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", verifiedByIds);

        profileMap = new Map(profiles?.map(p => [p.id, p.full_name || p.email]) || []);
      }

      const subsWithDetails = data?.map(s => ({
        ...s,
        token_code: s.scholarship_tokens?.token_code || "Unknown",
        verified_by_name: s.verified_by ? profileMap.get(s.verified_by) || "Admin" : undefined
      })) || [];

      setSubmissions(subsWithDetails);
      setSelectedIds(new Set());
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({ title: "Gagal memuat data", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: SubmissionStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const updateData: any = { status };
      if (status === "diverifikasi" || status === "ditolak") {
        updateData.verified_by = user?.id;
        updateData.verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("scholarship_submissions")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({ title: `Status diperbarui menjadi ${statusConfig[status].label}` });
      fetchSubmissions();
      onStatusUpdate();
      setSelectedSubmission(null);
    } catch (error: any) {
      toast({ title: "Gagal memperbarui status", description: error.message, variant: "destructive" });
    }
  };

  const deleteSubmissions = async (ids: string[]) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("scholarship_submissions")
        .delete()
        .in("id", ids);

      if (error) throw error;

      toast({ title: "Berhasil dihapus", description: `${ids.length} pengajuan telah dihapus` });
      fetchSubmissions();
      onStatusUpdate();
    } catch (error: any) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSubmissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubmissions.map(s => s.id)));
    }
  };

  const exportToExcel = () => {
    if (filteredSubmissions.length === 0) {
      toast({ title: "Tidak ada data untuk diexport", variant: "destructive" });
      return;
    }

    const exportData = filteredSubmissions.map(sub => ({
      "Nama Lengkap": sub.full_name,
      "Email": sub.email,
      "Telepon": sub.phone || "-",
      "Kategori": categoryConfig[sub.category]?.label || sub.category,
      "Status Pendaftar": sub.applicant_status?.replace("_", " ") || "-",
      "Universitas/Sekolah": sub.institution_name || "-",
      "Status Verifikasi": statusConfig[sub.status]?.label || sub.status,
      "Kode Token": sub.token_code,
      "Tanggal Submit": new Date(sub.submitted_at).toLocaleDateString("id-ID"),
      "Diverifikasi Oleh": sub.verified_by_name || "-",
      "Tanggal Verifikasi": sub.verified_at ? new Date(sub.verified_at).toLocaleDateString("id-ID") : "-",
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
    XLSX.utils.book_append_sheet(wb, ws, "Semua Pengajuan");
    XLSX.writeFile(wb, `semua_pengajuan_${new Date().toISOString().split("T")[0]}.xlsx`);
    
    toast({ title: "Export berhasil", description: `${filteredSubmissions.length} data berhasil diexport` });
  };

  const stats = {
    total: submissions.length,
    menunggu: submissions.filter(s => s.status === "menunggu").length,
    diverifikasi: submissions.filter(s => s.status === "diverifikasi").length,
    ditolak: submissions.filter(s => s.status === "ditolak").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Semua Data Pengajuan
        </h1>
        <p className="text-muted-foreground">Lihat dan koreksi semua pengajuan dari seluruh kategori</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.menunggu}</p>
                <p className="text-xs text-muted-foreground">Menunggu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.diverifikasi}</p>
                <p className="text-xs text-muted-foreground">Diverifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ditolak}</p>
                <p className="text-xs text-muted-foreground">Ditolak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Data Pengajuan</CardTitle>
              <CardDescription>
                Menampilkan {filteredSubmissions.length} dari {submissions.length} pengajuan
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Hapus ({selectedIds.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus {selectedIds.size} Pengajuan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin menghapus {selectedIds.size} pengajuan yang dipilih?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteSubmissions(Array.from(selectedIds))}
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {(Object.keys(categoryConfig) as ScholarshipCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>{categoryConfig[cat].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="all">Semua Status</SelectItem>
                  {(Object.keys(statusConfig) as SubmissionStatus[]).map(status => (
                    <SelectItem key={status} value={status}>{statusConfig[status].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada data pengajuan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Korektor</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub, idx) => {
                    const catConfig = categoryConfig[sub.category];
                    const statConfig = statusConfig[sub.status];
                    const Icon = catConfig?.icon || Globe;

                    return (
                      <TableRow key={sub.id} data-state={selectedIds.has(sub.id) ? "selected" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(sub.id)}
                            onCheckedChange={() => toggleSelect(sub.id)}
                          />
                        </TableCell>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.full_name}</p>
                            <p className="text-xs text-muted-foreground">{sub.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Icon className="w-3 h-3" />
                            {catConfig?.label || sub.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {sub.token_code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statConfig?.variant}>{statConfig?.label || sub.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {sub.verified_by_name ? (
                            <div className="text-sm">
                              <p>{sub.verified_by_name}</p>
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
                        <TableCell className="text-sm">
                          {new Date(sub.submitted_at).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setSelectedSubmission(sub)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Detail Pengajuan</DialogTitle>
                                </DialogHeader>
                                {selectedSubmission && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div><span className="text-muted-foreground">Nama:</span> <strong>{selectedSubmission.full_name}</strong></div>
                                      <div><span className="text-muted-foreground">Email:</span> <strong>{selectedSubmission.email}</strong></div>
                                      <div><span className="text-muted-foreground">Telepon:</span> <strong>{selectedSubmission.phone || "-"}</strong></div>
                                      <div><span className="text-muted-foreground">Kategori:</span> <strong className="capitalize">{categoryConfig[selectedSubmission.category]?.label}</strong></div>
                                      <div><span className="text-muted-foreground">Status Pendaftar:</span> <strong className="capitalize">{selectedSubmission.applicant_status?.replace("_", " ")}</strong></div>
                                      <div><span className="text-muted-foreground">Institusi:</span> <strong>{selectedSubmission.institution_name || "-"}</strong></div>
                                      <div><span className="text-muted-foreground">Kode Token:</span> <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{selectedSubmission.token_code}</code></div>
                                      <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusConfig[selectedSubmission.status]?.variant}>{statusConfig[selectedSubmission.status]?.label}</Badge></div>
                                      {selectedSubmission.verified_by_name && (
                                        <div className="col-span-2">
                                          <span className="text-muted-foreground">Dikoreksi oleh:</span>{" "}
                                          <strong>{selectedSubmission.verified_by_name}</strong>
                                          {selectedSubmission.verified_at && (
                                            <span className="text-muted-foreground ml-2">
                                              ({new Date(selectedSubmission.verified_at).toLocaleString("id-ID")})
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <hr />
                                    <div className="space-y-2">
                                      <h4 className="font-semibold">Berkas</h4>
                                      <div className="grid gap-2 text-sm">
                                        {selectedSubmission.kartu_pelajar_url && <a href={selectedSubmission.kartu_pelajar_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> Kartu Pelajar</a>}
                                        {selectedSubmission.ktm_url && <a href={selectedSubmission.ktm_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> KTM</a>}
                                        {selectedSubmission.cv_url && <a href={selectedSubmission.cv_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> CV</a>}
                                        {selectedSubmission.sertifikat_prestasi_url && <a href={selectedSubmission.sertifikat_prestasi_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> Sertifikat Prestasi</a>}
                                        {selectedSubmission.transkrip_nilai_url && <a href={selectedSubmission.transkrip_nilai_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> Transkrip Nilai</a>}
                                        {selectedSubmission.khs_url && <a href={selectedSubmission.khs_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> KHS</a>}
                                        {selectedSubmission.bukti_penghasilan_url && <a href={selectedSubmission.bukti_penghasilan_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> Bukti Penghasilan</a>}
                                        {selectedSubmission.bukti_listrik_url && <a href={selectedSubmission.bukti_listrik_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> Bukti Listrik</a>}
                                        {selectedSubmission.surat_keterangan_yatim_url && <a href={selectedSubmission.surat_keterangan_yatim_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> Surat Keterangan Yatim</a>}
                                        {selectedSubmission.sktm_url && <a href={selectedSubmission.sktm_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> SKTM</a>}
                                        {selectedSubmission.berkas_pendukung_url && <a href={selectedSubmission.berkas_pendukung_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> Berkas Pendukung</a>}
                                        {selectedSubmission.bukti_struk_url && <a href={selectedSubmission.bukti_struk_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline"><ExternalLink className="w-3 h-3" /> Bukti Struk</a>}
                                      </div>
                                      {selectedSubmission.essay && (
                                        <div className="mt-4">
                                          <h4 className="font-semibold mb-2">Esai</h4>
                                          <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">{selectedSubmission.essay}</p>
                                        </div>
                                      )}
                                      {selectedSubmission.video_tiktok_url && (
                                        <div className="mt-4">
                                          <h4 className="font-semibold mb-2">Video TikTok</h4>
                                          <a href={selectedSubmission.video_tiktok_url} target="_blank" className="text-primary hover:underline">{selectedSubmission.video_tiktok_url}</a>
                                        </div>
                                      )}
                                    </div>
                                    <hr />
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="success" 
                                        onClick={() => updateStatus(selectedSubmission.id, "diverifikasi")}
                                        disabled={selectedSubmission.status === "diverifikasi"}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" /> Verifikasi
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        onClick={() => updateStatus(selectedSubmission.id, "ditolak")}
                                        disabled={selectedSubmission.status === "ditolak"}
                                      >
                                        <XCircle className="w-4 h-4 mr-2" /> Tolak
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Pengajuan?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Pengajuan dari <strong>{sub.full_name}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteSubmissions([sub.id])}
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
