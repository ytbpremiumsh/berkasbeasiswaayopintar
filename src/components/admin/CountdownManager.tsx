import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Clock, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CountdownSettings {
  value: string;
  title: string;
  enabled: boolean;
}

export function CountdownManager() {
  const [settings, setSettings] = useState<CountdownSettings>({
    value: "",
    title: "Pendaftaran Beasiswa",
    enabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings.value) return;

    const calculateTimeLeft = () => {
      const targetDate = new Date(settings.value).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setPreviewTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setPreviewTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [settings.value]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("setting_key", "countdown_date")
        .maybeSingle();

      if (!error && data?.setting_value) {
        const settingValue = data.setting_value as unknown as CountdownSettings;
        setSettings({
          value: settingValue.value || "",
          title: settingValue.title || "Pendaftaran Beasiswa",
          enabled: settingValue.enabled || false,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const settingValue = {
        value: settings.value,
        title: settings.title,
        enabled: settings.enabled,
      };
      
      const { error } = await supabase
        .from("admin_settings")
        .update({
          setting_value: settingValue,
        })
        .eq("setting_key", "countdown_date");

      if (error) throw error;
      toast({ title: "Pengaturan countdown berhasil disimpan" });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({ title: "Gagal menyimpan pengaturan", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg w-12 h-12 flex items-center justify-center shadow-lg">
        <span className="text-lg font-bold">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan Countdown</h1>
        <p className="text-muted-foreground">Atur countdown timer yang ditampilkan di halaman utama</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Countdown Timer</CardTitle>
              <CardDescription>Tampilkan hitung mundur menuju tanggal tertentu</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Aktifkan Countdown</p>
              <p className="text-sm text-muted-foreground">Tampilkan countdown di halaman utama</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Judul Countdown</label>
            <Input
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Pendaftaran Beasiswa"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tanggal dan Waktu Target</label>
            <Input
              type="datetime-local"
              value={settings.value}
              onChange={(e) => setSettings(prev => ({ ...prev, value: e.target.value }))}
            />
            {settings.value && (
              <p className="text-xs text-muted-foreground">
                Target: {new Date(settings.value).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan Pengaturan
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!settings.value}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Preview Countdown</DialogTitle>
                </DialogHeader>
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
                  <div className="flex items-center justify-center gap-2 text-primary mb-4">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">{settings.title}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <TimeUnit value={previewTimeLeft.days} label="Hari" />
                    <span className="text-xl font-bold text-primary/50">:</span>
                    <TimeUnit value={previewTimeLeft.hours} label="Jam" />
                    <span className="text-xl font-bold text-primary/50">:</span>
                    <TimeUnit value={previewTimeLeft.minutes} label="Menit" />
                    <span className="text-xl font-bold text-primary/50">:</span>
                    <TimeUnit value={previewTimeLeft.seconds} label="Detik" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
