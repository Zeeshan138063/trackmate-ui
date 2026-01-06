import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut } from "lucide-react";
import { Inbox } from '@novu/react';

export function Header() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div></div>

        <div className="flex items-center space-x-4">
          <Inbox
            applicationIdentifier={import.meta.env.VITE_NOVU_APP_ID}
            subscriberId="6956acd8f9d367c59645b1d6"
            appearance={{
              variables: {
                colorPrimary: "#0d9488",
                colorForeground: "#0f172a",
              },
              elements: {
                bellIcon: { color: "#0f172a" },
              }
            }}
          />
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4" />
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
