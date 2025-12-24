import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, CheckCircle, Trophy, Heart, Wallet, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

const categoryConfig: Record<ScholarshipCategory, { label: string; icon: any; gradient: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, gradient: "from-amber-500 to-orange-500" },
  yatim: { label: "Yatim", icon: Heart, gradient: "from-rose-500 to-pink-500" },
  ekonomi: { label: "Ekonomi", icon: Wallet, gradient: "from-emerald-500 to-teal-500" },
  umum: { label: "Umum", icon: Globe, gradient: "from-blue-500 to-indigo-500" },
};

interface VerifiedSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  category: ScholarshipCategory;
  applicant_status: string;
  token_id: string;
  token_code?: string;
  submitted_at: string;
}

export function VerifiedSubmissions() {
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<VerifiedSubmission[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"all" | ScholarshipCategory>("all");

  useEffect(() => {
    fetchVerified();
  }, []);

  const fetchVerified = async () => {
    setIsLoading(true);
    try {
      const { data: subs, error } = await supabase
        .from("scholarship_submissions")
        .select("id, full_name, email, phone, category, applicant_status, token_id, submitted_at")
        .eq("status", "diverifikasi")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      // Get all tokens for mapping
      const { data: tokens } = await supabase
        .from("scholarship_tokens")
        .select("id, token_code");

      const tokenMap = new Map(tokens?.map(t => [t.id, t.token_code]) || []);

      // Add token_code to submissions
      const subsWithTokens = subs?.map(s => ({
        ...s,
        token_code: tokenMap.get(s.token_id) || "Unknown"
      })) || [];

      setSubmissions(subsWithTokens as VerifiedSubmission[]);
    } catch (error) {
      console.error("Error fetching verified:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubmissions = selectedCategory === "all" 
    ? submissions 
    : submissions.filter(s => s.category === selectedCategory);

  const exportToExcel = () => {
    if (filteredSubmissions.length === 0) {
      toast({ title: "Tidak ada data", description: "Tidak ada data untuk diexport", variant: "destructive" });
      return;
    }

    const exportData = filteredSubmissions.map(sub => ({
      "Nama Lengkap": sub.full_name,
      "Email": sub.email,
      "Telepon": sub.phone || "-",
      "Kategori": categoryConfig[sub.category]?.label || sub.category,
      "Status Pendaftar": sub.applicant_status?.replace("_", " ") || "-",
      "Kode Token": sub.token_code,
      "Tanggal Submit": new Date(sub.submitted_at).toLocaleDateString("id-ID"),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    const sheetName = selectedCategory === "all" ? "Semua Kategori" : categoryConfig[selectedCategory].label;
    XLSX.utils.book_append_sheet(wb, ws, `Terverifikasi - ${sheetName}`);
    XLSX.writeFile(wb, `peserta_terverifikasi_${selectedCategory}_${new Date().toISOString().split("T")[0]}.xlsx`);
    
    toast({ title: "Export berhasil", description: `${filteredSubmissions.length} data berhasil diexport` });
  };

  const categoryCounts = {
    all: submissions.length,
    prestasi: submissions.filter(s => s.category === "prestasi").length,
    yatim: submissions.filter(s => s.category === "yatim").length,
    ekonomi: submissions.filter(s => s.category === "ekonomi").length,
    umum: submissions.filter(s => s.category === "umum").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Peserta Terverifikasi</h1>
        <p className="text-muted-foreground">Daftar peserta yang sudah divalidasi dengan kode token</p>
      </div>

      {/* Stats */}
      <Card className="border-l-4 border-l-success">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Terverifikasi</p>
                <p className="text-3xl font-bold text-success">{submissions.length}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(categoryConfig) as ScholarshipCategory[]).map(cat => {
                const config = categoryConfig[cat];
                const Icon = config.icon;
                return (
                  <div key={cat} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{categoryCounts[cat]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter & Export */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Data Peserta Terverifikasi</CardTitle>
              <CardDescription>
                Menampilkan {filteredSubmissions.length} peserta 
                {selectedCategory !== "all" && ` kategori ${categoryConfig[selectedCategory].label}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {(Object.keys(categoryConfig) as ScholarshipCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {categoryConfig[cat].label} ({categoryCounts[cat]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportToExcel} className="gap-2">
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Belum ada peserta terverifikasi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kode Token</TableHead>
                    <TableHead>Tanggal Submit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub, idx) => {
                    const catConfig = categoryConfig[sub.category];
                    const Icon = catConfig?.icon || Globe;
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{sub.full_name}</TableCell>
                        <TableCell>{sub.email}</TableCell>
                        <TableCell>{sub.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Icon className="w-3 h-3" />
                            {catConfig?.label || sub.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{sub.applicant_status?.replace("_", " ")}</TableCell>
                        <TableCell className="font-mono text-xs bg-muted/50 rounded px-2">{sub.token_code}</TableCell>
                        <TableCell>{new Date(sub.submitted_at).toLocaleDateString("id-ID")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
