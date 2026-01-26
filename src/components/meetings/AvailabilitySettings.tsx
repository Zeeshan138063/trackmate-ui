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

const AvailabilitySettings = ({ userId, embedded = false }: { userId: string, embedded?: boolean }) => {
    const [preferences, setPreferences] = useState<AvailabilityPreference[]>([]);
    const [originalPreferences, setOriginalPreferences] = useState<AvailabilityPreference[]>([]); // Track original state for diffing
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadPreferences();
    }, [userId]);

    const loadPreferences = async () => {
        try {
            const data = await MeetingService.getAvailabilityPreferences(userId);
            setPreferences(data);
            setOriginalPreferences(JSON.parse(JSON.stringify(data))); // Deep copy
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
        // We cast to AvailabilityPreference but it won't have an ID yet, which is fine for our logic
        setPreferences([...preferences, newPref as AvailabilityPreference]);
    };

    const handleUpdatePreference = (index: number, updates: Partial<AvailabilityPreference>) => {
        const newPrefs = [...preferences];
        newPrefs[index] = { ...newPrefs[index], ...updates };
        setPreferences(newPrefs);
    };

    const handleRemovePreference = (index: number) => {
        const prefToRemove = preferences[index];
        setPreferences(preferences.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            // Diffing Logic
            const toCreate: Partial<AvailabilityPreference>[] = [];
            const toUpdate: Partial<AvailabilityPreference>[] = [];
            const toDelete: string[] = [];

            // 1. Identify Creates and Updates
            preferences.forEach(pref => {
                if (!pref.id) {
                    // New item (no ID)
                    toCreate.push(pref);
                } else {
                    // Existing item - check if changed
                    const original = originalPreferences.find(p => p.id === pref.id);
                    if (original) {
                        const hasChanged =
                            original.day_of_week !== pref.day_of_week ||
                            original.start_time !== pref.start_time ||
                            original.end_time !== pref.end_time ||
                            original.is_active !== pref.is_active;

                        if (hasChanged) {
                            toUpdate.push(pref);
                        }
                    }
                }
            });

            // 2. Identify Deletes
            originalPreferences.forEach(orig => {
                const stillExists = preferences.find(p => p.id === orig.id);
                if (!stillExists) {
                    toDelete.push(orig.id);
                }
            });

            if (toCreate.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
                toast({ title: "No changes", description: "Your availability is already up to date." });
                return;
            }

            await MeetingService.bulkSyncAvailability(userId, { toCreate, toUpdate, toDelete });

            toast({ title: "Preferences saved", description: "Your interview-only hours have been updated." });

            // Reload to get fresh IDs and state
            loadPreferences();

        } catch (error) {
            console.error("Error saving preferences:", error);
            toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
        }
    };

    const Content = (
        <div className={embedded ? "space-y-3" : "space-y-4"}>
            {!embedded && (
                <p className="text-xs text-muted-foreground">
                    Define your "ideal" slots for interviews. These will be highlighted when you share availability.
                </p>
            )}

            <div className="space-y-2">
                {preferences.map((pref, index) => (
                    <div key={index} className="flex flex-col gap-2 p-2 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between">
                            <SelectDay
                                value={pref.day_of_week}
                                onChange={(val) => handleUpdatePreference(index, { day_of_week: val })}
                            />
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleRemovePreference(index)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Input
                                type="time"
                                value={pref.start_time}
                                onChange={(e) => handleUpdatePreference(index, { start_time: e.target.value })}
                                className="h-7 text-xs px-1 bg-background border-input"
                            />
                            <span className="text-muted-foreground text-[10px]">to</span>
                            <Input
                                type="time"
                                value={pref.end_time}
                                onChange={(e) => handleUpdatePreference(index, { end_time: e.target.value })}
                                className="h-7 text-xs px-1 bg-background border-input"
                            />
                            <Switch
                                checked={pref.is_active}
                                onCheckedChange={(val) => handleUpdatePreference(index, { is_active: val })}
                                className="scale-75 origin-right"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Always show save button if there are preferences, or if deletes happened (but tracking deletes in UI needs state comparison) */}
            {/* User can see save button, handleSave will check logic */}
            <Button className="w-full h-8 text-xs" onClick={handleSave}>Save Changes</Button>

            {embedded && (
                <Button size="sm" variant="outline" className="w-full text-xs h-8 border-dashed" onClick={handleAddPreference}>
                    <Plus className="h-3 w-3 mr-1" /> Add Slot
                </Button>
            )}
        </div>
    );

    if (embedded) {
        return (
            <div className="p-4">
                {Content}
            </div>
        );
    }

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
            <CardContent>
                {Content}
            </CardContent>
        </Card>
    );
};

const SelectDay = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => (
    <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-transparent text-xs font-medium focus:outline-none"
    >
        {days.map((day, i) => (
            <option key={i} value={i}>{day.substring(0, 3)}</option>
        ))}
    </select>
);

export default AvailabilitySettings;
