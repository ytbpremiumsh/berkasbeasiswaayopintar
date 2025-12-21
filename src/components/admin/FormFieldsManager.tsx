import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Trophy, Heart, Wallet, Globe, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

interface FormField {
  id: string;
  category: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  description: string | null;
  is_default?: boolean;
}

const categoryLabels: Record<ScholarshipCategory, { label: string; icon: any; gradient: string; bgLight: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-500/10" },
  yatim: { label: "Yatim", icon: Heart, gradient: "from-rose-500 to-pink-500", bgLight: "bg-rose-500/10" },
  ekonomi: { label: "Ekonomi", icon: Wallet, gradient: "from-emerald-500 to-teal-500", bgLight: "bg-emerald-500/10" },
  umum: { label: "Umum", icon: Globe, gradient: "from-blue-500 to-indigo-500", bgLight: "bg-blue-500/10" },
};

// Default fields that exist in the ScholarshipForm
const defaultFields: Record<ScholarshipCategory, Omit<FormField, "id">[]> = {
  prestasi: [
    { category: "prestasi", field_name: "kartu_pelajar_url", field_label: "Kartu Pelajar / KTA", field_type: "file", is_required: true, is_active: true, display_order: 1, description: "Untuk Pelajar/Gap Year" },
    { category: "prestasi", field_name: "ktm_url", field_label: "KTM / Dokumen Resmi", field_type: "file", is_required: true, is_active: true, display_order: 2, description: "Untuk Mahasiswa" },
    { category: "prestasi", field_name: "cv_url", field_label: "Curriculum Vitae (CV)", field_type: "file", is_required: true, is_active: true, display_order: 3, description: null },
    { category: "prestasi", field_name: "sertifikat_prestasi_url", field_label: "Sertifikat Prestasi", field_type: "file", is_required: false, is_active: true, display_order: 4, description: "Akademik/Non-Akademik" },
    { category: "prestasi", field_name: "transkrip_nilai_url", field_label: "Transkrip Nilai", field_type: "file", is_required: false, is_active: true, display_order: 5, description: "Untuk Mahasiswa" },
    { category: "prestasi", field_name: "khs_url", field_label: "Kartu Hasil Studi (KHS)", field_type: "file", is_required: false, is_active: true, display_order: 6, description: "Untuk Mahasiswa" },
    { category: "prestasi", field_name: "berkas_pendukung_url", field_label: "Berkas Pendukung Lainnya", field_type: "file", is_required: false, is_active: true, display_order: 7, description: "Opsional" },
    { category: "prestasi", field_name: "bukti_struk_url", field_label: "Bukti Struk Pembayaran", field_type: "file", is_required: true, is_active: true, display_order: 8, description: null },
  ],
  yatim: [
    { category: "yatim", field_name: "kartu_pelajar_url", field_label: "Kartu Pelajar / KTA", field_type: "file", is_required: true, is_active: true, display_order: 1, description: "Untuk Pelajar/Gap Year" },
    { category: "yatim", field_name: "ktm_url", field_label: "KTM / Dokumen Resmi", field_type: "file", is_required: true, is_active: true, display_order: 2, description: "Untuk Mahasiswa" },
    { category: "yatim", field_name: "essay", field_label: "Esai / Pernyataan Pribadi", field_type: "textarea", is_required: true, is_active: true, display_order: 3, description: "Maksimal 500 kata" },
    { category: "yatim", field_name: "bukti_penghasilan_url", field_label: "Bukti Penghasilan Orang Tua/Wali", field_type: "file", is_required: false, is_active: true, display_order: 4, description: null },
    { category: "yatim", field_name: "bukti_listrik_url", field_label: "Bukti Pembayaran Listrik", field_type: "file", is_required: false, is_active: true, display_order: 5, description: "Bulan Terakhir" },
    { category: "yatim", field_name: "surat_keterangan_yatim_url", field_label: "Surat Keterangan Yatim", field_type: "file", is_required: true, is_active: true, display_order: 6, description: "Dokumen Pendukung" },
    { category: "yatim", field_name: "berkas_pendukung_url", field_label: "Berkas Pendukung Lainnya", field_type: "file", is_required: false, is_active: true, display_order: 7, description: "Opsional" },
    { category: "yatim", field_name: "bukti_struk_url", field_label: "Bukti Struk Pembayaran", field_type: "file", is_required: true, is_active: true, display_order: 8, description: null },
  ],
  ekonomi: [
    { category: "ekonomi", field_name: "kartu_pelajar_url", field_label: "Kartu Pelajar / KTA", field_type: "file", is_required: true, is_active: true, display_order: 1, description: "Untuk Pelajar/Gap Year" },
    { category: "ekonomi", field_name: "ktm_url", field_label: "KTM / Dokumen Resmi", field_type: "file", is_required: true, is_active: true, display_order: 2, description: "Untuk Mahasiswa" },
    { category: "ekonomi", field_name: "essay", field_label: "Esai / Pernyataan Pribadi", field_type: "textarea", is_required: true, is_active: true, display_order: 3, description: "Maksimal 500 kata" },
    { category: "ekonomi", field_name: "bukti_penghasilan_url", field_label: "Bukti Penghasilan Orang Tua/Wali", field_type: "file", is_required: false, is_active: true, display_order: 4, description: null },
    { category: "ekonomi", field_name: "bukti_listrik_url", field_label: "Bukti Pembayaran Listrik", field_type: "file", is_required: false, is_active: true, display_order: 5, description: "Bulan Terakhir" },
    { category: "ekonomi", field_name: "sktm_url", field_label: "Surat Keterangan Tidak Mampu (SKTM)", field_type: "file", is_required: true, is_active: true, display_order: 6, description: null },
    { category: "ekonomi", field_name: "berkas_pendukung_url", field_label: "Berkas Pendukung Lainnya", field_type: "file", is_required: false, is_active: true, display_order: 7, description: "Opsional" },
    { category: "ekonomi", field_name: "bukti_struk_url", field_label: "Bukti Struk Pembayaran", field_type: "file", is_required: true, is_active: true, display_order: 8, description: null },
  ],
  umum: [
    { category: "umum", field_name: "kartu_pelajar_url", field_label: "Kartu Pelajar / KTA", field_type: "file", is_required: true, is_active: true, display_order: 1, description: "Untuk Pelajar/Gap Year" },
    { category: "umum", field_name: "ktm_url", field_label: "KTM / Dokumen Resmi", field_type: "file", is_required: true, is_active: true, display_order: 2, description: "Untuk Mahasiswa" },
    { category: "umum", field_name: "essay", field_label: "Esai / Pernyataan Pribadi", field_type: "textarea", is_required: true, is_active: true, display_order: 3, description: "500-1000 kata" },
    { category: "umum", field_name: "video_tiktok_url", field_label: "Video TikTok", field_type: "url", is_required: false, is_active: true, display_order: 4, description: "Minimal 1 menit tentang Beasiswa Ayo Pintar" },
    { category: "umum", field_name: "sertifikat_prestasi_url", field_label: "Sertifikat Prestasi", field_type: "file", is_required: false, is_active: true, display_order: 5, description: null },
    { category: "umum", field_name: "berkas_pendukung_url", field_label: "Berkas Pendukung Lainnya", field_type: "file", is_required: false, is_active: true, display_order: 7, description: "Opsional" },
    { category: "umum", field_name: "bukti_struk_url", field_label: "Bukti Struk Pembayaran", field_type: "file", is_required: true, is_active: true, display_order: 8, description: null },
  ],
};

