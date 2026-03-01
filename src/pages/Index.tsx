import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CareerGoalSection } from "@/components/CareerGoalSection";
import { JobApplicationsChart } from "@/components/JobApplicationsChart";
import { JobSearchPipeline } from "@/components/JobSearchPipeline";
import { RecentActivity } from "@/components/RecentActivity";
import { WeeklySummary } from "@/components/WeeklySummary";
import { DatesCalendar } from "@/components/DatesCalendar";
import { PrioritiesSection } from "@/components/PrioritiesSection";
import { useJobs } from "@/hooks/useJobs";
import { useContacts } from "@/hooks/useContacts";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Layers,
  FileText,
  Sparkles,
  Compass,
  ArrowRight,
} from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Capitalize first letter only
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default function Index() {
  const navigate = useNavigate();
  const { jobs, loading: jobsLoading, updateJob } = useJobs();
  const { contacts, loading: contactsLoading } = useContacts();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState<string>("");

  // Fetch first name from profiles table (most reliable source)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) {
          setFirstName(capitalize(data.full_name.split(" ")[0]));
        } else if (data?.email) {
          setFirstName(capitalize(data.email.split("@")[0]));
        } else if (user.email) {
          setFirstName(capitalize(user.email.split("@")[0]));
        } else {
          setFirstName("there");
        }
      });
  }, [user?.id]);

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
      const statusKey = job.status.toLowerCase() as keyof typeof counts;
      if (statusKey in counts) counts[statusKey]++;

      const createdDate = job.createdAt ? new Date(job.createdAt) : new Date(job.dateSaved);
      if (createdDate > oneWeekAgo) weeklyJobsSaved++;
      totalExcitement += job.excitement;
    });

    const newConnections = contacts.filter(c => {
      const created = (c as any).created_at ? new Date((c as any).created_at) : null;
      return created && created > oneWeekAgo;
    }).length;

    const total = jobs.length;
    const responseRate = total > 0
      ? Math.round(((counts.interviewing + counts.negotiating + counts.accepted) / total) * 100 * 10) / 10
      : 0;

    return {
      ...counts,
      weeklyJobsSaved,
      newConnections,
      avgExcitement: total > 0 ? totalExcitement / total : 0,
      applyVelocity: total > 0 ? Math.round((counts.applied / total) * 100) : 0,
      total,
      responseRate,
    };
  }, [jobs, contacts]);

  const loading = jobsLoading || contactsLoading;

  // 5 most recent jobs for the mini-table
  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt) : new Date(a.dateSaved);
        const bDate = b.createdAt ? new Date(b.createdAt) : new Date(b.dateSaved);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 5);
  }, [jobs]);

  const STATUS_COLORS: Record<string, string> = {
    Bookmarked: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    Applying: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    Applied: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    Interviewing: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    Negotiating: "bg-purple-100 text-purple-700",
    Accepted: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

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

        {/* ── Personalized Greeting ── */}
        <div className="pb-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
            {getGreeting()}, {firstName || "…"}.
          </h1>
          <p className="mt-1 text-sm text-[#64748B] font-normal">
            Here's where your job search stands today.
          </p>
        </div>

        {/* ── 3 Clean Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Total Applications</p>
              <p className="text-4xl font-bold text-[#0F172A] dark:text-white tracking-tight">{stats.total}</p>
              <p className="text-xs text-[#64748B] mt-1">All time</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 ring-1 ring-primary/10">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Interviews</p>
              <p className="text-4xl font-bold text-primary tracking-tight">{stats.interviewing}</p>
              <p className="text-xs text-[#64748B] mt-1">Scheduled / active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Response Rate</p>
              <p className="text-4xl font-bold text-[#0F172A] dark:text-white tracking-tight">{stats.responseRate}%</p>
              <p className="text-xs text-[#64748B] mt-1">Based on applications</p>
            </CardContent>
          </Card>
        </div>

        {/* Career Goal Section */}
        <CareerGoalSection />

        {/* Primary Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <JobApplicationsChart appliedCount={stats.applied} />
          <JobSearchPipeline stats={stats} totalJobs={jobs.length} />
          <DatesCalendar jobs={jobs} onUpdateJob={updateJob} />
        </div>

        {/* Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <WeeklySummary
            jobsSaved={stats.weeklyJobsSaved}
            newConnections={stats.newConnections}
            avgExcitement={stats.avgExcitement}
            applyVelocity={stats.applyVelocity}
          />
          <RecentActivity jobs={jobs} />
        </div>

        {/* Priorities Section */}
        <PrioritiesSection />

        {/* ── Recent Applications Mini-Table ── */}
        {recentJobs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
                <button
                  onClick={() => navigate("/trackers")}
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentJobs.map((job) => {
                  const dateStr = job.createdAt
                    ? new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : new Date(job.dateSaved).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <div
                      key={job.id}
                      onClick={() => navigate("/trackers")}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{job.position}</p>
                        <p className="text-xs text-[#64748B] truncate">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status] || "bg-slate-100 text-slate-600"}`}>
                          {job.status}
                        </span>
                        <span className="text-xs text-[#64748B]">{dateStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Quick Nav Cards (OS Hero) ── */}
        <div className="text-center pt-4 pb-2">
          <h2 className="text-xl font-extrabold tracking-tight mb-1">
            Job<span className="font-mono text-primary">OS</span> — everything you need
          </h2>
          <p className="text-sm text-[#64748B] mb-8">One OS. Every job.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30" onClick={() => navigate("/trackers")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-5 w-5 text-primary" />
                  Applications
                </CardTitle>
                <CardDescription>Track every application across your full pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <button className="w-full h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">View Applications</button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30" onClick={() => navigate("/resume")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Resume <span className="text-[10px] font-mono text-[#818CF8] font-semibold">✦ AI</span>
                </CardTitle>
                <CardDescription>Build your master profile and auto-tailor per job</CardDescription>
              </CardHeader>
              <CardContent>
                <button className="w-full h-9 px-4 border border-input bg-background text-sm font-medium rounded-md hover:bg-muted/50 transition-colors">Open Resume Builder</button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30" onClick={() => navigate("/application-copilot")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Copilot <span className="text-[10px] font-mono text-[#818CF8] font-semibold">✦</span>
                </CardTitle>
                <CardDescription>AI that reads the JD and rewrites your resume to match</CardDescription>
              </CardHeader>
              <CardContent>
                <button className="w-full h-9 px-4 border border-input bg-background text-sm font-medium rounded-md hover:bg-muted/50 transition-colors">Open Copilot</button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30" onClick={() => navigate("/job-search")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Compass className="h-5 w-5 text-primary" />
                  Discover
                </CardTitle>
                <CardDescription>Find jobs from every board, globally, in one place</CardDescription>
              </CardHeader>
              <CardContent>
                <button className="w-full h-9 px-4 border border-input bg-background text-sm font-medium rounded-md hover:bg-muted/50 transition-colors">Browse Jobs</button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10">
            <button
              onClick={() => navigate("/trackers")}
              className="h-11 px-8 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
            >
              Get Started →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
