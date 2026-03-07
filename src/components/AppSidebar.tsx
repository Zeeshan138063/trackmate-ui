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
import { JobOsLogo } from "@/components/JobOsLogo";
import { useTheme } from "next-themes";

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
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

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
            <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <JobOsLogo variant="sidebar" showWordmark={!collapsed} lightMode={isLight} />
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