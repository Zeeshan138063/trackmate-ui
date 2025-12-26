import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Copy, Check, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AvailabilitySharer = () => {
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const mockSlots = [
        "Mon, Dec 29 - 2:00 PM to 3:00 PM",
        "Mon, Dec 29 - 4:00 PM to 5:00 PM",
        "Tue, Dec 30 - 10:00 AM to 11:00 AM",
        "Tue, Dec 30 - 1:00 PM to 2:00 PM",
        "Wed, Dec 31 - 9:00 AM to 10:00 AM"
    ];

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
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Select Availability
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2 text-xs text-muted-foreground mb-4">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Select the slots you want to share with the recruiter. We've automatically excluded times that conflict with your connected calendars.</p>
                </div>

                <div className="grid gap-2">
                    {mockSlots.map(slot => (
                        <div
                            key={slot}
                            onClick={() => toggleSlot(slot)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${selectedSlots.includes(slot)
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-transparent bg-muted/30 hover:bg-muted/50'
                                }`}
                        >
                            <span className="text-sm font-medium">{slot}</span>
                            {selectedSlots.includes(slot) && <Check className="h-4 w-4 text-primary" />}
                        </div>
                    ))}
                </div>

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
