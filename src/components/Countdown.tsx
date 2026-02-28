import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Calendar } from "lucide-react";

interface CountdownSettings {
  value: string;
  title: string;
  enabled: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown() {
  const [settings, setSettings] = useState<CountdownSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings?.enabled || !settings?.value) return;

    const timer = setInterval(() => {
      const targetDate = new Date(settings.value).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setIsExpired(true);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "countdown_date")
      .maybeSingle();

    if (!error && data?.setting_value) {
      const settingValue = data.setting_value as unknown as CountdownSettings;
      setSettings(settingValue);
    }
  };

  if (!settings?.enabled || !settings?.value) return null;

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-primary mb-2">
          <Clock className="w-5 h-5" />
          <span className="font-semibold">Pendaftaran Telah Berakhir</span>
        </div>
        <p className="text-sm text-muted-foreground">{settings.title}</p>
      </div>
    );
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shadow-lg">
        <span className="text-xl md:text-2xl font-bold">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-xs md:text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
      <div className="flex items-center justify-center gap-2 text-primary mb-4">
        <Calendar className="w-5 h-5" />
        <span className="font-semibold">{settings.title}</span>
      </div>
      
      <div className="flex items-center justify-center gap-3 md:gap-4">
        <TimeUnit value={timeLeft.days} label="Hari" />
        <span className="text-2xl font-bold text-primary/50 mt-[-1rem]">:</span>
        <TimeUnit value={timeLeft.hours} label="Jam" />
        <span className="text-2xl font-bold text-primary/50 mt-[-1rem]">:</span>
        <TimeUnit value={timeLeft.minutes} label="Menit" />
        <span className="text-2xl font-bold text-primary/50 mt-[-1rem]">:</span>
        <TimeUnit value={timeLeft.seconds} label="Detik" />
      </div>
      
      <p className="text-center text-sm text-muted-foreground mt-4">
        Berakhir pada {new Date(settings.value).toLocaleDateString("id-ID", { 
          weekday: "long", 
          year: "numeric", 
          month: "long", 
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}
      </p>
    </div>
  );
}
