

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CareerGoalSection } from "@/components/CareerGoalSection";
import { JobApplicationsChart } from "@/components/JobApplicationsChart";
import { JobSearchPipeline } from "@/components/JobSearchPipeline";
import { RecentActivity } from "@/components/RecentActivity";
import { WeeklySummary } from "@/components/WeeklySummary";
import { DatesCalendar } from "@/components/DatesCalendar";
import { PrioritiesSection } from "@/components/PrioritiesSection";
import { RecentActivity } from "@/components/RecentActivity";
import { WeeklySummary } from "@/components/WeeklySummary";
import { useJobs } from "@/hooks/useJobs";
import { useContacts } from "@/hooks/useContacts";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, FileText, MessageSquare } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { jobs, loading: jobsLoading, updateJob } = useJobs();
  const { contacts, loading: contactsLoading } = useContacts();

  // Calculate stats for dashboard with useMemo for stability
  const stats = useMemo(() => {
    const counts = {
      bookmarked: 0,
      applying: 0,
      applied: 0,
      interviewing: 0,
      negotiating: 0,
      accepted: 0,
    };

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let weeklyJobsSaved = 0;
    let totalExcitement = 0;

    jobs.forEach((job) => {
      // General stats
      const statusKey = job.status.toLowerCase() as keyof typeof counts;
      if (statusKey in counts) counts[statusKey]++;

      // Weekly stats: prioritize createdAt, fallback to dateSaved
      const createdDate = job.createdAt ? new Date(job.createdAt) : new Date(job.dateSaved);
      if (createdDate > oneWeekAgo) {
        weeklyJobsSaved++;
      }
      totalExcitement += job.excitement;
    });

    const newConnections = contacts.filter(c => {
      const created = (c as any).created_at ? new Date((c as any).created_at) : null;
      return created && created > oneWeekAgo;
    }).length;

    return {
      ...counts,
      weeklyJobsSaved,
      newConnections,
      avgExcitement: jobs.length > 0 ? totalExcitement / jobs.length : 0,
      applyVelocity: jobs.length > 0 ? Math.round((counts.applied / jobs.length) * 100) : 0
    };
  }, [jobs, contacts]);

  const loading = jobsLoading || contactsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Career Goal Section */}
        <CareerGoalSection />

        {/* Dashboard Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <JobApplicationsChart appliedCount={stats.applied} />
          </div>
          <div className="lg:col-span-1">
            <JobSearchPipeline stats={stats} totalJobs={jobs.length} />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
          <div className="lg:col-span-1">
            <DatesCalendar jobs={jobs} onUpdateJob={updateJob} />
          </div>
        </div>

        {/* Weekly Insights & Priority Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <WeeklySummary />
          </div>
          <div className="lg:col-span-2">
            <PrioritiesSection />
          </div>
        </div>

        {/* Original Welcome Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Welcome to Job Tracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Organize your job search, track applications, and land your dream job with our comprehensive job tracking platform.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/trackers")}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Job Tracker
                </CardTitle>
                <CardDescription>
                  Keep track of all your job applications in one organized place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">View Job Applications</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/resume")}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Resume Builder
                </CardTitle>
                <CardDescription>
                  Create professional resumes tailored to your target positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Build Resume</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/interview")}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Interview Practice
                </CardTitle>
                <CardDescription>
                  Prepare for interviews with practice questions and tips
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Practice Interviews</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/work-styles")}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Work Styles
                </CardTitle>
                <CardDescription>
                  Discover your work style and find matching opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Assess Work Style</Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <Button size="lg" onClick={() => navigate("/trackers")}>
              Get Started with Job Tracking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
