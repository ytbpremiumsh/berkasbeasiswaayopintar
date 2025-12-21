import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Loader2, Trophy, Heart, Wallet, Globe } from "lucide-react";

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
}

const categoryLabels: Record<ScholarshipCategory, { label: string; icon: any; color: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, color: "text-amber-500" },
  yatim: { label: "Yatim", icon: Heart, color: "text-rose-500" },
  ekonomi: { label: "Ekonomi", icon: Wallet, color: "text-emerald-500" },
  umum: { label: "Umum", icon: Globe, color: "text-blue-500" },
};

export function FormFieldsManager() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ScholarshipCategory>("prestasi");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Kelola Field Form</CardTitle>
            <CardDescription>Tambahkan field tambahan untuk form beasiswa per kategori</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ScholarshipCategory)}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            {(Object.keys(categoryLabels) as ScholarshipCategory[]).map((cat) => {
              const { label, icon: Icon, color } = categoryLabels[cat];
              return (
                <TabsTrigger key={cat} value={cat} className="gap-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleAddField} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Tambah Field
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Urutan</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Nama Field</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Wajib</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFields.map((field) => (
              <TableRow key={field.id}>
                <TableCell>{field.display_order}</TableCell>
                <TableCell className="font-medium">{field.field_label}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{field.field_name}</TableCell>
                <TableCell className="capitalize">{field.field_type}</TableCell>
                <TableCell>{field.is_required ? "Ya" : "Tidak"}</TableCell>
                <TableCell>
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
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Belum ada field tambahan untuk kategori {categoryLabels[selectedCategory].label}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

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
      </CardContent>
    </Card>
  );
}