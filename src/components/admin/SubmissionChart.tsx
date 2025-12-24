import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, subMonths, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { id } from "date-fns/locale";
import { BarChart3, TrendingUp } from "lucide-react";

type TimeRange = "7days" | "30days" | "6months";

export const SubmissionChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions-chart", timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case "7days":
          startDate = subDays(now, 7);
          break;
        case "30days":
          startDate = subDays(now, 30);
          break;
        case "6months":
          startDate = subMonths(now, 6);
          break;
      }

      const { data, error } = await supabase
        .from("scholarship_submissions")
        .select("submitted_at")
        .gte("submitted_at", startDate.toISOString())
        .order("submitted_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const getChartData = () => {
    const now = new Date();

    if (timeRange === "7days") {
      const days = eachDayOfInterval({
        start: subDays(now, 6),
        end: now,
      });

      return days.map((day) => {
        const count = submissions.filter((s) => {
          const subDate = new Date(s.submitted_at);
          return format(subDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
        }).length;

        return {
          date: format(day, "EEE", { locale: id }),
          fullDate: format(day, "d MMM", { locale: id }),
          count,
        };
      });
    }

    if (timeRange === "30days") {
      const days = eachDayOfInterval({
        start: subDays(now, 29),
        end: now,
      });

      return days.map((day) => {
        const count = submissions.filter((s) => {
          const subDate = new Date(s.submitted_at);
          return format(subDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
        }).length;

        return {
          date: format(day, "d", { locale: id }),
          fullDate: format(day, "d MMM", { locale: id }),
          count,
        };
      });
    }

    // 6 months - group by week
    const weeks = eachWeekOfInterval({
      start: subMonths(now, 6),
      end: now,
    });

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart);
      const count = submissions.filter((s) => {
        const subDate = new Date(s.submitted_at);
        return subDate >= weekStart && subDate <= weekEnd;
      }).length;

      return {
        date: format(weekStart, "d MMM", { locale: id }),
        fullDate: `${format(weekStart, "d MMM", { locale: id })} - ${format(weekEnd, "d MMM", { locale: id })}`,
        count,
      };
    });
  };

  const chartData = getChartData();
  const totalInRange = submissions.length;
  const avgPerDay = timeRange === "7days" 
    ? (totalInRange / 7).toFixed(1) 
    : timeRange === "30days" 
    ? (totalInRange / 30).toFixed(1) 
    : (totalInRange / 180).toFixed(1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{data.fullDate}</p>
          <p className="text-lg font-bold text-primary">{payload[0].value} pengajuan</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Statistik Pengajuan</CardTitle>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="7days" className="text-xs sm:text-sm">7 Hari</TabsTrigger>
              <TabsTrigger value="30days" className="text-xs sm:text-sm">30 Hari</TabsTrigger>
              <TabsTrigger value="6months" className="text-xs sm:text-sm">6 Bulan</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-primary/5 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Pengajuan</p>
            <p className="text-2xl font-bold text-primary">{totalInRange}</p>
          </div>
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Rata-rata/Hari</p>
            </div>
            <p className="text-2xl font-bold">{avgPerDay}</p>
          </div>
        </div>

        {/* Chart */}
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
