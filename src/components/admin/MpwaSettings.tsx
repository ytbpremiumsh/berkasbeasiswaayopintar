import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Send, QrCode, MessageCircle, Info, RefreshCw } from "lucide-react";

interface SV { value: string | boolean }

export function MpwaSettings() {
  const [apiUrl, setApiUrl] = useState("https://app.ayopintar.com/send-message");
  const [apiKey, setApiKey] = useState("");
  const [sender, setSender] = useState("");
  const [footer, setFooter] = useState("Sent via MPWA BalasinAja");
  const [template, setTemplate] = useState(
    "Halo {{nama}},\n\nTerima kasih telah mendaftar beasiswa {{kategori_beasiswa}}.\nBerkas Anda berhasil kami terima pada {{tanggal_submit}}.\n\nToken: {{token}}\n\nSalam,\nTim Beasiswa"
  );
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrMessage, setQrMessage] = useState<string>("");

  const variables = [
    { code: "{{nama}}", desc: "Nama pendaftar" },
    { code: "{{kategori_beasiswa}}", desc: "Kategori beasiswa" },
    { code: "{{status_pendaftar}}", desc: "Status pendaftar" },
    { code: "{{tanggal_submit}}", desc: "Tanggal submit" },
    { code: "{{token}}", desc: "Kode token" },
  ];

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("admin_settings")
        .select("*")
        .in("setting_key", ["mpwa_api_url", "mpwa_api_key", "mpwa_sender", "mpwa_footer", "mpwa_template", "mpwa_enabled"]);
      data?.forEach((s) => {
        const v = (s.setting_value as unknown as SV)?.value;
        switch (s.setting_key) {
          case "mpwa_api_url": setApiUrl(String(v || "https://app.ayopintar.com/send-message")); break;
          case "mpwa_api_key": setApiKey(String(v || "")); break;
          case "mpwa_sender": setSender(String(v || "")); break;
          case "mpwa_footer": setFooter(String(v || "")); break;
          case "mpwa_template": if (v) setTemplate(String(v)); break;
          case "mpwa_enabled": setEnabled(v === true || v === "true"); break;
        }
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const updates = [
        { setting_key: "mpwa_api_url", setting_value: { value: apiUrl } },
        { setting_key: "mpwa_api_key", setting_value: { value: apiKey } },
        { setting_key: "mpwa_sender", setting_value: { value: sender } },
        { setting_key: "mpwa_footer", setting_value: { value: footer } },
        { setting_key: "mpwa_template", setting_value: { value: template } },
        { setting_key: "mpwa_enabled", setting_value: { value: enabled } },
      ];
      for (const u of updates) {
        const { error } = await supabase.from("admin_settings").upsert(u, { onConflict: "setting_key" });
        if (error) throw error;
      }
      toast({ title: "Pengaturan MPWA disimpan" });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const sendTest = async () => {
    if (!testPhone.trim()) {
      toast({ title: "Masukkan nomor tujuan", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const msg = template
        .replace(/\{\{nama\}\}/g, "Test User")
        .replace(/\{\{kategori_beasiswa\}\}/g, "Prestasi")
        .replace(/\{\{status_pendaftar\}\}/g, "Mahasiswa")
        .replace(/\{\{tanggal_submit\}\}/g, new Date().toLocaleDateString("id-ID"))
        .replace(/\{\{token\}\}/g, "TEST-TOKEN");
      const { data, error } = await supabase.functions.invoke("mpwa-send", {
        body: { action: "send", phone: testPhone, message: msg, recipientName: "Test User", skipEnabledCheck: true },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || JSON.stringify(data?.provider));
      toast({ title: "Pesan tes terkirim" });
    } catch (e: any) {
      toast({ title: "Gagal kirim tes", description: e.message, variant: "destructive" });
    } finally { setTesting(false); }
  };

  const generateQr = async () => {
    if (!apiKey || !sender) {
      toast({ title: "Isi API Key & Sender dulu", variant: "destructive" });
      return;
    }
    setQrLoading(true);
    setQrImage(null);
    setQrMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("mpwa-send", {
        body: { action: "generate-qr", apiKey, sender },
      });
      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.message || "Gagal mengambil QR");
      }
      const r = data?.data || {};
      const msg = r.msg || r.message || "";
      const qr = r.qrcode || r.qr || r.qr_code || r.qrCode;
      if (qr) {
        const src = String(qr).startsWith("data:") ? String(qr) : `data:image/png;base64,${qr}`;
        setQrImage(src);
        setQrMessage(msg || "Scan QR untuk koneksi");
      } else {
        setQrMessage(msg || "Device sudah terhubung atau tidak ada QR");
      }
    } catch (e: any) {
      toast({ title: "Gagal generate QR", description: e.message, variant: "destructive" });
    } finally { setQrLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">MPWA BalasinAja</h1>
        <p className="text-muted-foreground">Notifikasi WhatsApp via API MPWA (app.ayopintar.com)</p>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enabled ? "bg-green-500/10" : "bg-muted"}`}>
              <MessageCircle className={`w-5 h-5 ${enabled ? "text-green-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="font-medium">Status MPWA</p>
              <p className="text-xs text-muted-foreground">{enabled ? "Aktif – pesan akan dikirim" : "Nonaktif"}</p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi API</CardTitle>
          <CardDescription>Endpoint default: https://app.ayopintar.com/send-message</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API URL</label>
            <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key MPWA" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sender (nomor device)</label>
            <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="62888xxxxxxx" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Footer (opsional)</label>
            <Input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Sent via MPWA" />
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Pengaturan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Koneksi Device (QR Code)</CardTitle>
              <CardDescription>Scan QR untuk menghubungkan device WhatsApp ke MPWA</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generateQr} disabled={qrLoading} variant="outline">
            {qrLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Generate / Refresh QR
          </Button>
          {qrMessage && <p className="text-sm text-muted-foreground">{qrMessage}</p>}
          {qrImage && (
            <div className="border rounded-lg p-4 inline-block bg-white">
              <img src={qrImage} alt="QR MPWA" className="w-64 h-64" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Pesan</CardTitle>
          <CardDescription>Pesan otomatis saat berkas berhasil dikirim</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Variabel tersedia</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <Badge key={v.code} variant="secondary" className="cursor-pointer" onClick={() => setTemplate((p) => p + v.code)} title={v.desc}>
                  {v.code}
                </Badge>
              ))}
            </div>
          </div>
          <Textarea value={template} onChange={(e) => setTemplate(e.target.value)} className="min-h-[150px]" />
          <Button onClick={save} disabled={saving} variant="outline">
            <Save className="w-4 h-4 mr-2" /> Simpan Template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tes Kirim Pesan</CardTitle>
          <CardDescription>Gunakan template di atas dengan data dummy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="628xxx atau 08xxx" className="flex-1" />
            <Button onClick={sendTest} disabled={testing}>
              {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Kirim Tes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
