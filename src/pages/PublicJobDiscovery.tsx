import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { JobService } from "@/services/JobService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Building, Clock, ArrowRight, Search, Briefcase } from "lucide-react";
import { Header } from "@/components/Header";

// Helper to format "time ago"
const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

export default function PublicJobDiscovery() {
    const { keyword } = useParams();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(keyword || "");

    useEffect(() => {
        if (keyword) {
            setSearchTerm(keyword);
            fetchJobs(keyword);
        } else {
            setLoading(false);
        }
    }, [keyword]);

    const fetchJobs = async (term: string) => {
        setLoading(true);
        try {
            const data = await JobService.getDiscoveredJobs(term);
            setJobs(data);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/jobs/${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <Briefcase className="h-6 w-6 text-indigo-600" />
                        <span className="font-bold text-xl tracking-tight text-slate-900 hidden md:block">TrackMate Jobs</span>
                    </div>

                    <form onSubmit={handleSearch} className="flex-1 max-w-lg relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search keywords (e.g. Remote Python)"
                            className="pl-9 bg-slate-100 border-none focus-visible:ring-indigo-500"
                        />
                    </form>

                    <Button variant="ghost" onClick={() => navigate('/auth')}>
                        Sign In
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {!keyword ? (
                    <div className="text-center py-20">
                        <h1 className="text-4xl font-bold text-slate-900 mb-4">Discover Your Next Role</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Search for the latest jobs from LinkedIn, aggregated and updated every hour.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-slate-800">
                                {jobs.length} New {keyword} Jobs
                            </h1>
                            <Badge variant="outline" className="px-3 py-1">
                                Last 24 Hours
                            </Badge>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-lg border border-dashed">
                                <p className="text-muted-foreground">No jobs found for this keyword yet.</p>
                                <p className="text-sm text-slate-400 mt-2">Try checking back later or refine your search.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobs.map((job) => (
                                    <Card key={job.id} className="hover:shadow-md transition-shadow group cursor-pointer" onClick={() => navigate(`/job-view/${job.id}`)}>
                                        <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-indigo-600 group-hover:underline">
                                                    {job.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-slate-700 font-medium mt-1">
                                                    <Building className="h-4 w-4 text-slate-400" />
                                                    {job.company}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {job.location}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTimeAgo(job.posted_at)}
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs font-normal bg-slate-100">
                                                        {job.source === 'linkedin_auto' ? 'LinkedIn' : 'Other'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button className="shrink-0 group-hover:translate-x-1 transition-transform" variant="outline">
                                                View Details <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
