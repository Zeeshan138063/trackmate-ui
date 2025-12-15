import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Engagement, EngagementType, EngagementDirection, Sentiment } from "@/types/engagement";
import { Loader2 } from "lucide-react";

interface AddEngagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (engagement: Omit<Engagement, 'id' | 'user_id' | 'created_at'>) => Promise<any>;
    contactId: string;
}

export function AddEngagementDialog({ open, onOpenChange, onSubmit, contactId }: AddEngagementDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'call' as EngagementType,
        direction: 'outbound' as EngagementDirection,
        date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm for local datetime input
        notes: '',
        sentiment: 'neutral' as Sentiment
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit({
                contact_id: contactId,
                type: formData.type,
                direction: formData.direction,
                date: new Date(formData.date).toISOString(),
                notes: formData.notes,
                sentiment: formData.sentiment
            });
            onOpenChange(false);
            // Reset form partly
            setFormData(prev => ({ ...prev, notes: '', sentiment: 'neutral' }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Log Interaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as EngagementType }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="call">Phone Call</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="linkedin">LinkedIn Message</SelectItem>
                                    <SelectItem value="meeting">Meeting</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Direction</Label>
                            <Select
                                value={formData.direction}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, direction: v as EngagementDirection }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="outbound">Outbound (I sent)</SelectItem>
                                    <SelectItem value="inbound">Inbound (They sent)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Date & Time</Label>
                        <Input
                            type="datetime-local"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Sentiment</Label>
                        <Select
                            value={formData.sentiment}
                            onValueChange={(v) => setFormData(prev => ({ ...prev, sentiment: v as Sentiment }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            placeholder="Details about the conversation..."
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Log Interaction
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
