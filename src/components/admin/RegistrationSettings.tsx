import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CLOSED_MESSAGE, getRegistrationStatus, REGISTRATION_KEY } from "@/lib/registration-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export function RegistrationSettings() {
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState(DEFAULT_CLOSED_MESSAGE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const status = await getRegistrationStatus();
      setOpen(status.is_open); setMessage(status.closed_message); setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal memuat pengaturan.");
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const save = async () => {
    setSaving(true);
    try {
      const closedMessage = message.trim() || DEFAULT_CLOSED_MESSAGE;
      const { data, error: saveError } = await supabase.from("admin_settings").upsert({
        setting_key: REGISTRATION_KEY,
        setting_value: { is_open: open, closed_message: closedMessage },
        updated_at: new Date().toISOString(),
      }, { onConflict: "setting_key" }).select("id").single();
      if (saveError || !data) throw saveError || new Error("Pengaturan tidak tersimpan.");
      setMessage(closedMessage);
      toast({ title: open ? "Pendaftaran dibuka" : "Pendaftaran ditutup", description: "Pengaturan berlaku untuk semua kategori dan form embed." });
    } catch (cause) {
      toast({ title: "Gagal menyimpan", description: cause instanceof Error ? cause.message : "Periksa izin akun admin Anda.", variant: "destructive" });
    } finally { setSaving(false); }
  };
  return <Card>
    <CardHeader><CardTitle>Status Pendaftaran & Pengiriman Berkas</CardTitle>
      <CardDescription>Berlaku untuk semua program dan kategori pada form pendaftaran, pengiriman berkas, serta embed. Data yang sudah masuk tetap tersimpan.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      {error && <div role="alert" className="text-sm text-destructive">{error} Pastikan migrasi database sudah diterapkan. <Button variant="link" onClick={load}>Muat ulang</Button></div>}
      <div className="flex items-center justify-between gap-4">
        <div><Label htmlFor="registration-open">Buka pendaftaran dan pengiriman berkas</Label><p className="text-sm text-muted-foreground">{loading ? "Memuat..." : open ? "Aktif — peserta bisa mengisi form." : "Nonaktif — peserta tidak bisa mengirim data atau mengunggah berkas."}</p></div>
        <Switch id="registration-open" checked={open} onCheckedChange={setOpen} disabled={loading || saving || !!error} />
      </div>
      <div className="space-y-2"><Label htmlFor="registration-message">Teks saat pendaftaran ditutup</Label>
        <Textarea id="registration-message" value={message} onChange={event => setMessage(event.target.value)} maxLength={2000} rows={4} disabled={loading || saving || !!error} />
        <p className="text-xs text-muted-foreground">Maksimal 2.000 karakter. Teks kosong akan menggunakan pesan bawaan.</p>
      </div>
      <p className="text-sm text-muted-foreground">Perubahan berlaku setelah menekan Simpan. Halaman peserta yang masih terbuka memeriksa ulang status setiap 60 detik dan sebelum unggah/kirim.</p>
      <Button onClick={save} disabled={loading || saving || !!error}>{saving ? "Menyimpan..." : "Simpan Status Pendaftaran"}</Button>
    </CardContent>
  </Card>;
}
