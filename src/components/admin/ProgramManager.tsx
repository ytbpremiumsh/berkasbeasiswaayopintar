import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, GraduationCap, Trash2, Edit, Check } from "lucide-react";

interface Program {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface ProgramStats {
  submissions: number;
  tokens: number;
  registrations: number;
}

export function ProgramManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<Record<string, ProgramStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("scholarship_programs")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPrograms(data || []);

      // Fetch stats for each program
      const statsMap: Record<string, ProgramStats> = {};
      for (const prog of data || []) {
        const [subs, toks, regs] = await Promise.all([
          supabase.from("scholarship_submissions").select("id", { count: "exact", head: true }).eq("program_id", prog.id),
          supabase.from("scholarship_tokens").select("id", { count: "exact", head: true }).eq("program_id", prog.id),
          supabase.from("registrations").select("id", { count: "exact", head: true }).eq("program_id", prog.id),
        ]);
        statsMap[prog.id] = {
          submissions: subs.count || 0,
          tokens: toks.count || 0,
          registrations: regs.count || 0,
        };
      }
      setStats(statsMap);
    } catch (error: any) {
      toast({ title: "Gagal memuat program", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("scholarship_programs")
          .update({ name, description: description || null })
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Program diperbarui" });
      } else {
        const { error } = await supabase
          .from("scholarship_programs")
          .insert({ name, description: description || null, is_active: false });
        if (error) throw error;
        toast({ title: "Program ditambahkan" });
      }
      setName("");
      setDescription("");
      setEditingId(null);
      setShowAdd(false);
      fetchPrograms();
    } catch (error: any) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (programId: string, currentActive: boolean) => {
    try {
      if (!currentActive) {
        // Deactivate all others first
        await supabase.from("scholarship_programs").update({ is_active: false }).neq("id", programId);
      }
      const { error } = await supabase
        .from("scholarship_programs")
        .update({ is_active: !currentActive })
        .eq("id", programId);
      if (error) throw error;
      toast({ title: !currentActive ? "Program diaktifkan" : "Program dinonaktifkan" });
      fetchPrograms();
    } catch (error: any) {
      toast({ title: "Gagal mengubah status", description: error.message, variant: "destructive" });
    }
  };

  const deleteProgram = async (programId: string) => {
    const s = stats[programId];
    if (s && (s.submissions > 0 || s.tokens > 0 || s.registrations > 0)) {
      toast({ title: "Tidak bisa dihapus", description: "Program ini masih memiliki data. Nonaktifkan saja.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("scholarship_programs").delete().eq("id", programId);
      if (error) throw error;
      toast({ title: "Program dihapus" });
      fetchPrograms();
    } catch (error: any) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    }
  };

  const startEdit = (prog: Program) => {
    setEditingId(prog.id);
    setName(prog.name);
    setDescription(prog.description || "");
    setShowAdd(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Program Beasiswa</h1>
          <p className="text-sm text-muted-foreground">Kelola program/batch beasiswa. Hanya 1 program aktif untuk publik.</p>
        </div>
        <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) { setEditingId(null); setName(""); setDescription(""); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Tambah Program</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Program" : "Tambah Program Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Program</Label>
                <Input placeholder="Contoh: Beasiswa Batch 2" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi (opsional)</Label>
                <Textarea placeholder="Deskripsi singkat program..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <Button onClick={handleSave} disabled={isSaving || !name.trim()} className="w-full">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingId ? "Simpan Perubahan" : "Tambah Program"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {programs.map((prog) => {
          const s = stats[prog.id] || { submissions: 0, tokens: 0, registrations: 0 };
          return (
            <Card key={prog.id} className={prog.is_active ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{prog.name}</CardTitle>
                      {prog.description && <CardDescription className="text-xs mt-0.5">{prog.description}</CardDescription>}
                    </div>
                  </div>
                  {prog.is_active && <Badge className="shrink-0">Aktif</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold">{s.submissions}</p>
                    <p className="text-[10px] text-muted-foreground">Pengajuan</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold">{s.tokens}</p>
                    <p className="text-[10px] text-muted-foreground">Token</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold">{s.registrations}</p>
                    <p className="text-[10px] text-muted-foreground">Pendaftaran</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={prog.is_active} onCheckedChange={() => toggleActive(prog.id, prog.is_active)} />
                    <Label className="text-sm">{prog.is_active ? "Aktif" : "Nonaktif"}</Label>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(prog)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteProgram(prog.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Dibuat: {new Date(prog.created_at).toLocaleDateString("id-ID")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {programs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Belum ada program beasiswa. Tambahkan program pertama Anda.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
