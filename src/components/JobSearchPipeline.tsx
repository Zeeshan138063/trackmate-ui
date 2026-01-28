import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { JobStats } from "@/types/job";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface JobSearchPipelineProps {
  stats: JobStats;
  totalJobs: number;
}

export function JobSearchPipeline({ stats, totalJobs }: JobSearchPipelineProps) {
  const pipelineData = [
    { name: 'Bookmarked', count: stats.bookmarked, color: '#94a3b8' },
    { name: 'Applied', count: stats.applied, color: '#eab308' },
    { name: 'Interviewing', count: stats.interviewing, color: '#0d9488' },
    { name: 'Negotiating', count: stats.negotiating, color: '#2563eb' },
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

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Job Search Pipeline</CardTitle>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDate(startDate)} - {formatDate(today)}
        </div>
      </CardHeader>
      <CardContent>
        {totalJobs > 0 ? (
          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical" margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No jobs tracked yet. Add your first job to see pipeline statistics!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}