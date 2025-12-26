import { FileText, Key, FormInput, Settings, LayoutDashboard, LogOut, CheckSquare, Copy, BadgeCheck, PanelLeftClose, PanelLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "submissions", label: "Data Pengajuan", icon: FileText },
  { id: "verified", label: "Terverifikasi", icon: BadgeCheck },
  { id: "duplicates", label: "Duplikasi", icon: Copy },
  { id: "tokens", label: "Kode Token", icon: Key },
  { id: "form-fields", label: "Kelola Form", icon: FormInput },
  { id: "success-templates", label: "Template Sukses", icon: CheckSquare },
  { id: "staff", label: "Kelola Staff", icon: Users },
  { id: "settings", label: "Pengaturan", icon: Settings },
];

export function AdminSidebar({ activeTab, onTabChange, onLogout, isCollapsed = false, onToggleCollapse }: AdminSidebarProps) {
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
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isCollapsed && "justify-center px-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && item.label}
            </button>
          );
        })}
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