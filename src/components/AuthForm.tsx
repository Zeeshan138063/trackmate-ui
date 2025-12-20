import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AuthFormProps {
  onSuccess: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const redirectUrl = `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/`;
    console.log("Sign up redirect URL:", redirectUrl, "Env Var:", import.meta.env.VITE_SITE_URL);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to complete your registration.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
        }
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: (import.meta.env.VITE_SITE_URL ?? window.location.origin) + '/',
      });

      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email",
          description: "We sent you a password reset link.",
        });
        setIsResettingPassword(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Immersive Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 z-0 h-full w-full bg-slate-950/50" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none opacity-50" />

      <Card className="w-full max-w-md relative z-10 border-white/[0.08] bg-black/40 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-700">
        <CardHeader className="text-center space-y-3 pb-8 pt-8">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-[0_0_30px_-5px_var(--primary)] flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-bold tracking-tight text-white drop-shadow-sm">
              {isResettingPassword ? "Reset Password" : "JobVelocity"}
            </CardTitle>
            <CardDescription className="text-slate-400 text-lg">
              {isResettingPassword ? "Enter your email to receive a reset link" : "Unlock your career potential"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {isResettingPassword ? (
            <div className="animate-in slide-in-from-right-2 duration-300">
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-slate-300 ml-1">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 rounded-xl transition-all hover:bg-white/10"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white font-semibold text-base shadow-[0_0_20px_-5px_var(--primary)] rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_var(--primary)] hover:scale-[1.01] mt-2 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Send Reset Link</span>
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-11 text-slate-400 hover:text-white hover:bg-white/5 transition-all mt-2"
                  onClick={() => setIsResettingPassword(false)}
                  disabled={isLoading}
                >
                  Back to Sign In
                </Button>
              </form>
            </div>
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/30 border border-white/5 h-14 p-1.5 rounded-xl">
                <TabsTrigger
                  value="signin"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 font-medium transition-all duration-300"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 font-medium transition-all duration-300"
                >
                  New Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="animate-in slide-in-from-left-2 duration-300 focus-visible:outline-none focus-visible:ring-0">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300 ml-1">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 rounded-xl transition-all hover:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="password" className="text-slate-300">Password</Label>
                      <button
                        type="button"
                        onClick={() => setIsResettingPassword(true)}
                        className="text-xs text-primary/80 hover:text-primary transition-colors font-medium hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 rounded-xl transition-all hover:bg-white/10"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white font-semibold text-base shadow-[0_0_20px_-5px_var(--primary)] rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_var(--primary)] hover:scale-[1.01] mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Connect to Pilot"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="animate-in slide-in-from-right-2 duration-300 focus-visible:outline-none focus-visible:ring-0">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-300 ml-1">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 rounded-xl transition-all hover:bg-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-300 ml-1">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-white/5 border-white/10 text-white focus-visible:ring-primary/50 focus-visible:border-primary/50 h-12 rounded-xl transition-all hover:bg-white/10"
                    />
                    <p className="text-[10px] text-slate-500 ml-1">Must be at least 6 characters</p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-white font-semibold text-base shadow-[0_0_20px_-5px_var(--primary)] rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_var(--primary)] hover:scale-[1.01] mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Activate Agent"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Footer / Copyright */}
      <div className="absolute bottom-6 text-slate-500 text-xs text-center w-full z-10">
        © 2024 TrackMate. All rights reserved.
      </div>
    </div>
  );
}
