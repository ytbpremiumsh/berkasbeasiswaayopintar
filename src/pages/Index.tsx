import { CategoryCard } from "@/components/CategoryCard";

const Index = () => {
  const categories = [
    { category: "prestasi" as const, title: "Beasiswa Prestasi", description: "Untuk pelajar dan mahasiswa berprestasi di bidang akademik maupun non-akademik.", slug: "prestasi" },
    { category: "yatim" as const, title: "Beasiswa Yatim", description: "Dukungan pendidikan bagi pelajar dan mahasiswa yatim yang membutuhkan.", slug: "yatim" },
    { category: "ekonomi" as const, title: "Beasiswa Ekonomi", description: "Bantuan pendidikan untuk keluarga dengan keterbatasan ekonomi.", slug: "ekonomi" },
    { category: "umum" as const, title: "Beasiswa Umum", description: "Kesempatan beasiswa terbuka untuk semua pelajar dan mahasiswa.", slug: "umum" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pilih Kategori Beasiswa</h1>
          <p className="text-muted-foreground">Silakan pilih kategori beasiswa yang sesuai</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {categories.map((cat) => (
            <CategoryCard key={cat.category} {...cat} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
