import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Users, FileCheck, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const categories = [
    {
      category: "prestasi" as const,
      title: "Beasiswa Prestasi",
      description: "Untuk pelajar dan mahasiswa berprestasi di bidang akademik maupun non-akademik.",
      slug: "prestasi",
    },
    {
      category: "yatim" as const,
      title: "Beasiswa Yatim",
      description: "Dukungan pendidikan bagi pelajar dan mahasiswa yatim yang membutuhkan.",
      slug: "yatim",
    },
    {
      category: "ekonomi" as const,
      title: "Beasiswa Ekonomi",
      description: "Bantuan pendidikan untuk keluarga dengan keterbatasan ekonomi.",
      slug: "ekonomi",
    },
    {
      category: "umum" as const,
      title: "Beasiswa Umum",
      description: "Kesempatan beasiswa terbuka untuk semua pelajar dan mahasiswa.",
      slug: "umum",
    },
  ];

  const features = [
    { icon: GraduationCap, title: "Pendaftaran Mudah", description: "Proses pendaftaran yang simpel dan user-friendly" },
    { icon: Users, title: "Berbagai Kategori", description: "4 kategori beasiswa sesuai kebutuhan Anda" },
    { icon: FileCheck, title: "Verifikasi Cepat", description: "Tim kami akan memverifikasi berkas dengan cepat" },
    { icon: Shield, title: "Data Aman", description: "Keamanan data pribadi Anda terjamin" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <GraduationCap className="w-4 h-4" />
              Beasiswa Pendidikan Ayo Pintar
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Raih Mimpimu dengan{" "}
              <span className="text-gradient">Beasiswa Pendidikan</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Platform pengiriman berkas beasiswa yang mudah, cepat, dan aman untuk pelajar dan mahasiswa Indonesia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="hero" size="xl">
                <a href="#kategori">
                  Daftar Sekarang
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/auth">Masuk ke Akun</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="kategori" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pilih Kategori Beasiswa
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Temukan kategori beasiswa yang sesuai dengan kondisi dan kebutuhan Anda
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.category}
                {...cat}
                className="animate-slide-up"
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
