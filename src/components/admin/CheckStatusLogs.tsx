import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, RefreshCw, Trash2, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const resultLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  has_submission: { label: "Berkas Terkirim", variant: "default" },
  valid_no_submission: { label: "Belum Kirim", variant: "secondary" },
  not_found: { label: "Tidak Ditemukan", variant: "destructive" },
};

export function CheckStatusLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("check_status_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      toast({ title: "Gagal memuat log", variant: "destructive" });
    } else {
      setLogs(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const clearLogs = async () => {
    if (!confirm("Hapus semua log cek status?")) return;
    const { error } = await supabase.from("check_status_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Log dihapus" });
      setLogs([]);
    }
  };

  const filtered = logs.filter(l =>
    l.token_code.toLowerCase().includes(search.toLowerCase()) ||
    (l.submission_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: logs.length,
    found: logs.filter(l => l.result === "has_submission").length,
    noSubmission: logs.filter(l => l.result === "valid_no_submission").length,
    notFound: logs.filter(l => l.result === "not_found").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Log Cek Status</h1>
        <p className="text-muted-foreground">Pantau aktivitas pengecekan status berkas oleh peserta</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Cek</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.found}</p>
              <p className="text-xs text-muted-foreground">Berkas Terkirim</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.noSubmission}</p>
              <p className="text-xs text-muted-foreground">Belum Kirim</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.notFound}</p>
              <p className="text-xs text-muted-foreground">Tidak Ditemukan</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari token atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="destructive" onClick={clearLogs} size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          Hapus Semua
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">Belum ada log</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Hasil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => {
                    const r = resultLabels[log.result] || { label: log.result, variant: "secondary" as const };
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric",
                          })}{" "}
                          {new Date(log.created_at).toLocaleTimeString("id-ID", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.token_code}</TableCell>
                        <TableCell className="text-sm">{log.submission_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={r.variant}>{r.label}</Badge>
                        </TableCell>
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
