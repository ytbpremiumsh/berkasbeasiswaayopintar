import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, CheckCircle2, XCircle, MessageCircle, TrendingUp, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { toast } from "@/hooks/use-toast";

interface WaLog {
  id: string;
  recipient_phone: string;
  recipient_name: string;
  message: string;
  status: string;
  error_message: string | null;
  provider: string | null;
  created_at: string;
}

export function WhatsappLogs() {
  const [logs, setLogs] = useState<WaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [days, setDays] = useState<number>(7);

  const fetchLogs = async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data, error } = await supabase
      .from("whatsapp_logs")
      .select("*")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      toast({ title: "Gagal memuat log", description: error.message, variant: "destructive" });
    } else {
      setLogs((data || []) as WaLog[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (providerFilter !== "all" && (l.provider || "onesender") !== providerFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.recipient_phone.toLowerCase().includes(q) &&
            !l.recipient_name.toLowerCase().includes(q) &&
            !l.message.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [logs, statusFilter, providerFilter, search]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status === "success").length;
    const failed = logs.filter((l) => l.status === "failed").length;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = logs.filter((l) => l.created_at.slice(0, 10) === today).length;
    const successRate = total ? Math.round((success / total) * 100) : 0;
    return { total, success, failed, todayCount, successRate };
  }, [logs]);

  const dailyChart = useMemo(() => {
    const map = new Map<string, { date: string; success: number; failed: number; total: number }>();
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { date: key.slice(5), success: 0, failed: 0, total: 0 });
    }
    logs.forEach((l) => {
      const key = l.created_at.slice(0, 10);
      const e = map.get(key);
      if (!e) return;
      e.total++;
      if (l.status === "success") e.success++;
      else if (l.status === "failed") e.failed++;
    });
    return Array.from(map.values());
  }, [logs, days]);

  const exportCsv = () => {
    const headers = ["Tanggal", "Nama", "Nomor", "Status", "Provider", "Pesan", "Error"];
    const rows = filtered.map((l) => [
      new Date(l.created_at).toLocaleString("id-ID"),
      l.recipient_name,
      l.recipient_phone,
      l.status,
      l.provider || "onesender",
      (l.message || "").replace(/\n/g, " "),
      (l.error_message || "").replace(/\n/g, " "),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Laporan WhatsApp</h2>
          <p className="text-muted-foreground text-sm">Riwayat pengiriman & statistik harian (30 hari terakhir)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <MessageCircle className="w-4 h-4" /> Total
            </div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Sukses
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <XCircle className="w-4 h-4 text-destructive" /> Gagal
            </div>
            <div className="text-2xl font-bold mt-1 text-destructive">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <TrendingUp className="w-4 h-4" /> Hari Ini
            </div>
            <div className="text-2xl font-bold mt-1">{stats.todayCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <TrendingUp className="w-4 h-4" /> Success Rate
            </div>
            <div className="text-2xl font-bold mt-1">{stats.successRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Statistik Harian</CardTitle>
            <CardDescription>Pengiriman pesan per hari</CardDescription>
          </div>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 hari</SelectItem>
              <SelectItem value="14">14 hari</SelectItem>
              <SelectItem value="30">30 hari</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="success" name="Sukses" fill="hsl(var(--primary))" stackId="a" />
                <Bar dataKey="failed" name="Gagal" fill="hsl(var(--destructive))" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filter & table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengiriman</CardTitle>
          <CardDescription>{filtered.length} dari {logs.length} log</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Cari nama / nomor / pesan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="success">Sukses</SelectItem>
                <SelectItem value="failed">Gagal</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Provider" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua provider</SelectItem>
                <SelectItem value="mpwa">MPWA</SelectItem>
                <SelectItem value="onesender">OneSender</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pesan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada log pengiriman
                  </TableCell></TableRow>
                ) : filtered.slice(0, 200).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>{l.recipient_name}</TableCell>
                    <TableCell className="font-mono text-xs">{l.recipient_phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.provider || "onesender"}</Badge>
                    </TableCell>
                    <TableCell>
                      {l.status === "success" ? (
                        <Badge className="bg-green-600 hover:bg-green-700">Sukses</Badge>
                      ) : l.status === "failed" ? (
                        <Badge variant="destructive" title={l.error_message || ""}>Gagal</Badge>
                      ) : (
                        <Badge variant="secondary">{l.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs" title={l.message}>
                      {l.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 200 && (
            <p className="text-xs text-muted-foreground mt-2">Menampilkan 200 baris pertama. Export CSV untuk semua data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
