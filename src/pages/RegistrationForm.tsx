import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Trophy, Heart, Wallet, Globe } from "lucide-react";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

interface RegistrationField {
  id: string;
  category: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  description: string | null;
  placeholder: string | null;
  options: any;
}

const categoryConfig: Record<ScholarshipCategory, { label: string; icon: any; gradient: string }> = {
  prestasi: { label: "Prestasi", icon: Trophy, gradient: "from-amber-500 to-orange-500" },
  yatim: { label: "Yatim", icon: Heart, gradient: "from-rose-500 to-pink-500" },
  ekonomi: { label: "Ekonomi", icon: Wallet, gradient: "from-emerald-500 to-teal-500" },
  umum: { label: "Umum", icon: Globe, gradient: "from-blue-500 to-indigo-500" },
};

const RegistrationForm = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";

  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validCategory = category as ScholarshipCategory;
  const config = categoryConfig[validCategory];

  useEffect(() => {
    if (config) fetchFields();
  }, [category]);

  const fetchFields = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("registration_fields")
        .select("*")
        .eq("category", validCategory)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error("Error fetching fields:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of fields) {
      if (field.is_required && !formData[field.field_name]?.trim()) {
        toast({ title: "Error", description: `${field.field_label} wajib diisi`, variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Get active program
      const { data: activeProgram } = await supabase
        .from("scholarship_programs")
        .select("id")
        .eq("is_active", true)
        .maybeSingle();

      const { error } = await supabase.from("registrations").insert({
        category: validCategory,
        form_data: formData,
        program_id: activeProgram?.id || null,
      });

      if (error) throw error;
      setIsSubmitted(true);
      toast({ title: "Berhasil!", description: "Pendaftaran Anda telah berhasil dikirim" });
    } catch (error: any) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Kategori tidak ditemukan</p>
      </div>
    );
  }

  const Icon = config.icon;

  if (isSubmitted) {
    return (
      <div className={cn("min-h-screen flex flex-col", isEmbed && "min-h-0")}>
        {!isEmbed && <SimpleHeader />}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-gradient-to-br", config.gradient)}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Pendaftaran Berhasil!</h2>
              <p className="text-muted-foreground">
                Terima kasih telah mendaftar Beasiswa {config.label}. Data Anda telah kami terima.
              </p>
              {!isEmbed && (
                <Button onClick={() => window.location.href = "/"} variant="outline">
                  Kembali ke Beranda
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        {!isEmbed && <Footer />}
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex flex-col bg-muted/30", isEmbed && "min-h-0 bg-transparent")}>
      {!isEmbed && <SimpleHeader />}
      <div className="flex-1 flex items-start justify-center p-4 py-8">
        <Card className="max-w-xl w-full">
          <CardHeader className="text-center">
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 bg-gradient-to-br", config.gradient)}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-xl">Pendaftaran Beasiswa {config.label}</CardTitle>
            <CardDescription>Silakan isi data di bawah ini dengan lengkap dan benar</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : fields.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Form pendaftaran belum dikonfigurasi</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.field_label}
                      {field.is_required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                    {field.field_type === "select" ? (
                      <Select
                        value={formData[field.field_name] || ""}
                        onValueChange={(v) => handleChange(field.field_name, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Pilih..."} />
                        </SelectTrigger>
                        <SelectContent className="bg-card border">
                          {(Array.isArray(field.options) ? field.options : JSON.parse(field.options || "[]")).map((opt: string) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.field_type === "textarea" ? (
                      <Textarea
                        placeholder={field.placeholder || ""}
                        value={formData[field.field_name] || ""}
                        onChange={(e) => handleChange(field.field_name, e.target.value)}
                        rows={4}
                      />
                    ) : (
                      <Input
                        type={field.field_type === "url" ? "url" : field.field_type === "email" ? "email" : "text"}
                        placeholder={field.placeholder || ""}
                        value={formData[field.field_name] || ""}
                        onChange={(e) => handleChange(field.field_name, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Mengirim...
                    </>
                  ) : (
                    "Daftar Sekarang"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      {!isEmbed && <Footer />}
    </div>
  );
};

export default RegistrationForm;
