import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Trophy, Heart, Wallet, Globe, FileText, CheckCircle, XCircle, Clock,
  TrendingUp, Users, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

type ScholarshipCategory = "prestasi" | "yatim" | "ekonomi" | "umum";

interface CategoryStats {
  total: number;
  menunggu: number;
  diverifikasi: number;
  ditolak: number;
}

interface AnalyticsDashboardProps {
  categoryStats: Record<ScholarshipCategory, CategoryStats>;
  totalTokens: number;
  usedTokens: number;
  recentSubmissions: number;
}

const categoryConfig = {
  prestasi: { 
    label: "Prestasi", 
    icon: Trophy, 
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-500/10",
    text: "text-amber-500"
  },
  yatim: { 
    label: "Yatim", 
    icon: Heart, 
    gradient: "from-rose-500 to-pink-500",
    bgLight: "bg-rose-500/10",
    text: "text-rose-500"
  },
  ekonomi: { 
    label: "Ekonomi", 
    icon: Wallet, 
    gradient: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-500/10",
    text: "text-emerald-500"
  },
  umum: { 
    label: "Umum", 
    icon: Globe, 
    gradient: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-500/10",
    text: "text-blue-500"
  },
};

export function AnalyticsDashboard({ categoryStats, totalTokens, usedTokens, recentSubmissions }: AnalyticsDashboardProps) {
  const totalAll = Object.values(categoryStats).reduce((sum, s) => sum + s.total, 0);
  const totalMenunggu = Object.values(categoryStats).reduce((sum, s) => sum + s.menunggu, 0);
  const totalDiverifikasi = Object.values(categoryStats).reduce((sum, s) => sum + s.diverifikasi, 0);
  const totalDitolak = Object.values(categoryStats).reduce((sum, s) => sum + s.ditolak, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Analitik</h1>
          <p className="text-muted-foreground">Pantau statistik pengajuan beasiswa secara real-time</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Terakhir diperbarui</p>
          <p className="text-sm font-medium">{new Date().toLocaleDateString("id-ID", { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pengajuan</p>
                <p className="text-3xl font-bold text-foreground">{totalAll}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Menunggu Review</p>
                <p className="text-3xl font-bold text-warning">{totalMenunggu}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Diverifikasi</p>
                <p className="text-3xl font-bold text-success">{totalDiverifikasi}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ditolak</p>
                <p className="text-3xl font-bold text-destructive">{totalDitolak}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(categoryConfig) as ScholarshipCategory[]).map((cat) => {
          const config = categoryConfig[cat];
          const stats = categoryStats[cat];
          const Icon = config.icon;
          const completionRate = stats.total > 0 
            ? Math.round((stats.diverifikasi / stats.total) * 100) 
            : 0;

          return (
            <Card key={cat} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className={cn("h-2 bg-gradient-to-r", config.gradient)} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg", config.gradient)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Pengajuan</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <h3 className="font-semibold text-lg">Beasiswa {config.label}</h3>
                
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Tingkat Verifikasi</span>
                    <span className={cn("font-medium", config.text)}>{completionRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full bg-gradient-to-r transition-all duration-500", config.gradient)}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                  <div>
                    <p className="text-lg font-semibold text-warning">{stats.menunggu}</p>
                    <p className="text-[10px] text-muted-foreground">Menunggu</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-success">{stats.diverifikasi}</p>
                    <p className="text-[10px] text-muted-foreground">Verified</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-destructive">{stats.ditolak}</p>
                    <p className="text-[10px] text-muted-foreground">Ditolak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Token</p>
                <p className="text-3xl font-bold">{totalTokens}</p>
                <p className="text-xs text-muted-foreground">{usedTokens} sudah digunakan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Token Tersedia</p>
                <p className="text-3xl font-bold">{totalTokens - usedTokens}</p>
                <p className="text-xs text-muted-foreground">Siap digunakan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pengajuan Terbaru</p>
                <p className="text-3xl font-bold">{recentSubmissions}</p>
                <p className="text-xs text-muted-foreground">7 hari terakhir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}