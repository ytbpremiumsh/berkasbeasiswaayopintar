import { Trophy, Heart, Wallet, Globe, GraduationCap } from "lucide-react";

interface FormBannerProps {
  category: "prestasi" | "yatim" | "ekonomi" | "umum";
}

const categoryConfig = {
  prestasi: {
    title: "Beasiswa Prestasi",
    subtitle: "Untuk Pelajar & Mahasiswa Berprestasi",
    icon: Trophy,
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    pattern: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]",
  },
  yatim: {
    title: "Beasiswa Yatim",
    subtitle: "Dukungan Pendidikan untuk Yatim",
    icon: Heart,
    gradient: "from-rose-500 via-pink-500 to-red-400",
    pattern: "bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))]",
  },
  ekonomi: {
    title: "Beasiswa Ekonomi",
    subtitle: "Bantuan untuk Keluarga Kurang Mampu",
    icon: Wallet,
    gradient: "from-emerald-500 via-teal-500 to-green-400",
    pattern: "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))]",
  },
  umum: {
    title: "Beasiswa Umum",
    subtitle: "Kesempatan untuk Semua Pelajar",
    icon: Globe,
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    pattern: "bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))]",
  },
};

export function FormBanner({ category }: FormBannerProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${config.pattern} ${config.gradient} p-6 md:p-8 mb-6`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-20">
        <Icon className="w-full h-full" />
      </div>
      <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-white/10 blur-xl" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">{config.title}</h2>
          <p className="text-white/80 text-sm md:text-base">{config.subtitle}</p>
        </div>
      </div>
      
      {/* Bottom info */}
      <div className="relative z-10 mt-4 pt-4 border-t border-white/20">
        <p className="text-white/90 text-xs md:text-sm">
          📋 Pastikan semua berkas sudah siap sebelum mengisi formulir
        </p>
      </div>
    </div>
  );
}
