import { Card, CardContent } from "@/components/ui/card";
import { 
  Trophy, Heart, Wallet, Globe, FileText, CheckCircle, XCircle, Clock,
  TrendingUp, Users, Calendar, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubmissionChart } from "./SubmissionChart";
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
  
  const verificationRate = totalAll > 0 ? Math.round((totalDiverifikasi / totalAll) * 100) : 0;
  const tokenUsageRate = totalTokens > 0 ? Math.round((usedTokens / totalTokens) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("id-ID", { 
            weekday: "long", day: "numeric", month: "long", year: "numeric" 
          })}</p>
        </div>
      </div>

      {/* Main Stats Card - Compact Infographic Style */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Total Submissions */}
            <div className="col-span-2 flex items-center gap-4 p-4 bg-card rounded-xl shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-4xl font-bold">{totalAll}</p>
                <p className="text-sm text-muted-foreground">Total Pengajuan</p>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="flex flex-col justify-center p-3 bg-warning/5 rounded-xl border border-warning/20">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-2xl font-bold text-warning">{totalMenunggu}</span>
              </div>
              <p className="text-xs text-muted-foreground">Menunggu</p>
            </div>
            
            <div className="flex flex-col justify-center p-3 bg-success/5 rounded-xl border border-success/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-2xl font-bold text-success">{totalDiverifikasi}</span>
              </div>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
            
            <div className="flex flex-col justify-center p-3 bg-destructive/5 rounded-xl border border-destructive/20">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <span className="text-2xl font-bold text-destructive">{totalDitolak}</span>
              </div>
              <p className="text-xs text-muted-foreground">Ditolak</p>
            </div>

            <div className="flex flex-col justify-center p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">{verificationRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Verifikasi</p>
            </div>
          </div>
        </div>

        {/* Category Mini Cards */}
        <div className="p-4 border-t bg-muted/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(categoryConfig) as ScholarshipCategory[]).map((cat) => {
              const config = categoryConfig[cat];
              const stats = categoryStats[cat];
              const Icon = config.icon;
              const rate = stats.total > 0 ? Math.round((stats.diverifikasi / stats.total) * 100) : 0;

              return (
                <div key={cat} className="group relative p-4 bg-card rounded-xl hover:shadow-md transition-all duration-200 cursor-default">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-sm", config.gradient)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold">{stats.total}</span>
                  </div>
                  <p className="font-medium text-sm">{config.label}</p>
                  
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full bg-gradient-to-r transition-all", config.gradient)}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  
                  {/* Mini stats on hover */}
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="text-warning">{stats.menunggu} pending</span>
                    <span className="text-success">{stats.diverifikasi} ok</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Token & Activity Row - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{totalTokens}</span>
                <span className="text-xs text-muted-foreground">{tokenUsageRate}% used</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Token</p>
              <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-violet-500" style={{ width: `${tokenUsageRate}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold">{totalTokens - usedTokens}</span>
              <p className="text-sm text-muted-foreground">Token Tersedia</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold">{recentSubmissions}</span>
              <p className="text-sm text-muted-foreground">7 Hari Terakhir</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Submission Chart */}
      <SubmissionChart />
    </div>
  );
}