import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const selected = programs.find(p => p.id === selectedProgramId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors whitespace-nowrap">
          <GraduationCap className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground truncate max-w-[250px]">
            {selected?.name || "Pilih Program"}
          </span>
          {selected?.is_active && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              Aktif
            </Badge>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[240px]">
        {programs.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => onProgramChange(p.id)}
            className="flex items-center justify-between gap-3 whitespace-nowrap cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{p.name}</span>
              {p.is_active && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                  Aktif
                </Badge>
              )}
            </span>
            {p.id === selectedProgramId && (
              <Check className="w-4 h-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
