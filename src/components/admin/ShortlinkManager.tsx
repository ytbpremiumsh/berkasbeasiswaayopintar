import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Link2, ExternalLink, Eye, Copy, Trash2, BarChart3, Monitor, Smartphone, Globe } from "lucide-react";

interface Shortlink {
  id: string;
  slug: string;
  destination_url: string;
  title: string | null;
  is_active: boolean;
  click_count: number;
  created_at: string;
}

interface ShortlinkVisit {
  id: string;
  visited_at: string;
  ip_address: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
}

export function ShortlinkManager() {
  const [shortlinks, setShortlinks] = useState<Shortlink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Shortlink | null>(null);
  const [visits, setVisits] = useState<ShortlinkVisit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // Form states
  const [newSlug, setNewSlug] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    fetchShortlinks();
  }, []);

  const fetchShortlinks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("shortlinks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShortlinks(data || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({ title: "Gagal memuat data", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVisits = async (shortlinkId: string) => {
    setLoadingVisits(true);
    try {
      const { data, error } = await supabase
        .from("shortlink_visits")
        .select("*")
        .eq("shortlink_id", shortlinkId)
        .order("visited_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      console.error("Fetch visits error:", error);
    } finally {
      setLoadingVisits(false);
    }
  };

  const addShortlink = async () => {
    if (!newSlug.trim() || !newDestination.trim()) {
      toast({ title: "Data tidak lengkap", description: "Slug dan URL tujuan harus diisi", variant: "destructive" });
      return;
    }

    // Validate slug format
    if (!/^[a-zA-Z0-9-_]+$/.test(newSlug)) {
      toast({ title: "Slug tidak valid", description: "Slug hanya boleh mengandung huruf, angka, dash, dan underscore", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("shortlinks")
        .insert({
          slug: newSlug.toLowerCase(),
          destination_url: newDestination,
          title: newTitle || null,
          created_by: user?.id,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Slug sudah digunakan, pilih slug lain");
        }
        throw error;
      }

      toast({ title: "Shortlink berhasil dibuat" });
      setNewSlug("");
      setNewDestination("");
      setNewTitle("");
      setShowAddDialog(false);
      fetchShortlinks();
    } catch (error: any) {
      console.error("Add error:", error);
      toast({ title: "Gagal menambahkan", description: error.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from("shortlinks")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;

      setShortlinks(prev => prev.map(s => s.id === id ? { ...s, is_active } : s));
      toast({ title: is_active ? "Shortlink diaktifkan" : "Shortlink dinonaktifkan" });
    } catch (error: any) {
      toast({ title: "Gagal mengubah status", description: error.message, variant: "destructive" });
    }
  };

  const deleteShortlink = async (id: string) => {
    if (!confirm("Yakin ingin menghapus shortlink ini? Semua data kunjungan juga akan dihapus.")) return;

    try {
      const { error } = await supabase
        .from("shortlinks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Shortlink dihapus" });
      fetchShortlinks();
    } catch (error: any) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    }
  };

  const copyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/go/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: "Link disalin", description: fullUrl });
  };

  const openAnalytics = (link: Shortlink) => {
    setSelectedLink(link);
    fetchVisits(link.id);
  };

  const baseUrl = window.location.origin;

  // Calculate analytics stats
  const uniqueIPs = [...new Set(visits.map(v => v.ip_address).filter(Boolean))].length;
  const deviceStats = {
    desktop: visits.filter(v => v.device_type === "desktop").length,
    mobile: visits.filter(v => v.device_type === "mobile").length,
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
            <Link2 className="w-6 h-6" />
            Kelola Shortlink
          </h1>
          <p className="text-muted-foreground">
            Buat dan kelola URL pendek dengan analitik pengunjung
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Shortlink
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Shortlink Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Judul (opsional)</Label>
                <Input
                  placeholder="Promo Beasiswa 2024"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug URL *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{baseUrl}/go/</span>
                  <Input
                    placeholder="promo-2024"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Hanya huruf kecil, angka, dash, dan underscore</p>
              </div>
              <div className="space-y-2">
                <Label>URL Tujuan *</Label>
                <Input
                  placeholder="https://example.com/halaman-tujuan"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                />
              </div>
              <Button onClick={addShortlink} disabled={isAdding} className="w-full">
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Buat Shortlink
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shortlinks.length}</p>
                <p className="text-xs text-muted-foreground">Total Link</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shortlinks.reduce((acc, s) => acc + s.click_count, 0)}</p>
                <p className="text-xs text-muted-foreground">Total Klik</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shortlinks.filter(s => s.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Link Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {shortlinks.length > 0 
                    ? Math.round(shortlinks.reduce((acc, s) => acc + s.click_count, 0) / shortlinks.length)
                    : 0}
                </p>
                <p className="text-xs text-muted-foreground">Rata-rata Klik</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shortlinks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Shortlink</CardTitle>
          <CardDescription>Kelola semua shortlink dan lihat statistik klik</CardDescription>
        </CardHeader>
        <CardContent>
          {shortlinks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada shortlink. Buat shortlink pertama Anda!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shortlink</TableHead>
                    <TableHead>URL Tujuan</TableHead>
                    <TableHead className="text-center">Klik</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shortlinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div>
                          {link.title && <p className="font-medium text-sm">{link.title}</p>}
                          <code className="text-xs bg-muted px-2 py-1 rounded">/go/{link.slug}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={link.destination_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 max-w-[200px] truncate"
                        >
                          {link.destination_url}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-bold">{link.click_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={link.is_active}
                            onCheckedChange={(checked) => toggleActive(link.id, checked)}
                          />
                          <span className={`text-xs ${link.is_active ? "text-success" : "text-muted-foreground"}`}>
                            {link.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(link.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => copyLink(link.slug)} title="Salin Link">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openAnalytics(link)} title="Lihat Analitik">
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Analitik: {selectedLink?.title || selectedLink?.slug}</DialogTitle>
                              </DialogHeader>
                              {selectedLink && (
                                <div className="space-y-4">
                                  {/* Stats */}
                                  <div className="grid grid-cols-3 gap-4">
                                    <Card>
                                      <CardContent className="p-3 text-center">
                                        <p className="text-2xl font-bold">{selectedLink.click_count}</p>
                                        <p className="text-xs text-muted-foreground">Total Klik</p>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardContent className="p-3 text-center">
                                        <p className="text-2xl font-bold">{uniqueIPs}</p>
                                        <p className="text-xs text-muted-foreground">IP Unik</p>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardContent className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <div className="flex items-center gap-1">
                                            <Monitor className="w-4 h-4" />
                                            <span className="text-sm font-bold">{deviceStats.desktop}</span>
                                          </div>
                                          <span className="text-muted-foreground">/</span>
                                          <div className="flex items-center gap-1">
                                            <Smartphone className="w-4 h-4" />
                                            <span className="text-sm font-bold">{deviceStats.mobile}</span>
                                          </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Desktop / Mobile</p>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Recent Visits */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Kunjungan Terbaru</h4>
                                    {loadingVisits ? (
                                      <div className="flex justify-center py-4">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                      </div>
                                    ) : visits.length === 0 ? (
                                      <p className="text-sm text-muted-foreground text-center py-4">Belum ada kunjungan</p>
                                    ) : (
                                      <div className="max-h-[300px] overflow-y-auto">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Waktu</TableHead>
                                              <TableHead>IP</TableHead>
                                              <TableHead>Device</TableHead>
                                              <TableHead>Browser</TableHead>
                                              <TableHead>OS</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {visits.slice(0, 20).map((visit) => (
                                              <TableRow key={visit.id}>
                                                <TableCell className="text-xs">
                                                  {new Date(visit.visited_at).toLocaleString("id-ID")}
                                                </TableCell>
                                                <TableCell className="text-xs font-mono">{visit.ip_address || "-"}</TableCell>
                                                <TableCell className="text-xs capitalize">{visit.device_type || "-"}</TableCell>
                                                <TableCell className="text-xs">{visit.browser || "-"}</TableCell>
                                                <TableCell className="text-xs">{visit.os || "-"}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteShortlink(link.id)}
                            className="text-destructive hover:text-destructive"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
