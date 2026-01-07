import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchConfig, suggestKeywords } from "@/utils/search-intelligence";
import { MasterProfile } from "@/types/resume";
import { X, Wand2, Filter, Clock, Check, ChevronsUpDown, SlidersHorizontal } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

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

    // UI States
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (query) {
            setSuggestions(suggestKeywords(query));
        }
    }, [query]);

    // Custom Time Calculation
    const [customHours, setCustomHours] = useState(1);
    const [customMinutes, setCustomMinutes] = useState(0);

    useEffect(() => {
        const total = (Number(customHours) * 3600) + (Number(customMinutes) * 60);
        setCustomSeconds(total > 0 ? total : 3600);
    }, [customHours, customMinutes]);

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
        <Card className="border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/10">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-indigo-600" />
                        Smart Search Config
                    </div>
                </CardTitle>
                <CardDescription className="dark:text-indigo-300/60">
                    Configure advanced intelligence to target the perfect role.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Top Row: Search Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Target Role</Label>
                        <div className="relative">
                            <Input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="e.g. Senior Product Designer"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-slate-100 focus-visible:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Location</Label>
                        <Input
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="Remote, City, or Country"
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-slate-100 focus-visible:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Suggestions Pills */}
                {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 self-center mr-1">Try:</span>
                        {suggestions.map(s => (
                            <Badge
                                key={s}
                                variant="outline"
                                className="cursor-pointer bg-white dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors text-[10px] px-2 py-0.5"
                                onClick={() => setQuery(cur => cur ? `${cur} OR "${s}"` : s)}
                            >
                                + {s}
                            </Badge>
                        ))}
                    </div>
                )}

                <Separator className="bg-indigo-100/50 dark:bg-indigo-900/30" />

                {/* Filters Row */}
                <div className="grid grid-cols-1 gap-3">

                    {/* Experience Filter */}
                    <div className="flex-1">
                        <Label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Experience</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between bg-white dark:bg-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 text-sm font-normal h-10 hover:bg-slate-50 dark:hover:bg-slate-800">
                                    {experience.length === 0 ? "Any Level" : `${experience.length} selected`}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                            {EXPERIENCE_LEVELS.map((level) => (
                                                <CommandItem
                                                    key={level.id}
                                                    value={level.label}
                                                    onSelect={() => toggleFilter(experience, setExperience, level.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", experience.includes(level.id) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                                        <Check className={cn("h-4 w-4")} />
                                                    </div>
                                                    <span>{level.label}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Workplace Filter */}
                    <div className="flex-1">
                        <Label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Workplace</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between bg-white dark:bg-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 text-sm font-normal h-10 hover:bg-slate-50 dark:hover:bg-slate-800">
                                    {workplace.length === 0 ? "Any Type" : `${workplace.length} selected`}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                            {WORKPLACE_TYPES.map((type) => (
                                                <CommandItem
                                                    key={type.id}
                                                    value={type.label}
                                                    onSelect={() => toggleFilter(workplace, setWorkplace, type.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", workplace.includes(type.id) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                                        <Check className={cn("h-4 w-4")} />
                                                    </div>
                                                    <span>{type.label}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Date Posted Filter */}
                    <div className="flex-1">
                        <Label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Date Posted</Label>
                        <Select value={datePosted} onValueChange={(v: any) => setDatePosted(v)}>
                            <SelectTrigger className="bg-white dark:bg-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 h-10 w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Any Time</SelectItem>
                                <SelectItem value="today">Past 24 Hours</SelectItem>
                                <SelectItem value="3days">Past 3 Days</SelectItem>
                                <SelectItem value="week">Past Week</SelectItem>
                                <SelectItem value="month">Past Month</SelectItem>
                                <SelectItem value="custom">Custom Time</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Custom Time Inputs */}
                        {datePosted === 'custom' && (
                            <div className="flex items-center gap-2 mt-2 animate-in slide-in-from-top-1">
                                <div className="space-y-0.5 flex-1">
                                    <Label className="text-[10px] text-slate-500">Hours</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={customHours}
                                        onChange={e => setCustomHours(parseInt(e.target.value) || 0)}
                                        className="h-8 text-xs bg-white dark:bg-slate-900"
                                    />
                                </div>
                                <div className="space-y-0.5 flex-1">
                                    <Label className="text-[10px] text-slate-500">Minutes</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={customMinutes}
                                        onChange={e => setCustomMinutes(parseInt(e.target.value) || 0)}
                                        className="h-8 text-xs bg-white dark:bg-slate-900"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Advanced Toggle */}
                <div onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-xs text-indigo-600 cursor-pointer hover:underline w-fit select-none">
                    <SlidersHorizontal className="h-3 w-3" />
                    {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
                </div>

                {/* Advanced Section (Excluded Terms) */}
                {showAdvanced && (
                    <div className="pt-2 animate-in slide-in-from-top-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Excluding Terms (Negative Keywords)</Label>
                        <div className="flex gap-2">
                            <Input
                                value={excludeInput}
                                onChange={e => setExcludeInput(e.target.value)}
                                onKeyDown={handleAddExclude}
                                placeholder="e.g. C++, Legacy, Clearance"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-slate-100 h-9 text-sm"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2 min-h-[24px]">
                            {excluded.map(term => (
                                <Badge key={term} variant="secondary" className="gap-1 bg-red-50 text-red-700 border-red-100 hover:bg-red-100">
                                    {term}
                                    <X
                                        className="h-3 w-3 cursor-pointer hover:text-red-900"
                                        onClick={() => removeExclude(term)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <Button onClick={handleSearch} className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium h-11 mt-2 shadow-sm">
                    Update Feed Filters
                </Button>
            </CardContent>
        </Card>
    );
}
