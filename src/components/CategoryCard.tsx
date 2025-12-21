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
  prestasi: "from-amber-500 to-orange-500",
  yatim: "from-rose-500 to-pink-500",
  ekonomi: "from-emerald-500 to-teal-500",
  umum: "from-blue-500 to-indigo-500",
};

export function CategoryCard({ category, title, description, slug, className }: CategoryCardProps) {
  const Icon = categoryIcons[category];
  const colorClass = categoryColors[category];

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
          colorClass
        )}
      />
      <CardHeader>
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg",
            colorClass
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
        <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Link to={`/beasiswa/${slug}`}>
            Daftar Sekarang
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
