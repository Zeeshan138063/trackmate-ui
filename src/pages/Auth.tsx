
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/AuthForm";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset_password'>('signin');

  useEffect(() => {
    // Check if we're in password recovery mode from the URL hash
    const isRecovery = window.location.hash.includes('type=recovery');

    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !isRecovery) {
        navigate("/");
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event);
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset_password');
      } else if (session && event !== 'SIGNED_OUT' && !isRecovery) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate("/");
  };

  return <AuthForm onSuccess={handleAuthSuccess} initialMode={mode} />;
}
