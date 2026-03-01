import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut, Zap } from "lucide-react";
import { Inbox } from '@novu/react';
import { useState, useEffect } from "react";

export function Header() {
  const { user, signOut } = useAuth();
  const [extensionInstalled, setExtensionInstalled] = useState(false);

  useEffect(() => {
    // Extension injects window.jobosExtension when active
    setExtensionInstalled(!!(window as any).jobosExtension);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div></div>

        <div className="flex items-center space-x-3">
          {/* Get Extension pill — hidden when extension already installed */}
          {!extensionInstalled && (
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
            >
              <Zap className="h-3 w-3" />
              Get Extension
            </a>
          )}

          <Inbox
            applicationIdentifier={import.meta.env.VITE_NOVU_APP_ID}
            subscriberId="6956acd8f9d367c59645b1d6"
            appearance={{
              variables: {
                colorPrimary: "#6366F1",
                colorForeground: "#0f172a",
              },
              elements: {
                bellIcon: { color: "#64748B" },
              }
            }}
          />
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{user.email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}

