import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import type { JobStats } from "@/types/job";

interface JobSearchPipelineProps {
  stats: JobStats;
  totalJobs: number;
}

export function JobSearchPipeline({ stats, totalJobs }: JobSearchPipelineProps) {
  const pipelineData = [
    { name: 'Bookmarked', count: stats.bookmarked, color: 'bg-indigo-500', glow: 'shadow-indigo-500/20' },
    { name: 'Applying', count: stats.applying, color: 'bg-indigo-400', glow: 'shadow-indigo-400/20' },
    { name: 'Applied', count: stats.applied, color: 'bg-emerald-400', glow: 'shadow-emerald-400/20' },
    { name: 'Interviewing', count: stats.interviewing, color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
    { name: 'Negotiating', count: stats.negotiating, color: 'bg-amber-400', glow: 'shadow-amber-400/20' },
    { name: 'Accepted', count: stats.accepted, color: 'bg-green-400', glow: 'shadow-green-400/20' },
  ];

  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getWidth = (count: number) => {
    return totalJobs > 0 ? (count / totalJobs) * 100 : 0;
  };

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Job Search Pipeline</CardTitle>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/40" />
        </div>
        <div className="text-[10px] font-medium text-muted-foreground/60 mt-1 uppercase tracking-tighter">
          Cycle: {formatDate(startDate)} — {formatDate(today)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {totalJobs > 0 ? (
          pipelineData.map((item) => (
            <div key={item.name} className="group flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                  {item.name}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black tabular-nums">{item.count}</span>
                  <span className="text-[9px] text-muted-foreground font-medium italic">jobs</span>
                </div>
              </div>
              <div className="relative h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-white/5 dark:border-black/5 shadow-inner">
                <div
                  className={`absolute left-0 top-0 h-full ${item.color} ${item.glow} shadow-lg rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${getWidth(item.count)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 space-y-3">
            <div className="h-12 w-12 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground font-medium px-6 leading-relaxed">
              Your pipeline is waiting. <br /> Add your first job tracking data to start.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}