import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, PlayCircle, StopCircle, Bot, Sparkles, Activity } from "lucide-react";
import { QueryService, JobSearchQuery } from "@/services/QueryService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { SearchConfig } from "@/utils/search-intelligence";
import { mapConfigToFilters, getEffectivedKeyword } from "@/utils/filter-mapper";

interface JobQueryManagerProps {
    activeConfig?: SearchConfig;
}

export function JobQueryManager({ activeConfig }: JobQueryManagerProps) {
    const [queries, setQueries] = useState<JobSearchQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKeyword, setNewKeyword] = useState("");
    const [adding, setAdding] = useState(false);
    const [useSmartFilters, setUseSmartFilters] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadQueries();
    }, []);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const data = await QueryService.getQueries();
            setQueries(data);
        } catch (e: any) {
            console.error("Failed to load queries", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newKeyword.trim()) return;
        setAdding(true);
        try {
            let filters: Record<string, any> = { f_TPR: "r86400" }; // Default
            let finalKeyword = newKeyword.trim();

            if (useSmartFilters && activeConfig) {
                filters = mapConfigToFilters(activeConfig);
                if (activeConfig.excludedTerms.length > 0) {
                    finalKeyword = getEffectivedKeyword({ ...activeConfig, query: finalKeyword });
                }
            }

            await QueryService.addQuery(finalKeyword, filters);
            setNewKeyword("");
            await loadQueries();
            toast({ title: "Agent Deployed", description: `Searching for "${finalKeyword}" 24/7.` });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await QueryService.deleteQuery(id);
            setQueries(prev => prev.filter(q => q.id !== id));
            toast({ title: "Agent Stopped", description: "Search query removed." });
        } catch (e: any) {
            toast({ title: "Error", description: "Failed to delete query", variant: "destructive" });
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            const updated = await QueryService.toggleQuery(id, !currentStatus);
            setQueries(prev => prev.map(q => q.id === id ? updated : q));
        } catch (e: any) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    return (
        <Card className="bg-gradient-to-b from-white to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/10 border-indigo-100 dark:border-indigo-900 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-white/50 dark:bg-slate-950/50 border-b border-indigo-50 dark:border-indigo-900/50">
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-950 dark:text-indigo-100">
                    <Bot className="h-5 w-5 text-indigo-600" />
                    Automated Agents
                </CardTitle>
                <CardDescription>
                    Deploy AI agents to scout for jobs 24/7.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Role to hunt for..."
                            value={newKeyword}
                            onChange={e => setNewKeyword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            className="pl-9 bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-800 dark:text-slate-100 focus-visible:ring-indigo-500"
                        />
                        <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
                    </div>
                    <Button onClick={handleAdd} disabled={adding || !newKeyword.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0">
                        {adding ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>

                {activeConfig && (
                    <div className="flex items-center space-x-2 px-1">
                        <Switch
                            id="smart-filters"
                            checked={useSmartFilters}
                            onCheckedChange={setUseSmartFilters}
                            className="data-[state=checked]:bg-indigo-600"
                        />
                        <Label htmlFor="smart-filters" className="text-xs text-muted-foreground cursor-pointer select-none">
                            Use smart filters (Remote, Level, etc.)
                        </Label>
                    </div>
                )}

                <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {loading && <div className="text-center p-4 text-muted-foreground"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-indigo-600" />Syncing agents...</div>}

                    {!loading && queries.length === 0 && (
                        <div className="text-center p-8 border-2 border-dashed border-indigo-100 dark:border-indigo-900/50 rounded-xl bg-white/50 dark:bg-indigo-950/10">
                            <Bot className="h-8 w-8 text-indigo-200 mx-auto mb-2" />
                            <p className="text-sm text-indigo-900 font-medium">No active agents</p>
                            <p className="text-xs text-muted-foreground">Add a keyword to start hunting.</p>
                        </div>
                    )}

                    {queries.map(q => (
                        <div key={q.id} className="flex items-center justify-between p-3 border border-indigo-50 dark:border-indigo-900/50 bg-white dark:bg-slate-900/50 rounded-lg hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{q.keyword}</span>
                                    {q.is_active ? (
                                        <Badge variant="outline" className="text-[10px] h-5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30 flex items-center gap-1">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Paused</Badge>
                                    )}
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-1.5">
                                    <Activity className="h-3 w-3 text-indigo-400" />
                                    <span>Last run: {q.last_run_at ? formatDistanceToNow(new Date(q.last_run_at), { addSuffix: true }) : 'Never'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                                    onClick={() => handleToggle(q.id, q.is_active)}
                                    title={q.is_active ? "Pause Agent" : "Resume Agent"}
                                >
                                    {q.is_active ? <StopCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(q.id)}
                                    title="Delete Agent"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
