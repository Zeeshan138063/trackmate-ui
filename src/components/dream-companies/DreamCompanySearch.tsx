
import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export interface CompanyFilters {
    query: string;
    location: string;
    industry: string;
    size: string;
    workType: "all" | "remote" | "onsite" | "hybrid";
    status: string;
}

interface DreamCompanySearchProps {
    onFilterChange: (filters: CompanyFilters) => void;
    industries: string[];
    statuses: string[];
}

export function DreamCompanySearch({ onFilterChange, industries, statuses }: DreamCompanySearchProps) {
    const [filters, setFilters] = useState<CompanyFilters>({
        query: "",
        location: "",
        industry: "all",
        size: "all",
        workType: "all",
        status: "all"
    });

    const [isNLPActive, setIsNLPActive] = useState(false);

    useEffect(() => {
        // Semantic/NLP Simulation
        // If query contains "remote", "hybrid", "onsite", automatically toggle worktype
        const queryLower = filters.query.toLowerCase();
        let updatedFilters = { ...filters };
        let nlpDetected = false;

        if (queryLower.includes("remote")) {
            updatedFilters.workType = "remote";
            nlpDetected = true;
        } else if (queryLower.includes("hybrid")) {
            updatedFilters.workType = "hybrid";
            nlpDetected = true;
        } else if (queryLower.includes("onsite")) {
            updatedFilters.workType = "onsite";
            nlpDetected = true;
        }

        setIsNLPActive(nlpDetected);
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const handleClear = () => {
        setFilters({
            query: "",
            location: "",
            industry: "all",
            size: "all",
            workType: "all",
            status: "all"
        });
    };

    const hasActiveFilters = filters.location || filters.industry !== "all" || filters.size !== "all" || filters.workType !== "all" || filters.status !== "all";

    return (
        <div className="space-y-4 w-full max-w-4xl mx-auto">
            <div className="flex gap-2 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by company name, technology, or 'remote'..."
                        value={filters.query}
                        onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                        className="pl-10 h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all rounded-xl shadow-sm"
                    />
                    {filters.query && (
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, query: "" }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={`h-11 gap-2 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm ${hasActiveFilters ? 'border-primary/50 bg-primary/5 text-primary' : ''}`}>
                            <SlidersHorizontal className="h-4 w-4" />
                            Filters
                            {hasActiveFilters && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    !
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-6 rounded-2xl shadow-2xl border-border/50 backdrop-blur-md bg-background/95">
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold leading-none text-foreground">Advanced Filters</h4>
                                <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 text-xs text-muted-foreground hover:text-destructive transition-colors">
                                    Reset
                                </Button>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Location</Label>
                                    <Input
                                        placeholder="City, State, or Country"
                                        value={filters.location}
                                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                                        className="h-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Industry</Label>
                                    <Select value={filters.industry} onValueChange={(v) => setFilters(prev => ({ ...prev, industry: v }))}>
                                        <SelectTrigger className="h-9 bg-muted/30 border-none focus:ring-1 focus:ring-primary/30">
                                            <SelectValue placeholder="All Industries" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Industries</SelectItem>
                                            {industries.map(ind => (
                                                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Work Type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["all", "remote", "onsite", "hybrid"].map((type) => (
                                            <Button
                                                key={type}
                                                variant={filters.workType === type ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setFilters(prev => ({ ...prev, workType: type as any }))}
                                                className={`h-8 text-xs capitalize transition-all ${filters.workType === type ? 'shadow-md scale-[1.02]' : 'opacity-70 hover:opacity-100'}`}
                                            >
                                                {type}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</Label>
                                    <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                                        <SelectTrigger className="h-9 bg-muted/30 border-none focus:ring-1 focus:ring-primary/30">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            {statuses.map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {isNLPActive && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                        <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                        Smart logic applied: <span className="text-primary font-medium capitalize">{filters.workType}</span> records prioritized
                    </span>
                </div>
            )}
        </div>
    );
}
