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

    const { userId } = await req.json();

    if (!userId) throw new Error('UserId required');

    // 1. Fetch Accounts
    const { data: accounts, error: accountsError } = await supabaseClient
      .from('calendar_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_enabled', true);

    if (accountsError) throw accountsError;

    const results = [];

    for (const account of accounts) {
        let accessToken = account.access_token;
        
        // Refresh Token Logic (Duplicated for now)
        if (new Date(account.expires_at) < new Date()) {
            const newTokens = await refreshAccessToken(account.provider, account.refresh_token);
            if (newTokens) {
                accessToken = newTokens.access_token;
                await supabaseClient.from('calendar_accounts').update({
                    access_token: newTokens.access_token,
                    expires_at: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
                }).eq('id', account.id);
            } else {
                console.error(`Failed to refresh token for account ${account.id}`);
                continue; 
            }
        }

        // Determine calendars to sync
        let calendarsToSync = [];
        if (account.settings?.selected_calendars?.length > 0) {
            calendarsToSync = account.settings.selected_calendars;
        } else {
            // Default to primary if nothing selected? Or maybe 'primary' keyword
            calendarsToSync = ['primary']; 
        }

        for (const calId of calendarsToSync) {
            try {
                if (account.provider === 'google') {
                    const timeMin = new Date().toISOString();
                    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
                    
                    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`);
                    url.searchParams.append('timeMin', timeMin);
                    url.searchParams.append('timeMax', timeMax);
                    url.searchParams.append('singleEvents', 'true');
                    url.searchParams.append('orderBy', 'startTime');

                    const res = await fetch(url.toString(), {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    
                    const data = await res.json();
                    if (data.items) {
                        for (const event of data.items) {
                            if (!event.start?.dateTime && !event.start?.date) continue; // Skip tasks without time?

                            const startTime = event.start.dateTime || event.start.date; // Date only for all-day
                            const endTime = event.end.dateTime || event.end.date;
                            
                            const start = new Date(startTime);
                            const end = new Date(endTime);
                            const duration = (end.getTime() - start.getTime()) / (1000 * 60);

                            // Upsert meeting
                            const { error: upsertError } = await supabaseClient
                                .from('meetings')
                                .upsert({
                                    user_id: userId,
                                    title: event.summary || '(No Title)',
                                    description: event.description,
                                    scheduled_at: start.toISOString(),
                                    duration_minutes: duration,
                                    location_platform: event.location || 'Google Calendar',
                                    meeting_link: event.htmlLink,
                                    external_id: event.id,
                                    external_provider: 'google',
                                    last_synced_at: new Date().toISOString(),
                                    status: 'SCHEDULED' // Default
                                }, { onConflict: 'user_id, external_provider, external_id' });

                            if (upsertError) console.error('Upsert error:', upsertError);
                        }
                    }
                } else if (account.provider === 'outlook' || account.provider === 'azure') {
                    // Outlook Logic
                    const startDateTime = new Date().toISOString();
                    const endDateTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                    
                    const url = new URL(`https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calId)}/events`);
                    url.searchParams.append('startDateTime', startDateTime);
                    url.searchParams.append('endDateTime', endDateTime);
                    url.searchParams.append('$select', 'subject,bodyPreview,start,end,location,webLink,id');
                    url.searchParams.append('$top', '100');

                    const res = await fetch(url.toString(), {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    
                    const data = await res.json();
                    if (data.value) {
                         for (const event of data.value) {
                            const startTime = event.start?.dateTime; // Outlook returns { dateTime, timeZone }
                            const endTime = event.end?.dateTime;
                            
                            if (!startTime) continue;

                            const start = new Date(startTime + 'Z'); // Outlook time is often local, need to be careful with timezone. Assume UTC or handle zulu. 
                            // Actually Graph API returns UTC by default or specified. 
                            const end = new Date(endTime + 'Z');
                            const duration = (end.getTime() - start.getTime()) / (1000 * 60);

                            // Upsert meeting
                            const { error: upsertError } = await supabaseClient
                                .from('meetings')
                                .upsert({
                                    user_id: userId,
                                    title: event.subject || '(No Title)',
                                    description: event.bodyPreview,
                                    scheduled_at: start.toISOString(),
                                    duration_minutes: duration,
                                    location_platform: event.location?.displayName || 'Outlook Calendar',
                                    meeting_link: event.webLink,
                                    external_id: event.id,
                                    external_provider: 'outlook',
                                    last_synced_at: new Date().toISOString(),
                                    status: 'SCHEDULED'
                                }, { onConflict: 'user_id, external_provider, external_id' });

                            if (upsertError) console.error('Upsert error:', upsertError);
                        }
                    }
                }
            } catch (e) {
                console.error(`Error syncing calendar ${calId}:`, e);
            }
        }
        results.push({ accountId: account.id, status: 'synced' });
    }

    return new Response(JSON.stringify({ results }), {
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
    if (provider === 'google') {
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
        if (!clientId || !clientSecret) return null;

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
        if (data.error) return null;
        return {
            access_token: data.access_token,
            expires_in: data.expires_in
        };
    } else if (provider === 'outlook' || provider === 'azure') {
         const clientId = Deno.env.get('AZURE_CLIENT_ID');
         const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
         // const tenantId = Deno.env.get('AZURE_TENANT_ID') || 'common'; // Often 'common' for multi-tenant app
         
         if (!clientId || !clientSecret) return null;

         // For Outlook (Microsoft Identity Platform), simplified
         const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
             method: 'POST',
             headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
             body: new URLSearchParams({
                 client_id: clientId,
                 client_secret: clientSecret,
                 scope: 'Calendars.Read offline_access', // scopes must match
                 refresh_token: refreshToken,
                 grant_type: 'refresh_token',
             })
         });
         
         const data = await res.json();
         if (data.error) return null;
         return {
             access_token: data.access_token,
             expires_in: data.expires_in
         };
    }
    return null;
}
