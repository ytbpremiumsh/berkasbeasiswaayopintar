import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ShortlinkRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      navigate("/");
      return;
    }

    const redirect = async () => {
      try {
        // Call edge function to log visit and get destination
        const { data, error } = await supabase.functions.invoke("shortlink-redirect", {
          body: { slug },
        });

        if (error) {
          console.error("Redirect error:", error);
          setError("Terjadi kesalahan saat memproses link");
          return;
        }

        if (!data?.destination) {
          setError("Link tidak ditemukan atau tidak aktif");
          return;
        }

        // Redirect to destination
        window.location.href = data.destination;
      } catch (err) {
        console.error("Redirect error:", err);
        setError("Terjadi kesalahan");
      }
    };

    redirect();
  }, [slug, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive text-lg">{error}</p>
          <button 
            onClick={() => navigate("/")}
            className="text-primary hover:underline"
          >
            Kembali ke beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Mengalihkan...</p>
    </div>
  );
};

export default ShortlinkRedirect;
