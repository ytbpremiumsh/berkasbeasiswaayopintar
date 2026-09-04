import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function AdministrationResultsManager() {
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPublicationStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_settings")
          .select("setting_value")
          .eq("setting_key", "administration_results_page")
          .maybeSingle();

        if (error) throw error;
        const value = data?.setting_value as { is_published?: boolean } | null;
        setIsPublished(value?.is_published === true);
      } catch (error) {
        console.error("Error fetching administration results setting:", error);
        toast({ title: "Gagal memuat status publikasi", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicationStatus();
  }, []);

  const handlePublicationChange = async (checked: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert(
          {
            setting_key: "administration_results_page",
            setting_value: { is_published: checked },
          },
          { onConflict: "setting_key" },
        );

      if (error) throw error;
      setIsPublished(checked);
      toast({ title: checked ? "Pengumuman dipublikasikan" : "Pengumuman disembunyikan" });
    } catch (error: any) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Pengumuman Lolos Administrasi</h1>
        <p className="text-sm text-muted-foreground">Atur publikasi peserta yang pengajuannya telah diverifikasi</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Status Publikasi</CardTitle>
              <CardDescription>Tentukan apakah daftar peserta dapat dilihat oleh publik</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Publikasikan Pengumuman</p>
              <p className="text-xs text-muted-foreground">
                {isPublished
                  ? "Daftar peserta lolos administrasi dapat dilihat oleh publik"
                  : "Daftar peserta masih disembunyikan dari publik"}
              </p>
            </div>
            <Switch checked={isPublished} onCheckedChange={handlePublicationChange} disabled={isSaving} />
          </div>

          <Button variant="outline" asChild>
            <Link to="/lolos-administrasi" target="_blank" rel="noreferrer">
              Lihat Halaman Publik
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
