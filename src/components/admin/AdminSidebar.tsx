import { FileText, Key, FormInput, Settings, LayoutDashboard, LogOut, CheckSquare, Copy, BadgeCheck, PanelLeftClose, PanelLeft, Users, MonitorPlay, Wallet, ChevronDown, Image, Link2, ListChecks, Clock, MessageCircle, Code, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userRole?: "admin" | "staff" | null;
}

const menuGroups = [
  {
    id: "main",
    label: "Menu Utama",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "all-submissions", label: "Semua Pengajuan", icon: ListChecks },
      { id: "submissions", label: "Per Kategori", icon: FileText },
      { id: "verified", label: "Terverifikasi", icon: BadgeCheck },
      { id: "duplicates", label: "Duplikasi", icon: Copy },
      { id: "tokens", label: "Kode Token", icon: Key },
    ],
  },
  {
    id: "mayar",
    label: "Mayar Payment",
    items: [
      { id: "mayar", label: "Saldo & Transaksi", icon: Wallet },
      { id: "pending-submissions", label: "Belum Kirim Berkas", icon: FileText },
    ],
  },
  {
    id: "system",
    label: "Sistem",
    items: [
      { id: "form-fields", label: "Kelola Form", icon: FormInput },
      { id: "success-templates", label: "Template Sukses", icon: CheckSquare },
      { id: "banners", label: "Kelola Banner", icon: Image },
      { id: "shortlinks", label: "Kelola Shortlink", icon: Link2 },
      { id: "countdown", label: "Countdown", icon: Clock },
      { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
      { id: "staff", label: "Kelola Staff", icon: Users },
      { id: "adsense", label: "Kelola AdSense", icon: MonitorPlay },
      { id: "embed", label: "Embed Form", icon: Code },
      { id: "check-logs", label: "Log Cek Status", icon: Eye },
    ],
  },
  {
    id: "account",
    label: "Akun",
    items: [
      { id: "settings", label: "Pengaturan", icon: Settings },
    ],
  },
];

export function AdminSidebar({ activeTab, onTabChange, onLogout, isCollapsed = false, onToggleCollapse, userRole }: AdminSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    main: true,
    mayar: true,
    system: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Staff can only access Main Menu
  const filteredMenuGroups = userRole === "staff" 
    ? menuGroups.filter(group => group.id === "main")
    : menuGroups;

  return (
    <aside className={cn(
      "bg-card border-r min-h-screen flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-foreground">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Beasiswa Ayo Pintar</p>
              </div>
            )}
          </div>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className={cn("shrink-0", isCollapsed && "mx-auto mt-2")}
            >
              {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filteredMenuGroups.map((group, groupIndex) => (
          <div key={group.id}>
            {groupIndex > 0 && !isCollapsed && (
              <Separator className="my-3" />
            )}
            
            {isCollapsed ? (
              // Collapsed mode: show only icons
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      title={item.label}
                      className={cn(
                        "w-full flex items-center justify-center px-2 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                    </button>
                  );
                })}
              </div>
            ) : (
              // Expanded mode: show collapsible groups
              <Collapsible
                open={openGroups[group.id]}
                onOpenChange={() => toggleGroup(group.id)}
              >
                <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                  {group.label}
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    openGroups[group.id] && "rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t">
        <button
          onClick={onLogout}
          title={isCollapsed ? "Keluar" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && "Keluar"}
        </button>
      </div>
    </aside>
  );
}