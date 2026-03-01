import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { JobService } from "@/services/JobService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, MapPin, Building, Clock, ExternalLink, ArrowLeft, CheckCircle2, Calendar, Share2, Linkedin, Twitter, Link2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useJobs } from "@/hooks/useJobs";
import { toast } from "sonner";

export default function JobDetails() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { addJob } = useJobs();
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (jobId) {
            fetchDetails(jobId);
        }
    }, [jobId]);

    const fetchDetails = async (id: string) => {
        setLoading(true);
        try {
            const data = await JobService.getJobDetails(id);
            if (!data) {
                // Handle not found
            }
            setJob(data);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (job?.job_url) {
            window.open(job.job_url, '_blank');
        }
    };

    const handleSaveToTracker = async () => {
        if (!user) {
            toast.error("Please sign in to save jobs.");
            navigate(`/auth?redirect=/job-view/${jobId}`);
            return;
        }

        try {
            await addJob({
                position: job.title,
                company: job.company,
                location: job.location,
                jobUrl: job.job_url,
                datePosted: job.posted_at,
                description: job.description,
                status: 'Bookmarked',
                excitement: 3,
                dateSaved: new Date().toISOString(),
                source: 'auto'
            } as any);

            setIsSaved(true);
            toast.success("Job saved to your tracker!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to save job.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex text-center items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Job Not Found</h1>
                <Button onClick={() => navigate('/jobs')}>Back to Discovery</Button>
            </div>
        );
    }

    // JSON-LD JobPosting schema for GEO
    const jobPostingSchema = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": job.title,
        "description": job.description || `Apply for ${job.title} at ${job.company} in ${job.location}. Full job details and application tracking available on JobOS.`,
        "datePosted": job.posted_at,
        "validThrough": new Date(new Date(job.posted_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days fallback
        "employmentType": "FULL_TIME",
        "hiringOrganization": {
            "@type": "Organization",
            "name": job.company,
            "sameAs": `https://www.google.com/search?q=${encodeURIComponent(job.company)}`
        },
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": job.location,
                "addressRegion": "",
                "postalCode": "",
                "addressCountry": "Global"
            }
        },
        "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": {
                "@type": "QuantitativeValue",
                "value": 0,
                "unitText": "YEAR"
            }
        },
        "url": window.location.href
    };

    const handleShare = (platform: 'linkedin' | 'twitter' | 'copy') => {
        const url = window.location.href;
        const text = `Check out this ${job?.title} position at ${job?.company} on JobOS!`;

        if (platform === 'linkedin') {
            const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            window.open(shareUrl, '_blank', 'width=600,height=600');
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        } else if (platform === 'copy') {
            navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard!");
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <script type="application/ld+json">
                {JSON.stringify(jobPostingSchema)}
            </script>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>

                <div className="border rounded-xl p-8 shadow-sm bg-white">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 leading-tight">{job.title}</h1>
                            <div className="flex items-center gap-2 mt-2 text-lg text-slate-700 font-medium">
                                <Building className="h-5 w-5 text-slate-400" />
                                {job.company}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <div className="flex gap-3">
                                {isSaved ? (
                                    <>
                                        <Button variant="outline" className="flex-1 md:flex-none" onClick={() => navigate('/meeting-hub')}>
                                            <Calendar className="h-4 w-4 mr-2" /> Schedule Interview
                                        </Button>
                                        <Button disabled variant="outline" className="flex-1 md:flex-none">
                                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Saved
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={handleSaveToTracker} variant="outline" className="flex-1 md:flex-none">
                                        Save to Tracker
                                    </Button>
                                )}
                                <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700 flex-1 md:flex-none">
                                    Apply on LinkedIn <ExternalLink className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-end gap-2 text-muted-foreground mt-2">
                                <span className="text-xs font-medium mr-2">Share:</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-[#0077b5]" onClick={() => handleShare('linkedin')}>
                                    <Linkedin className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-[#1da1f2]" onClick={() => handleShare('twitter')}>
                                    <Twitter className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleShare('copy')}>
                                    <Link2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                            <Clock className="h-3 w-3" />
                            Posted {new Date(job.posted_at).toLocaleDateString()}
                        </div>
                        <Badge variant="secondary" className="font-normal text-slate-600">
                            {job.source}
                        </Badge>
                    </div>

                    <Separator className="my-8" />

                    <div className="prose max-w-none text-slate-800">
                        <h3 className="text-xl font-semibold mb-4">About the Job</h3>
                        {/* We likely won't have full description from simple search page crawl unless we fetched detailed page.
                            So we show what we have, or a note. */}
                        {job.description ? (
                            <p className="whitespace-pre-wrap leading-relaxed">{job.description}</p>
                        ) : (
                            <div className="p-6 bg-slate-50 rounded-lg text-center text-muted-foreground">
                                <p>Full description available on LinkedIn.</p>
                                <Button variant="link" onClick={handleApply}>View full details</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
