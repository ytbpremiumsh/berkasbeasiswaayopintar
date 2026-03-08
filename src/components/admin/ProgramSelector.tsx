import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap } from "lucide-react";

interface Program {
  id: string;
  name: string;
  is_active: boolean;
}

interface ProgramSelectorProps {
  selectedProgramId: string | null;
  onProgramChange: (programId: string) => void;
}

export function ProgramSelector({ selectedProgramId, onProgramChange }: ProgramSelectorProps) {
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    const { data } = await supabase
      .from("scholarship_programs")
      .select("id, name, is_active")
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      setPrograms(data);
      if (!selectedProgramId) {
        const active = data.find(p => p.is_active);
        onProgramChange(active?.id || data[0].id);
      }
    }
  };

  if (programs.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
      <Select value={selectedProgramId || ""} onValueChange={onProgramChange}>
        <SelectTrigger className="w-[200px] h-9 text-sm">
          <SelectValue placeholder="Pilih Program" />
        </SelectTrigger>
        <SelectContent className="bg-card border">
          {programs.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-2">
                {p.name}
                {p.is_active && <span className="text-[10px] text-primary font-medium">(Aktif)</span>}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
