import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, MonitorPlay, LayoutTemplate } from "lucide-react";

interface AdsenseSetting {
  id: string;
  placement_key: string;
  adsense_code: string | null;
  is_active: boolean;
  description: string | null;
}

const placementLabels: Record<string, { label: string; icon: string }> = {
  header: { label: "Header (Atas Halaman)", icon: "🔝" },
  sidebar: { label: "Sidebar", icon: "📐" },
  content_top: { label: "Atas Konten", icon: "⬆️" },
  content_bottom: { label: "Bawah Konten", icon: "⬇️" },
  footer: { label: "Footer (Bawah Halaman)", icon: "🔚" },
  between_sections: { label: "Antar Section", icon: "📍" },
};

export function AdsenseManager() {
  const [settings, setSettings] = useState<AdsenseSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("adsense_settings")
        .select("*")
        .order("placement_key");

      if (error) throw error;
      setSettings((data as AdsenseSetting[]) || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({ title: "Gagal memuat data", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (id: string, updates: Partial<AdsenseSetting>) => {
    setSavingId(id);
    try {
      const { error } = await supabase
        .from("adsense_settings")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setSettings(prev => 
        prev.map(s => s.id === id ? { ...s, ...updates } : s)
      );

      toast({ title: "Berhasil disimpan" });
    } catch (error: any) {
      console.error("Update error:", error);
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const handleCodeChange = (id: string, code: string) => {
    setSettings(prev => 
      prev.map(s => s.id === id ? { ...s, adsense_code: code } : s)
    );
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    await updateSetting(id, { is_active });
  };

  const handleSave = async (setting: AdsenseSetting) => {
    await updateSetting(setting.id, { adsense_code: setting.adsense_code });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MonitorPlay className="w-6 h-6" />
          Kelola AdSense
        </h1>
        <p className="text-muted-foreground">
          Masukkan kode iklan AdSense untuk ditampilkan di berbagai posisi halaman
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <LayoutTemplate className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Cara Penggunaan</p>
              <p className="text-sm text-muted-foreground mt-1">
                Masukkan kode script AdSense lengkap (termasuk tag {"<script>"} dan {"<ins>"}) ke dalam textarea. 
                Aktifkan toggle untuk menampilkan iklan di posisi yang diinginkan. 
                Iklan akan muncul di halaman utama, pengiriman berkas, cek status, dan halaman publik lainnya.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Grid */}
      <div className="grid gap-4">
        {settings.map((setting) => {
          const placement = placementLabels[setting.placement_key] || { 
            label: setting.placement_key, 
            icon: "📌" 
          };

          return (
            <Card key={setting.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{placement.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{placement.label}</CardTitle>
                      <CardDescription>{setting.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={setting.is_active ? "default" : "secondary"}>
                      {setting.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                    <Switch
                      checked={setting.is_active}
                      onCheckedChange={(checked) => handleToggle(setting.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kode AdSense</Label>
                  <Textarea
                    placeholder={`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX" crossorigin="anonymous"></script>
<ins class="adsbygoogle" ...></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
                    value={setting.adsense_code || ""}
                    onChange={(e) => handleCodeChange(setting.id, e.target.value)}
                    className="min-h-[120px] font-mono text-xs"
                  />
                </div>
                <Button 
                  onClick={() => handleSave(setting)}
                  disabled={savingId === setting.id}
                  size="sm"
                >
                  {savingId === setting.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Simpan Kode
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}