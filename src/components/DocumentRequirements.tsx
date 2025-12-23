import { FileText, GraduationCap, Users } from "lucide-react";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";
type ApplicantStatus = "pelajar" | "gap_year" | "mahasiswa";

interface DocumentRequirementsProps {
  category: ScholarshipCategory;
}

const categoryColors: Record<ScholarshipCategory, string> = {
  prestasi: "text-amber-500",
  yatim: "text-rose-500",
  ekonomi: "text-emerald-500",
  umum: "text-blue-500",
};

interface DocumentItem {
  name: string;
  required: boolean;
  applicantTypes: ApplicantStatus[];
}

const pelajarDocuments: DocumentItem[] = [
  { name: "Kartu Pelajar / KTA", required: true, applicantTypes: ["pelajar", "gap_year"] },
];

const mahasiswaDocuments: DocumentItem[] = [
  { name: "Kartu Tanda Mahasiswa (KTM)", required: true, applicantTypes: ["mahasiswa"] },
];

const categoryDocuments: Record<ScholarshipCategory, { general: DocumentItem[]; pelajar: DocumentItem[]; mahasiswa: DocumentItem[] }> = {
  prestasi: {
    general: [
      { name: "Curriculum Vitae (CV)", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Sertifikat Prestasi", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
    ],
    pelajar: [],
    mahasiswa: [
      { name: "Transkrip Nilai", required: false, applicantTypes: ["mahasiswa"] },
      { name: "Kartu Hasil Studi (KHS)", required: false, applicantTypes: ["mahasiswa"] },
    ],
  },
  yatim: {
    general: [
      { name: "Esai Pribadi (maks. 500 kata)", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Surat Keterangan Yatim", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Bukti Penghasilan Orang Tua/Wali", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Bukti Pembayaran Listrik", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
    ],
    pelajar: [],
    mahasiswa: [],
  },
  ekonomi: {
    general: [
      { name: "Esai Pribadi (maks. 500 kata)", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "SKTM (Surat Keterangan Tidak Mampu)", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Bukti Penghasilan Orang Tua/Wali", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Bukti Pembayaran Listrik", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
    ],
    pelajar: [],
    mahasiswa: [],
  },
  umum: {
    general: [
      { name: "Esai Pribadi (500-1000 kata)", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Video TikTok (min. 1 menit)", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Sertifikat Prestasi", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
    ],
    pelajar: [],
    mahasiswa: [],
  },
};

export function DocumentRequirements({ category }: DocumentRequirementsProps) {
  const accentColor = categoryColors[category];
  const docs = categoryDocuments[category];

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-3 text-sm">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <FileText className="w-4 h-4 text-primary" />
        <span>Berkas yang Harus Disiapkan</span>
      </div>
      
      <p className="text-xs text-muted-foreground">Format: PDF/JPG/PNG (maks. 5MB)</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pelajar / Gap Year */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Pelajar / Gap Year</span>
          </div>
          <ul className="space-y-0.5 text-xs">
            {pelajarDocuments.map((doc, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className={`${accentColor}`}>•</span>
                <span>{doc.name}{doc.required && <span className="text-destructive">*</span>}</span>
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
            {mahasiswaDocuments.map((doc, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className={`${accentColor}`}>•</span>
                <span>{doc.name}{doc.required && <span className="text-destructive">*</span>}</span>
              </li>
            ))}
            {docs.mahasiswa.map((doc, i) => (
              <li key={`m-${i}`} className="flex items-start gap-1.5">
                <span className={`${accentColor}`}>•</span>
                <span>{doc.name}{doc.required && <span className="text-destructive">*</span>}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Category-specific */}
      {docs.general.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>Dokumen Khusus Kategori</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            {docs.general.map((doc, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className={`${accentColor}`}>•</span>
                <span>{doc.name}{doc.required && <span className="text-destructive">*</span>}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">* Wajib</p>
    </div>
  );
}
