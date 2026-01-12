import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, accountId } = await req.json();

    if (action === 'list-calendars' && accountId) {
      // 1. Fetch Account
      const { data: account, error: accountError } = await supabaseClient
        .from('calendar_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (accountError || !account) throw new Error('Account not found');

      let accessToken = account.access_token;

      // 2. Refresh Token if needed (simplified check, assume check expiration or just try catch 401)
      // Ideally check expires_at
      if (new Date(account.expires_at) < new Date()) {
         const newTokens = await refreshAccessToken(account.provider, account.refresh_token);
         if (newTokens) {
            accessToken = newTokens.access_token;
            // Update DB
            await supabaseClient.from('calendar_accounts').update({
                access_token: newTokens.access_token,
                expires_at: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
            }).eq('id', accountId);
         }
      }

      // 3. Fetch Calendars
      let calendars = [];
      if (account.provider === 'google') {
        const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        if (data.items) {
            calendars = data.items.map((item: any) => ({
                id: item.id,
                summary: item.summary,
                primary: item.primary
            }));
        }
      } else if (account.provider === 'outlook' || account.provider === 'azure') {
          const res = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
              headers: { Authorization: `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (data.value) {
              calendars = data.value.map((item: any) => ({
                  id: item.id,
                  summary: item.name,
                  primary: item.isDefaultCalendar
              }));
          }
      }

      return new Response(JSON.stringify({ calendars }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshAccessToken(provider: string, refreshToken: string) {
    // This requires client_id and client_secret which should be in env vars
    // SUPABASE_AUTH_GOOGLE_CLIENT_ID, SUPABASE_AUTH_GOOGLE_SECRET etc.
    // However, Deno env might not have them exposed by default unless set manually.
    // Assuming they are set in the Edge Function environment secrets.
    
    // NOTE: This is a critical part. If we can't refresh server-side because we lack secrets,
    // we might rely on the client refreshing the session? No, background sync needs server-side refresh.
    // We MUST have client secrets here.
    
    if (provider === 'google') {
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
        if (!clientId || !clientSecret) throw new Error("Missing Google credentials in Edge Function");

        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error_description);
        return {
            access_token: data.access_token,
            expires_in: data.expires_in
        };
    }
    // Add Outlook refresh logic similarly
    return null;
}
