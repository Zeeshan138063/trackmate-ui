import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Sparkles, Linkedin, Github } from "lucide-react";

interface AuthFormProps {
  onSuccess: () => void;
  initialMode?: 'signin' | 'signup' | 'reset_password';
}

export function AuthForm({ onSuccess, initialMode = 'signin' }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password' | 'reset_password'>(
    initialMode === 'reset_password' ? 'reset_password' : (initialMode === 'signup' ? 'signup' : 'signin')
  );
  const isSignUp = mode === 'signup';
  const isForgotPassword = mode === 'forgot_password';
  const isResetPassword = mode === 'reset_password';
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isResetPassword) {
        // Reset Password Logic
        const { error } = await supabase.auth.updateUser({
          password: password,
        });
        if (error) throw error;
        toast({ title: "Success", description: "Password updated successfully." });
        setMode('signin');
      } else if (isForgotPassword) {
        // Forgot Password Logic
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Password reset link sent." });
        setMode('signin');
      } else if (isSignUp) {
        // Sign Up Logic
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            captchaToken: captchaToken || undefined
          }
        });

        turnstileRef.current?.reset();
        setCaptchaToken(null);

        if (error) throw error;
        toast({ title: "Check your email", description: "Confirmation link sent." });
      } else {
        // Sign In Logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken: captchaToken || undefined
          }
        });

        turnstileRef.current?.reset();
        setCaptchaToken(null);

        if (error) throw error;
        toast({ title: "Welcome back!", description: "Successfully signed in." });
        onSuccess();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
        }
      })
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')`,
        }}
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
      </div>

      {/* Main Card Content */}
      <div className="relative z-10 w-full max-w-md px-6 py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-700">

        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <p className="text-slate-200 text-sm font-medium tracking-widest uppercase flex items-center justify-center gap-2">
            One OS. Every job. <span className="text-primary font-mono">✦</span>
          </p>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg flex items-center justify-center gap-2">
              Job<span className="font-mono text-primary">OS</span>
            </h1>
            <p className="text-slate-300 text-lg font-light">
              {isResetPassword ? "Secure your account" : "Your job search, systemized."}
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleAuth} className="w-full space-y-4">
          <div className="space-y-4">
            {!isResetPassword && (
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white border-0 text-slate-900 placeholder:text-slate-400 rounded-lg shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-400"
              />
            )}
            {!isForgotPassword && (
              <Input
                type="password"
                placeholder={isResetPassword ? "New Password" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-white border-0 text-slate-900 placeholder:text-slate-400 rounded-lg shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-400"
              />
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 px-1">
            <button
              type="button"
              onClick={() => setMode(isSignUp ? 'signin' : 'signup')}
              className="hover:text-white transition-colors hover:underline"
            >
              {isSignUp ? "Already have an account?" : "Create an account"}
            </button>
            {!isResetPassword && (
              <button
                type="button"
                onClick={() => setMode(isForgotPassword ? 'signin' : 'forgot_password')}
                className="hover:text-white transition-colors hover:underline"
              >
                {isForgotPassword ? "Back to Sign In" : "Forgot Password?"}
              </button>
            )}
            {isResetPassword && (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="hover:text-white transition-colors hover:underline"
              >
                Cancel
              </button>
            )}
          </div>

          {(isSignUp || mode === 'signin') && (
            <div className="flex justify-center py-2">
              <Turnstile
                ref={turnstileRef}
                siteKey={import.meta.env.VITE_TURNSTILE_SITEKEY || "1x00000000000000000000AA"}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || ((isSignUp || mode === 'signin') && !captchaToken)}
            className="w-full h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-500/25 rounded-lg transition-all transform hover:scale-[1.02]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <span className="flex items-center gap-2">
                {isResetPassword ? "Update Password" : (isForgotPassword ? "Send Reset Link" : (isSignUp ? "Create Account" : "Enter JobOS"))} <span className="font-mono text-indigo-200">✦</span>
              </span>
            )}
          </Button>
        </form>

        {/* Social Login Section */}
        <div className="mt-8 w-full space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-slate-300">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth('google')}
              className="h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 hover:text-slate-900 font-semibold rounded-lg shadow-sm relative z-20 transition-all transform hover:scale-[1.02]"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth('linkedin_oidc')}
              className="h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 hover:text-slate-900 font-semibold rounded-lg shadow-sm relative z-20 transition-all transform hover:scale-[1.02]"
            >
              <Linkedin className="w-4 h-4 mr-2 text-[#0077b5]" />
              LinkedIn
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-slate-400/60 text-[10px] flex flex-col items-center gap-1.5">
          <span>© {new Date().getFullYear()} JobOS · jobos.dev · Built for job seekers worldwide.</span>
          <div className="flex items-center gap-2">
            <a
              href="https://jobos.dev/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400/80 hover:text-slate-200 underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-slate-400/40">|</span>
            <a
              href="https://jobos.dev/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400/80 hover:text-slate-200 underline underline-offset-2 transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

