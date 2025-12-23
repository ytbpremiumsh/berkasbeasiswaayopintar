import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export function SimpleHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground">Ayo Pintar</span>
              <span className="text-xs text-muted-foreground">Beasiswa Pendidikan</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
