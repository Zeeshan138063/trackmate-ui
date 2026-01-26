import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Copy, Check, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MeetingService } from "@/services/MeetingService";
import { supabase } from "@/integrations/supabase/client";

const AvailabilitySharer = () => {
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const slots = await MeetingService.getSuggestedSlots(user.id);
                    setAvailableSlots(slots);
                }
            } catch (error) {
                console.error("Failed to load availability slots:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSlots();
    }, []);

    const toggleSlot = (slot: string) => {
        setSelectedSlots(prev =>
            prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
        );
    };

    const copyToClipboard = () => {
        if (selectedSlots.length === 0) return;

        const text = "Hi, here are my available interview slots:\n\n" +
            selectedSlots.join("\n") +
            "\n\nPlease let me know which one works best for you!";

        navigator.clipboard.writeText(text);
        setCopied(true);
        toast({
            title: "Copied to clipboard",
            description: "Availability slots are ready to paste.",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="w-full max-w-lg mx-auto border-none shadow-none">
            <CardHeader className="p-0 pb-4">
                {/* Header is handled by Dialog usually, but we keep it minimal here */}
            </CardHeader>
            <CardContent className="space-y-4 p-0">
                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2 text-xs text-muted-foreground mb-4">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Select the slots you want to share. These are generated based on your <strong>Interview Hours</strong> settings and exclude existing meetings.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No slots found. Please check your Availability Settings.
                    </div>
                ) : (
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {availableSlots.map(slot => (
                            <div
                                key={slot}
                                onClick={() => toggleSlot(slot)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedSlots.includes(slot)
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-transparent bg-muted/30 hover:bg-muted/50'
                                    }`}
                            >
                                <span className="text-sm font-medium">{slot}</span>
                                {selectedSlots.includes(slot) && <Check className="h-4 w-4 text-primary" />}
                            </div>
                        ))}
                    </div>
                )}

                <Button
                    className="w-full mt-4"
                    disabled={selectedSlots.length === 0}
                    onClick={copyToClipboard}
                >
                    {copied ? (
                        <><Check className="mr-2 h-4 w-4" /> Copied!</>
                    ) : (
                        <><Copy className="mr-2 h-4 w-4" /> Copy Availability Slots</>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};

export default AvailabilitySharer;
