import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Loader2, Plus, Save, Trash2, Image as ImageIcon, 
  GripVertical, ArrowUp, ArrowDown, ExternalLink 
} from "lucide-react";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

export function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    link_url: "",
    is_active: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({ title: "Gagal memuat data", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image_url) {
      toast({ title: "Lengkapi data", description: "Judul dan URL gambar wajib diisi", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingBanner) {
        // Update
        const { error } = await supabase
          .from("banners")
          .update({
            title: formData.title,
            image_url: formData.image_url,
            link_url: formData.link_url || null,
            is_active: formData.is_active,
          })
          .eq("id", editingBanner.id);

        if (error) throw error;
        toast({ title: "Banner berhasil diperbarui" });
      } else {
        // Create
        const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order)) + 1 : 0;
        const { error } = await supabase
          .from("banners")
          .insert({
            title: formData.title,
            image_url: formData.image_url,
            link_url: formData.link_url || null,
            is_active: formData.is_active,
            display_order: maxOrder,
          });

        if (error) throw error;
        toast({ title: "Banner berhasil ditambahkan" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus banner ini?")) return;

    try {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Banner berhasil dihapus" });
      fetchBanners();
    } catch (error: any) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase.from("banners").update({ is_active }).eq("id", id);
      if (error) throw error;
      setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active } : b));
      toast({ title: is_active ? "Banner diaktifkan" : "Banner dinonaktifkan" });
    } catch (error: any) {
      toast({ title: "Gagal mengubah status", description: error.message, variant: "destructive" });
    }
  };

  const handleMoveOrder = async (id: string, direction: "up" | "down") => {
    const currentIndex = banners.findIndex(b => b.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const currentBanner = banners[currentIndex];
    const swapBanner = banners[newIndex];

    try {
      // Swap display_order values
      await supabase.from("banners").update({ display_order: swapBanner.display_order }).eq("id", currentBanner.id);
      await supabase.from("banners").update({ display_order: currentBanner.display_order }).eq("id", swapBanner.id);
      
      fetchBanners();
      toast({ title: "Urutan diperbarui" });
    } catch (error: any) {
      toast({ title: "Gagal mengubah urutan", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({ title: "", image_url: "", link_url: "", is_active: true });
    setEditingBanner(null);
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      is_active: banner.is_active,
    });
    setIsDialogOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            Kelola Banner
          </h1>
          <p className="text-muted-foreground">
            Atur banner carousel yang ditampilkan di halaman utama
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Banner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Edit Banner" : "Tambah Banner Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Banner *</Label>
                <Input
                  placeholder="Contoh: Pendaftaran Beasiswa 2024"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>URL Gambar *</Label>
                <Input
                  placeholder="https://example.com/banner.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Upload gambar ke storage atau gunakan URL eksternal. Ukuran disarankan: 1200x400 pixel
                </p>
              </div>
              {formData.image_url && (
                <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Link URL (Opsional)</Label>
                <Input
                  placeholder="https://example.com/promo"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  URL tujuan ketika banner diklik
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label>Aktif</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
              <Button onClick={handleSubmit} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editingBanner ? "Simpan Perubahan" : "Tambah Banner"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners List */}
      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada banner. Tambahkan banner pertama Anda!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <Card key={banner.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Order Controls */}
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(banner.id, "up")}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center justify-center text-sm text-muted-foreground font-mono">
                      {index + 1}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      disabled={index === banners.length - 1}
                      onClick={() => handleMoveOrder(banner.id, "down")}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={banner.image_url} 
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{banner.title}</h3>
                      <Badge variant={banner.is_active ? "default" : "secondary"}>
                        {banner.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    {banner.link_url && (
                      <a 
                        href={banner.link_url} 
                        target="_blank" 
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {banner.link_url}
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={(checked) => handleToggleActive(banner.id, checked)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(banner)}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tips:</strong> Gunakan tombol panah untuk mengatur urutan tampilan banner. 
            Banner akan ditampilkan sebagai carousel di halaman utama.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
