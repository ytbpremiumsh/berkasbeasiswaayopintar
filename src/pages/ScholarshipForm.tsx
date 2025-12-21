import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProgressSteps } from "@/components/ProgressSteps";
import { TokenValidator } from "@/components/TokenValidator";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, Trophy, Heart, Wallet, Globe } from "lucide-react";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";
type ApplicantStatus = "pelajar" | "gap_year" | "mahasiswa";

interface FormData {
  tokenId: string;
  fullName: string;
  email: string;
  phone: string;
  applicantStatus: ApplicantStatus | "";
  kartuPelajarUrl: string;
  ktmUrl: string;
  cvUrl: string;
  sertifikatPrestasiUrl: string;
  transkripNilaiUrl: string;
  khsUrl: string;
  essay: string;
  buktiPenghasilanUrl: string;
  buktiListrikUrl: string;
  suratKeteranganYatimUrl: string;
  sktmUrl: string;
  videoTiktokUrl: string;
  berkasPendukungUrl: string;
  buktiStrukUrl: string;
}

const categoryInfo = {
  prestasi: { title: "Beasiswa Prestasi", icon: Trophy, color: "from-amber-500 to-orange-500" },
  yatim: { title: "Beasiswa Yatim", icon: Heart, color: "from-rose-500 to-pink-500" },
  ekonomi: { title: "Beasiswa Ekonomi", icon: Wallet, color: "from-emerald-500 to-teal-500" },
  umum: { title: "Beasiswa Umum", icon: Globe, color: "from-blue-500 to-indigo-500" },
};

