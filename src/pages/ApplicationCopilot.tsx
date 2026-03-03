import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useJobs } from "@/hooks/useJobs";
import { useResume } from "@/hooks/useResume";
import { Job } from "@/types/job";
import { MasterProfile } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, CheckCircle2, XCircle, FileText, Briefcase, ExternalLink, Bot, AlertCircle, Building2, Printer, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { ResumeAIHelper } from "@/utils/resume-ai-helper";

export default function ApplicationCopilot() {
    const { jobs, updateJob, loading: jobsLoading } = useJobs();
    const { masterProfile, loading: profileLoading } = useResume();
    const { toast } = useToast();

    // AI State
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [tailoredResume, setTailoredResume] = useState<MasterProfile | null>(null);
    const [realMatchScore, setRealMatchScore] = useState<number | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);

    // Filter for jobs that are in "Bookmarked" or "Applying" stage
    const queue = useMemo(() => {
        if (!jobs) return [];
        const applying = jobs.filter(j => j.status === 'Applying');
        if (applying.length > 0) return applying;
        return jobs.filter(j => j.status === 'Bookmarked');
    }, [jobs]);

    const [selectedIndex, setSelectedIndex] = useState(0);
    const currentJob = queue[selectedIndex];

    // Reset Job Specific State when changing jobs
    useEffect(() => {
        setTailoredResume(null);
        setRealMatchScore(null);
        setExplanation(null);
    }, [currentJob?.id]);

    // Handle Bounds
    if (selectedIndex >= queue.length && queue.length > 0) {
        setSelectedIndex(0);
    }

    const handleNext = () => {
        if (selectedIndex < queue.length - 1) {
            setSelectedIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (selectedIndex > 0) {
            setSelectedIndex(prev => prev - 1);
        }
    }

    const handleApprove = async () => {
        if (!currentJob) return;
        try {
            await updateJob({
                ...currentJob,
                status: 'Applied',
                dateApplied: new Date().toISOString()
            });
            toast({
                title: "Application Approved",
                description: `Moved ${currentJob.position} to Applied status.`
            });
        } catch (e) {
            toast({ title: "Error", description: "Failed to update job.", variant: "destructive" });
        }
    };

    const handleReject = async () => {
        if (!currentJob) return;
        try {
            await updateJob({ ...currentJob, status: 'Rejected' });
            toast({
                title: "Application Skipped",
                description: `Moved ${currentJob.position} to Rejected.`
            });
        } catch (e) {
            toast({ title: "Error", description: "Failed to update job.", variant: "destructive" });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // REAL AI Regeneration
    const handleRegenerate = async () => {
        if (!currentJob || !masterProfile) return;

        setIsRegenerating(true);
        try {
            const result = await ResumeAIHelper.tailorAndScoreResume(
                currentJob.description || currentJob.position,
                masterProfile
            );

            setTailoredResume(result.tailoredProfile);
            setRealMatchScore(result.matchScore);
            setExplanation(result.explanation);

            toast({
                title: `Optimized! Match Score: ${result.matchScore}%`,
                description: result.explanation || "Resume tailored to job description.",
            });

        } catch (error) {
            console.error(error);
            toast({
                title: "Optimization Failed",
                description: "Could not generate tailored resume. Check your AI settings.",
                variant: "destructive"
            });
        } finally {
            setIsRegenerating(false);
        }
    };

    // Use Real Score if available, otherwise fallback to mock calculation
    const displayScore = useMemo(() => {
        if (realMatchScore !== null) return realMatchScore;

        // Fallback Mock Logic
        if (!currentJob || !masterProfile) return 0;
        let score = 70;
        const title = currentJob.position.toLowerCase();
        const target = (masterProfile.targetTitle || "").toLowerCase();
        if (title.includes(target) || target.includes(title)) score += 15;
        const desc = (currentJob.description || "").toLowerCase();
        const skills = masterProfile.skills.flatMap(s => s.items.split(',').map(i => i.trim().toLowerCase()));
        let skillMatches = 0;
        skills.forEach(s => {
            if (desc.includes(s)) skillMatches++;
        });
        score += Math.min(15, skillMatches * 2);
        return Math.min(99, score);

    }, [currentJob, masterProfile, realMatchScore]);

    // Determining which resume to show
    const resumeToShow = tailoredResume || masterProfile;

    if (jobsLoading || profileLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F5F3FF] dark:bg-indigo-950/10 rounded-2xl mx-6 my-4">
                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
                    <span className="text-2xl text-primary font-mono font-bold">✦</span>
                </div>
                <p className="text-sm text-[#64748B] font-medium">Copilot is loading your queue…</p>
            </div>
        );
    }

    if (queue.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F5F3FF] dark:bg-indigo-950/10 rounded-2xl mx-6 my-4 text-center px-8 py-16 animate-in fade-in zoom-in duration-500">
                {/* ✦ Icon */}
                <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                    <span className="text-3xl text-white font-mono font-bold leading-none">✦</span>
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-3">
                    JobOS Copilot
                </h2>
                <p className="text-[#64748B] text-sm max-w-sm mb-2 leading-relaxed">
                    Your AI that reads a job description and tailors your entire
                    application — resume, cover letter, and match score — in seconds.
                </p>
                <p className="text-[#64748B] text-xs mb-8">
                    Add jobs to your <span className="font-semibold text-primary">Applications</span> pipeline to begin.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => window.location.href = '/trackers'}
                        className="h-10 px-6 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                    >
                        Select a Job to Analyze
                    </button>
                    <button
                        onClick={() => window.location.href = '/job-search'}
                        className="h-10 px-6 border border-[#E2E8F0] bg-white text-[#0F172A] text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        Discover New Jobs
                    </button>
                </div>

                {/* Feature list */}
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-2xl w-full">
                    {[
                        { icon: "📄", title: "Resume Tailoring", desc: "Rewrites your resume to match the job description" },
                        { icon: "🎯", title: "Match Score", desc: "AI-powered compatibility score for every application" },
                        { icon: "⚡", title: "One Click Apply", desc: "Approve & mark as applied in a single action" },
                    ].map(f => (
                        <div key={f.title} className="flex flex-col gap-1 p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0]">
                            <span className="text-xl">{f.icon}</span>
                            <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{f.title}</p>
                            <p className="text-xs text-[#64748B]">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-background/50">

            {/* Page Header — full-width, dark treatment */}
            <header className="px-6 py-4 border-b bg-white dark:bg-[#0A0E1A] dark:border-[#2D3148] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <span className="text-white font-mono font-bold text-lg leading-none">✦</span>
                    </div>
                    <div>
                        <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                            Application Copilot
                            <span className="ml-2 text-sm font-semibold text-[#818CF8] align-middle">✦ AI</span>
                        </h1>
                        <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                            JOB {selectedIndex + 1} OF {queue.length} • {currentJob.status.toUpperCase()} QUEUE
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-slate-500 mr-2">
                        {queue.length - 1 - selectedIndex} remaining
                    </div>
                    <Button variant="outline" size="sm" onClick={handlePrevious} disabled={selectedIndex === 0}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNext} disabled={selectedIndex === queue.length - 1}>
                        Next <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                </div>
            </header>

            {/* Main Content - Split View */}
            <div className="flex-1 overflow-hidden p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1600px] mx-auto w-full">

                {/* LEFT: Job Description Card */}
                <Card className="flex flex-col overflow-hidden h-full shadow-md border-slate-200 dark:border-slate-800 transition-all hover:shadow-lg">
                    <CardHeader className="pb-3 bg-white dark:bg-slate-950 shrink-0">
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                                <Badge variant="outline" className="mb-2 bg-slate-50 dark:bg-slate-900">{currentJob.status}</Badge>
                                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                    {currentJob.position}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-base">
                                    <Building2 className="h-4 w-4" />
                                    {currentJob.company}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={`flex flex-col items-center justify-center h-16 w-16 rounded-full border-4 ${displayScore >= 80 ? 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'} `}>
                                    <span className="text-xl font-bold">{displayScore}</span>
                                    <span className="text-[9px] font-bold uppercase">Match</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 mt-3 pt-3 border-t">
                            {currentJob.location && (
                                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                    <Briefcase className="h-3.5 w-3.5" /> {currentJob.location}
                                </span>
                            )}
                            {currentJob.jobUrl && (
                                <a href={currentJob.jobUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors">
                                    Original Posting <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            )}
                            <span className="flex items-center gap-1.5 px-2 py-1">
                                Posted: {currentJob.datePosted ? new Date(currentJob.datePosted).toLocaleDateString() : 'Unknown'}
                            </span>
                        </div>
                    </CardHeader>

                    <Separator />

                    <ScrollArea className="flex-1 bg-white dark:bg-slate-950">
                        <div className="p-6">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-slate-400" />
                                Job Description
                            </h3>
                            <div className="prose prose-slate prose-sm max-w-none dark:prose-invert">
                                <p className="whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
                                    {currentJob.description || "No full description available for this job."}
                                </p>
                            </div>
                        </div>
                    </ScrollArea>
                </Card>

                {/* RIGHT: Resume & Actions */}
                <div className="flex flex-col gap-4 h-full overflow-hidden">

                    {/* Resume Card */}
                    <Card className="flex-1 flex flex-col overflow-hidden border-2 border-indigo-100 dark:border-indigo-900 shadow-sm relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

                        <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 pb-3 shrink-0 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-indigo-600" />
                                <CardTitle className="text-base text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                                    {tailoredResume ? (
                                        <>
                                            Tailored Resume <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                                        </>
                                    ) : "Master Profile Preview"}
                                </CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-8 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100" onClick={handleRegenerate} disabled={isRegenerating}>
                                    {isRegenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                                    {isRegenerating ? 'Optimizing...' : 'Regenerate'}
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 bg-white/50 border-indigo-200" onClick={handlePrint}>
                                    <Printer className="h-3.5 w-3.5 mr-1" />
                                    PDF
                                </Button>
                            </div>
                        </CardHeader>

                        {/* Explanation Banner if tailored */}
                        {explanation && (
                            <div className="bg-green-50 dark:bg-green-950/30 px-4 py-2 text-xs text-green-700 dark:text-green-300 border-b border-green-100 dark:border-green-900/50 flex items-start gap-2">
                                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <p><strong>AI Insight:</strong> {explanation}</p>
                            </div>
                        )}

                        <div className="flex-1 bg-slate-100/50 dark:bg-slate-950/50 overflow-hidden relative">
                            <div className="absolute inset-0 overflow-y-auto p-4 flex justify-center">
                                <div className="w-full max-w-[8.5in] bg-white dark:bg-white shadow-sm min-h-full origin-top scale-[0.65] sm:scale-[0.85] lg:scale-100 transition-transform">
                                    <ResumePreview data={resumeToShow!} />
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs text-center text-indigo-600/70 border-t border-indigo-100 italic shrink-0">
                            {tailoredResume
                                ? "Displaying AI-Optimized Resume tailored for this specific job."
                                : "Displaying Master Profile. Click 'Regenerate' to tailor it with AI."}
                        </div>
                    </Card>

                    {/* Action Bar */}
                    <Card className="shrink-0 p-4 bg-white dark:bg-slate-900 shadow-lg border-t-0 lg:border-t rounded-t-none lg:rounded-xl z-10">
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 group transition-all"
                                onClick={handleReject}
                            >
                                <XCircle className="mr-2 h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                                Skip Job
                            </Button>
                            <Button
                                size="lg"
                                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:translate-y-[-2px] transition-all"
                                onClick={handleApprove}
                            >
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Approve & Apply
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Print Portal - Renders outside the main layout for clean printing */}
            {createPortal(
                <div id="resume-print-portal" className="hidden print:block fixed inset-0 bg-white z-[9999]">
                    <ResumePreview data={resumeToShow!} />
                </div>,
                document.body
            )}
        </div>
    );
}
