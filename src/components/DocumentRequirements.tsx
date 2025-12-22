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
  description: string;
  required: boolean;
  applicantTypes: ApplicantStatus[];
}

const baseDocuments: DocumentItem[] = [
  {
    name: "Bukti Struk/Pembayaran",
    description: "Bukti telah memilih berkas beasiswa",
    required: true,
    applicantTypes: ["pelajar", "gap_year", "mahasiswa"],
  },
];

const pelajarDocuments: DocumentItem[] = [
  {
    name: "Kartu Pelajar / KTA",
    description: "Kartu identitas sebagai pelajar aktif",
    required: true,
    applicantTypes: ["pelajar", "gap_year"],
  },
];

const mahasiswaDocuments: DocumentItem[] = [
  {
    name: "Kartu Tanda Mahasiswa (KTM)",
    description: "Kartu identitas sebagai mahasiswa aktif",
    required: true,
    applicantTypes: ["mahasiswa"],
  },
];

const categoryDocuments: Record<ScholarshipCategory, { general: DocumentItem[]; pelajar: DocumentItem[]; mahasiswa: DocumentItem[] }> = {
  prestasi: {
    general: [
      { name: "Curriculum Vitae (CV)", description: "CV terbaru dengan format yang rapi", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Sertifikat Prestasi", description: "Sertifikat akademik atau non-akademik", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
    ],
    pelajar: [],
    mahasiswa: [
      { name: "Transkrip Nilai", description: "Transkrip nilai terakhir", required: false, applicantTypes: ["mahasiswa"] },
      { name: "Kartu Hasil Studi (KHS)", description: "KHS semester terakhir", required: false, applicantTypes: ["mahasiswa"] },
    ],
  },
  yatim: {
    general: [
      { name: "Esai Pribadi", description: "Tulisan tentang diri dan motivasi (maks. 500 kata)", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Surat Keterangan Yatim", description: "Dari kelurahan/RT/RW", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Bukti Penghasilan Orang Tua/Wali", description: "Slip gaji atau surat keterangan penghasilan", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Bukti Pembayaran Listrik", description: "Struk listrik bulan terakhir", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
    ],
    pelajar: [],
    mahasiswa: [],
  },
  ekonomi: {
    general: [
      { name: "Esai Pribadi", description: "Tulisan tentang diri dan motivasi (maks. 500 kata)", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Surat Keterangan Tidak Mampu (SKTM)", description: "Dari kelurahan/kecamatan", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Bukti Penghasilan Orang Tua/Wali", description: "Slip gaji atau surat keterangan penghasilan", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Bukti Pembayaran Listrik", description: "Struk listrik bulan terakhir", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
    ],
    pelajar: [],
    mahasiswa: [],
  },
  umum: {
    general: [
      { name: "Esai Pribadi", description: "Tulisan tentang diri dan motivasi (500-1000 kata)", required: true, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Video TikTok", description: "Video minimal 1 menit tentang Beasiswa Ayo Pintar", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
      { name: "Sertifikat Prestasi", description: "Sertifikat akademik atau non-akademik jika ada", required: false, applicantTypes: ["pelajar", "gap_year", "mahasiswa"] },
    ],
    pelajar: [],
    mahasiswa: [],
  },
};

export function DocumentRequirements({ category }: DocumentRequirementsProps) {
  const accentColor = categoryColors[category];
  const docs = categoryDocuments[category];

  const renderDocumentList = (title: string, icon: React.ReactNode, documents: DocumentItem[], applicantType?: ApplicantStatus) => {
    const filteredDocs = documents.filter(doc => 
      !applicantType || doc.applicantTypes.includes(applicantType)
    );

    if (filteredDocs.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-medium text-foreground">
          {icon}
          <span>{title}</span>
        </div>
        <ul className="space-y-2 ml-6">
          {filteredDocs.map((doc, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className={`mt-1 ${accentColor}`}>•</span>
              <div>
                <span className="font-medium">{doc.name}</span>
                {doc.required && <span className="text-destructive ml-1">*</span>}
                <p className="text-xs text-muted-foreground">{doc.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <FileText className="w-5 h-5 text-primary" />
        <span>Berkas yang Harus Disiapkan</span>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Pastikan Anda telah menyiapkan berkas dalam format <strong>PDF/JPG/PNG</strong> (maks. 5MB):
      </p>

      <div className="space-y-4">
        {/* Base Documents - All applicants */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <FileText className="w-4 h-4" />
            <span>Dokumen Wajib (Semua Jenjang)</span>
          </div>
          <ul className="space-y-2 ml-6">
            {baseDocuments.map((doc, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className={`mt-1 ${accentColor}`}>•</span>
                <div>
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-destructive ml-1">*</span>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pelajar / Gap Year Documents */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 font-medium text-foreground mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>Untuk Pelajar / Gap Year</span>
          </div>
          <ul className="space-y-2 ml-6">
            {pelajarDocuments.map((doc, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className={`mt-1 ${accentColor}`}>•</span>
                <div>
                  <span className="font-medium">{doc.name}</span>
                  {doc.required && <span className="text-destructive ml-1">*</span>}
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </li>
            ))}
            {docs.pelajar.map((doc, index) => (
              <li key={`pelajar-${index}`} className="flex items-start gap-2">
                <span className={`mt-1 ${accentColor}`}>•</span>
                <div>
                  <span className="font-medium">{doc.name}</span>
                  {doc.required && <span className="text-destructive ml-1">*</span>}
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Mahasiswa Documents */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 font-medium text-foreground mb-2">
            <Users className="w-4 h-4" />
            <span>Untuk Mahasiswa</span>
          </div>
          <ul className="space-y-2 ml-6">
            {mahasiswaDocuments.map((doc, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className={`mt-1 ${accentColor}`}>•</span>
                <div>
                  <span className="font-medium">{doc.name}</span>
                  {doc.required && <span className="text-destructive ml-1">*</span>}
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </li>
            ))}
            {docs.mahasiswa.map((doc, index) => (
              <li key={`mahasiswa-${index}`} className="flex items-start gap-2">
                <span className={`mt-1 ${accentColor}`}>•</span>
                <div>
                  <span className="font-medium">{doc.name}</span>
                  {doc.required && <span className="text-destructive ml-1">*</span>}
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Category-specific general documents */}
        {docs.general.length > 0 && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 font-medium text-foreground mb-2">
              <FileText className="w-4 h-4" />
              <span>Dokumen Khusus Kategori Ini</span>
            </div>
            <ul className="space-y-2 ml-6">
              {docs.general.map((doc, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className={`mt-1 ${accentColor}`}>•</span>
                  <div>
                    <span className="font-medium">{doc.name}</span>
                    {doc.required && <span className="text-destructive ml-1">*</span>}
                    <p className="text-xs text-muted-foreground">{doc.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground italic">
        * Wajib diisi
      </p>
    </div>
  );
}
