import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Layers,
  Compass,
  Settings,
  HelpCircle,
  Users,
  BarChart2,
  Star,
  Map,
  Sparkles,
  Calendar,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Interviews", url: "/meeting-hub", icon: Calendar },
  { title: "Resume", url: "/resume", icon: FileText, ai: true },
  { title: "Applications", url: "/trackers", icon: Layers },
  { title: "Discover", url: "/job-search", icon: Compass },
  { title: "Copilot", url: "/application-copilot", icon: Sparkles, ai: true },
  { title: "Watchlist", url: "/dream-companies", icon: Star },
  { title: "Playbook", url: "/strategy-guide", icon: Map },
  { title: "Network", url: "/connections", icon: Users },
  { title: "Analytics", url: "/growth", icon: BarChart2 },
];

const bottomItems = [
  { title: "Support", url: "/support", icon: HelpCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const navigate = useNavigate();

  const isRouteActive = (url: string) => {
    if (currentPath === url) return true;
    if (url === "/") return false;
    return currentPath.startsWith(`${url}/`);
  };

  const getButtonClass = (active: boolean) =>
    active
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary w-full justify-start"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground w-full justify-start";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo / Wordmark */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              {/* JO Logomark — white JO on solid indigo for strong visual weight */}
              <div className="relative w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
                <span className="font-mono font-bold text-[11px] text-white tracking-tight leading-none">JO</span>
              </div>
              {/* WordMark: "Job" in sans-serif, "OS" in JetBrains Mono — lighter indigo in dark for contrast */}
              {!collapsed && (
                <span className="font-semibold text-lg whitespace-nowrap leading-none">
                  Job<span className="font-mono font-bold text-[#6366F1] dark:text-[#818CF8]">OS</span>
                </span>
              )}
            </Link>
            {!collapsed && <SidebarTrigger />}
          </div>
          {collapsed && (
            <div className="flex justify-center mt-4">
              <SidebarTrigger />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const active = isRouteActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      className={getButtonClass(active)}
                      isActive={active}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="flex items-center gap-1.5">
                          {item.title}
                          {item.ai && (
                            <span className="text-[10px] text-[#818CF8] font-mono font-semibold leading-none">✦</span>
                          )}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => {
                const active = isRouteActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      className={getButtonClass(active)}
                      isActive={active}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wide">jobos.dev</span>
              <span className="text-[10px] text-muted-foreground/40">One OS. Every job.</span>
            </div>
          )}
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}