const ScholarshipForm = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState<FormData>({
    tokenId: "",
    fullName: "",
    email: "",
    phone: "",
    applicantStatus: "",
    kartuPelajarUrl: "",
    ktmUrl: "",
    cvUrl: "",
    sertifikatPrestasiUrl: "",
    transkripNilaiUrl: "",
    khsUrl: "",
    essay: "",
    buktiPenghasilanUrl: "",
    buktiListrikUrl: "",
    suratKeteranganYatimUrl: "",
    sktmUrl: "",
    videoTiktokUrl: "",
    berkasPendukungUrl: "",
    buktiStrukUrl: "",
  });

  const validCategory = category as ScholarshipCategory;
  const info = categoryInfo[validCategory];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user?.email) {
        setFormData(prev => ({ ...prev, email: session.user.email || "" }));
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Kategori tidak ditemukan</p>
      </div>
    );
  }

  const Icon = info.icon;
  const steps = ["Validasi Token", "Data Diri", "Unggah Berkas", "Konfirmasi"];

  const isPelajar = formData.applicantStatus === "pelajar" || formData.applicantStatus === "gap_year";
  const isMahasiswa = formData.applicantStatus === "mahasiswa";

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!formData.tokenId;
      case 1:
        return !!formData.fullName && !!formData.email && !!formData.applicantStatus;
      case 2:
        return !!formData.buktiStrukUrl && validateRequiredFiles();
      default:
        return true;
    }
  };

  const validateRequiredFiles = () => {
    if (isPelajar && !formData.kartuPelajarUrl) return false;
    if (isMahasiswa && !formData.ktmUrl) return false;
    
    if (validCategory === "prestasi") {
      if (!formData.cvUrl) return false;
    }
    
    if (validCategory === "yatim" || validCategory === "ekonomi" || validCategory === "umum") {
      if (!formData.essay) return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Harap login terlebih dahulu", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update token status
      await supabase
        .from("scholarship_tokens")
        .update({ status: "digunakan", used_by: user.id, used_at: new Date().toISOString() })
        .eq("id", formData.tokenId);

      // Submit application
      const { error } = await supabase.from("scholarship_submissions").insert({
        user_id: user.id,
        token_id: formData.tokenId,
        category: validCategory as any,
        applicant_status: formData.applicantStatus as any,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        kartu_pelajar_url: formData.kartuPelajarUrl || null,
        ktm_url: formData.ktmUrl || null,
        cv_url: formData.cvUrl || null,
        sertifikat_prestasi_url: formData.sertifikatPrestasiUrl || null,
        transkrip_nilai_url: formData.transkripNilaiUrl || null,
        khs_url: formData.khsUrl || null,
        essay: formData.essay || null,
        bukti_penghasilan_url: formData.buktiPenghasilanUrl || null,
        bukti_listrik_url: formData.buktiListrikUrl || null,
        surat_keterangan_yatim_url: formData.suratKeteranganYatimUrl || null,
        sktm_url: formData.sktmUrl || null,
        video_tiktok_url: formData.videoTiktokUrl || null,
        berkas_pendukung_url: formData.berkasPendukungUrl || null,
        bukti_struk_url: formData.buktiStrukUrl || null,
      } as any);

      if (error) throw error;

      toast({ title: "Berhasil!", description: "Berkas beasiswa Anda telah terkirim." });
      navigate("/sukses");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({ title: "Gagal mengirim", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-fade-in">
            <TokenValidator
              category={validCategory}
              onValidToken={(id, customerName, customerEmail) => {
                updateFormData("tokenId", id);
                if (customerName) updateFormData("fullName", customerName);
                if (customerEmail) updateFormData("email", customerEmail);
              }}
              value={formData.tokenId ? "VALIDATED" : ""}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Pendaftar <span className="text-destructive">*</span></label>
              <Select value={formData.applicantStatus} onValueChange={(v) => updateFormData("applicantStatus", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status Anda" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="pelajar">Pelajar</SelectItem>
                  <SelectItem value="gap_year">Gap Year</SelectItem>
                  <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Lengkap <span className="text-destructive">*</span></label>
              <Input placeholder="Masukkan nama lengkap" value={formData.fullName} onChange={(e) => updateFormData("fullName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
              <Input type="email" placeholder="email@contoh.com" value={formData.email} onChange={(e) => updateFormData("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Telepon</label>
              <Input placeholder="08xxxxxxxxxx" value={formData.phone} onChange={(e) => updateFormData("phone", e.target.value)} />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Kartu Identitas */}
            {isPelajar && (
              <FileUpload
                label="Kartu Pelajar / KTA"
                required
                folder={`${user?.id}/${validCategory}`}
                value={formData.kartuPelajarUrl}
                onUpload={(url) => updateFormData("kartuPelajarUrl", url)}
              />
            )}
            {isMahasiswa && (
              <FileUpload
                label="Kartu Tanda Mahasiswa (KTM) / Dokumen Resmi"
                required
                folder={`${user?.id}/${validCategory}`}
                value={formData.ktmUrl}
                onUpload={(url) => updateFormData("ktmUrl", url)}
              />
            )}

            {/* Prestasi specific */}
            {validCategory === "prestasi" && (
              <>
                <FileUpload label="Curriculum Vitae (CV)" required folder={`${user?.id}/${validCategory}`} value={formData.cvUrl} onUpload={(url) => updateFormData("cvUrl", url)} />
                <FileUpload label="Sertifikat Prestasi (Akademik/Non-Akademik)" folder={`${user?.id}/${validCategory}`} value={formData.sertifikatPrestasiUrl} onUpload={(url) => updateFormData("sertifikatPrestasiUrl", url)} />
                {isMahasiswa && (
                  <>
                    <FileUpload label="Transkrip Nilai" folder={`${user?.id}/${validCategory}`} value={formData.transkripNilaiUrl} onUpload={(url) => updateFormData("transkripNilaiUrl", url)} />
                    <FileUpload label="Kartu Hasil Studi (KHS)" folder={`${user?.id}/${validCategory}`} value={formData.khsUrl} onUpload={(url) => updateFormData("khsUrl", url)} />
                  </>
                )}
              </>
            )}

            {/* Yatim specific */}
            {validCategory === "yatim" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Esai / Pernyataan Pribadi <span className="text-destructive">*</span></label>
                  <p className="text-xs text-muted-foreground">Maksimal 500 kata</p>
                  <Textarea placeholder="Tuliskan esai Anda di sini..." value={formData.essay} onChange={(e) => updateFormData("essay", e.target.value)} className="min-h-[200px]" />
                  <p className="text-xs text-muted-foreground">{formData.essay.split(/\s+/).filter(Boolean).length}/500 kata</p>
                </div>
                <FileUpload label="Bukti Penghasilan Orang Tua / Wali" folder={`${user?.id}/${validCategory}`} value={formData.buktiPenghasilanUrl} onUpload={(url) => updateFormData("buktiPenghasilanUrl", url)} />
                <FileUpload label="Bukti Pembayaran Listrik / Token (Bulan Terakhir)" folder={`${user?.id}/${validCategory}`} value={formData.buktiListrikUrl} onUpload={(url) => updateFormData("buktiListrikUrl", url)} />
                <FileUpload label="Surat Keterangan Yatim / Dokumen Pendukung" required folder={`${user?.id}/${validCategory}`} value={formData.suratKeteranganYatimUrl} onUpload={(url) => updateFormData("suratKeteranganYatimUrl", url)} />
              </>
            )}

            {/* Ekonomi specific */}
            {validCategory === "ekonomi" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Esai / Pernyataan Pribadi <span className="text-destructive">*</span></label>
                  <p className="text-xs text-muted-foreground">Maksimal 500 kata</p>
                  <Textarea placeholder="Tuliskan esai Anda di sini..." value={formData.essay} onChange={(e) => updateFormData("essay", e.target.value)} className="min-h-[200px]" />
                  <p className="text-xs text-muted-foreground">{formData.essay.split(/\s+/).filter(Boolean).length}/500 kata</p>
                </div>
                <FileUpload label="Bukti Penghasilan Orang Tua / Wali" folder={`${user?.id}/${validCategory}`} value={formData.buktiPenghasilanUrl} onUpload={(url) => updateFormData("buktiPenghasilanUrl", url)} />
                <FileUpload label="Bukti Pembayaran Listrik / Token (Bulan Terakhir)" folder={`${user?.id}/${validCategory}`} value={formData.buktiListrikUrl} onUpload={(url) => updateFormData("buktiListrikUrl", url)} />
                <FileUpload label="Surat Keterangan Tidak Mampu (SKTM)" required folder={`${user?.id}/${validCategory}`} value={formData.sktmUrl} onUpload={(url) => updateFormData("sktmUrl", url)} />
              </>
            )}

            {/* Umum specific */}
            {validCategory === "umum" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Esai / Pernyataan Pribadi <span className="text-destructive">*</span></label>
                  <p className="text-xs text-muted-foreground">500-1000 kata</p>
                  <Textarea placeholder="Tuliskan esai Anda di sini..." value={formData.essay} onChange={(e) => updateFormData("essay", e.target.value)} className="min-h-[200px]" />
                  <p className="text-xs text-muted-foreground">{formData.essay.split(/\s+/).filter(Boolean).length}/1000 kata</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video TikTok</label>
                  <p className="text-xs text-muted-foreground">Minimal 1 menit tentang Beasiswa Pendidikan Ayo Pintar</p>
                  <Input placeholder="https://tiktok.com/@username/video/..." value={formData.videoTiktokUrl} onChange={(e) => updateFormData("videoTiktokUrl", e.target.value)} />
                </div>
                <FileUpload label="Sertifikat Prestasi" folder={`${user?.id}/${validCategory}`} value={formData.sertifikatPrestasiUrl} onUpload={(url) => updateFormData("sertifikatPrestasiUrl", url)} />
              </>
            )}

            {/* Common fields */}
            <FileUpload label="Berkas Pendukung Lainnya" description="Opsional" folder={`${user?.id}/${validCategory}`} value={formData.berkasPendukungUrl} onUpload={(url) => updateFormData("berkasPendukungUrl", url)} />
            <FileUpload label="Bukti Struk Telah Memilih Berkas" required folder={`${user?.id}/${validCategory}`} value={formData.buktiStrukUrl} onUpload={(url) => updateFormData("buktiStrukUrl", url)} />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Ringkasan Data</h3>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Kategori:</span><span className="font-medium">{info.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className="font-medium capitalize">{formData.applicantStatus?.replace("_", " ")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Nama:</span><span className="font-medium">{formData.fullName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-medium">{formData.email}</span></div>
                {formData.phone && <div className="flex justify-between"><span className="text-muted-foreground">Telepon:</span><span className="font-medium">{formData.phone}</span></div>}
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">Pastikan semua data sudah benar sebelum mengirim.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card variant="elevated" className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br ${info.color}`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">{info.title}</CardTitle>
            <CardDescription>Lengkapi form berikut untuk mendaftar beasiswa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <ProgressSteps steps={steps} currentStep={currentStep} />
            
            {!user && currentStep > 0 && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-center">
                <p className="text-sm text-warning-foreground">Anda harus <a href="/auth" className="underline font-medium">login</a> untuk melanjutkan pengisian form.</p>
              </div>
            )}

            {renderStep()}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button onClick={() => setCurrentStep(s => s + 1)} disabled={!canProceed()}>
                  Lanjut <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button variant="success" onClick={handleSubmit} disabled={isSubmitting || !user}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Kirim Berkas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ScholarshipForm;
