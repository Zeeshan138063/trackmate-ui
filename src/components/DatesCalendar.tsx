import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import type { Job } from "@/types/job";
import { cn } from "@/lib/utils";
import { EditJobDialog } from "@/components/EditJobDialog";

interface DatesCalendarProps {
  jobs: Job[];
  onUpdateJob?: (job: Job) => void;
}

export function DatesCalendar({ jobs, onUpdateJob }: DatesCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Helper to get YYYY-MM-DD in local time
  const toLocaleYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Edit Job State
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Get jobs with follow-up dates or deadlines
  const jobsWithDates = jobs.filter(job => job.followUp || job.deadline || job.dateApplied);

  // Create sets for different event types to color-code dots
  const events = jobsWithDates.reduce((acc, job) => {
    if (job.followUp) acc.followUps.add(job.followUp);
    if (job.deadline) acc.deadlines.add(job.deadline);
    if (job.dateApplied) acc.applied.add(job.dateApplied);
    return acc;
  }, {
    followUps: new Set<string>(),
    deadlines: new Set<string>(),
    applied: new Set<string>()
  });

  // Get jobs for selected date
  const getJobsForDate = (date: Date) => {
    const dateStr = toLocaleYYYYMMDD(date);
    return jobsWithDates.filter(job =>
      job.followUp === dateStr ||
      job.deadline === dateStr ||
      job.dateApplied === dateStr
    );
  };

  const selectedDateJobs = selectedDate ? getJobsForDate(selectedDate) : [];
  const hasJobsWithDates = jobsWithDates.length > 0;

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setEditDialogOpen(true);
  };

  const handleUpdateJob = (updatedJob: Job) => {
    if (onUpdateJob) {
      onUpdateJob(updatedJob);
    }
    setEditingJob(null);
  };

  const handleAutoSave = (updatedJob: Job) => {
    if (onUpdateJob) {
      onUpdateJob(updatedJob);
      // Keep local state in sync so dialog doesn't close or show stale data
      setEditingJob(updatedJob);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden border-none shadow-xl bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-3 flex-none">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Dates & Deadlines</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          {!hasJobsWithDates ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
              <div className="bg-primary/10 p-4 rounded-full">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Stay on Track</p>
                <p className="text-sm text-muted-foreground">
                  Add dates to jobs to see your schedule here
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/trackers'}>
                Go to Trackers
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-2">
              <div className="w-full flex-none">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border p-2 shadow-sm bg-card w-full"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                    month: "space-y-2 w-full",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full justify-between",
                    row: "flex w-full justify-between mt-1",
                    day: "h-8 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-transparent border border-primary text-primary font-semibold",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                    cell: "h-8 w-full text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                    caption: "flex justify-center pt-1 relative items-center h-8",
                    nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted rounded-full transition-colors"
                  }}
                  components={{
                    DayContent: ({ date }) => {
                      const dateStr = toLocaleYYYYMMDD(date);
                      const hasFollowUp = events.followUps.has(dateStr);
                      const hasDeadline = events.deadlines.has(dateStr);
                      const hasApplied = events.applied.has(dateStr);

                      return (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <span className="z-10">{date.getDate()}</span>
                          <div className="absolute bottom-1 flex gap-0.5 space-x-0.5">
                            {hasDeadline && <div className="h-1 w-1 rounded-full bg-red-500" />}
                            {!hasDeadline && hasFollowUp && <div className="h-1 w-1 rounded-full bg-blue-500" />}
                            {!hasDeadline && !hasFollowUp && hasApplied && <div className="h-1 w-1 rounded-full bg-green-500" />}
                          </div>
                        </div>
                      );
                    }
                  }}
                />
              </div>

              <div className="flex-1 min-h-0 border-t pt-2 mt-2 flex flex-col">
                {selectedDate && (
                  <>
                    <h4 className="font-semibold mb-2 text-sm flex-none flex items-center gap-2">
                      <span className="capitalize">
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="h-px flex-1 bg-border/50"></span>
                    </h4>

                    <div className="overflow-y-auto flex-1 pr-1 space-y-2 min-h-[100px] max-h-[300px]">
                      {selectedDateJobs.length > 0 ? (
                        selectedDateJobs.map((job) => (
                          <div
                            key={job.id}
                            onClick={() => handleEditJob(job)}
                            className="group flex items-start space-x-3 p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                          >
                            <div className="flex-none mt-0.5">
                              {job.deadline === toLocaleYYYYMMDD(selectedDate) ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              ) : job.followUp === toLocaleYYYYMMDD(selectedDate) ? (
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-sm font-medium leading-none truncate group-hover:text-primary transition-colors">{job.position}</p>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mb-1">{job.company}</p>
                              <div className="flex flex-wrap gap-1">
                                {job.deadline === toLocaleYYYYMMDD(selectedDate) && (
                                  <span className="inline-flex text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Deadline</span>
                                )}
                                {job.followUp === toLocaleYYYYMMDD(selectedDate) && (
                                  <span className="inline-flex text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Follow Up</span>
                                )}
                                {job.dateApplied === toLocaleYYYYMMDD(selectedDate) && (
                                  <span className="inline-flex text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Applied</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground h-full min-h-[60px]">
                          <div className="bg-muted p-3 rounded-full mb-2 opacity-50">
                            <CalendarDays className="h-5 w-5" />
                          </div>
                          <p className="text-xs">No tasks for this date</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Job Dialog */}
      {onUpdateJob && (
        <EditJobDialog
          job={editingJob}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdateJob={handleUpdateJob}
          onAutoSave={handleAutoSave}
        />
      )}
    </>
  );
}