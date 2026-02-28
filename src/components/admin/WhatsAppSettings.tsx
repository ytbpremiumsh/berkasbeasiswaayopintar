import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Loader2, Save, MessageCircle, Info, Send, CheckCircle, XCircle, Clock, BarChart3 } from "lucide-react";

interface SettingValue {
  value: string | boolean;
}

interface WhatsAppLog {
  id: string;
  recipient_phone: string;
  recipient_name: string | null;
  message: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface DailyStats {
  date: string; // YYYY-MM-DD
  success: number;
  failed: number;
  total: number;
}

function onlyDigits(input: string) {
  return (input || "").replace(/\D/g, "");
}

function normalizeIndoPhone(input: string) {
  const digits = onlyDigits(input);
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function WhatsAppSettings() {
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [phone, setPhone] = useState("");
  const [template, setTemplate] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  const variablesList = [
    { code: "{{nama}}", description: "Nama lengkap pendaftar" },
    { code: "{{kategori_beasiswa}}", description: "Kategori beasiswa (Prestasi/Yatim/Ekonomi/Umum)" },
    { code: "{{status_pendaftar}}", description: "Status pendaftar (Pelajar/Gap Year/Mahasiswa)" },
    { code: "{{tanggal_submit}}", description: "Tanggal pengiriman form" },
    { code: "{{token}}", description: "Kode token beasiswa" },
  ];

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .in("setting_key", ["onesender_api_url", "onesender_api_key", "onesender_phone", "whatsapp_template", "whatsapp_enabled"]);

      if (error) throw error;

      data?.forEach((setting) => {
        const settingValue = setting.setting_value as unknown as SettingValue;
        const value = settingValue?.value;
        switch (setting.setting_key) {
          case "onesender_api_url":
            setApiUrl(String(value || ""));
            break;
          case "onesender_api_key":
            setApiKey(String(value || ""));
            break;
          case "onesender_phone":
            setPhone(String(value || ""));
            break;
          case "whatsapp_template":
            setTemplate(String(value || ""));
            break;
          case "whatsapp_enabled":
            setIsEnabled(value === true || value === "true");
            break;
        }
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      // 1) Table (last 50)
      const { data, error } = await supabase
        .from("whatsapp_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);

      // 2) Stats (7 days)
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);

      const { data: statsLogs, error: statsError } = await supabase
        .from("whatsapp_logs")
        .select("status, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      if (statsError) throw statsError;

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        return d.toISOString().split("T")[0];
      });

      const stats = last7Days.map((date) => {
        const dayLogs = (statsLogs || []).filter((log: any) => String(log.created_at).startsWith(date));
        return {
          date,
          success: dayLogs.filter((l: any) => l.status === "success").length,
          failed: dayLogs.filter((l: any) => l.status === "failed").length,
          total: dayLogs.length,
        };
      });

      setDailyStats(stats);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { setting_key: "onesender_api_url", setting_value: { value: apiUrl } },
        { setting_key: "onesender_api_key", setting_value: { value: apiKey } },
        { setting_key: "onesender_phone", setting_value: { value: phone } },
        { setting_key: "whatsapp_template", setting_value: { value: template } },
        { setting_key: "whatsapp_enabled", setting_value: { value: isEnabled } },
      ];

      for (const update of updates) {
        const { error } = await supabase.from("admin_settings").upsert(update, { onConflict: "setting_key" });
        if (error) throw error;
      }

      toast({ title: "Pengaturan WhatsApp berhasil disimpan" });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({ title: "Gagal menyimpan pengaturan", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast({ title: "Masukkan nomor telepon untuk tes", variant: "destructive" });
      return;
    }

    if (!apiUrl || !apiKey || !phone) {
      toast({ title: "Lengkapi konfigurasi API terlebih dahulu", variant: "destructive" });
      return;
    }

    if (!isEnabled) {
      toast({ title: "WhatsApp sedang nonaktif", variant: "destructive" });
      return;
    }

    setIsTesting(true);
    try {
      const testMessage = template
        .replace(/\{\{nama\}\}/g, "Test User")
        .replace(/\{\{kategori_beasiswa\}\}/g, "Prestasi")
        .replace(/\{\{status_pendaftar\}\}/g, "Mahasiswa")
        .replace(/\{\{tanggal_submit\}\}/g, new Date().toLocaleDateString("id-ID"))
        .replace(/\{\{token\}\}/g, "TEST-TOKEN123");

      const normalized = normalizeIndoPhone(testPhone);
      if (!normalized) throw new Error("Nomor tujuan tidak valid");

      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: normalized,
          message: testMessage,
          recipientName: "Test User",
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Gagal mengirim pesan");

      toast({ title: "Pesan tes berhasil dikirim!" });
      fetchLogs();
    } catch (error: any) {
      console.error("Test message error:", error);
      toast({ title: "Gagal mengirim pesan tes", description: error.message, variant: "destructive" });
    } finally {
      setIsTesting(false);
    }
  };

  const insertVariable = (variable: string) => {
    setTemplate((prev) => prev + variable);
  };

  const previewTemplate = () => {
    return template
      .replace(/\{\{nama\}\}/g, "Ahmad Budi Santoso")
      .replace(/\{\{kategori_beasiswa\}\}/g, "Prestasi")
      .replace(/\{\{status_pendaftar\}\}/g, "Mahasiswa")
      .replace(/\{\{tanggal_submit\}\}/g, new Date().toLocaleDateString("id-ID"))
      .replace(/\{\{token\}\}/g, "PRES-ABC123XYZ");
  };

  const totalSuccess = useMemo(() => logs.filter((l) => l.status === "success").length, [logs]);
  const totalFailed = useMemo(() => logs.filter((l) => l.status === "failed").length, [logs]);

  const chartData = useMemo(() => {
    return dailyStats.map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" }),
    }));
  }, [dailyStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan WhatsApp</h1>
        <p className="text-muted-foreground">Konfigurasi notifikasi WhatsApp melalui OneSender</p>
      </div>

      {/* Toggle & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? "bg-green-500/10" : "bg-muted"}`}>
                  <MessageCircle className={`w-5 h-5 ${isEnabled ? "text-green-500" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">{isEnabled ? "Aktif" : "Nonaktif"}</p>
                </div>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSuccess}</p>
                <p className="text-xs text-muted-foreground">Berhasil</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFailed}</p>
                <p className="text-xs text-muted-foreground">Gagal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Total (50 terakhir)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-day wave chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistik Pengiriman 7 Hari Terakhir</CardTitle>
          <CardDescription>Grafik titik/gelombang (berdasarkan log pengiriman)</CardDescription>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="success" name="Sukses" stroke="hsl(var(--primary))" strokeWidth={2} dot />
              <Line type="monotone" dataKey="failed" name="Gagal" stroke="hsl(var(--destructive))" strokeWidth={2} dot />
              <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* OneSender API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>OneSender API</CardTitle>
              <CardDescription>Pengaturan koneksi untuk pengiriman WhatsApp</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">API URL</label>
            <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="http(s)://.../api/v1/messages" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Masukkan API Key" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nomor Pengirim</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="628xxxxxxxxxx" />
            <p className="text-xs text-muted-foreground">Tips: hanya angka (tanpa spasi/tanda baca). Sistem akan normalisasi otomatis.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Pengaturan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Pesan</CardTitle>
          <CardDescription>Sesuaikan pesan yang akan dikirim ke pendaftar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Variabel yang tersedia</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {variablesList.map((v) => (
                <Badge
                  key={v.code}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => insertVariable(v.code)}
                  title={v.description}
                >
                  {v.code}
                </Badge>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              {variablesList.map((v) => (
                <p key={v.code}><code className="bg-muted px-1 rounded">{v.code}</code> - {v.description}</p>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Template Pesan</label>
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Halo {{nama}}, terima kasih telah mendaftar beasiswa {{kategori_beasiswa}}..."
              className="min-h-[150px]"
            />
          </div>

          {template && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview Pesan</label>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{previewTemplate()}</p>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Test Message */}
      <Card>
        <CardHeader>
          <CardTitle>Tes Kirim Pesan</CardTitle>
          <CardDescription>Kirim pesan tes untuk memastikan konfigurasi berfungsi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="Nomor tujuan (628xxx atau 08xxx)"
              className="flex-1"
            />
            <Button onClick={sendTestMessage} disabled={isTesting}>
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Kirim Tes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>History Pengiriman</CardTitle>
          <CardDescription>50 pesan terakhir yang dikirim</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Belum ada history pengiriman
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleDateString("id-ID", {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.recipient_phone}</TableCell>
                      <TableCell>{log.recipient_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                          {log.status === 'success' ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Sukses</>
                          ) : log.status === 'failed' ? (
                            <><XCircle className="w-3 h-3 mr-1" /> Gagal</>
                          ) : (
                            <><Clock className="w-3 h-3 mr-1" /> Pending</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.error_message || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
