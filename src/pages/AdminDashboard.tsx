import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { FormFieldsManager } from "@/components/admin/FormFieldsManager";
import { SuccessTemplatesManager } from "@/components/admin/SuccessTemplatesManager";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { 
  Trophy, Heart, Wallet, Globe, 
  Eye, CheckCircle, XCircle, Clock, Plus, Loader2, ExternalLink, Download, Menu
} from "lucide-react";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";
type SubmissionStatus = "menunggu" | "diverifikasi" | "ditolak";

const categoryLabels: Record<ScholarshipCategory, { label: string; icon: any; gradient: string; bgLight: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-500/10" },
  yatim: { label: "Yatim", icon: Heart, gradient: "from-rose-500 to-pink-500", bgLight: "bg-rose-500/10" },
  ekonomi: { label: "Ekonomi", icon: Wallet, gradient: "from-emerald-500 to-teal-500", bgLight: "bg-emerald-500/10" },
  umum: { label: "Umum", icon: Globe, gradient: "from-blue-500 to-indigo-500", bgLight: "bg-blue-500/10" },
};

const statusLabels: Record<SubmissionStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  menunggu: { label: "Menunggu", variant: "secondary" },
  diverifikasi: { label: "Diverifikasi", variant: "default" },
  ditolak: { label: "Ditolak", variant: "destructive" },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<ScholarshipCategory>("prestasi");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newTokenCode, setNewTokenCode] = useState("");
  const [newTokenCategory, setNewTokenCategory] = useState<ScholarshipCategory>("prestasi");
  const [isAddingToken, setIsAddingToken] = useState(false);
  
  // Settings
  const [oneSenderApiUrl, setOneSenderApiUrl] = useState("");
  const [oneSenderApiKey, setOneSenderApiKey] = useState("");
  const [oneSenderPhone, setOneSenderPhone] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState("");
  const [mayarApiKey, setMayarApiKey] = useState("");

  // Stats
  const [categoryStats, setCategoryStats] = useState<Record<ScholarshipCategory, { total: number; menunggu: number; diverifikasi: number; ditolak: number }>>({
    prestasi: { total: 0, menunggu: 0, diverifikasi: 0, ditolak: 0 },
    yatim: { total: 0, menunggu: 0, diverifikasi: 0, ditolak: 0 },
    ekonomi: { total: 0, menunggu: 0, diverifikasi: 0, ditolak: 0 },
    umum: { total: 0, menunggu: 0, diverifikasi: 0, ditolak: 0 },
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
      const { data: subs, error: subsError } = await supabase
        .from("scholarship_submissions")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (subsError) throw subsError;
      setSubmissions(subs || []);

      // Calculate stats
      const stats: Record<ScholarshipCategory, { total: number; menunggu: number; diverifikasi: number; ditolak: number }> = {
        prestasi: { total: 0, menunggu: 0, diverifikasi: 0, ditolak: 0 },
        yatim: { total: 0, menunggu: 0, diverifikasi: 0, ditolak: 0 },
        ekonomi: { total: 0, menunggu: 0, diverifikasi: 0, ditolak: 0 },
        umum: { total: 0, menunggu: 0, diverifikasi: 0, ditolak: 0 },
      };

      subs?.forEach(s => {
        const cat = s.category as ScholarshipCategory;
        if (stats[cat]) {
          stats[cat].total++;
          if (s.status === "menunggu") stats[cat].menunggu++;
          if (s.status === "diverifikasi") stats[cat].diverifikasi++;
          if (s.status === "ditolak") stats[cat].ditolak++;
        }
      });

      setCategoryStats(stats);

      const { data: toks, error: toksError } = await supabase
        .from("scholarship_tokens")
        .select("*")
        .order("created_at", { ascending: false });

      if (toksError) throw toksError;
      setTokens(toks || []);

      // Fetch settings
      const { data: settings } = await supabase.from("admin_settings").select("*");
      if (settings) {
        const apiUrl = settings.find(s => s.setting_key === "onesender_api_url");
        const apiKey = settings.find(s => s.setting_key === "onesender_api_key");
        const phone = settings.find(s => s.setting_key === "onesender_phone");
        const template = settings.find(s => s.setting_key === "whatsapp_template");
        const mayar = settings.find(s => s.setting_key === "mayar_api_key");
        if (apiUrl) setOneSenderApiUrl((apiUrl.setting_value as any)?.value || "");
        if (apiKey) setOneSenderApiKey((apiKey.setting_value as any)?.value || "");
        if (phone) setOneSenderPhone((phone.setting_value as any)?.value || "");
        if (template) setWhatsappTemplate((template.setting_value as any)?.value || "");
        if (mayar) setMayarApiKey((mayar.setting_value as any)?.value || "");
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
        { setting_key: "onesender_api_url", setting_value: { value: oneSenderApiUrl } },
        { setting_key: "onesender_api_key", setting_value: { value: oneSenderApiKey } },
        { setting_key: "onesender_phone", setting_value: { value: oneSenderPhone } },
        { setting_key: "whatsapp_template", setting_value: { value: whatsappTemplate } },
        { setting_key: "mayar_api_key", setting_value: { value: mayarApiKey } },
      ];

      for (const setting of settings) {
        await supabase.from("admin_settings").upsert(setting, { onConflict: "setting_key" });
      }

      toast({ title: "Pengaturan disimpan" });
    } catch (error: any) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    }
  };

  const exportToExcel = (category: ScholarshipCategory) => {
    const categoryData = submissions.filter(s => s.category === category);
    
    const exportData = categoryData.map(sub => ({
      "Nama Lengkap": sub.full_name,
      "Email": sub.email,
      "Telepon": sub.phone || "-",
      "Status Pendaftar": sub.applicant_status?.replace("_", " ") || "-",
      "Status": statusLabels[sub.status as SubmissionStatus]?.label || sub.status,
      "Tanggal Submit": new Date(sub.submitted_at).toLocaleDateString("id-ID"),
      "Kartu Pelajar": sub.kartu_pelajar_url || "-",
      "KTM": sub.ktm_url || "-",
      "CV": sub.cv_url || "-",
      "Sertifikat Prestasi": sub.sertifikat_prestasi_url || "-",
      "Transkrip Nilai": sub.transkrip_nilai_url || "-",
      "KHS": sub.khs_url || "-",
      "Esai": sub.essay || "-",
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
    XLSX.utils.book_append_sheet(wb, ws, `Beasiswa ${categoryLabels[category].label}`);
    XLSX.writeFile(wb, `beasiswa_${category}_${new Date().toISOString().split("T")[0]}.xlsx`);
    
    toast({ title: "Export berhasil", description: `Data ${categoryLabels[category].label} telah diexport` });
  };

  const filteredSubmissions = submissions.filter(s => {
    if (s.category !== selectedCategory) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const currentStats = categoryStats[selectedCategory];
  const usedTokens = tokens.filter(t => t.status === "digunakan").length;
  const recentSubmissions = submissions.filter(s => {
    const submitDate = new Date(s.submitted_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return submitDate >= weekAgo;
  }).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <div className={cn("hidden lg:block", sidebarOpen ? "block" : "hidden")}>
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-card border-b p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-bold">Admin Panel</h1>
          <div />
        </header>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
            <div className="fixed left-0 top-0 h-full" onClick={e => e.stopPropagation()}>
              <AdminSidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} onLogout={handleLogout} />
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <AnalyticsDashboard 
              categoryStats={categoryStats} 
              totalTokens={tokens.length}
              usedTokens={usedTokens}
              recentSubmissions={recentSubmissions}
            />
          )}

          {/* Submissions */}
          {activeTab === "submissions" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Data Pengajuan</h1>
                <p className="text-muted-foreground">Kelola pengajuan beasiswa dari semua kategori</p>
              </div>

              {/* Category Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(Object.keys(categoryLabels) as ScholarshipCategory[]).map((cat) => {
                  const config = categoryLabels[cat];
                  const Icon = config.icon;
                  const isActive = selectedCategory === cat;
                  const stats = categoryStats[cat];

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "p-4 rounded-xl transition-all duration-200 text-left group",
                        isActive 
                          ? "bg-card shadow-lg ring-2 ring-primary" 
                          : "bg-card/50 hover:bg-card hover:shadow-md"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform group-hover:scale-105",
                          config.gradient
                        )}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{stats.total}</p>
                          <p className="text-sm text-muted-foreground">{config.label}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Stats for selected category */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", categoryLabels[selectedCategory].gradient)}>
                        {(() => { const Icon = categoryLabels[selectedCategory].icon; return <Icon className="w-5 h-5 text-white" />; })()}
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{currentStats.total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
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
                        <p className="text-2xl font-bold">{currentStats.menunggu}</p>
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
                        <p className="text-2xl font-bold">{currentStats.diverifikasi}</p>
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
                        <p className="text-2xl font-bold">{currentStats.ditolak}</p>
                        <p className="text-xs text-muted-foreground">Ditolak</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Data Pengajuan - {categoryLabels[selectedCategory].label}</CardTitle>
                      <CardDescription>Kelola pengajuan beasiswa {categoryLabels[selectedCategory].label}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent className="bg-card border">
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="menunggu">Menunggu</SelectItem>
                          <SelectItem value="diverifikasi">Diverifikasi</SelectItem>
                          <SelectItem value="ditolak">Ditolak</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => exportToExcel(selectedCategory)}>
                        <Download className="w-4 h-4 mr-2" /> Export Excel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Status Pendaftar</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubmissions.map((sub) => {
                          const stat = statusLabels[sub.status as SubmissionStatus];
                          return (
                            <TableRow key={sub.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{sub.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{sub.email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="capitalize">{sub.applicant_status?.replace("_", " ")}</TableCell>
                              <TableCell>
                                <Badge variant={stat.variant}>{stat.label}</Badge>
                              </TableCell>
                              <TableCell>{new Date(sub.submitted_at).toLocaleDateString("id-ID")}</TableCell>
                              <TableCell>
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
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredSubmissions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Tidak ada data pengajuan
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tokens */}
          {activeTab === "tokens" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Manajemen Token</h1>
                <p className="text-muted-foreground">Kelola kode token untuk validasi pendaftaran</p>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle>Tambah Token Baru</CardTitle>
                    <div className="flex gap-2">
                      <Input placeholder="Kode token baru" value={newTokenCode} onChange={(e) => setNewTokenCode(e.target.value.toUpperCase())} className="w-[160px] uppercase" />
                      <Select value={newTokenCategory} onValueChange={(v) => setNewTokenCategory(v as ScholarshipCategory)}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border">
                          {(Object.keys(categoryLabels) as ScholarshipCategory[]).map((cat) => {
                            const config = categoryLabels[cat];
                            const Icon = config.icon;
                            return (
                              <SelectItem key={cat} value={cat}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  {config.label}
                                </div>
                              </SelectItem>
                            );
                          })}
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
                        const Icon = cat.icon;
                        return (
                          <TableRow key={token.id}>
                            <TableCell className="font-mono font-bold">{token.token_code}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1">
                                <Icon className="w-3 h-3" /> {cat.label}
                              </Badge>
                            </TableCell>
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
            </div>
          )}

          {/* Form Fields */}
          {activeTab === "form-fields" && <FormFieldsManager />}

          {/* Success Templates */}
          {activeTab === "success-templates" && <SuccessTemplatesManager />}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
                <p className="text-muted-foreground">Konfigurasi API dan integrasi</p>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pengaturan Mayar API</CardTitle>
                    <CardDescription>Konfigurasi API Key Mayar untuk validasi token beasiswa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API Key Mayar</label>
                      <Input type="password" placeholder="Masukkan API Key Mayar" value={mayarApiKey} onChange={(e) => setMayarApiKey(e.target.value)} />
                      <p className="text-xs text-muted-foreground">API Key ini digunakan untuk memvalidasi kode token dari Mayar</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pengaturan OneSender (WhatsApp)</CardTitle>
                    <CardDescription>Konfigurasi integrasi WhatsApp untuk notifikasi otomatis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API URL OneSender</label>
                      <Input placeholder="https://api.onesender.com/v1/send" value={oneSenderApiUrl} onChange={(e) => setOneSenderApiUrl(e.target.value)} />
                    </div>
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
                  </CardContent>
                </Card>

                <Button onClick={saveSettings} className="w-full sm:w-auto">Simpan Semua Pengaturan</Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;