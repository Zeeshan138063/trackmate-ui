import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Lock, ExternalLink } from "lucide-react";
import type { Job } from "@/types/job";

interface DatesCalendarProps {
  jobs: Job[];
}

export function DatesCalendar({ jobs }: DatesCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Helper function to format date without timezone issues
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle job click - navigate to trackers with job highlighted
  const handleJobClick = (jobId: string) => {
    // Navigate to trackers page with the job ID as a query parameter
    window.location.href = `/trackers?highlight=${jobId}`;
  };
  
  // Get jobs with follow-up dates or deadlines
  const jobsWithDates = jobs.filter(job => job.followUp || job.deadline || job.dateApplied);
  
  // Create dates that have events
  const eventDates = jobsWithDates.reduce((dates, job) => {
    if (job.followUp) dates.add(job.followUp);
    if (job.deadline) dates.add(job.deadline);
    if (job.dateApplied) dates.add(job.dateApplied);
    return dates;
  }, new Set<string>());

  // Get jobs for selected date
  const getJobsForDate = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return jobsWithDates.filter(job => 
      job.followUp === dateStr || 
      job.deadline === dateStr || 
      job.dateApplied === dateStr
    );
  };

  const selectedDateJobs = selectedDate ? getJobsForDate(selectedDate) : [];
  const hasJobsWithDates = jobsWithDates.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <CardTitle>Dates</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!hasJobsWithDates ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground">
                Set a date on a job or contact to unlock this module
              </p>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/trackers'}>
                Add Job Dates
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                event: (date) => {
                  const dateStr = formatDateLocal(date);
                  return eventDates.has(dateStr);
                }
              }}
              modifiersStyles={{
                event: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: '50%'
                }
              }}
            />
            
            <div className="border-t pt-4">
              {selectedDate && (
                <div>
                  <h4 className="font-semibold mb-2">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  {selectedDateJobs.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateJobs.map((job) => (
                        <div 
                          key={job.id} 
                          className="p-2 bg-muted rounded-md text-sm cursor-pointer hover:bg-muted/80 transition-colors border border-transparent hover:border-primary/20 group"
                          onClick={() => handleJobClick(job.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleJobClick(job.id);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{job.position}</div>
                              <div className="text-muted-foreground">{job.company}</div>
                              <div className="text-xs text-primary">
                                {(() => {
                                  if (!selectedDate) return '';
                                  const selectedDateStr = formatDateLocal(selectedDate);
                                  
                                  if (job.followUp === selectedDateStr) return 'Follow-up';
                                  if (job.deadline === selectedDateStr) return 'Deadline';
                                  if (job.dateApplied === selectedDateStr) return 'Applied';
                                  return '';
                                })()}
                              </div>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No jobs or contacts to follow up on this date.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}