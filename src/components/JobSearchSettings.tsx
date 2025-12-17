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
import { X, Wand2, Filter, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface JobSearchSettingsProps {
    profile: MasterProfile;
    onSearch: (config: SearchConfig) => void;
    onConfigChange?: (config: SearchConfig) => void;
}

const EXPERIENCE_LEVELS = [
    { id: "1", label: "Internship" },
    { id: "2", label: "Entry level" },
    { id: "3", label: "Associate" },
    { id: "4", label: "Mid-Senior" },
    { id: "5", label: "Director" },
    { id: "6", label: "Executive" },
];

const WORKPLACE_TYPES = [
    { id: "1", label: "On-site" },
    { id: "2", label: "Remote" },
    { id: "3", label: "Hybrid" },
];

export function JobSearchSettings({ profile, onSearch, onConfigChange }: JobSearchSettingsProps) {
    const [query, setQuery] = useState(profile.targetTitle || "");
    const [location, setLocation] = useState(profile.contact.location || "Remote");
    const [remote, setRemote] = useState(true);
    const [datePosted, setDatePosted] = useState<SearchConfig['datePosted']>("week");
    const [customSeconds, setCustomSeconds] = useState(3600); // Default 1 hour
    const [excluded, setExcluded] = useState<string[]>([]);
    const [excludeInput, setExcludeInput] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Advanced Filters
    const [experience, setExperience] = useState<string[]>([]);
    const [workplace, setWorkplace] = useState<string[]>(remote ? ["2"] : []);

    useEffect(() => {
        if (query) {
            setSuggestions(suggestKeywords(query));
        }
    }, [query]);

    // Sync remote switch with workplace type
    useEffect(() => {
        if (remote && !workplace.includes("2")) {
            setWorkplace(prev => [...prev, "2"]);
        } else if (!remote && workplace.includes("2") && workplace.length === 1) {
            setWorkplace([]);
        }
    }, [remote]);

    // Emit config changes for live previews (without triggering a scan)
    useEffect(() => {
        if (onConfigChange) {
            onConfigChange({
                query,
                location,
                remote,
                datePosted,
                customTimeSeconds: customSeconds,
                excludedTerms: excluded,
                experienceLevel: experience,
                workplaceType: workplace
            });
        }
    }, [query, location, remote, datePosted, customSeconds, excluded, experience, workplace]);

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

    const toggleFilter = (list: string[], setList: (l: string[]) => void, id: string) => {
        if (list.includes(id)) {
            setList(list.filter(item => item !== id));
        } else {
            setList([...list, id]);
        }
    };

    const handleSearch = () => {
        onSearch({
            query,
            location,
            remote,
            datePosted,
            customTimeSeconds: customSeconds,
            excludedTerms: excluded,
            experienceLevel: experience,
            workplaceType: workplace
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
                    Configure advanced filters to hit the LinkedIn Job Discovery API perfectly.
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

                <Separator className="bg-indigo-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Filter Group 1 */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Filter className="w-4 h-4" /> Experience Level</Label>
                            <div className="flex flex-wrap gap-2">
                                {EXPERIENCE_LEVELS.map(level => (
                                    <Badge
                                        key={level.id}
                                        variant={experience.includes(level.id) ? "default" : "outline"}
                                        className={`cursor-pointer ${experience.includes(level.id) ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-white hover:bg-slate-100'}`}
                                        onClick={() => toggleFilter(experience, setExperience, level.id)}
                                    >
                                        {level.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Filter className="w-4 h-4" /> Workplace Type</Label>
                            <div className="flex flex-wrap gap-2">
                                {WORKPLACE_TYPES.map(type => (
                                    <Badge
                                        key={type.id}
                                        variant={workplace.includes(type.id) ? "default" : "outline"}
                                        className={`cursor-pointer ${workplace.includes(type.id) ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-white hover:bg-slate-100'}`}
                                        onClick={() => toggleFilter(workplace, setWorkplace, type.id)}
                                    >
                                        {type.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Filter Group 2 */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Date Posted</Label>
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
                                    <SelectItem value="custom">Custom (Seconds)</SelectItem>
                                </SelectContent>
                            </Select>
                            {datePosted === 'custom' && (
                                <div className="mt-2 text-xs">
                                    <Label>Seconds (e.g. 3600 = 1 hr)</Label>
                                    <Input
                                        type="number"
                                        value={customSeconds}
                                        onChange={e => setCustomSeconds(Number(e.target.value))}
                                        className="h-8 mt-1 bg-white"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Excluding Terms</Label>
                            <div className="relative">
                                <Input
                                    value={excludeInput}
                                    onChange={e => setExcludeInput(e.target.value)}
                                    onKeyDown={handleAddExclude}
                                    placeholder="e.g. Senior, Internship, C++"
                                    className="bg-white"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {excluded.map(term => (
                                    <Badge key={term} variant="secondary" className="gap-1 bg-slate-200">
                                        {term}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => removeExclude(term)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <Button onClick={handleSearch} className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6 shadow-md shadow-indigo-200">
                    Update Search Intelligence & URL
                </Button>
            </CardContent>
        </Card>
    );
}
