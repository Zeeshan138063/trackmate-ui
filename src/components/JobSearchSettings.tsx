import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchConfig, suggestKeywords } from "@/utils/search-intelligence";
import { MasterProfile } from "@/types/resume";
import { X, Wand2 } from "lucide-react";

interface JobSearchSettingsProps {
    profile: MasterProfile;
    onSearch: (config: SearchConfig) => void;
}

export function JobSearchSettings({ profile, onSearch }: JobSearchSettingsProps) {
    const [query, setQuery] = useState(profile.targetTitle || "");
    const [location, setLocation] = useState(profile.contact.location || "Remote");
    const [remote, setRemote] = useState(true);
    const [datePosted, setDatePosted] = useState<SearchConfig['datePosted']>("week");
    const [excluded, setExcluded] = useState<string[]>([]);
    const [excludeInput, setExcludeInput] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (query) {
            setSuggestions(suggestKeywords(query));
        }
    }, [query]);

    const handleAddExclude = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && excludeInput) {
            e.preventDefault();
            if (!excluded.includes(excludeInput.trim())) {
                setExcluded([...excluded, excludeInput.trim()]);
            }
            setExcludeInput("");
        }
    };

    const removeExclude = (term: string) => {
        setExcluded(excluded.filter(t => t !== term));
    };

    const handleSearch = () => {
        onSearch({
            query,
            location,
            remote,
            datePosted,
            excludedTerms: excluded
        });
    };

    return (
        <Card className="border-indigo-100 bg-indigo-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-indigo-600" />
                    Smart Search Config
                </CardTitle>
                <CardDescription>
                    We use your profile to optimize search queries. Tweak them below.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Target Job Title (Query)</Label>
                        <Input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="e.g. Senior Product Designer"
                            className="bg-white"
                        />
                        {suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 text-xs">
                                <span className="text-muted-foreground mr-1">Try also:</span>
                                {suggestions.map(s => (
                                    <Badge
                                        key={s}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-indigo-100"
                                        onClick={() => setQuery(cur => cur ? `${cur} OR "${s}"` : s)}
                                    >
                                        + {s}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label>Excluding Terms (Press Enter)</Label>
                        <div className="relative">
                            <Input
                                value={excludeInput}
                                onChange={e => setExcludeInput(e.target.value)}
                                onKeyDown={handleAddExclude}
                                placeholder="e.g. Senior, Internship"
                                className="bg-white"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {excluded.map(term => (
                                <Badge key={term} variant="secondary" className="gap-1">
                                    {term}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => removeExclude(term)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Date Posted</Label>
                        <Select value={datePosted} onValueChange={(v: any) => setDatePosted(v)}>
                            <SelectTrigger className="bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Any Time</SelectItem>
                                <SelectItem value="today">Past 24 Hours</SelectItem>
                                <SelectItem value="3days">Past 3 Days</SelectItem>
                                <SelectItem value="week">Past Week</SelectItem>
                                <SelectItem value="month">Past Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2 pb-2">
                        <Switch id="remote-mode" checked={remote} onCheckedChange={setRemote} />
                        <Label htmlFor="remote-mode">Remote Only</Label>
                    </div>
                </div>

                <Button onClick={handleSearch} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700">
                    Update Search Intelligence
                </Button>
            </CardContent>
        </Card>
    );
}
