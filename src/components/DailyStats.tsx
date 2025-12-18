import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, Send, Users, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyStatsProps {
    stats: {
        bookmarked: number;
        applied: number;
        interviewing: number;
    };
}

export function DailyStats({ stats }: DailyStatsProps) {
    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                    Daily Pulse
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bookmarked Card */}
                <Card className="relative overflow-hidden border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Bookmark className="h-24 w-24 text-indigo-600 -rotate-12 transform translate-x-4 translate-y-[-10px]" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-sm ring-1 ring-white/50">
                                <Bookmark className="h-5 w-5" />
                            </div>
                            <div className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                                stats.bookmarked > 0 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                            )}>
                                <span>Today</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-4xl font-bold text-slate-900 tracking-tight">
                                {stats.bookmarked}
                            </div>
                            <p className="text-sm font-medium text-indigo-600/80 flex items-center gap-1">
                                New Opportunities
                                {stats.bookmarked > 0 && <ArrowUpRight className="h-3 w-3" />}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Applied Card */}
                <Card className="relative overflow-hidden border-teal-100 bg-gradient-to-br from-white to-teal-50/50 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Send className="h-24 w-24 text-teal-600 -rotate-12 transform translate-x-4 translate-y-[-10px]" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-teal-100/80 flex items-center justify-center text-teal-600 shadow-sm ring-1 ring-white/50">
                                <Send className="h-5 w-5 ml-0.5" />
                            </div>
                            <div className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                                stats.applied > 0 ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"
                            )}>
                                <span>Today</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-4xl font-bold text-slate-900 tracking-tight">
                                {stats.applied}
                            </div>
                            <p className="text-sm font-medium text-teal-600/80 flex items-center gap-1">
                                Applications Sent
                                {stats.applied > 0 && <ArrowUpRight className="h-3 w-3" />}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Interviewing Card */}
                <Card className="relative overflow-hidden border-amber-100 bg-gradient-to-br from-white to-amber-50/50 hover:shadow-lg transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="h-24 w-24 text-amber-600 -rotate-12 transform translate-x-4 translate-y-[-10px]" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-600 shadow-sm ring-1 ring-white/50">
                                <Users className="h-5 w-5" />
                            </div>
                            <div className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                                stats.interviewing > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                            )}>
                                <span>Today</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-4xl font-bold text-slate-900 tracking-tight">
                                {stats.interviewing}
                            </div>
                            <p className="text-sm font-medium text-amber-600/80 flex items-center gap-1">
                                Active Interactions
                                {stats.interviewing > 0 && <ArrowUpRight className="h-3 w-3" />}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
