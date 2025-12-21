import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Berhasil masuk", description: "Selamat datang kembali!" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast({ title: "Pendaftaran berhasil", description: "Akun Anda telah dibuat. Silakan masuk." });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({ title: "Terjadi kesalahan", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-md animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isLogin ? "Masuk" : "Daftar"}</CardTitle>
            <CardDescription>
              {isLogin ? "Masuk ke akun Anda untuk melanjutkan" : "Buat akun baru untuk mendaftar beasiswa"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Nama lengkap Anda" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="email@contoh.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kata Sandi</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isLogin ? "Masuk" : "Daftar"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary hover:underline">
                {isLogin ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
