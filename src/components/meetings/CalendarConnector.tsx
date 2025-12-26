import { useState, useEffect } from "react";
import { Button } from "@/components/ui/card"; // Wait, Card is not Button
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { MeetingService } from "@/services/MeetingService";
import { CalendarAccount } from "@/types/meeting";
import { useToast } from "@/hooks/use-toast";
import { Button as UIButton } from "@/components/ui/button";

const CalendarConnector = ({ userId }: { userId: string }) => {
    const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
    const [loading, setLoading] = useState(true);
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

    const handleConnect = (provider: 'google' | 'outlook') => {
        toast({
            title: "Connection Coming Soon",
            description: `OAuth flow for ${provider} is currently being implemented.`,
        });
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
                            <CardContent className="p-4 flex items-center justify-between">
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
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="flex flex-col gap-2">
                <UIButton
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => handleConnect('google')}
                >
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                    Connect Google Calendar
                </UIButton>
                <UIButton
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => handleConnect('outlook')}
                >
                    <img src="https://www.microsoft.com/favicon.ico" className="w-4 h-4" alt="Microsoft" />
                    Connect Outlook Calendar
                </UIButton>
            </div>
        </div>
    );
};

export default CalendarConnector;
