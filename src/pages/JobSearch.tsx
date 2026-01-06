import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useResume } from "@/hooks/useResume";
import { JobSearchSettings } from "@/components/JobSearchSettings";
import { generateSearchUrl, SearchConfig } from "@/utils/search-intelligence";
import { ExternalLink, Search, Info, Briefcase, PlusCircle, ArrowRight, Loader2, RefreshCw, Zap, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { initialMasterProfile } from "@/types/resume";
import { JobService, ScannedJob } from "@/services/JobService";
import { JobQueryManager } from "@/components/JobQueryManager";
import { useJobs } from "@/hooks/useJobs";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function JobSearch() {
  const { masterProfile, loading: profileLoading } = useResume();
  const { addJob } = useJobs();
  const [activeConfig, setActiveConfig] = useState<SearchConfig>({
    query: "",
    location: "Remote",
    remote: true,
    datePosted: 'week',
    excludedTerms: []
  });
  // Track most recent UI changes, even if not "submitted" yet
  const [latestConfig, setLatestConfig] = useState<SearchConfig>(activeConfig);

  const { toast } = useToast();


  // Auto-population state
  const [scannedJobs, setScannedJobs] = useState<ScannedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScannedJob | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Layout Refs for dynamic height alignment
  const sidebarRef = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [feedHeight, setFeedHeight] = useState(965); // Default to user preference

  // Sync profile to config when loaded
  useEffect(() => {
    if (masterProfile && !activeConfig.query) {
      setActiveConfig(prev => ({
        ...prev,
        query: masterProfile.targetTitle || "Software Engineer",
        location: masterProfile.contact.location || "Remote"
      }));
      setLatestConfig(prev => ({
        ...prev,
        query: masterProfile.targetTitle || "Software Engineer",
        location: masterProfile.contact.location || "Remote"
      }));

      // Auto-start scan on first load
      handleRunScan();
    }
  }, [masterProfile]);

  // Dynamic Height Sync Effect
  useEffect(() => {
    if (!sidebarRef.current || !listRef.current) return;

    const updateHeight = () => {
      // Only apply dynamic calculation on desktop (lg breakpoint)
      if (window.matchMedia('(min-width: 1024px)').matches) {
        // Calculate the available space from the top of the list to the bottom of the sidebar
        const sidebarRect = sidebarRef.current?.getBoundingClientRect();
        const listRect = listRef.current?.getBoundingClientRect();

        if (sidebarRect && listRect) {
          // sidebarBottom is the target visual bottom line
          // newHeight = (Target Bottom) - (Current Top of List)
          // Subtract 24px buffer to prevent visual overshoot
          const newHeight = (sidebarRect.bottom - listRect.top) - 24;

          // Ensure a reasonable minimum
          setFeedHeight(Math.max(newHeight, 500));
        }
      } else {
        // Fallback for mobile/tablet where they stack
        setFeedHeight(600);
      }
    };

    const observer = new ResizeObserver(updateHeight);
    if (sidebarRef.current) observer.observe(sidebarRef.current);
    if (topSectionRef.current) observer.observe(topSectionRef.current);

    // Also listen to window resize
    window.addEventListener('resize', updateHeight);

    // Initial calc - wait for layout to settle slightly
    setTimeout(updateHeight, 100);
    // Re-calc after animation (700ms) to ensure final position is correct
    setTimeout(updateHeight, 800);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isScanning && !isLoadingMore) {
          loadMoreJobs();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, hasMore, isScanning, isLoadingMore, scannedJobs]);

  const handleRunScan = async (overrideConfig?: SearchConfig) => {
    if (!masterProfile) return;
    setIsScanning(true);
    setPage(0); // Reset page on new scan
    setHasMore(true);

    try {
      // Use override config if provided (for immediate updates), otherwise active state
      const cfg = overrideConfig || activeConfig;
      const keyword = cfg.query || masterProfile.targetTitle || "Software Engineer";

      // 2. Get Real Discovered jobs (if any)
      const realJobsData = await JobService.getDiscoveredJobs(keyword, 0, 20);

      const realJobs: ScannedJob[] = realJobsData.map((j: any) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location || "Remote",
        salary: "Not Disclosed",
        type: "Full-time",
        skills: [keyword, "AI Match"],
        matchScore: j.similarity ? Math.round(j.similarity * 100) : 85, // Use real similarity or fallback
        foundDate: j.posted_at,
        source: j.source || 'LinkedIn',
        description: j.description || "No description available",
        isRemote: j.location ? j.location.toLowerCase().includes('remote') : false,
        job_url: j.job_url
      }));

      // Only show REAL jobs (replace existing)
      setScannedJobs(realJobs);
      setHasMore(realJobs.length >= 20);

      if (realJobs.length > 0) {
        toast({
          title: "Scan Complete",
          description: `Found ${realJobs.length} new real jobs.`
        });
      } else {
        toast({
          title: "No New Jobs",
          description: "Try a different keyword or check back later."
        });
      }
    } catch (e) {
      console.error("Scan failed", e);
    } finally {
      setIsScanning(false);
    }
  };

  const loadMoreJobs = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const keyword = activeConfig.query || masterProfile?.targetTitle || "Software Engineer";
      const newJobsData = await JobService.getDiscoveredJobs(keyword, nextPage, 20);

      if (newJobsData.length === 0) {
        setHasMore(false);
        return;
      }

      const newJobs: ScannedJob[] = newJobsData.map((j: any) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location || "Remote",
        salary: "Not Disclosed",
        type: "Full-time",
        skills: [keyword, "AI Match"],
        matchScore: j.similarity ? Math.round(j.similarity * 100) : 85,
        foundDate: j.posted_at,
        source: j.source || 'LinkedIn',
        description: j.description || "No description available",
        isRemote: j.location ? j.location.toLowerCase().includes('remote') : false,
        job_url: j.job_url
      }));

      setScannedJobs(prev => [...prev, ...newJobs]);
      setPage(nextPage);
      setHasMore(newJobs.length >= 20);

    } catch (e) {
      console.error("Load more failed", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLaunchSearch = (platform: 'google' | 'linkedin' | 'indeed') => {
    if (!latestConfig.query) {
      toast({ title: "Please define a target job title first." });
      return;
    }
    const url = generateSearchUrl(platform, latestConfig);
    window.open(url, '_blank');
    toast({
      title: "Search Launched",
      description: `Opened optimized ${platform} search in new tab.`
    });
  };



  const handleSaveScannedJob = async (job: ScannedJob) => {
    try {
      // Map ScannedJob to Job
      // Attempt to parse salary if it's a string range (e.g. $100k - $150k)
      // For now, we'll just leave salary undefined as strings don't map to number easily without parsing logic

      await addJob({
        position: job.title,
        company: job.company,
        location: job.location,
        jobUrl: job.job_url, // Maps correctly now
        description: job.description,
        status: "Bookmarked",
        excitement: job.matchScore >= 90 ? 5 : job.matchScore >= 80 ? 4 : 3,
        dateSaved: new Date().toISOString(),
        datePosted: job.foundDate,
        source: "linkedin_auto" // Using the allowed literal type
      });

      setSavedJobIds(prev => [...prev, job.id]);

      // Remove from scanned jobs list
      setScannedJobs(prev => prev.filter(j => j.id !== job.id));

      // If the selected job was the one saved, close the dialog
      if (selectedJob?.id === job.id) {
        setSelectedJob(null);
      }

      toast({
        title: "Job Saved to Tracker",
        description: `Added ${job.title} at ${job.company}.`,
      });
    } catch (error) {
      console.error("Failed to save job", error);
      toast({
        title: "Error Saving Job",
        description: "Could not add to tracker. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (profileLoading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const currentProfile = masterProfile || initialMasterProfile;

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Search Intelligence</h1>
          <p className="text-muted-foreground mt-2">
            Leveraging your Master Profile to find the perfect roles across the web.
          </p>
        </div>
        <Button onClick={() => handleRunScan()} disabled={isScanning} variant="outline" className="gap-2 dark:border-slate-800 dark:hover:bg-slate-900">
          {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isScanning ? "Scanning..." : "Re-Scan Feed"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings & Agents */}
        <div ref={sidebarRef} className="lg:col-span-1 space-y-6 self-start">
          <JobSearchSettings
            profile={currentProfile}
            onSearch={(config) => {
              setActiveConfig(config);
              handleRunScan(config);
            }}
            onConfigChange={setLatestConfig}
          />



          {/* Automated Agents - Prominent Position in Sidebar */}
          <JobQueryManager activeConfig={latestConfig} />

        </div>

        {/* Right Column: Search Dashboard & Feed */}
        <div className="lg:col-span-2 space-y-8">

          {/* Smart Links Section (Restored) */}
          <div ref={topSectionRef} className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-indigo-600" />
              Smart Search Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Google Jobs */}
              <Card className="hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors cursor-pointer group shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950" onClick={() => handleLaunchSearch('google')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-sm flex items-center justify-center font-serif font-bold text-lg text-slate-700 dark:text-slate-300">G</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm group-hover:text-indigo-600 transition-colors">Google Jobs</h3>
                    <p className="text-xs text-muted-foreground">Aggregator</p>
                  </div>
                </CardContent>
              </Card>
              {/* LinkedIn */}
              <Card className="hover:border-blue-300 dark:hover:border-blue-800 transition-colors cursor-pointer group shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950" onClick={() => handleLaunchSearch('linkedin')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#0077b5] text-white flex items-center justify-center font-bold text-sm">in</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">LinkedIn</h3>
                    <p className="text-xs text-muted-foreground">Networking</p>
                  </div>
                </CardContent>
              </Card>
              {/* Indeed */}
              <Card className="hover:border-blue-300 dark:hover:border-blue-800 transition-colors cursor-pointer group shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950" onClick={() => handleLaunchSearch('indeed')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#2164f3] text-white flex items-center justify-center font-bold text-sm">I</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">Indeed</h3>
                    <p className="text-xs text-muted-foreground">Volume</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>



          {/* Live Feed Section */}
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                Live Job Feed
                <Badge variant="outline" className="ml-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50">
                  {scannedJobs.length} New Matches
                </Badge>
              </h2>
            </div>

          </div>
          {/* Scrollable Container */}
          <div
            ref={listRef}
            className="overflow-y-auto pr-2 space-y-3 custom-scrollbar"
            style={{ height: feedHeight }}
          >
            {isScanning ? (
              [1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 h-24 bg-slate-50/50 dark:bg-slate-900/50" />
                </Card>
              ))
            ) : (
              <>
                {scannedJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-all border-slate-200 dark:border-slate-800 group relative overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1">{job.title}</h3>
                            <Badge variant="secondary" className="text-xs font-normal bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50">
                              {job.matchScore}% Match
                            </Badge>
                            {job.source && (
                              <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200">
                                {job.source}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground gap-3 flex-wrap">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{job.company}</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span>{job.location}</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">{job.salary}</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {job.skills.slice(0, 3).map(skill => (
                              <Badge key={skill} variant="outline" className="text-[10px] px-2 py-0 h-5 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => setSelectedJob(job)}>
                            View Details
                          </Button>
                          {savedJobIds.includes(job.id) ? (
                            <Button variant="ghost" disabled className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Saved
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handleSaveScannedJob(job)} className="bg-slate-900 hover:bg-slate-800">
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Loader / End of List Indicator */}
                <div ref={observerTarget} className="py-4 text-center">
                  {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />}
                  {!hasMore && scannedJobs.length > 0 && (
                    <p className="text-xs text-muted-foreground">No more jobs to load.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>


      {/* Job Details Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center justify-between pr-8">
              <span>{selectedJob?.title}</span>
              {selectedJob?.matchScore && (
                <Badge variant="secondary" className="ml-2">
                  {selectedJob.matchScore}% Match
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-700 dark:text-slate-300">
              {selectedJob?.company} • {selectedJob?.location}
            </DialogDescription>
            {selectedJob?.foundDate && (
              <p className="text-sm text-slate-500 mt-1">
                Posted {formatDistanceToNow(new Date(selectedJob.foundDate), { addSuffix: true })}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2 flex-wrap">
              {selectedJob?.skills.map(s => (
                <Badge key={s} variant="outline" className="bg-slate-50 dark:bg-slate-900">{s}</Badge>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => window.open(selectedJob?.job_url || '#', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {selectedJob?.source ? `Apply on ${selectedJob.source}` : "View Job"}
              </Button>
              <Button onClick={() => {
                if (selectedJob) handleSaveScannedJob(selectedJob);
                setSelectedJob(null);
              }}>
                Save to Tracker
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}