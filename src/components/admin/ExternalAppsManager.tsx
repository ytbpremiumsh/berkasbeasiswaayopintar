import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ExternalLink, Loader2, Globe, ArrowLeft, RefreshCw } from "lucide-react";

interface ExternalApp {
  id: string;
  title: string;
  url: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export function ExternalAppsManager() {
  const [apps, setApps] = useState<ExternalApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ExternalApp | null>(null);
  const [activeApp, setActiveApp] = useState<ExternalApp | null>(null);
  const [form, setForm] = useState({ title: "", url: "", description: "", display_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("external_apps")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) {
      toast({ title: "Gagal memuat", description: error.message, variant: "destructive" });
    } else {
      setApps((data as ExternalApp[]) || []);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditingApp(null);
    setForm({ title: "", url: "", description: "", display_order: apps.length, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (app: ExternalApp) => {
    setEditingApp(app);
    setForm({ title: app.title, url: app.url, description: app.description || "", display_order: app.display_order, is_active: app.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast({ title: "Judul dan URL wajib diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingApp) {
        const { error } = await supabase
          .from("external_apps")
          .update({ title: form.title, url: form.url, description: form.description || null, display_order: form.display_order, is_active: form.is_active, updated_at: new Date().toISOString() } as any)
          .eq("id", editingApp.id);
        if (error) throw error;
        toast({ title: "Berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from("external_apps")
          .insert({ title: form.title, url: form.url, description: form.description || null, display_order: form.display_order, is_active: form.is_active } as any);
        if (error) throw error;
        toast({ title: "Berhasil ditambahkan" });
      }
      setDialogOpen(false);
      fetchApps();
    } catch (error: any) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus aplikasi ini?")) return;
    const { error } = await supabase.from("external_apps").delete().eq("id", id);
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil dihapus" });
      if (activeApp?.id === id) setActiveApp(null);
      fetchApps();
    }
  };

  const [iframeKey, setIframeKey] = useState(0);

  // If viewing an app - use full page iframe without fallback
  if (activeApp) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap pb-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setActiveApp(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-foreground truncate">{activeApp.title}</h1>
            {activeApp.description && <p className="text-xs sm:text-sm text-muted-foreground truncate">{activeApp.description}</p>}
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => setIframeKey(k => k + 1)}>
            <RefreshCw className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
        <div className="flex-1 border rounded-lg overflow-hidden bg-background" style={{ minHeight: "calc(100vh - 180px)" }}>
          <iframe
            key={iframeKey}
            src={activeApp.url}
            className="w-full h-full border-0"
            style={{ minHeight: "calc(100vh - 180px)" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Aplikasi Eksternal</h1>
          <p className="text-sm text-muted-foreground">Simpan URL eksternal dan tampilkan langsung</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} size="sm" className="shrink-0">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Tambah Aplikasi</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingApp ? "Edit Aplikasi" : "Tambah Aplikasi"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Judul *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Google Analytics" />
              </div>
              <div>
                <Label>URL *</Label>
                <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi singkat..." rows={2} />
              </div>
              <div>
                <Label>Urutan</Label>
                <Input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>Aktif</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editingApp ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Globe className="w-12 h-12 mb-3 opacity-50" />
            <p className="font-medium">Belum ada aplikasi eksternal</p>
            <p className="text-sm">Klik "Tambah Aplikasi" untuk menambahkan URL eksternal</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map(app => (
            <Card key={app.id} className={`cursor-pointer transition-all hover:shadow-lg group ${!app.is_active ? "opacity-60" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => app.is_active && setActiveApp(app)}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-primary/70 shrink-0">
                      <Globe className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{app.title}</CardTitle>
                      {app.description && <CardDescription className="truncate">{app.description}</CardDescription>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(app)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(app.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent onClick={() => app.is_active && setActiveApp(app)}>
                <p className="text-xs text-muted-foreground truncate">{app.url}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
