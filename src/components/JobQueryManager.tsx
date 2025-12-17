import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, PlayCircle, StopCircle } from "lucide-react";
import { QueryService, JobSearchQuery } from "@/services/QueryService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export function JobQueryManager() {
    const [queries, setQueries] = useState<JobSearchQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKeyword, setNewKeyword] = useState("");
    const [adding, setAdding] = useState(false);
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
            toast({
                title: "Error",
                description: "Failed to load automated searches.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newKeyword.trim()) return;
        setAdding(true);
        try {
            // Default filters can be passed here if we want to extend the UI later
            await QueryService.addQuery(newKeyword.trim(), { f_TPR: "r86400" }); // Default to past 24h
            setNewKeyword("");
            await loadQueries();
            toast({ title: "Search Added", description: `We'll automatically scan for "${newKeyword}"` });
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
            toast({ title: "Deleted", description: "Search query removed." });
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
        <Card className="h-full bg-white border-slate-200">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    Automated Search Agents
                </CardTitle>
                <CardDescription>
                    We'll periodically scan these keywords for you.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Add new keyword (e.g. React Developer)"
                        value={newKeyword}
                        onChange={e => setNewKeyword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <Button onClick={handleAdd} disabled={adding || !newKeyword.trim()}>
                        {adding ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
                    {loading && <div className="text-center p-4 text-muted-foreground"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />Loading agents...</div>}

                    {!loading && queries.length === 0 && (
                        <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                            No active agents. Add a keyword above.
                        </div>
                    )}

                    {queries.map(q => (
                        <div key={q.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors group">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-800">{q.keyword}</span>
                                    {!q.is_active && <Badge variant="secondary" className="text-[10px] bg-slate-100">Paused</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                    <span>Last run: {q.last_run_at ? formatDistanceToNow(new Date(q.last_run_at), { addSuffix: true }) : 'Never'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                    onClick={() => handleToggle(q.id, q.is_active)}
                                >
                                    {q.is_active ? <StopCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                                    onClick={() => handleDelete(q.id)}
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
