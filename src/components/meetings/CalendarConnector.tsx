import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { MeetingService } from "@/services/MeetingService";
import { CalendarAccount } from "@/types/meeting";
import { useToast } from "@/hooks/use-toast";
import { Button as UIButton } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";

interface CalendarList {
    id: string;
    summary: string;
    primary?: boolean;
}

const CalendarConnector = ({ userId }: { userId: string }) => {
    const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [availableCalendars, setAvailableCalendars] = useState<Record<string, CalendarList[]>>({});
    const [loadingCalendars, setLoadingCalendars] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    useEffect(() => {
        loadAccounts();
    }, [userId]);

    const loadAccounts = async () => {
        try {
            const data = await MeetingService.getCalendarAccounts(userId);
            setAccounts(data);
        } catch (error) {
            console.error("Failed to load calendar accounts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.provider_token) {
                // Determine provider based on user metadata or session
                // This is tricky because Supabase 'SIGNED_IN' doesn't explicitly guarantee which provider *just* connected if previously logged in.
                // However, usually we can infer or we just try to save the token for the provider in the session.

                // Inspect user identities to find the most recent one or provider
                const provider = session.user.app_metadata.provider;

                if (provider === 'google' || provider === 'azure') {
                    const normalizedProvider = provider === 'azure' ? 'outlook' : provider as 'google' | 'outlook';

                    console.log("Connect Calendar Debug:", {
                        provider: normalizedProvider,
                        access_token_exists: !!session.provider_token,
                        refresh_token_exists: !!session.provider_refresh_token,
                        email: session.user?.email
                    });

                    if (!session.provider_token) {
                        console.error("Missing Access Token from Provider!");
                        // Can't connect without token
                        return;
                    }

                    try {
                        await MeetingService.connectCalendarAccount({
                            user_id: userId,
                            provider: normalizedProvider,
                            access_token: session.provider_token,
                            refresh_token: session.provider_refresh_token, // Might be undefined if not first consent
                            expires_at: new Date(Date.now() + (session.expires_in || 3600) * 1000).toISOString(),
                            is_primary: false,
                            sync_enabled: true,
                            account_email: session.user.email
                        });

                        toast({ title: "Calendar Connected", description: `Successfully connected ${normalizedProvider} calendar.` });
                        loadAccounts();
                    } catch (e: any) {
                        console.error("Error connecting calendar:", e);
                        toast({ title: "Connection Failed", description: e.message || "Unknown error", variant: "destructive" });
                    }
                }
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [userId]);

    // const handleConnect = async (provider: 'google' | 'outlook') => {
    //     try {
    //         const { error } = await supabase.auth.signInWithOAuth({
    //             provider: provider === 'outlook' ? 'azure' : 'google', // Map 'outlook' to 'azure'
    //             options: {
    //                 redirectTo: window.location.href,
    //                 scopes: provider === 'google' 
    //                     ? 'https://www.googleapis.com/auth/calendar.readonly' 
    //                     : 'Calendars.Read',
    //                 queryParams: {
    //                     access_type: 'offline',
    //                     prompt: 'consent'
    //                 }
    //             }
    //         });
    //         if (error) throw error;
    //     } catch (error) {
    //         console.error("OAuth error:", error);
    //         toast({ title: "Connection Error", description: "Failed to initiate connection.", variant: "destructive" });
    //     }
    // };

    const fetchSubCalendars = async (accountId: string, provider: 'google' | 'outlook') => {
        // In a real implementation, this calls an Edge Function or uses the stored token.
        // For now, we'll mock it or assume a future implementation.
        setLoadingCalendars(prev => ({ ...prev, [accountId]: true }));

        try {
            const { data, error } = await supabase.functions.invoke('manage-calendar', {
                body: { action: 'list-calendars', accountId }
            });

            if (error) throw error;
            setAvailableCalendars(prev => ({ ...prev, [accountId]: data.calendars || [] }));
        } catch (e) {
            console.error("Error fetching calendars:", e);
            // Verify with mock data if function fails (for dev/demo)
            if (provider === 'google') {
                setAvailableCalendars(prev => ({
                    ...prev, [accountId]: [
                        { id: 'primary', summary: 'Primary', primary: true },
                        { id: 'birthdays', summary: 'Birthdays' },
                        { id: 'family', summary: 'Family' },
                        { id: 'tasks', summary: 'Tasks' }
                    ]
                }));
            } else {
                setAvailableCalendars(prev => ({
                    ...prev, [accountId]: [
                        { id: 'calendar', summary: 'Calendar', primary: true },
                        { id: 'tasks', summary: 'Tasks' }
                    ]
                }));
            }
        } finally {
            setLoadingCalendars(prev => ({ ...prev, [accountId]: false }));
        }
    };

    const toggleCalendar = async (accountId: string, calendarId: string, currentSettings: any) => {
        const selected = currentSettings?.selected_calendars || [];
        const newSelected = selected.includes(calendarId)
            ? selected.filter((id: string) => id !== calendarId)
            : [...selected, calendarId];

        try {
            // Update local state first for responsiveness (optimistic update could be better)
            await MeetingService.updateCalendarSettings(accountId, { ...currentSettings, selected_calendars: newSelected });
            loadAccounts(); // Reload to get fresh state
        } catch (e) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4">
                {accounts.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed rounded-lg bg-muted/30">
                        <Calendar className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                        <p className="text-sm text-muted-foreground">No calendars connected yet.</p>
                    </div>
                ) : (
                    accounts.map((account) => (
                        <Card key={account.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${account.provider === 'google' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{account.account_email || `${account.provider} Account`}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={account.sync_enabled ? "default" : "secondary"} className="text-[10px] h-4">
                                                    {account.sync_enabled ? "Synced" : "Paused"}
                                                </Badge>
                                                {account.is_primary && (
                                                    <Badge variant="outline" className="text-[10px] h-4">Primary</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={account.sync_enabled}
                                        onCheckedChange={() => { }}
                                    />
                                </div>

                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="item-1" className="border-b-0">
                                        <AccordionTrigger
                                            className="text-xs py-1"
                                            onClick={() => {
                                                if (!availableCalendars[account.id]) {
                                                    fetchSubCalendars(account.id, account.provider);
                                                }
                                            }}
                                        >
                                            Sync Settings ({account.settings?.selected_calendars?.length || 0} calendars)
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            {loadingCalendars[account.id] ? (
                                                <div className="flex justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                                            ) : (
                                                <div className="space-y-2 mt-2 pl-2">
                                                    {(availableCalendars[account.id] || []).map(cal => (
                                                        <div key={cal.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`${account.id}-${cal.id}`}
                                                                checked={account.settings?.selected_calendars?.includes(cal.id)}
                                                                onCheckedChange={() => toggleCalendar(account.id, cal.id, account.settings)}
                                                            />
                                                            <Label htmlFor={`${account.id}-${cal.id}`} className="text-sm font-normal">{cal.summary}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="flex flex-col gap-2">
                <UIButton
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => toast({ title: "Coming Soon", description: "Calendar connecting feature coming soon." })}
                >
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                    Connect Google Calendar
                </UIButton>
                <UIButton
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => toast({ title: "Coming Soon", description: "Calendar connecting feature coming soon." })}
                >
                    <img src="https://www.microsoft.com/favicon.ico" className="w-4 h-4" alt="Microsoft" />
                    Connect Outlook Calendar
                </UIButton>
            </div>
        </div>
    );
};

export default CalendarConnector;
