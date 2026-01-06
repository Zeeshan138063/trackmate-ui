import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

import { Header } from "@/components/Header";
import { NotificationChecker } from "@/components/NotificationChecker";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <NotificationChecker />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 bg-background min-w-0 flex flex-col">
          <Header />
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}