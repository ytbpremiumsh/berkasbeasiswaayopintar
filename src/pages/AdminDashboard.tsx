import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  LayoutDashboard, FileText, Users, Settings, LogOut, Trophy, Heart, Wallet, Globe, 
  Eye, CheckCircle, XCircle, Clock, Plus, Loader2, ExternalLink, Key
} from "lucide-react";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";
type SubmissionStatus = "menunggu" | "diverifikasi" | "ditolak";

const categoryLabels: Record<ScholarshipCategory, { label: string; icon: any; color: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, color: "bg-amber-500" },
  yatim: { label: "Yatim", icon: Heart, color: "bg-rose-500" },
  ekonomi: { label: "Ekonomi", icon: Wallet, color: "bg-emerald-500" },
  umum: { label: "Umum", icon: Globe, color: "bg-blue-500" },
};

const statusLabels: Record<SubmissionStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  menunggu: { label: "Menunggu", variant: "secondary" },
  diverifikasi: { label: "Diverifikasi", variant: "default" },
  ditolak: { label: "Ditolak", variant: "destructive" },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newTokenCode, setNewTokenCode] = useState("");
  const [newTokenCategory, setNewTokenCategory] = useState<ScholarshipCategory>("prestasi");
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [oneSenderApiKey, setOneSenderApiKey] = useState("");
  const [oneSenderPhone, setOneSenderPhone] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState("");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    menunggu: 0,
    diverifikasi: 0,
    ditolak: 0,
  });

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login");
      return;
    }

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) {
      toast({ title: "Akses ditolak", description: "Anda bukan admin", variant: "destructive" });
      navigate("/");
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch submissions
      const { data: subs, error: subsError } = await supabase
        .from("scholarship_submissions")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (subsError) throw subsError;
      setSubmissions(subs || []);

      // Calculate stats
      const total = subs?.length || 0;
      const menunggu = subs?.filter(s => s.status === "menunggu").length || 0;
      const diverifikasi = subs?.filter(s => s.status === "diverifikasi").length || 0;
      const ditolak = subs?.filter(s => s.status === "ditolak").length || 0;
      setStats({ total, menunggu, diverifikasi, ditolak });

      // Fetch tokens
      const { data: toks, error: toksError } = await supabase
        .from("scholarship_tokens")
        .select("*")
        .order("created_at", { ascending: false });

      if (toksError) throw toksError;
      setTokens(toks || []);

      // Fetch settings
      const { data: settings } = await supabase
        .from("admin_settings")
        .select("*");

      if (settings) {
        const apiKey = settings.find(s => s.setting_key === "onesender_api_key");
        const phone = settings.find(s => s.setting_key === "onesender_phone");
        const template = settings.find(s => s.setting_key === "whatsapp_template");
        if (apiKey) setOneSenderApiKey((apiKey.setting_value as any)?.value || "");
        if (phone) setOneSenderPhone((phone.setting_value as any)?.value || "");
        if (template) setWhatsappTemplate((template.setting_value as any)?.value || "");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const updateSubmissionStatus = async (id: string, status: SubmissionStatus) => {
    try {
      const { error } = await supabase
        .from("scholarship_submissions")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Status diperbarui" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Gagal memperbarui", description: error.message, variant: "destructive" });
    }
  };

  const addToken = async () => {
    if (!newTokenCode.trim()) return;
    setIsAddingToken(true);
    try {
      const { error } = await supabase.from("scholarship_tokens").insert({
        token_code: newTokenCode.toUpperCase(),
        category: newTokenCategory,
      });

      if (error) throw error;
      toast({ title: "Token ditambahkan" });
      setNewTokenCode("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Gagal menambahkan", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingToken(false);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = [
        { setting_key: "onesender_api_key", setting_value: { value: oneSenderApiKey } },
        { setting_key: "onesender_phone", setting_value: { value: oneSenderPhone } },
        { setting_key: "whatsapp_template", setting_value: { value: whatsappTemplate } },
      ];

      for (const setting of settings) {
        await supabase.from("admin_settings").upsert(setting, { onConflict: "setting_key" });
      }

      toast({ title: "Pengaturan disimpan" });
    } catch (error: any) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Dashboard Admin</h1>
              <p className="text-xs text-muted-foreground">Beasiswa Ayo Pintar</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Keluar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Pengajuan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
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

        {/* Tabs */}
        <Tabs defaultValue="submissions">
          <TabsList className="mb-6">
            <TabsTrigger value="submissions"><FileText className="w-4 h-4 mr-2" /> Data Pengajuan</TabsTrigger>
            <TabsTrigger value="tokens"><Key className="w-4 h-4 mr-2" /> Kode Token</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" /> Pengaturan</TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Data Pengajuan Beasiswa</CardTitle>
                    <CardDescription>Kelola pengajuan beasiswa yang masuk</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
                      <SelectContent className="bg-card border">
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        <SelectItem value="prestasi">Prestasi</SelectItem>
                        <SelectItem value="yatim">Yatim</SelectItem>
                        <SelectItem value="ekonomi">Ekonomi</SelectItem>
                        <SelectItem value="umum">Umum</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent className="bg-card border">
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="menunggu">Menunggu</SelectItem>
                        <SelectItem value="diverifikasi">Diverifikasi</SelectItem>
                        <SelectItem value="ditolak">Ditolak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Status Pendaftar</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((sub) => {
                        const cat = categoryLabels[sub.category as ScholarshipCategory];
                        const stat = statusLabels[sub.status as SubmissionStatus];
                        return (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{sub.full_name}</p>
                                <p className="text-xs text-muted-foreground">{sub.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1">
                                <cat.icon className="w-3 h-3" /> {cat.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{sub.applicant_status?.replace("_", " ")}</TableCell>
                            <TableCell>
                              <Badge variant={stat.variant}>{stat.label}</Badge>
                            </TableCell>
                            <TableCell>{new Date(sub.submitted_at).toLocaleDateString("id-ID")}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(sub)}>
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
                                          <div><span className="text-muted-foreground">Kategori:</span> <strong className="capitalize">{selectedSubmission.category}</strong></div>
                                          <div><span className="text-muted-foreground">Status Pendaftar:</span> <strong className="capitalize">{selectedSubmission.applicant_status?.replace("_", " ")}</strong></div>
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
                                          <Button variant="success" onClick={() => { updateSubmissionStatus(selectedSubmission.id, "diverifikasi"); setSelectedSubmission(null); }}>
                                            <CheckCircle className="w-4 h-4 mr-2" /> Verifikasi
                                          </Button>
                                          <Button variant="destructive" onClick={() => { updateSubmissionStatus(selectedSubmission.id, "ditolak"); setSelectedSubmission(null); }}>
                                            <XCircle className="w-4 h-4 mr-2" /> Tolak
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredSubmissions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Tidak ada data pengajuan
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Manajemen Kode Token</CardTitle>
                    <CardDescription>Kelola kode token untuk validasi pendaftaran</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Kode token baru" value={newTokenCode} onChange={(e) => setNewTokenCode(e.target.value.toUpperCase())} className="w-[160px] uppercase" />
                    <Select value={newTokenCategory} onValueChange={(v) => setNewTokenCategory(v as ScholarshipCategory)}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border">
                        <SelectItem value="prestasi">Prestasi</SelectItem>
                        <SelectItem value="yatim">Yatim</SelectItem>
                        <SelectItem value="ekonomi">Ekonomi</SelectItem>
                        <SelectItem value="umum">Umum</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addToken} disabled={isAddingToken}>
                      {isAddingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Token</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dibuat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token) => {
                      const cat = categoryLabels[token.category as ScholarshipCategory];
                      return (
                        <TableRow key={token.id}>
                          <TableCell className="font-mono font-bold">{token.token_code}</TableCell>
                          <TableCell><Badge variant="outline"><cat.icon className="w-3 h-3 mr-1" /> {cat.label}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={token.status === "valid" ? "default" : token.status === "digunakan" ? "secondary" : "destructive"}>
                              {token.status === "valid" ? "Valid" : token.status === "digunakan" ? "Digunakan" : "Tidak Valid"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(token.created_at).toLocaleDateString("id-ID")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan OneSender (WhatsApp)</CardTitle>
                <CardDescription>Konfigurasi integrasi WhatsApp untuk notifikasi otomatis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key OneSender</label>
                  <Input type="password" placeholder="Masukkan API Key" value={oneSenderApiKey} onChange={(e) => setOneSenderApiKey(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nomor Pengirim</label>
                  <Input placeholder="628xxxxxxxxxx" value={oneSenderPhone} onChange={(e) => setOneSenderPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template Pesan WhatsApp</label>
                  <p className="text-xs text-muted-foreground">Variabel: {"{{nama}}, {{kategori_beasiswa}}, {{status_pendaftar}}, {{tanggal_submit}}"}</p>
                  <Textarea placeholder="Contoh: Halo {{nama}}, pengajuan beasiswa {{kategori_beasiswa}} Anda telah diterima..." value={whatsappTemplate} onChange={(e) => setWhatsappTemplate(e.target.value)} className="min-h-[120px]" />
                </div>
                <Button onClick={saveSettings}>Simpan Pengaturan</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
