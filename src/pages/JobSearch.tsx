import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useResume } from "@/hooks/useResume";
import { JobSearchSettings } from "@/components/JobSearchSettings";
import { generateSearchUrl, SearchConfig } from "@/utils/search-intelligence";
import { ExternalLink, Search, Info, Briefcase, PlusCircle, ArrowRight, Loader2, RefreshCw, Zap, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { initialMasterProfile } from "@/types/resume";
import { JobService, ScannedJob } from "@/services/JobService";
import { JobQueryManager } from "@/components/JobQueryManager";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function JobSearch() {
  const { masterProfile, loading: profileLoading } = useResume();
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
  const [importUrl, setImportUrl] = useState("");

  // Auto-population state
  const [scannedJobs, setScannedJobs] = useState<ScannedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScannedJob | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

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

  const handleRunScan = async (overrideConfig?: SearchConfig) => {
    if (!masterProfile) return;
    setIsScanning(true);
    try {
      // Use override config if provided (for immediate updates), otherwise active state
      const cfg = overrideConfig || activeConfig;
      const keyword = cfg.query || masterProfile.targetTitle || "Software Engineer";

      // 2. Get Real Discovered jobs (if any)
      const realJobsData = await JobService.getDiscoveredJobs(keyword);

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

      // Only show REAL jobs
      setScannedJobs(realJobs);

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

  const handleLaunchSearch = (platform: 'google' | 'linkedin' | 'indeed') => {
    if (!activeConfig.query) {
      toast({ title: "Please define a target job title first." });
      return;
    }
    const url = generateSearchUrl(platform, activeConfig);
    window.open(url, '_blank');
    toast({
      title: "Search Launched",
      description: `Opened optimized ${platform} search in new tab.`
    });
  };

  const handleImport = () => {
    if (!importUrl) return;
    // Mock import functionality - normally this would parse the URL
    toast({
      title: "Job Imported",
      description: "We've added this job to your tracker (Mock).",
    });
    setImportUrl("");
  };

  const handleSaveScannedJob = (job: ScannedJob) => {
    setSavedJobIds(prev => [...prev, job.id]);
    toast({
      title: "Job Saved",
      description: `Added ${job.title} at ${job.company} to your tracker.`,
    });
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
        <Button onClick={() => handleRunScan()} disabled={isScanning} variant="outline" className="gap-2">
          {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isScanning ? "Scanning..." : "Re-Scan Feed"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings */}
        <div className="lg:col-span-1 space-y-6">
          <JobSearchSettings
            profile={currentProfile}
            onSearch={(config) => {
              setActiveConfig(config);
              handleRunScan(config);
            }}
            onConfigChange={setLatestConfig}
          />

          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Import</CardTitle>
              <CardDescription className="text-xs">Found a job? Paste the link to track it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="https://linkedin.com/jobs/view/..."
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                className="bg-white"
              />
              <Button size="sm" variant="secondary" className="w-full" onClick={handleImport}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add to Tracker
              </Button>
            </CardContent>
          </Card>

          {/* External Search Tools (Moved to sidebar) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">External Discovery</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full justify-start h-auto py-3 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 group" onClick={() => handleLaunchSearch('google')}>
                <div className="h-6 w-6 rounded-full bg-white border border-indigo-100 flex items-center justify-center mr-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="font-serif font-bold text-xs text-slate-700">G</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">Google Jobs</div>
                  <div className="text-[10px] text-muted-foreground">Aggregator</div>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3 border-blue-100 hover:border-blue-300 hover:bg-blue-50 group" onClick={() => handleLaunchSearch('linkedin')}>
                <div className="h-6 w-6 rounded-full bg-[#0077b5] flex items-center justify-center mr-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="font-bold text-xs text-white">in</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-700 group-hover:text-blue-700">LinkedIn</div>
                  <div className="text-[10px] text-muted-foreground">Networking</div>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3 border-slate-100 hover:border-slate-300 hover:bg-slate-50 group" onClick={() => handleLaunchSearch('indeed')}>
                <div className="h-6 w-6 rounded-full bg-[#2164f3] flex items-center justify-center mr-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="font-bold text-xs text-white">I</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Indeed</div>
                  <div className="text-[10px] text-muted-foreground">High Volume</div>
                </div>
              </Button>
            </div>
          </div>


        </div>

        {/* Right Column: Search Dashboard & Feed */}
        <div className="lg:col-span-2 space-y-8">

          {/* Automated Agents - Prominent Position */}
          <JobQueryManager activeConfig={latestConfig} />

          {/* Smart Links Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-indigo-600" />
              Smart Search Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Google Jobs */}
              <Card className="hover:border-indigo-300 transition-colors cursor-pointer group shadow-sm bg-gradient-to-br from-white to-slate-50" onClick={() => handleLaunchSearch('google')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white border shadow-sm flex items-center justify-center font-serif font-bold text-lg text-slate-700">G</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm group-hover:text-indigo-600 transition-colors">Google Jobs</h3>
                    <p className="text-xs text-muted-foreground">Aggregator</p>
                  </div>
                </CardContent>
              </Card>
              {/* LinkedIn */}
              <Card className="hover:border-blue-300 transition-colors cursor-pointer group shadow-sm bg-gradient-to-br from-white to-slate-50" onClick={() => handleLaunchSearch('linkedin')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#0077b5] text-white flex items-center justify-center font-bold text-sm">in</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">LinkedIn</h3>
                    <p className="text-xs text-muted-foreground">Networking</p>
                  </div>
                </CardContent>
              </Card>
              {/* Indeed */}
              <Card className="hover:border-blue-300 transition-colors cursor-pointer group shadow-sm bg-gradient-to-br from-white to-slate-50" onClick={() => handleLaunchSearch('indeed')}>
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
                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                  {scannedJobs.length} New Matches
                </Badge>
              </h2>
            </div>

            {/* Scrollable Container */}
            <div className="h-[600px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {isScanning ? (
                [1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 h-24 bg-slate-50/50" />
                  </Card>
                ))
              ) : (
                scannedJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-all border-slate-200 group relative overflow-hidden bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">{job.title}</h3>
                            <Badge variant="secondary" className="text-xs font-normal bg-indigo-50 text-indigo-700 border-indigo-100">
                              {job.matchScore}% Match
                            </Badge>
                            {job.source && (
                              <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200">
                                {job.source}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground gap-3 flex-wrap">
                            <span className="font-medium text-slate-700">{job.company}</span>
                            <span className="text-slate-300">•</span>
                            <span>{job.location}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-green-600 font-medium">{job.salary}</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {job.skills.slice(0, 3).map(skill => (
                              <Badge key={skill} variant="outline" className="text-[10px] px-2 py-0 h-5 bg-slate-50/50">
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
                            <Button variant="ghost" disabled className="text-green-600 bg-green-50">
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
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Job Details Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center justify-between">
              <span>{selectedJob?.title}</span>
              {selectedJob?.matchScore && (
                <Badge variant="secondary" className="ml-2">
                  {selectedJob.matchScore}% Match
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-700">
              {selectedJob?.company} • {selectedJob?.location}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2 flex-wrap">
              {selectedJob?.skills.map(s => (
                <Badge key={s} variant="outline" className="bg-slate-50">{s}</Badge>
              ))}
            </div>

            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line border-t pt-4">
              {selectedJob?.description}
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
    </div >
  );
}