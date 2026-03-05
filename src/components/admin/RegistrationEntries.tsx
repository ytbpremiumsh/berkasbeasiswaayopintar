import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Download, Trash2, Trophy, Heart, Wallet, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

interface Registration {
  id: string;
  category: string;
  form_data: any;
  created_at: string;
}

interface RegField {
  id: string;
  category: string;
  field_name: string;
  field_label: string;
  display_order: number;
}

const categoryLabels: Record<ScholarshipCategory, { label: string; icon: any; gradient: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, gradient: "from-amber-500 to-orange-500" },
  yatim: { label: "Yatim", icon: Heart, gradient: "from-rose-500 to-pink-500" },
  ekonomi: { label: "Ekonomi", icon: Wallet, gradient: "from-emerald-500 to-teal-500" },
  umum: { label: "Umum", icon: Globe, gradient: "from-blue-500 to-indigo-500" },
};

export function RegistrationEntries() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [fields, setFields] = useState<RegField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ScholarshipCategory>("prestasi");
  const [selectedEntry, setSelectedEntry] = useState<Registration | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [regsResult, fieldsResult] = await Promise.all([
      supabase.from("registrations").select("*").order("created_at", { ascending: false }),
      supabase.from("registration_fields").select("*").order("display_order", { ascending: true }),
    ]);
    if (!regsResult.error) setRegistrations(regsResult.data || []);
    if (!fieldsResult.error) setFields(fieldsResult.data || []);
    setIsLoading(false);
  };

  const filtered = registrations.filter(r => r.category === selectedCategory);
  const categoryFields = fields.filter(f => f.category === selectedCategory);

  // Get display columns (first 3 fields for table)
  const displayFields = categoryFields.slice(0, 4);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data pendaftaran ini?")) return;
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Data dihapus" });
      fetchData();
    }
  };

  const exportToExcel = () => {
    const exportData = filtered.map(reg => {
      const row: Record<string, any> = { "Tanggal": new Date(reg.created_at).toLocaleDateString("id-ID") };
      categoryFields.forEach(f => {
        row[f.field_label] = reg.form_data[f.field_name] || "-";
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Pendaftaran ${categoryLabels[selectedCategory].label}`);
    XLSX.writeFile(wb, `pendaftaran_${selectedCategory}_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Export berhasil" });
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Pendaftaran</h1>
        <p className="text-muted-foreground">Lihat dan kelola data pendaftaran beasiswa</p>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(categoryLabels) as ScholarshipCategory[]).map((cat) => {
          const config = categoryLabels[cat];
          const Icon = config.icon;
          const isActive = selectedCategory === cat;
          const count = registrations.filter(r => r.category === cat).length;
          return (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={cn("p-4 rounded-xl transition-all duration-200 text-left group",
                isActive ? "bg-card shadow-lg ring-2 ring-primary" : "bg-card/50 hover:bg-card hover:shadow-md"
              )}>
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg", config.gradient)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
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
              <CardTitle>Pendaftaran - {categoryLabels[selectedCategory].label}</CardTitle>
              <CardDescription>{filtered.length} pendaftar</CardDescription>
            </div>
            <Button variant="outline" onClick={exportToExcel} disabled={filtered.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  {displayFields.map(f => <TableHead key={f.id}>{f.field_label}</TableHead>)}
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((reg, idx) => (
                  <TableRow key={reg.id}>
                    <TableCell>{idx + 1}</TableCell>
                    {displayFields.map(f => (
                      <TableCell key={f.id} className="max-w-[200px] truncate">
                        {reg.form_data[f.field_name] || "-"}
                      </TableCell>
                    ))}
                    <TableCell>{new Date(reg.created_at).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedEntry(reg)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Detail Pendaftaran</DialogTitle>
                            </DialogHeader>
                            {selectedEntry && (
                              <div className="space-y-3 text-sm">
                                {categoryFields.map(f => (
                                  <div key={f.id} className="flex justify-between gap-4">
                                    <span className="text-muted-foreground shrink-0">{f.field_label}:</span>
                                    <span className="font-medium text-right">{selectedEntry.form_data[f.field_name] || "-"}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">Tanggal Daftar:</span>
                                  <span className="font-medium">{new Date(selectedEntry.created_at).toLocaleString("id-ID")}</span>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(reg.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={displayFields.length + 3} className="text-center py-8 text-muted-foreground">
                      Belum ada data pendaftaran
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
