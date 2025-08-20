import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { JobStats } from "@/types/job";

interface JobSearchPipelineProps {
  stats: JobStats;
  totalJobs: number;
}

export function JobSearchPipeline({ stats, totalJobs }: JobSearchPipelineProps) {
  const pipelineData = [
    { status: 'Bookmarked', count: stats.bookmarked, color: 'bg-slate-400' },
    { status: 'Applied', count: stats.applied, color: 'bg-yellow-500' },
    { status: 'Interviewing', count: stats.interviewing, color: 'bg-teal-600' },
    { status: 'Negotiating', count: stats.negotiating, color: 'bg-blue-600' },
  ];

  const getPercentage = (count: number) => {
    return totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0;
  };

  const getWidth = (count: number) => {
    return totalJobs > 0 ? (count / totalJobs) * 100 : 0;
  };

  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1); // Start of year
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Job Search Pipeline</CardTitle>
        </div>
        <div className="text-sm text-muted-foreground">
          Displaying results: {formatDate(startDate)} - {formatDate(today)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pipelineData.map((item) => (
          <div key={item.status} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{item.status}</span>
                {item.count > 0 && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded">
                    {getPercentage(item.count)}%
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold">{item.count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${item.color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${getWidth(item.count)}%` }}
              />
            </div>
          </div>
        ))}
        {totalJobs === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No jobs tracked yet. Add your first job to see pipeline statistics!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}