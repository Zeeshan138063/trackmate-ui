import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Home,
  FileText,
  Target,
  MessageSquare,
  Briefcase,
  Search,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  Building,
  Bot,
  Calendar,
  Sparkles
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
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Meeting Hub", url: "/meeting-hub", icon: Calendar },
  { title: "Resume Builder", url: "/resume", icon: FileText },
  { title: "Trackers", url: "/trackers", icon: Target },
  /* { title: "Interview Practice", url: "/interview", icon: MessageSquare },
  { title: "Interview Feedback", url: "/interview-feedback", icon: MessageSquare },
  { title: "Work Styles", url: "/work-styles", icon: Briefcase }, */
  { title: "Job Search", url: "/job-search", icon: Search },
  { title: "Application Copilot", url: "/application-copilot", icon: Bot },
  { title: "Dream Companies", url: "/dream-companies", icon: Building },
  { title: "Strategy Guide", url: "/strategy-guide", icon: Bot }, // Reusing Bot for now or add Compass
  { title: "Connections", url: "/connections", icon: Users },
  { title: "Growth Engine", url: "/growth", icon: TrendingUp },
];

const bottomItems = [
  { title: "Support Center", url: "/support", icon: HelpCircle },
  { title: "Account Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const navigate = useNavigate();

  // Helper for active state - exact match or subpath match
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
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="relative w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-xs relative z-10">CP</span>
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 animate-pulse" />
              </div>
              {!collapsed && (
                <span className="font-semibold text-lg whitespace-nowrap">
                  CareerPilot <span className="text-[10px] font-mono font-black bg-[length:200%_auto] bg-gradient-to-r from-primary via-indigo-400 to-primary bg-clip-text text-transparent animate-shimmer ml-1 tracking-tighter">AI</span>
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
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
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
                      <item.icon className="h-5 w-5 shrink-0" />
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
          {!collapsed && <span className="text-sm text-muted-foreground">Theme</span>}
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar >
  );
}