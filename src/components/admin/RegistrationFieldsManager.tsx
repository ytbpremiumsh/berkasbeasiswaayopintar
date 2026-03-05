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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2, Trophy, Heart, Wallet, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

interface RegField {
  id: string;
  category: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  description: string | null;
  placeholder: string | null;
  options: any;
}

const categoryLabels: Record<ScholarshipCategory, { label: string; icon: any; gradient: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, gradient: "from-amber-500 to-orange-500" },
  yatim: { label: "Yatim", icon: Heart, gradient: "from-rose-500 to-pink-500" },
  ekonomi: { label: "Ekonomi", icon: Wallet, gradient: "from-emerald-500 to-teal-500" },
  umum: { label: "Umum", icon: Globe, gradient: "from-blue-500 to-indigo-500" },
};

export function RegistrationFieldsManager() {
  const [fields, setFields] = useState<RegField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ScholarshipCategory>("prestasi");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<RegField | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    field_name: "",
    field_label: "",
    field_type: "text",
    is_required: false,
    description: "",
    placeholder: "",
    options: "",
    display_order: 0,
  });

  useEffect(() => { fetchFields(); }, []);

  const fetchFields = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("registration_fields")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error) setFields(data || []);
    setIsLoading(false);
  };

  const handleAddField = () => {
    setEditingField(null);
    setFormData({
      field_name: "", field_label: "", field_type: "text",
      is_required: false, description: "", placeholder: "", options: "",
      display_order: fields.filter(f => f.category === selectedCategory).length + 1,
    });
    setIsDialogOpen(true);
  };

  const handleEditField = (field: RegField) => {
    setEditingField(field);
    const opts = field.options ? (typeof field.options === "string" ? field.options : JSON.stringify(field.options)) : "";
    setFormData({
      field_name: field.field_name, field_label: field.field_label,
      field_type: field.field_type, is_required: field.is_required,
      description: field.description || "", placeholder: field.placeholder || "",
      options: opts, display_order: field.display_order,
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
      let parsedOptions = null;
      if (formData.options.trim()) {
        try { parsedOptions = JSON.parse(formData.options); } catch {
          parsedOptions = formData.options.split(",").map(s => s.trim());
        }
      }
      const payload = {
        field_name: formData.field_name,
        field_label: formData.field_label,
        field_type: formData.field_type,
        is_required: formData.is_required,
        description: formData.description || null,
        placeholder: formData.placeholder || null,
        options: parsedOptions,
        display_order: formData.display_order,
      };

      if (editingField) {
        const { error } = await supabase.from("registration_fields").update(payload).eq("id", editingField.id);
        if (error) throw error;
        toast({ title: "Field diperbarui" });
      } else {
        const { error } = await supabase.from("registration_fields").insert({ ...payload, category: selectedCategory });
        if (error) throw error;
        toast({ title: "Field ditambahkan" });
      }
      setIsDialogOpen(false);
      fetchFields();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const handleToggleActive = async (field: RegField) => {
    await supabase.from("registration_fields").update({ is_active: !field.is_active }).eq("id", field.id);
    fetchFields();
  };

  const handleToggleRequired = async (field: RegField) => {
    await supabase.from("registration_fields").update({ is_required: !field.is_required }).eq("id", field.id);
    fetchFields();
  };

  const handleDeleteField = async (field: RegField) => {
    if (!confirm(`Hapus field "${field.field_label}"?`)) return;
    await supabase.from("registration_fields").delete().eq("id", field.id);
    toast({ title: "Field dihapus" });
    fetchFields();
  };

  const filteredFields = fields.filter(f => f.category === selectedCategory);

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kelola Form Pendaftaran</h1>
        <p className="text-muted-foreground">Atur field form pendaftaran untuk setiap kategori</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(categoryLabels) as ScholarshipCategory[]).map((cat) => {
          const config = categoryLabels[cat];
          const Icon = config.icon;
          const isActive = selectedCategory === cat;
          const fieldCount = fields.filter(f => f.category === cat).length;
          return (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={cn("p-4 rounded-xl border-2 transition-all duration-200 text-left",
                isActive ? "border-primary bg-primary/5 shadow-lg" : "border-transparent bg-card hover:border-border hover:shadow-md"
              )}>
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
              <CardTitle>Field Pendaftaran - {categoryLabels[selectedCategory].label}</CardTitle>
              <CardDescription>Kelola field yang ditampilkan pada form pendaftaran</CardDescription>
            </div>
            <Button onClick={handleAddField}><Plus className="w-4 h-4 mr-2" /> Tambah Field</Button>
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
                    <TableCell><Badge variant="outline">{field.display_order}</Badge></TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{field.field_label}</p>
                        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{field.field_name}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{field.field_type}</Badge></TableCell>
                    <TableCell className="text-center"><Switch checked={field.is_required} onCheckedChange={() => handleToggleRequired(field)} /></TableCell>
                    <TableCell className="text-center"><Switch checked={field.is_active} onCheckedChange={() => handleToggleActive(field)} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditField(field)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteField(field)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Belum ada field untuk kategori {categoryLabels[selectedCategory].label}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field" : "Tambah Field Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Label Field</label>
              <Input placeholder="Contoh: Nomor WhatsApp" value={formData.field_label}
                onChange={(e) => setFormData(prev => ({ ...prev, field_label: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Field (untuk database)</label>
              <Input placeholder="Contoh: phone" value={formData.field_name}
                onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value.toLowerCase().replace(/\s+/g, "_") }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Field</label>
              <Select value={formData.field_type} onValueChange={(v) => setFormData(prev => ({ ...prev, field_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="select">Dropdown / Select</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Placeholder</label>
              <Input placeholder="Teks placeholder" value={formData.placeholder}
                onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))} />
            </div>
            {formData.field_type === "select" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Opsi (pisahkan dengan koma atau JSON array)</label>
                <Textarea placeholder='Contoh: SMP, SMA/SMK, D3, S1' value={formData.options}
                  onChange={(e) => setFormData(prev => ({ ...prev, options: e.target.value }))} />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi (opsional)</label>
              <Input placeholder="Deskripsi field" value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Urutan Tampil</label>
              <Input type="number" min="0" value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formData.is_required} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_required: v }))} />
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
