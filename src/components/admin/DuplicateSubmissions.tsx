import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Users } from "lucide-react";

interface DuplicateGroup {
  type: "name" | "email";
  value: string;
  count: number;
  submissions: Array<{
    id: string;
    full_name: string;
    email: string;
    token_id: string;
    token_code?: string;
    category: string;
    submitted_at: string;
  }>;
}

export function DuplicateSubmissions({ programId }: { programId?: string | null }) {
  const [isLoading, setIsLoading] = useState(true);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);

  useEffect(() => {
    fetchDuplicates();
  }, [programId]);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("scholarship_submissions")
        .select("id, full_name, email, token_id, category, submitted_at")
        .order("submitted_at", { ascending: false });

      if (programId) {
        query = query.eq("program_id", programId);
      }

      const { data: submissions, error } = await query;

      if (error) throw error;

      // Get all tokens for mapping
      const { data: tokens } = await supabase
        .from("scholarship_tokens")
        .select("id, token_code");

      const tokenMap = new Map(tokens?.map(t => [t.id, t.token_code]) || []);

      // Add token_code to submissions
      const subsWithTokens = submissions?.map(s => ({
        ...s,
        token_code: tokenMap.get(s.token_id) || "Unknown"
      })) || [];

      // Find duplicates by name
      const nameGroups = new Map<string, typeof subsWithTokens>();
      subsWithTokens.forEach(sub => {
        const key = sub.full_name.toLowerCase().trim();
        if (!nameGroups.has(key)) {
          nameGroups.set(key, []);
        }
        nameGroups.get(key)!.push(sub);
      });

      // Find duplicates by email
      const emailGroups = new Map<string, typeof subsWithTokens>();
      subsWithTokens.forEach(sub => {
        const key = sub.email.toLowerCase().trim();
        if (!emailGroups.has(key)) {
          emailGroups.set(key, []);
        }
        emailGroups.get(key)!.push(sub);
      });

      const duplicatesList: DuplicateGroup[] = [];

      // Add name duplicates
      nameGroups.forEach((subs, name) => {
        if (subs.length > 1) {
          duplicatesList.push({
            type: "name",
            value: name,
            count: subs.length,
            submissions: subs
          });
        }
      });

      // Add email duplicates
      emailGroups.forEach((subs, email) => {
        if (subs.length > 1) {
          duplicatesList.push({
            type: "email",
            value: email,
            count: subs.length,
            submissions: subs
          });
        }
      });

      // Sort by count descending
      duplicatesList.sort((a, b) => b.count - a.count);

      setDuplicates(duplicatesList);
    } catch (error) {
      console.error("Error fetching duplicates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalDuplicates = duplicates.reduce((sum, d) => sum + d.count, 0);
  const uniqueDuplicateGroups = duplicates.length;

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
        <h1 className="text-2xl font-bold text-foreground">Deteksi Duplikasi</h1>
        <p className="text-muted-foreground">Daftar peserta yang terdeteksi mengajukan lebih dari sekali</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grup Duplikat</p>
                <p className="text-3xl font-bold">{uniqueDuplicateGroups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pengajuan Duplikat</p>
                <p className="text-3xl font-bold">{totalDuplicates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {duplicates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-success" />
            </div>
            <p className="text-lg font-medium">Tidak ada duplikasi ditemukan</p>
            <p className="text-muted-foreground">Semua pengajuan berasal dari peserta unik</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicates.map((group, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={group.type === "name" ? "secondary" : "outline"}>
                    {group.type === "name" ? "Nama Sama" : "Email Sama"}
                  </Badge>
                  <span className="font-medium capitalize">{group.value}</span>
                  <Badge variant="destructive">{group.count}x</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Tanggal Submit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.submissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.full_name}</TableCell>
                        <TableCell>{sub.email}</TableCell>
                        <TableCell className="font-mono text-xs">{sub.token_code}</TableCell>
                        <TableCell className="capitalize">{sub.category}</TableCell>
                        <TableCell>{new Date(sub.submitted_at).toLocaleDateString("id-ID")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
