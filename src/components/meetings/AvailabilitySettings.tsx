import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MeetingService } from "@/services/MeetingService";
import { AvailabilityPreference } from "@/types/meeting";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2 } from "lucide-react";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AvailabilitySettings = ({ userId }: { userId: string }) => {
    const [preferences, setPreferences] = useState<AvailabilityPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadPreferences();
    }, [userId]);

    const loadPreferences = async () => {
        try {
            const data = await MeetingService.getAvailabilityPreferences(userId);
            setPreferences(data);
        } catch (error) {
            console.error("Error loading preferences:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPreference = () => {
        const newPref: Partial<AvailabilityPreference> = {
            user_id: userId,
            day_of_week: 1, // Monday
            start_time: "09:00:00",
            end_time: "17:00:00",
            is_active: true
        };
        setPreferences([...preferences, newPref as AvailabilityPreference]);
    };

    const handleUpdatePreference = (index: number, updates: Partial<AvailabilityPreference>) => {
        const newPrefs = [...preferences];
        newPrefs[index] = { ...newPrefs[index], ...updates };
        setPreferences(newPrefs);
    };

    const handleRemovePreference = (index: number) => {
        setPreferences(preferences.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            await MeetingService.updateAvailabilityPreference(userId, preferences);
            toast({ title: "Preferences saved", description: "Your interview-only hours have been updated." });
        } catch (error) {
            console.error("Error saving preferences:", error);
            toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Interview-Only Hours
                </CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddPreference}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                    Define your "ideal" slots for interviews. These will be highlighted when you share availability.
                </p>

                <div className="space-y-3">
                    {preferences.map((pref, index) => (
                        <div key={index} className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30">
                            <div className="flex items-center justify-between">
                                <SelectDay
                                    value={pref.day_of_week}
                                    onChange={(val) => handleUpdatePreference(index, { day_of_week: val })}
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRemovePreference(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="time"
                                    value={pref.start_time}
                                    onChange={(e) => handleUpdatePreference(index, { start_time: e.target.value })}
                                    className="h-8 text-xs"
                                />
                                <span className="text-muted-foreground text-xs">to</span>
                                <Input
                                    type="time"
                                    value={pref.end_time}
                                    onChange={(e) => handleUpdatePreference(index, { end_time: e.target.value })}
                                    className="h-8 text-xs"
                                />
                                <Switch
                                    checked={pref.is_active}
                                    onCheckedChange={(val) => handleUpdatePreference(index, { is_active: val })}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {preferences.length > 0 && (
                    <Button className="w-full" onClick={handleSave}>Save Preferences</Button>
                )}
            </CardContent>
        </Card>
    );
};

const SelectDay = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => (
    <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-transparent text-sm font-medium focus:outline-none"
    >
        {days.map((day, i) => (
            <option key={i} value={i}>{day}</option>
        ))}
    </select>
);

export default AvailabilitySettings;
