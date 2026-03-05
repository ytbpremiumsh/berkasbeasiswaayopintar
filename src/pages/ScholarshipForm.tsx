import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ProgressSteps } from "@/components/ProgressSteps";
import { TokenValidator } from "@/components/TokenValidator";
import { FileUpload } from "@/components/FileUpload";
import { DynamicFormField } from "@/components/DynamicFormField";
import { FormBanner } from "@/components/FormBanner";
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
  institutionName: string;
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
  field_type: string;
  is_required: boolean;
  is_active: boolean;
  category: string;
  description: string | null;
}

const ScholarshipForm = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
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
    institutionName: "",
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
        .select("field_name, field_label, field_type, is_required, is_active, category, description")
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

  const getFieldType = (fieldName: string): string => {
    const field = formFields.find((f) => f.field_name === fieldName);
    return field?.field_type || "file";
  };

  const getFieldDescription = (fieldName: string): string | null => {
    const field = formFields.find((f) => f.field_name === fieldName);
    return field?.description || null;
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
        return !!formData.fullName && !!formData.email && !!formData.applicantStatus && !!formData.institutionName;
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
          institutionName: formData.institutionName || null,
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
            {formData.applicantStatus && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isMahasiswa ? "Nama Universitas" : "Nama Sekolah"} <span className="text-destructive">*</span>
                </label>
                <Input 
                  placeholder={isMahasiswa ? "Masukkan nama universitas" : "Masukkan nama sekolah"} 
                  value={formData.institutionName} 
                  onChange={(e) => updateFormData("institutionName", e.target.value)} 
                />
              </div>
            )}
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
            {/* Google Drive Instructions */}
            <div className="bg-primary/5 border border-primary/20 rounded-md p-3 space-y-1">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                Link Google Drive
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda dapat mengupload berkas ke <span className="font-medium text-foreground">Google Drive</span> terlebih dahulu, lalu tempelkan link-nya pada form. 
                Pastikan setiap jenis berkas dimasukkan ke <span className="font-medium text-foreground">folder terpisah</span> dan akses file diatur ke <span className="font-medium text-foreground">"Anyone with the link"</span> agar tim kami dapat mengakses berkas Anda.
              </p>
            </div>

            {/* Kartu Identitas untuk Pelajar */}
            {isPelajar && isFieldActive("kartu_pelajar_url") && (
              <DynamicFormField
                fieldName="kartu_pelajar_url"
                label={getFieldLabel("kartu_pelajar_url", "Kartu Pelajar / KTA")}
                fieldType={getFieldType("kartu_pelajar_url")}
                required={isFieldRequired("kartu_pelajar_url")}
                description={getFieldDescription("kartu_pelajar_url")}
                value={formData.kartuPelajarUrl}
                onChange={(url) => updateFormData("kartuPelajarUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}
            
            {/* Kartu Identitas untuk Mahasiswa */}
            {isMahasiswa && isFieldActive("ktm_url") && (
              <DynamicFormField
                fieldName="ktm_url"
                label={getFieldLabel("ktm_url", "Kartu Tanda Mahasiswa (KTM) / Dokumen Resmi")}
                fieldType={getFieldType("ktm_url")}
                required={isFieldRequired("ktm_url")}
                description={getFieldDescription("ktm_url")}
                value={formData.ktmUrl}
                onChange={(url) => updateFormData("ktmUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* CV */}
            {isFieldActive("cv_url") && (
              <DynamicFormField
                fieldName="cv_url"
                label={getFieldLabel("cv_url", "Curriculum Vitae (CV)")}
                fieldType={getFieldType("cv_url")}
                required={isFieldRequired("cv_url")}
                description={getFieldDescription("cv_url")}
                value={formData.cvUrl}
                onChange={(url) => updateFormData("cvUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* Sertifikat Prestasi */}
            {isFieldActive("sertifikat_prestasi_url") && (
              <DynamicFormField
                fieldName="sertifikat_prestasi_url"
                label={getFieldLabel("sertifikat_prestasi_url", "Sertifikat Prestasi (Akademik/Non-Akademik)")}
                fieldType={getFieldType("sertifikat_prestasi_url")}
                required={isFieldRequired("sertifikat_prestasi_url")}
                description={getFieldDescription("sertifikat_prestasi_url")}
                value={formData.sertifikatPrestasiUrl}
                onChange={(url) => updateFormData("sertifikatPrestasiUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* Transkrip Nilai - Mahasiswa only */}
            {isMahasiswa && isFieldActive("transkrip_nilai_url") && (
              <DynamicFormField
                fieldName="transkrip_nilai_url"
                label={getFieldLabel("transkrip_nilai_url", "Transkrip Nilai")}
                fieldType={getFieldType("transkrip_nilai_url")}
                required={isFieldRequired("transkrip_nilai_url")}
                description={getFieldDescription("transkrip_nilai_url")}
                value={formData.transkripNilaiUrl}
                onChange={(url) => updateFormData("transkripNilaiUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* KHS - Mahasiswa only */}
            {isMahasiswa && isFieldActive("khs_url") && (
              <DynamicFormField
                fieldName="khs_url"
                label={getFieldLabel("khs_url", "Kartu Hasil Studi (KHS)")}
                fieldType={getFieldType("khs_url")}
                required={isFieldRequired("khs_url")}
                description={getFieldDescription("khs_url")}
                value={formData.khsUrl}
                onChange={(url) => updateFormData("khsUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* Esai */}
            {isFieldActive("essay") && (
              <DynamicFormField
                fieldName="essay"
                label={getFieldLabel("essay", "Esai / Pernyataan Pribadi")}
                fieldType={getFieldType("essay")}
                required={isFieldRequired("essay")}
                description={getFieldDescription("essay")}
                value={formData.essay}
                onChange={(value) => updateFormData("essay", value)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* Bukti Penghasilan */}
            {isFieldActive("bukti_penghasilan_url") && (
              <DynamicFormField
                fieldName="bukti_penghasilan_url"
                label={getFieldLabel("bukti_penghasilan_url", "Bukti Penghasilan Orang Tua / Wali")}
                fieldType={getFieldType("bukti_penghasilan_url")}
                required={isFieldRequired("bukti_penghasilan_url")}
                description={getFieldDescription("bukti_penghasilan_url")}
                value={formData.buktiPenghasilanUrl}
                onChange={(url) => updateFormData("buktiPenghasilanUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* Bukti Listrik */}
            {isFieldActive("bukti_listrik_url") && (
              <DynamicFormField
                fieldName="bukti_listrik_url"
                label={getFieldLabel("bukti_listrik_url", "Bukti Pembayaran Listrik / Token (Bulan Terakhir)")}
                fieldType={getFieldType("bukti_listrik_url")}
                required={isFieldRequired("bukti_listrik_url")}
                description={getFieldDescription("bukti_listrik_url")}
                value={formData.buktiListrikUrl}
                onChange={(url) => updateFormData("buktiListrikUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* Surat Keterangan Yatim */}
            {isFieldActive("surat_keterangan_yatim_url") && (
              <DynamicFormField
                fieldName="surat_keterangan_yatim_url"
                label={getFieldLabel("surat_keterangan_yatim_url", "Surat Keterangan Yatim / Dokumen Pendukung")}
                fieldType={getFieldType("surat_keterangan_yatim_url")}
                required={isFieldRequired("surat_keterangan_yatim_url")}
                description={getFieldDescription("surat_keterangan_yatim_url")}
                value={formData.suratKeteranganYatimUrl}
                onChange={(url) => updateFormData("suratKeteranganYatimUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* SKTM */}
            {isFieldActive("sktm_url") && (
              <DynamicFormField
                fieldName="sktm_url"
                label={getFieldLabel("sktm_url", "Surat Keterangan Tidak Mampu (SKTM)")}
                fieldType={getFieldType("sktm_url")}
                required={isFieldRequired("sktm_url")}
                description={getFieldDescription("sktm_url")}
                value={formData.sktmUrl}
                onChange={(url) => updateFormData("sktmUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* Video TikTok */}
            {isFieldActive("video_tiktok_url") && (
              <DynamicFormField
                fieldName="video_tiktok_url"
                label={getFieldLabel("video_tiktok_url", "Video TikTok")}
                fieldType={getFieldType("video_tiktok_url")}
                required={isFieldRequired("video_tiktok_url")}
                description={getFieldDescription("video_tiktok_url")}
                value={formData.videoTiktokUrl}
                onChange={(url) => updateFormData("videoTiktokUrl", url)}
                uploadFolder={uploadFolder}
              />
            )}

            {/* Berkas Pendukung */}
            {isFieldActive("berkas_pendukung_url") && (
              <DynamicFormField
                fieldName="berkas_pendukung_url"
                label={getFieldLabel("berkas_pendukung_url", "Berkas Pendukung Lainnya")}
                fieldType={getFieldType("berkas_pendukung_url")}
                required={isFieldRequired("berkas_pendukung_url")}
                description={getFieldDescription("berkas_pendukung_url") || (isFieldRequired("berkas_pendukung_url") ? undefined : "Opsional")}
                value={formData.berkasPendukungUrl}
                onChange={(url) => updateFormData("berkasPendukungUrl", url)}
                uploadFolder={uploadFolder}
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
    <div className={`min-h-screen flex flex-col bg-background ${isEmbed ? 'p-2' : ''}`}>
      <main className={`flex-1 container mx-auto ${isEmbed ? 'px-2 py-4' : 'px-4 py-8'}`}>
        {!isEmbed && <AdsenseAd placement="header" className="mb-6 max-w-2xl mx-auto" />}
        
        {!isEmbed && (
          <div className="max-w-2xl mx-auto">
            <FormBanner category={validCategory} />
          </div>
        )}
        
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

            {!isEmbed && <AdsenseAd placement="between_sections" className="my-4" />}

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => currentStep === 0 ? (isEmbed ? null : navigate("/")) : setCurrentStep(s => s - 1)}
                disabled={currentStep === 0 && isEmbed}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </Button>
              
              {!isEmbed && <AdsenseAd placement="sidebar" className="hidden md:block mx-4" />}
              
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
        
        {!isEmbed && <AdsenseAd placement="content_bottom" className="mt-8 max-w-2xl mx-auto" />}
      </main>
      
      {!isEmbed && <AdsenseAd placement="footer" className="container mx-auto px-4 mb-4" />}
    </div>
  );
};

export default ScholarshipForm;
