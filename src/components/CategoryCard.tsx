import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowRight, Trophy, Heart, Wallet, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: "prestasi" | "yatim" | "ekonomi" | "umum";
  title: string;
  description: string;
  slug: string;
  className?: string;
}

const categoryIcons = {
  prestasi: Trophy,
  yatim: Heart,
  ekonomi: Wallet,
  umum: Globe,
};

const categoryColors = {
  prestasi: {
    gradient: "from-amber-500 to-orange-500",
    button: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0",
    shadow: "shadow-amber-500/25",
  },
  yatim: {
    gradient: "from-rose-500 to-pink-500",
    button: "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0",
    shadow: "shadow-rose-500/25",
  },
  ekonomi: {
    gradient: "from-emerald-500 to-teal-500",
    button: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0",
    shadow: "shadow-emerald-500/25",
  },
  umum: {
    gradient: "from-blue-500 to-indigo-500",
    button: "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0",
    shadow: "shadow-indigo-500/25",
  },
};

export function CategoryCard({ category, title, description, slug, className }: CategoryCardProps) {
  const Icon = categoryIcons[category];
  const colors = categoryColors[category];

  return (
    <Card
      variant="elevated"
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
          colors.gradient
        )}
      />
      <CardHeader>
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg",
            colors.gradient,
            colors.shadow
          )}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          asChild 
          className={cn(
            "w-full shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
            colors.button,
            colors.shadow
          )}
        >
          <Link to={`/beasiswa/${slug}`}>
            Daftar Sekarang
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
