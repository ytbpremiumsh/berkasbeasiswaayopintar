import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { AdsenseAd } from "@/components/AdsenseAd";

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
  isTokenValidated: boolean;
}

const categoryInfo = {
  prestasi: { title: "Beasiswa Prestasi", icon: Trophy, color: "from-amber-500 to-orange-500" },
  yatim: { title: "Beasiswa Yatim", icon: Heart, color: "from-rose-500 to-pink-500" },
  ekonomi: { title: "Beasiswa Ekonomi", icon: Wallet, color: "from-emerald-500 to-teal-500" },
  umum: { title: "Beasiswa Umum", icon: Globe, color: "from-blue-500 to-indigo-500" },
};

interface FormField {
  field_name: string;
  field_label: string;
  is_required: boolean;
  is_active: boolean;
  category: string;
}

const ScholarshipForm = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  
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
    isTokenValidated: false,
  });

  const validCategory = category as ScholarshipCategory;
  const info = categoryInfo[validCategory];

  // Fetch form fields from database
  useEffect(() => {
    const fetchFormFields = async () => {
      if (!validCategory) return;
      
      const { data, error } = await supabase
        .from("form_fields")
        .select("field_name, field_label, is_required, is_active, category")
        .eq("category", validCategory)
        .eq("is_active", true)
        .order("display_order");

      if (!error && data) {
        setFormFields(data);
      }
      setLoadingFields(false);
    };

    fetchFormFields();
  }, [validCategory]);

  // Helper functions to check field status from database
  const isFieldActive = (fieldName: string): boolean => {
    return formFields.some((f) => f.field_name === fieldName);
  };

  const isFieldRequired = (fieldName: string): boolean => {
    const field = formFields.find((f) => f.field_name === fieldName);
    return field?.is_required ?? false;
  };

  const getFieldLabel = (fieldName: string, defaultLabel: string): string => {
    const field = formFields.find((f) => f.field_name === fieldName);
    return field?.field_label || defaultLabel;
  };

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
        return validateRequiredFiles();
      default:
        return true;
    }
  };

  const validateRequiredFiles = () => {
    // Map form data fields to database field names
    const fieldMapping: Record<string, keyof FormData> = {
      kartu_pelajar_url: "kartuPelajarUrl",
      ktm_url: "ktmUrl",
      cv_url: "cvUrl",
      sertifikat_prestasi_url: "sertifikatPrestasiUrl",
      transkrip_nilai_url: "transkripNilaiUrl",
      khs_url: "khsUrl",
      essay: "essay",
      bukti_penghasilan_url: "buktiPenghasilanUrl",
      bukti_listrik_url: "buktiListrikUrl",
      surat_keterangan_yatim_url: "suratKeteranganYatimUrl",
      sktm_url: "sktmUrl",
      video_tiktok_url: "videoTiktokUrl",
      berkas_pendukung_url: "berkasPendukungUrl",
    };

    // Check all required fields based on database configuration
    for (const field of formFields) {
      if (!field.is_required) continue;
      
      const formDataKey = fieldMapping[field.field_name];
      if (!formDataKey) continue;

      // Check if this field applies to current applicant status
      const pelajarOnlyFields = ["kartu_pelajar_url"];
      const mahasiswaOnlyFields = ["ktm_url", "transkrip_nilai_url", "khs_url"];
      
      if (pelajarOnlyFields.includes(field.field_name) && !isPelajar) continue;
      if (mahasiswaOnlyFields.includes(field.field_name) && !isMahasiswa) continue;

      const value = formData[formDataKey];
      if (!value) return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Submit application using edge function for public access
      const { data, error } = await supabase.functions.invoke("submit-scholarship", {
        body: {
          sessionId,
          tokenId: formData.tokenId,
          category: validCategory,
          applicantStatus: formData.applicantStatus,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          kartuPelajarUrl: formData.kartuPelajarUrl || null,
          ktmUrl: formData.ktmUrl || null,
          cvUrl: formData.cvUrl || null,
          sertifikatPrestasiUrl: formData.sertifikatPrestasiUrl || null,
          transkripNilaiUrl: formData.transkripNilaiUrl || null,
          khsUrl: formData.khsUrl || null,
          essay: formData.essay || null,
          buktiPenghasilanUrl: formData.buktiPenghasilanUrl || null,
          buktiListrikUrl: formData.buktiListrikUrl || null,
          suratKeteranganYatimUrl: formData.suratKeteranganYatimUrl || null,
          sktmUrl: formData.sktmUrl || null,
          videoTiktokUrl: formData.videoTiktokUrl || null,
          berkasPendukungUrl: formData.berkasPendukungUrl || null,
          buktiStrukUrl: formData.buktiStrukUrl || null,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      toast({ title: "Berhasil!", description: "Berkas beasiswa Anda telah terkirim." });
      navigate(`/sukses/${validCategory}`);
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({ title: "Gagal mengirim", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Folder for file uploads - use session ID for anonymous users
  const uploadFolder = `public/${sessionId}/${validCategory}`;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-fade-in">
            <TokenValidator
              category={validCategory}
              onValidToken={(id, customerName, customerEmail) => {
                setFormData(prev => ({
                  ...prev,
                  tokenId: id,
                  fullName: customerName || prev.fullName,
                  email: customerEmail || prev.email,
                  isTokenValidated: true,
                }));
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
              <Input 
                placeholder="Masukkan nama lengkap" 
                value={formData.fullName} 
                onChange={(e) => updateFormData("fullName", e.target.value)} 
                readOnly={formData.isTokenValidated && !!formData.fullName}
                className={formData.isTokenValidated && formData.fullName ? "bg-muted cursor-not-allowed" : ""}
              />
              {formData.isTokenValidated && formData.fullName && (
                <p className="text-xs text-muted-foreground">Nama diambil dari data pembelian token</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
              <Input 
                type="email" 
                placeholder="email@contoh.com" 
                value={formData.email} 
                onChange={(e) => updateFormData("email", e.target.value)} 
                readOnly={formData.isTokenValidated && !!formData.email}
                className={formData.isTokenValidated && formData.email ? "bg-muted cursor-not-allowed" : ""}
              />
              {formData.isTokenValidated && formData.email && (
                <p className="text-xs text-muted-foreground">Email diambil dari data pembelian token</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Telepon</label>
              <Input placeholder="08xxxxxxxxxx" value={formData.phone} onChange={(e) => updateFormData("phone", e.target.value)} />
            </div>
          </div>
        );

      case 2:
        if (loadingFields) {
          return (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          );
        }
        
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Kartu Identitas untuk Pelajar */}
            {isPelajar && isFieldActive("kartu_pelajar_url") && (
              <FileUpload
                label={getFieldLabel("kartu_pelajar_url", "Kartu Pelajar / KTA")}
                required={isFieldRequired("kartu_pelajar_url")}
                folder={uploadFolder}
                value={formData.kartuPelajarUrl}
                onUpload={(url) => updateFormData("kartuPelajarUrl", url)}
              />
            )}
            
            {/* Kartu Identitas untuk Mahasiswa */}
            {isMahasiswa && isFieldActive("ktm_url") && (
              <FileUpload
                label={getFieldLabel("ktm_url", "Kartu Tanda Mahasiswa (KTM) / Dokumen Resmi")}
                required={isFieldRequired("ktm_url")}
                folder={uploadFolder}
                value={formData.ktmUrl}
                onUpload={(url) => updateFormData("ktmUrl", url)}
              />
            )}

            {/* CV */}
            {isFieldActive("cv_url") && (
              <FileUpload 
                label={getFieldLabel("cv_url", "Curriculum Vitae (CV)")} 
                required={isFieldRequired("cv_url")} 
                folder={uploadFolder} 
                value={formData.cvUrl} 
                onUpload={(url) => updateFormData("cvUrl", url)} 
              />
            )}

            {/* Sertifikat Prestasi */}
            {isFieldActive("sertifikat_prestasi_url") && (
              <FileUpload 
                label={getFieldLabel("sertifikat_prestasi_url", "Sertifikat Prestasi (Akademik/Non-Akademik)")} 
                required={isFieldRequired("sertifikat_prestasi_url")}
                folder={uploadFolder} 
                value={formData.sertifikatPrestasiUrl} 
                onUpload={(url) => updateFormData("sertifikatPrestasiUrl", url)} 
              />
            )}

            {/* Transkrip Nilai - Mahasiswa only */}
            {isMahasiswa && isFieldActive("transkrip_nilai_url") && (
              <FileUpload 
                label={getFieldLabel("transkrip_nilai_url", "Transkrip Nilai")} 
                required={isFieldRequired("transkrip_nilai_url")}
                folder={uploadFolder} 
                value={formData.transkripNilaiUrl} 
                onUpload={(url) => updateFormData("transkripNilaiUrl", url)} 
              />
            )}

            {/* KHS - Mahasiswa only */}
            {isMahasiswa && isFieldActive("khs_url") && (
              <FileUpload 
                label={getFieldLabel("khs_url", "Kartu Hasil Studi (KHS)")} 
                required={isFieldRequired("khs_url")}
                folder={uploadFolder} 
                value={formData.khsUrl} 
                onUpload={(url) => updateFormData("khsUrl", url)} 
              />
            )}

            {/* Esai */}
            {isFieldActive("essay") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {getFieldLabel("essay", "Esai / Pernyataan Pribadi")} 
                  {isFieldRequired("essay") && <span className="text-destructive">*</span>}
                </label>
                <p className="text-xs text-muted-foreground">Maksimal 500 kata</p>
                <Textarea 
                  placeholder="Tuliskan esai Anda di sini..." 
                  value={formData.essay} 
                  onChange={(e) => updateFormData("essay", e.target.value)} 
                  className="min-h-[200px]" 
                />
                <p className="text-xs text-muted-foreground">{formData.essay.split(/\s+/).filter(Boolean).length}/500 kata</p>
              </div>
            )}

            {/* Bukti Penghasilan */}
            {isFieldActive("bukti_penghasilan_url") && (
              <FileUpload 
                label={getFieldLabel("bukti_penghasilan_url", "Bukti Penghasilan Orang Tua / Wali")} 
                required={isFieldRequired("bukti_penghasilan_url")}
                folder={uploadFolder} 
                value={formData.buktiPenghasilanUrl} 
                onUpload={(url) => updateFormData("buktiPenghasilanUrl", url)} 
              />
            )}

            {/* Bukti Listrik */}
            {isFieldActive("bukti_listrik_url") && (
              <FileUpload 
                label={getFieldLabel("bukti_listrik_url", "Bukti Pembayaran Listrik / Token (Bulan Terakhir)")} 
                required={isFieldRequired("bukti_listrik_url")}
                folder={uploadFolder} 
                value={formData.buktiListrikUrl} 
                onUpload={(url) => updateFormData("buktiListrikUrl", url)} 
              />
            )}

            {/* Surat Keterangan Yatim */}
            {isFieldActive("surat_keterangan_yatim_url") && (
              <FileUpload 
                label={getFieldLabel("surat_keterangan_yatim_url", "Surat Keterangan Yatim / Dokumen Pendukung")} 
                required={isFieldRequired("surat_keterangan_yatim_url")}
                folder={uploadFolder} 
                value={formData.suratKeteranganYatimUrl} 
                onUpload={(url) => updateFormData("suratKeteranganYatimUrl", url)} 
              />
            )}

            {/* SKTM */}
            {isFieldActive("sktm_url") && (
              <FileUpload 
                label={getFieldLabel("sktm_url", "Surat Keterangan Tidak Mampu (SKTM)")} 
                required={isFieldRequired("sktm_url")}
                folder={uploadFolder} 
                value={formData.sktmUrl} 
                onUpload={(url) => updateFormData("sktmUrl", url)} 
              />
            )}

            {/* Video TikTok */}
            {isFieldActive("video_tiktok_url") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {getFieldLabel("video_tiktok_url", "Video TikTok")}
                  {isFieldRequired("video_tiktok_url") && <span className="text-destructive">*</span>}
                </label>
                <p className="text-xs text-muted-foreground">Minimal 1 menit tentang Beasiswa Pendidikan Ayo Pintar</p>
                <Input 
                  placeholder="https://tiktok.com/@username/video/..." 
                  value={formData.videoTiktokUrl} 
                  onChange={(e) => updateFormData("videoTiktokUrl", e.target.value)} 
                />
              </div>
            )}

            {/* Berkas Pendukung */}
            {isFieldActive("berkas_pendukung_url") && (
              <FileUpload 
                label={getFieldLabel("berkas_pendukung_url", "Berkas Pendukung Lainnya")} 
                description={isFieldRequired("berkas_pendukung_url") ? undefined : "Opsional"}
                required={isFieldRequired("berkas_pendukung_url")}
                folder={uploadFolder} 
                value={formData.berkasPendukungUrl} 
                onUpload={(url) => updateFormData("berkasPendukungUrl", url)} 
              />
            )}
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

            {renderStep()}

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => currentStep === 0 ? navigate("/") : setCurrentStep(s => s - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button onClick={() => setCurrentStep(s => s + 1)} disabled={!canProceed()}>
                  Lanjut <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button variant="success" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Kirim Berkas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Content Bottom Ad */}
        <AdsenseAd placement="content_bottom" className="mt-8" />
      </main>
      
      {/* Footer Ad */}
      <AdsenseAd placement="footer" className="container mx-auto px-4 mb-4" />
    </div>
  );
};

export default ScholarshipForm;
