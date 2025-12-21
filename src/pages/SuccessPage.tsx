import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const SuccessPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full text-center animate-scale-in">
          <CardHeader>
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <CardTitle className="text-2xl">Berkas Terkirim!</CardTitle>
            <CardDescription>
              Pengajuan beasiswa Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.
            </p>
            <Button asChild className="w-full">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Beranda
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SuccessPage;
