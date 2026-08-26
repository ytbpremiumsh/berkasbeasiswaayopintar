import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FILE_FIELDS: { key: string; label: string }[] = [
  { key: "kartu_pelajar_url", label: "Kartu Pelajar" },
  { key: "ktm_url", label: "Kartu Tanda Mahasiswa (KTM)" },
  { key: "cv_url", label: "Curriculum Vitae (CV)" },
  { key: "sertifikat_prestasi_url", label: "Sertifikat Prestasi" },
  { key: "transkrip_nilai_url", label: "Transkrip Nilai" },
  { key: "khs_url", label: "Kartu Hasil Studi (KHS)" },
  { key: "bukti_penghasilan_url", label: "Bukti Penghasilan" },
  { key: "bukti_listrik_url", label: "Bukti Pembayaran Listrik" },
  { key: "surat_keterangan_yatim_url", label: "Surat Keterangan Yatim" },
  { key: "sktm_url", label: "SKTM" },
  { key: "video_tiktok_url", label: "Video TikTok" },
  { key: "berkas_pendukung_url", label: "Berkas Pendukung" },
  { key: "bukti_struk_url", label: "Bukti Struk" },
];

interface SubmissionFilesProps {
  submission: Record<string, any>;
  category: string;
}

interface FieldMeta {
  field_name: string;
  field_label: string;
  is_required: boolean;
  display_order: number;
}

export function SubmissionFiles({ submission, category }: SubmissionFilesProps) {
  const [meta, setMeta] = useState<FieldMeta[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("form_fields")
        .select("field_name, field_label, is_required, display_order")
        .eq("category", category)
        .eq("is_active", true)
        .order("display_order");
      if (active && data) setMeta(data as FieldMeta[]);
    };
    load();
    return () => {
      active = false;
    };
  }, [category]);

  // Fields configured for this category (fallback: show all known file fields)
  const configured = meta.filter((m) => FILE_FIELDS.some((f) => f.key === m.field_name));

  const rows =
    configured.length > 0
      ? configured.map((m) => ({
          key: m.field_name,
          label: m.field_label || FILE_FIELDS.find((f) => f.key === m.field_name)?.label || m.field_name,
          required: m.is_required,
        }))
      : FILE_FIELDS.filter((f) => submission[f.key]).map((f) => ({
          key: f.key,
          label: f.label,
          required: false,
        }));

  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Berkas</h4>
      <div className="grid gap-2 text-sm">
        {rows.map((row) => {
          const value = submission[row.key] as string | null;
          return (
            <div
              key={row.key}
              className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-2.5"
            >
              <div className="flex items-center gap-2 font-medium text-foreground">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Lampiran {row.label}</span>
                <Badge variant={row.required ? "destructive" : "secondary"} className="text-[10px]">
                  {row.required ? "Wajib" : "Opsional"}
                </Badge>
              </div>
              {value ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline break-all pl-5"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span>{value}</span>
                </a>
              ) : (
                <span className="pl-5 text-muted-foreground italic">Tidak diisi</span>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <span className="text-muted-foreground">Tidak ada berkas yang dikonfigurasi.</span>
        )}
      </div>
    </div>
  );
}
