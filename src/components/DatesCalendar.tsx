import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Lock } from "lucide-react";
import type { Job } from "@/types/job";

interface DatesCalendarProps {
  jobs: Job[];
}

export function DatesCalendar({ jobs }: DatesCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
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
    const dateStr = date.toISOString().split('T')[0];
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
                  const dateStr = date.toISOString().split('T')[0];
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
                        <div key={job.id} className="p-2 bg-muted rounded-md text-sm">
                          <div className="font-medium">{job.position}</div>
                          <div className="text-muted-foreground">{job.company}</div>
                          <div className="text-xs text-primary">
                            {job.followUp === selectedDate?.toISOString().split('T')[0] && 'Follow-up'}
                            {job.deadline === selectedDate?.toISOString().split('T')[0] && 'Deadline'}
                            {job.dateApplied === selectedDate?.toISOString().split('T')[0] && 'Applied'}
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