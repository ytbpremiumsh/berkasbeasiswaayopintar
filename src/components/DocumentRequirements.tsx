import { FileText, GraduationCap, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

interface DocumentRequirementsProps {
  category: ScholarshipCategory;
}

const categoryColors: Record<ScholarshipCategory, string> = {
  prestasi: "text-amber-500",
  yatim: "text-rose-500",
  ekonomi: "text-emerald-500",
  umum: "text-blue-500",
};

interface FormField {
  field_name: string;
  field_label: string;
  is_required: boolean;
  category: string;
}

// Mapping field_name to display name for document requirements
const fieldNameToDocName: Record<string, string> = {
  kartu_pelajar_url: "Kartu Pelajar / KTA",
  ktm_url: "Kartu Tanda Mahasiswa (KTM)",
  cv_url: "Curriculum Vitae (CV)",
  sertifikat_prestasi_url: "Sertifikat Prestasi",
  transkrip_nilai_url: "Transkrip Nilai",
  khs_url: "Kartu Hasil Studi (KHS)",
  essay: "Esai Pribadi",
  bukti_penghasilan_url: "Bukti Penghasilan Orang Tua/Wali",
  bukti_listrik_url: "Bukti Pembayaran Listrik",
  surat_keterangan_yatim_url: "Surat Keterangan Yatim",
  sktm_url: "SKTM (Surat Keterangan Tidak Mampu)",
  video_tiktok_url: "Video TikTok (min. 1 menit)",
  berkas_pendukung_url: "Berkas Pendukung Lainnya",
};

// Fields that are for pelajar/gap_year only
const pelajarOnlyFields = ["kartu_pelajar_url"];

// Fields that are for mahasiswa only
const mahasiswaOnlyFields = ["ktm_url", "transkrip_nilai_url", "khs_url"];

// Fields that are general (applicable to all)
const generalFields = [
  "cv_url",
  "sertifikat_prestasi_url",
  "essay",
  "bukti_penghasilan_url",
  "bukti_listrik_url",
  "surat_keterangan_yatim_url",
  "sktm_url",
  "video_tiktok_url",
  "berkas_pendukung_url",
];

export function DocumentRequirements({ category }: DocumentRequirementsProps) {
  const accentColor = categoryColors[category];
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFormFields = async () => {
      const { data, error } = await supabase
        .from("form_fields")
        .select("field_name, field_label, is_required, category")
        .eq("category", category)
        .eq("is_active", true)
        .order("display_order");

      if (!error && data) {
        setFormFields(data);
      }
      setLoading(false);
    };

    fetchFormFields();
  }, [category]);

  const getIsRequired = (fieldName: string): boolean => {
    const field = formFields.find((f) => f.field_name === fieldName);
    return field?.is_required ?? false;
  };

  const getDisplayName = (fieldName: string): string => {
    const field = formFields.find((f) => f.field_name === fieldName);
    return field?.field_label || fieldNameToDocName[fieldName] || fieldName;
  };

  const isFieldActive = (fieldName: string): boolean => {
    return formFields.some((f) => f.field_name === fieldName);
  };

  // Filter active fields by type
  const activePelajarFields = pelajarOnlyFields.filter(isFieldActive);
  const activeMahasiswaFields = mahasiswaOnlyFields.filter(isFieldActive);
  const activeGeneralFields = generalFields.filter(isFieldActive);

  if (loading) {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-3 text-sm">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <FileText className="w-4 h-4 text-primary" />
        <span>Berkas yang Harus Disiapkan</span>
      </div>

      <p className="text-xs text-muted-foreground">Format: PDF/JPG/PNG (maks. 5MB)</p>

      <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5 space-y-1">
        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary" />
          Link Google Drive
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Anda dapat mengupload berkas ke <span className="font-medium text-foreground">Google Drive</span> terlebih dahulu, lalu tempelkan link-nya pada form. 
          Pastikan setiap jenis berkas dimasukkan ke <span className="font-medium text-foreground">folder terpisah</span> dan akses file diatur ke <span className="font-medium text-foreground">"Anyone with the link"</span> agar tim kami dapat mengakses berkas Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pelajar / Gap Year */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Pelajar / Gap Year</span>
          </div>
          <ul className="space-y-0.5 text-xs">
            {activePelajarFields.map((fieldName) => (
              <li key={fieldName} className="flex items-start gap-1.5">
                <span className={`${accentColor}`}>•</span>
                <span>
                  {getDisplayName(fieldName)}
                  {getIsRequired(fieldName) && <span className="text-destructive">*</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mahasiswa */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>Mahasiswa</span>
          </div>
          <ul className="space-y-0.5 text-xs">
            {activeMahasiswaFields.map((fieldName) => (
              <li key={fieldName} className="flex items-start gap-1.5">
                <span className={`${accentColor}`}>•</span>
                <span>
                  {getDisplayName(fieldName)}
                  {getIsRequired(fieldName) && <span className="text-destructive">*</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Category-specific */}
      {activeGeneralFields.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>Dokumen Khusus Kategori</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            {activeGeneralFields.map((fieldName) => (
              <li key={fieldName} className="flex items-start gap-1.5">
                <span className={`${accentColor}`}>•</span>
                <span>
                  {getDisplayName(fieldName)}
                  {getIsRequired(fieldName) && <span className="text-destructive">*</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">* Wajib</p>
    </div>
  );
}
