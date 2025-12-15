import { useState } from "react";
import { FollowUp, FollowUpType } from "@/types/engagement";
import { format, isPast, isToday } from "date-fns";
import { Calendar, CheckCircle2, Circle, Clock, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface FollowUpListProps {
    followUps: FollowUp[];
    loading: boolean;
    onAdd: (followUp: Omit<FollowUp, 'id' | 'user_id' | 'created_at'>) => Promise<any>;
    onUpdateStatus: (id: string, status: 'pending' | 'completed' | 'missed') => Promise<any>;
    onDelete: (id: string) => Promise<boolean>;
    contactId: string;
}

export function FollowUpList({ followUps, loading, onAdd, onUpdateStatus, onDelete, contactId }: FollowUpListProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: 'general_checkin' as FollowUpType,
        due_date: new Date().toISOString().slice(0, 16),
        notes: ''
    });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onAdd({
                contact_id: contactId,
                status: 'pending',
                type: formData.type,
                due_date: new Date(formData.due_date).toISOString(),
                notes: formData.notes
            });
            setIsAddOpen(false);
            setFormData(prev => ({ ...prev, notes: '' })); // reset notes
        } catch (e) {
            // error handled in hook
        }
    };

    if (loading) return <div className="text-center py-8 text-muted-foreground">Loading reminders...</div>;

    const pending = followUps.filter(f => f.status === 'pending');
    const completed = followUps.filter(f => f.status !== 'pending');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Upcoming Reminders</h3>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Reminder
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Set Reminder</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Reason / Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as FollowUpType }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general_checkin">General Check-in</SelectItem>
                                        <SelectItem value="birthday">Birthday Wish</SelectItem>
                                        <SelectItem value="job_update">Job Update</SelectItem>
                                        <SelectItem value="health_check">Health Check-in</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                    placeholder="What do you want to say?"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Set Reminder</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {pending.length === 0 && (
                <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500/50" />
                    <p>All caught up! No pending reminders.</p>
                </div>
            )}

            <div className="space-y-3">
                {pending.map((item) => {
                    const isOverdue = isPast(new Date(item.due_date)) && !isToday(new Date(item.due_date));
                    const isDueToday = isToday(new Date(item.due_date));

                    return (
                        <div key={item.id} className={`flex items-start justify-between p-4 rounded-lg border ${isOverdue ? "bg-red-50 border-red-200" : isDueToday ? "bg-amber-50 border-amber-200" : "bg-card"}`}>
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 ${isOverdue ? "text-red-500" : "text-primary"}`}>
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium capitalize">{item.type.replace('_', ' ')}</h4>
                                        {isOverdue && <Badge variant="destructive" className="text-[10px] h-5">Overdue</Badge>}
                                        {isDueToday && <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] h-5">Today</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {format(new Date(item.due_date), "PPP p")}
                                    </p>
                                    {item.notes && <p className="text-sm mt-2 text-foreground/80">{item.notes}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="gap-2" onClick={() => onUpdateStatus(item.id, 'completed')}>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Done
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {completed.length > 0 && (
                <div className="pt-6">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Completed History</h4>
                    <div className="space-y-2 opacity-60">
                        {completed.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded border bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span className="text-sm line-through capitalize">{item.type.replace('_', ' ')}</span>
                                </div>
                                <span className="text-xs">{format(new Date(item.due_date), "MMM d")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
