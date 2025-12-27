import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Trophy, Heart, Wallet, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdsenseAd } from "@/components/AdsenseAd";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

const categoryIcons: Record<ScholarshipCategory, any> = {
  prestasi: Trophy,
  yatim: Heart,
  ekonomi: Wallet,
  umum: Globe,
};

const categoryGradients: Record<ScholarshipCategory, string> = {
  prestasi: "from-amber-500 to-orange-500",
  yatim: "from-rose-500 to-pink-500",
  ekonomi: "from-emerald-500 to-teal-500",
  umum: "from-blue-500 to-indigo-500",
};

interface SuccessTemplate {
  title: string;
  description: string;
  note: string;
  button_text: string;
  button_link: string;
}

const defaultTemplate: SuccessTemplate = {
  title: "Berkas Terkirim!",
  description: "Pengajuan beasiswa Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.",
  note: "Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.",
  button_text: "Kembali ke Beranda",
  button_link: "/",
};

const SuccessPage = () => {
  const { category } = useParams<{ category: string }>();
  const [template, setTemplate] = useState<SuccessTemplate>(defaultTemplate);
  const [isLoading, setIsLoading] = useState(true);

  const validCategory = (category || "umum") as ScholarshipCategory;
  const Icon = categoryIcons[validCategory] || Globe;
  const gradient = categoryGradients[validCategory] || "from-blue-500 to-indigo-500";

  useEffect(() => {
    fetchTemplate();
  }, [category]);

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("success_templates")
        .select("*")
        .eq("category", validCategory)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setTemplate({
          title: data.title,
          description: data.description,
          note: data.note || "",
          button_text: data.button_text,
          button_link: data.button_link,
        });
      }
    } catch (error) {
      console.error("Error fetching template:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header Ad */}
      <AdsenseAd placement="header" className="container mx-auto px-4 mt-4" />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <Card variant="elevated" className="text-center animate-scale-in">
            <CardHeader className="pb-4">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <div className="w-20 h-20 rounded-full bg-background/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">{template.title}</CardTitle>
              <CardDescription className="text-base mt-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {template.note && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    {template.note}
                  </p>
                </div>
              )}
              <Button asChild className="w-full" size="lg">
                <Link to={template.button_link}>
                  {template.button_text}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Content Bottom Ad */}
          <AdsenseAd placement="content_bottom" />
        </div>
      </main>
      
      {/* Footer Ad */}
      <AdsenseAd placement="footer" className="container mx-auto px-4 mb-4" />
    </div>
  );
};

export default SuccessPage;
