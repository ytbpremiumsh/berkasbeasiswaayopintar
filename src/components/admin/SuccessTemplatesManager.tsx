import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Heart, Wallet, Globe, Save, Loader2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

interface SuccessTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  note: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
}

const categoryConfig: Record<ScholarshipCategory, { label: string; icon: any; gradient: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, gradient: "from-amber-500 to-orange-500" },
  yatim: { label: "Yatim", icon: Heart, gradient: "from-rose-500 to-pink-500" },
  ekonomi: { label: "Ekonomi", icon: Wallet, gradient: "from-emerald-500 to-teal-500" },
  umum: { label: "Umum", icon: Globe, gradient: "from-blue-500 to-indigo-500" },
};

export function SuccessTemplatesManager() {
  const [templates, setTemplates] = useState<Record<ScholarshipCategory, SuccessTemplate | null>>({
    prestasi: null,
    yatim: null,
    ekonomi: null,
    umum: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<ScholarshipCategory | null>(null);
  const [activeTab, setActiveTab] = useState<ScholarshipCategory>("prestasi");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("success_templates")
        .select("*");

      if (error) throw error;

      const templatesMap: Record<ScholarshipCategory, SuccessTemplate | null> = {
        prestasi: null,
        yatim: null,
        ekonomi: null,
        umum: null,
      };

      // Default template structure
      const defaultTemplate = (cat: ScholarshipCategory): SuccessTemplate => ({
        id: "",
        category: cat,
        title: "Berkas Terkirim!",
        description: `Pengajuan beasiswa ${cat} Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.`,
        note: "Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.",
        button_text: "Kembali ke Beranda",
        button_link: "/",
        is_active: true,
      });

      // First fill with defaults
      (Object.keys(templatesMap) as ScholarshipCategory[]).forEach((cat) => {
        templatesMap[cat] = defaultTemplate(cat);
      });

      // Then override with database values
      data?.forEach((template) => {
        const cat = template.category as ScholarshipCategory;
        if (templatesMap.hasOwnProperty(cat)) {
          templatesMap[cat] = template as SuccessTemplate;
        }
      });

      setTemplates(templatesMap);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({ title: "Gagal memuat template", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = (category: ScholarshipCategory, field: keyof SuccessTemplate, value: string | boolean) => {
    setTemplates((prev) => ({
      ...prev,
      [category]: prev[category] ? { ...prev[category]!, [field]: value } : null,
    }));
  };

  const saveTemplate = async (category: ScholarshipCategory) => {
    const template = templates[category];
    if (!template) return;

    setIsSaving(category);
    try {
      // Check if template exists in database
      const { data: existing } = await supabase
        .from("success_templates")
        .select("id")
        .eq("category", category)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("success_templates")
          .update({
            title: template.title,
            description: template.description,
            note: template.note,
            button_text: template.button_text,
            button_link: template.button_link,
            is_active: template.is_active,
          })
          .eq("category", category);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("success_templates")
          .insert({
            category,
            title: template.title,
            description: template.description,
            note: template.note,
            button_text: template.button_text,
            button_link: template.button_link,
            is_active: template.is_active,
          });

        if (error) throw error;
      }

      toast({ title: "Template berhasil disimpan" });
      fetchTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({ title: "Gagal menyimpan template", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Template Halaman Sukses</h1>
        <p className="text-muted-foreground">Kustomisasi pesan sukses untuk setiap kategori beasiswa</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ScholarshipCategory)}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          {(Object.keys(categoryConfig) as ScholarshipCategory[]).map((cat) => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            return (
              <TabsTrigger key={cat} value={cat} className="gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(categoryConfig) as ScholarshipCategory[]).map((cat) => {
          const config = categoryConfig[cat];
          const Icon = config.icon;
          const template = templates[cat];

          return (
            <TabsContent key={cat} value={cat}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Template Beasiswa {config.label}</CardTitle>
                      <CardDescription>Sesuaikan pesan sukses untuk kategori {config.label.toLowerCase()}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {template ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Judul</label>
                        <Input
                          value={template.title}
                          onChange={(e) => updateTemplate(cat, "title", e.target.value)}
                          placeholder="Berkas Terkirim!"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Deskripsi</label>
                        <Textarea
                          value={template.description}
                          onChange={(e) => updateTemplate(cat, "description", e.target.value)}
                          placeholder="Pengajuan beasiswa Anda telah berhasil dikirim..."
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Catatan Tambahan</label>
                        <Textarea
                          value={template.note || ""}
                          onChange={(e) => updateTemplate(cat, "note", e.target.value)}
                          placeholder="Kami akan mengirimkan notifikasi melalui WhatsApp..."
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Teks Tombol</label>
                          <Input
                            value={template.button_text}
                            onChange={(e) => updateTemplate(cat, "button_text", e.target.value)}
                            placeholder="Kembali ke Beranda"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Link Tombol</label>
                          <Input
                            value={template.button_link}
                            onChange={(e) => updateTemplate(cat, "button_link", e.target.value)}
                            placeholder="/"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button onClick={() => saveTemplate(cat)} disabled={isSaving === cat}>
                          {isSaving === cat ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Simpan Template
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Preview Halaman Sukses</DialogTitle>
                            </DialogHeader>
                            <div className="text-center py-6 space-y-4">
                              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center mx-auto`}>
                                <div className="w-16 h-16 rounded-full bg-background/20 flex items-center justify-center">
                                  <Icon className="w-8 h-8 text-white" />
                                </div>
                              </div>
                              <h3 className="text-xl font-bold">{template.title}</h3>
                              <p className="text-muted-foreground">{template.description}</p>
                              {template.note && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="text-sm text-muted-foreground">{template.note}</p>
                                </div>
                              )}
                              <Button className="w-full">{template.button_text}</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Template tidak ditemukan untuk kategori ini.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