export function FormFieldsManager() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ScholarshipCategory>("prestasi");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const [formData, setFormData] = useState({
    field_name: "",
    field_label: "",
    field_type: "text",
    is_required: false,
    description: "",
    display_order: 0,
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_fields")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error("Error fetching fields:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultFields = async (category: ScholarshipCategory) => {
    setIsInitializing(true);
    try {
      const fieldsToInsert = defaultFields[category];
      
      for (const field of fieldsToInsert) {
        const { error } = await supabase
          .from("form_fields")
          .upsert(field, { onConflict: "category,field_name" });
        
        if (error) throw error;
      }

      toast({ title: "Berhasil", description: `Field default ${categoryLabels[category].label} telah ditambahkan` });
      fetchFields();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAddField = () => {
    setEditingField(null);
    setFormData({
      field_name: "",
      field_label: "",
      field_type: "text",
      is_required: false,
      description: "",
      display_order: fields.filter(f => f.category === selectedCategory).length,
    });
    setIsDialogOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      description: field.description || "",
      display_order: field.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSaveField = async () => {
    if (!formData.field_name || !formData.field_label) {
      toast({ title: "Error", description: "Nama field dan label wajib diisi", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingField) {
        const { error } = await supabase
          .from("form_fields")
          .update({
            field_name: formData.field_name,
            field_label: formData.field_label,
            field_type: formData.field_type,
            is_required: formData.is_required,
            description: formData.description || null,
            display_order: formData.display_order,
          })
          .eq("id", editingField.id);

        if (error) throw error;
        toast({ title: "Field diperbarui" });
      } else {
        const { error } = await supabase
          .from("form_fields")
          .insert({
            category: selectedCategory,
            field_name: formData.field_name,
            field_label: formData.field_label,
            field_type: formData.field_type,
            is_required: formData.is_required,
            description: formData.description || null,
            display_order: formData.display_order,
          });

        if (error) throw error;
        toast({ title: "Field ditambahkan" });
      }

      setIsDialogOpen(false);
      fetchFields();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (field: FormField) => {
    try {
      const { error } = await supabase
        .from("form_fields")
        .update({ is_active: !field.is_active })
        .eq("id", field.id);

      if (error) throw error;
      fetchFields();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleRequired = async (field: FormField) => {
    try {
      const { error } = await supabase
        .from("form_fields")
        .update({ is_required: !field.is_required })
        .eq("id", field.id);

      if (error) throw error;
      fetchFields();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteField = async (field: FormField) => {
    if (!confirm(`Hapus field "${field.field_label}"?`)) return;

    try {
      const { error } = await supabase
        .from("form_fields")
        .delete()
        .eq("id", field.id);

      if (error) throw error;
      toast({ title: "Field dihapus" });
      fetchFields();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredFields = fields.filter(f => f.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kelola Field Form</h1>
        <p className="text-muted-foreground">Atur field form beasiswa untuk setiap kategori</p>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(categoryLabels) as ScholarshipCategory[]).map((cat) => {
          const config = categoryLabels[cat];
          const Icon = config.icon;
          const isActive = selectedCategory === cat;
          const fieldCount = fields.filter(f => f.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                isActive 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-transparent bg-card hover:border-border hover:shadow-md"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", config.gradient)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{fieldCount} field</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Field Form - {categoryLabels[selectedCategory].label}
              </CardTitle>
              <CardDescription>Kelola field yang ditampilkan pada form beasiswa</CardDescription>
            </div>
            <div className="flex gap-2">
              {filteredFields.length === 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => initializeDefaultFields(selectedCategory)}
                  disabled={isInitializing}
                >
                  {isInitializing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Muat Field Default
                </Button>
              )}
              <Button onClick={handleAddField}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Field
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Urutan</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Nama Field</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-center">Wajib</TableHead>
                  <TableHead className="text-center">Aktif</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFields.map((field) => (
                  <TableRow key={field.id} className={!field.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <Badge variant="outline">{field.display_order}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{field.field_label}</p>
                        {field.description && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{field.field_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{field.field_type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={field.is_required} onCheckedChange={() => handleToggleRequired(field)} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={field.is_active} onCheckedChange={() => handleToggleActive(field)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditField(field)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteField(field)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="text-muted-foreground space-y-2">
                        <p>Belum ada field untuk kategori {categoryLabels[selectedCategory].label}</p>
                        <p className="text-sm">Klik "Muat Field Default" untuk memuat field standar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field" : "Tambah Field Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Label Field</label>
              <Input
                placeholder="Contoh: Surat Rekomendasi"
                value={formData.field_label}
                onChange={(e) => setFormData(prev => ({ ...prev, field_label: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Field (untuk database)</label>
              <Input
                placeholder="Contoh: surat_rekomendasi_url"
                value={formData.field_name}
                onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Field</label>
              <Select value={formData.field_type} onValueChange={(v) => setFormData(prev => ({ ...prev, field_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi (opsional)</label>
              <Input
                placeholder="Deskripsi field untuk pengguna"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Urutan Tampil</label>
              <Input
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_required}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_required: v }))}
              />
              <label className="text-sm font-medium">Wajib diisi</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveField} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingField ? "Simpan Perubahan" : "Tambah Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}