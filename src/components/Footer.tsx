import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground">Ayo Pintar</span>
              <span className="text-xs text-muted-foreground">Beasiswa Pendidikan</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Beranda
            </Link>
            <Link to="/#kategori" className="hover:text-foreground transition-colors">
              Kategori Beasiswa
            </Link>
            <Link to="/lolos-administrasi" className="hover:text-foreground transition-colors">
              Lolos Administrasi
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Masuk
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ayo Pintar. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
