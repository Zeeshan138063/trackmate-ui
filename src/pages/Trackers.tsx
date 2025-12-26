
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Menu, Archive, Download, FileText, HelpCircle, ArrowRight, Sparkles, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusCard } from "@/components/StatusCard";
import { JobTable } from "@/components/JobTable";
import { AddJobDialog } from "@/components/AddJobDialog";
import { EditJobDialog } from "@/components/EditJobDialog";
import { ColumnsDropdown, ColumnOption } from "@/components/ColumnsDropdown";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { JobStats, Job } from "@/types/job";
import { DailyStats } from "@/components/DailyStats";

const defaultColumns: ColumnOption[] = [
  { id: "minSalary", label: "Min. Salary", checked: false },
  { id: "maxSalary", label: "Max. Salary", checked: true },
  { id: "location", label: "Location", checked: true },
  { id: "status", label: "Status", checked: true },
  { id: "datePosted", label: "Date Posted", checked: false },
  { id: "dateSaved", label: "Date Saved", checked: true },
  { id: "deadline", label: "Deadline", checked: true },
  { id: "dateApplied", label: "Date Applied", checked: true },
  { id: "followUp", label: "Follow up", checked: true },
  { id: "excitement", label: "Excitement", checked: true },
  { id: "source", label: "Source", checked: true },
];

export default function Trackers() {
  const { jobs, loading, addJob, updateJob, deleteJob } = useJobs();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<ColumnOption[]>(defaultColumns);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [extensionJobData, setExtensionJobData] = useState<Partial<Job> | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | "bulk" | null>(null);

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.position.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      (job.location && job.location.toLowerCase().includes(query))
    );
  });

  const handleImport = async () => {
    if (!importUrl) return;

    if (!isAuthenticated) {
      toast.error("Please login to add jobs.");
      return;
    }

    // Basic heuristic to guess company/title or just default
    // In a real app we'd scrape this. For now, create a placeholder.
    const newJob: Omit<Job, "id"> = {
      position: "Imported Job (Pending Details)",
      company: "Unknown Company",
      jobUrl: importUrl,
      location: "Remote",
      status: "Bookmarked",
      dateSaved: new Date().toISOString(),
      excitement: 3
    };

    try {
      await addJob(newJob);
      toast.success("Job added to tracker! Please update details.");
      setImportUrl("");
    } catch (error) {
      toast.error("Failed to add job.");
      console.error(error);
    }
  };

  const calculateStats = (): JobStats => {
    return jobs.reduce(
      (acc, job) => {
        switch (job.status) {
          case "Bookmarked":
            acc.bookmarked++;
            break;
          case "Applying":
            acc.applying++;
            break;
          case "Applied":
            acc.applied++;
            break;
          case "Interviewing":
            acc.interviewing++;
            break;
          case "Negotiating":
            acc.negotiating++;
            break;
          case "Accepted":
            acc.accepted++;
            break;
        }
        return acc;
      },
      { bookmarked: 0, applying: 0, applied: 0, interviewing: 0, negotiating: 0, accepted: 0 }
    );
  };

  const calculateDailyStats = () => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

    return jobs.reduce(
      (acc, job) => {
        // Today Bookmarked: Compare local date of dateSaved with today
        const savedDate = new Date(job.dateSaved);
        if (savedDate.toLocaleDateString('en-CA') === todayStr) {
          acc.bookmarked++;
        }

        // Today Applied: Direct string comparison YYYY-MM-DD
        if (job.dateApplied === todayStr) {
          acc.applied++;
        }

        // Today Interview: Status is Interviewing AND FollowUp date is today
        if (job.status === "Interviewing" && job.followUp === todayStr) {
          acc.interviewing++;
        }

        return acc;
      },
      { bookmarked: 0, applied: 0, interviewing: 0 }
    );
  };

  const dailyStats = calculateDailyStats();
  const stats = calculateStats();

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedJobs(checked ? jobs.map(job => job.id) : []);
  };

  const confirmDelete = async () => {
    if (jobToDelete === "bulk") {
      for (const jobId of selectedJobs) {
        await deleteJob(jobId);
      }
      setSelectedJobs([]);
      toast.success("Selected jobs deleted successfully");
    } else if (jobToDelete) {
      await deleteJob(jobToDelete);
      toast.success("Job deleted successfully");
    }
    setDeleteConfirmationOpen(false);
    setJobToDelete(null);
  };

  const handleDeleteClick = (jobId: string) => {
    setJobToDelete(jobId);
    setDeleteConfirmationOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setJobToDelete("bulk");
    setDeleteConfirmationOpen(true);
  };

  const handleToggleColumn = (columnId: string) => {
    setVisibleColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, checked: !col.checked } : col
      )
    );
  };

  const handleQuickTour = () => {
    toast.info("Quick Tour feature coming soon!");
  };

  const handleArchivedJobs = () => {
    toast.info("Archived Jobs feature coming soon!");
  };

  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Job Title,Company,Location,Status,Date Applied,Deadline,Salary Min,Salary Max,Excitement\n" +
      jobs.map(job =>
        `"${job.position}","${job.company}","${job.location}","${job.status}","${job.dateApplied || 'N/A'}","${job.deadline || 'N/A'}","${job.minSalary || 'N/A'}","${job.maxSalary || 'N/A'}","${job.excitement}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "jobs_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Report exported successfully!");
  };

  const handleDownloadData = () => {
    const jsonData = JSON.stringify(jobs, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jobs_data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Data downloaded successfully!");
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setEditDialogOpen(true);
  };

  const handleUpdateJob = (updatedJob: Job) => {
    updateJob(updatedJob);
    setEditingJob(null);
  };

  const handleAutoSave = (updatedJob: Job) => {
    // Save to DB
    updateJob(updatedJob);
    // Keep local state in sync so dialog doesn't close or show stale data
    setEditingJob(updatedJob);
  };

  // Handle extension job data from URL parameters
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'addJob') {
      // Wait for auth to finish loading before processing
      if (authLoading) {
        // Auth is still loading, will retry when loading completes
        return;
      }

      // Since this page is protected by ProtectedRoute, if we reach here and auth is done loading,
      // the user should be authenticated. But double-check anyway.
      if (!isAuthenticated || !user) {
        console.warn('User not authenticated when processing extension data', { isAuthenticated, user, authLoading });
        toast.error('Please log in to TrackMate first, then use the extension to add jobs. Redirecting to login...', {
          duration: 4000
        });
        // Redirect to auth page with redirect back to trackers
        setTimeout(() => {
          const currentUrl = window.location.pathname + window.location.search;
          window.location.href = '/auth?redirect=' + encodeURIComponent(currentUrl);
        }, 2000);
        setSearchParams({});
        return;
      }

      // User is authenticated, proceed with processing extension data
      console.log('Processing extension job data for user:', user.email);

      const dataId = searchParams.get('dataId');

      // If we have a dataId, fetch full data from extension storage
      if (dataId) {
        // Send request immediately and then every 500ms
        const sendRequest = () => {
          window.postMessage({
            type: 'TRACKMATE_FETCH_JOB_DATA',
            dataId: dataId
          }, window.location.origin);
        };

        sendRequest();
        const retryInterval = setInterval(sendRequest, 500);

        // Define timeout ID variable so we can clear it
        let fallbackTimeoutId: NodeJS.Timeout;

        // Listen for response
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'TRACKMATE_JOB_DATA_RESPONSE' && event.origin === window.location.origin) {
            window.removeEventListener('message', messageHandler);
            clearInterval(retryInterval);
            clearTimeout(fallbackTimeoutId); // stop fallback from running

            const fullData = event.data.data;
            const jobData: Partial<Job> = fullData ? {
              position: fullData.position || searchParams.get('position') || '',
              company: fullData.company || searchParams.get('company') || '',
              jobUrl: fullData.jobUrl || searchParams.get('jobUrl') || undefined,
              location: fullData.location || searchParams.get('location') || undefined,
              description: fullData.description || undefined,
              minSalary: fullData.minSalary || (searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!) : undefined),
              maxSalary: fullData.maxSalary || (searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : undefined),
              datePosted: fullData.datePosted || searchParams.get('datePosted') || undefined,
              deadline: fullData.deadline || searchParams.get('deadline') || undefined,
              status: (fullData.status as Job["status"]) || 'Bookmarked',
              excitement: fullData.excitement ? Number(fullData.excitement) : 3,
            } : {
              position: searchParams.get('position') || '',
              company: searchParams.get('company') || '',
              jobUrl: searchParams.get('jobUrl') || undefined,
              location: searchParams.get('location') || undefined,
              minSalary: searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!) : undefined,
              maxSalary: searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : undefined,
              datePosted: searchParams.get('datePosted') || undefined,
              deadline: searchParams.get('deadline') || undefined,
              status: (searchParams.get('status') as Job["status"]) || 'Bookmarked',
              excitement: searchParams.get('excitement') ? parseInt(searchParams.get('excitement')!) : 3,
            };

            // Validate required fields - if missing, just warn but allow user to fill them
            if (!jobData.position || !jobData.company) {
              toast.warning('Some job details could not be extracted. Please fill them in.');
            }

            setExtensionJobData(jobData);
            setAddDialogOpen(true);
            setSearchParams({});
            toast.success(`Job data received from extension! Ready to add as ${user.email}`);
          }
        };

        window.addEventListener('message', messageHandler);

        // Timeout fallback to URL params only
        fallbackTimeoutId = setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          clearInterval(retryInterval);

          const jobData: Partial<Job> = {
            position: searchParams.get('position') || '',
            company: searchParams.get('company') || '',
            jobUrl: searchParams.get('jobUrl') || undefined,
            location: searchParams.get('location') || undefined,
            minSalary: searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!) : undefined,
            maxSalary: searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : undefined,
            status: (searchParams.get('status') as Job["status"]) || 'Bookmarked',
            excitement: searchParams.get('excitement') ? parseInt(searchParams.get('excitement')!) : 3,
            datePosted: searchParams.get('datePosted') || undefined,
            deadline: searchParams.get('deadline') || undefined,
          };

          if (jobData.position || jobData.company || jobData.jobUrl) {
            setExtensionJobData(jobData);
            setAddDialogOpen(true);
            setSearchParams({});
            toast.warning('Could not fetch full job details (description might be missing). Please fill manually.');
          }
        }, 5000); // Increased to 5s fallback

      } else {
        // Fallback: use URL params only (for backwards compatibility)
        const jobData: Partial<Job> = {
          position: searchParams.get('position') || '',
          company: searchParams.get('company') || '',
          jobUrl: searchParams.get('jobUrl') || undefined,
          location: searchParams.get('location') || undefined,
          minSalary: searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!) : undefined,
          maxSalary: searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : undefined,
          status: (searchParams.get('status') as Job["status"]) || 'Bookmarked',
          excitement: searchParams.get('excitement') ? parseInt(searchParams.get('excitement')!) : 3,
          datePosted: searchParams.get('datePosted') || undefined,
          deadline: searchParams.get('deadline') || undefined,
        };

        if (jobData.position || jobData.company || jobData.jobUrl) {
          if (!jobData.position || !jobData.company) {
            toast.warning('Some job details could not be extracted. Please fill them in.');
          }
          setExtensionJobData(jobData);
          setAddDialogOpen(true);
          setSearchParams({});
          toast.success(`Job data received from extension! Ready to add as ${user.email}`);
        }
      }
    }
  }, [searchParams, setSearchParams, isAuthenticated, user, authLoading]);

  const handleAddJobFromExtension = async (job: Omit<Job, "id">) => {
    if (!user) {
      toast.error('You must be logged in to add jobs');
      return;
    }

    // The addJob function from useJobs already includes user_id: user.id
    // This ensures the job is associated with the logged-in user
    await addJob(job);
    setExtensionJobData(null);
    setAddDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-6">
        {/* Premium Magic Input Section */}
        {/* Premium Magic Input Section (Hidden for now) */}
        {/* <div className="relative z-10 max-w-2xl mx-auto my-8 animate-in fade-in zoom-in-95 duration-500">
             
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur-lg transition duration-500 group-hover:opacity-40" />
            
            
            <div className="relative group bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/50 transition-all duration-300 hover:scale-[1.01] focus-within:scale-[1.01] focus-within:ring-2 focus-within:ring-indigo-500/20">
                <div className="flex items-center gap-2">
                    <div className="pl-3 flex items-center justify-center shrink-0">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex items-center justify-center shadow-sm">
                            <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                    
                    <Input
                        placeholder="Paste a job link to magically track it..."
                        value={importUrl}
                        onChange={e => setImportUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleImport()}
                        className="flex-1 border-none bg-transparent text-lg h-14 placeholder:text-slate-400 font-medium focus-visible:ring-0 shadow-none selection:bg-indigo-100"
                        autoFocus
                    />
                    
                    <Button 
                        size="icon" 
                        className="h-12 w-12 shrink-0 bg-slate-900 hover:bg-indigo-600 text-white shadow-lg rounded-xl transition-all duration-300 hover:rotate-[-5deg]"
                        onClick={handleImport}
                    >
                        {importUrl ? (
                            <ArrowRight className="h-6 w-6" />
                        ) : (
                            <PlusCircle className="h-6 w-6 opacity-50" />
                        )}
                    </Button>
                </div>
            </div>

            
            <div className="absolute -bottom-8 left-0 w-full text-center">
                <p className="text-[10px] font-semibold tracking-widest text-indigo-300 uppercase opacity-60">
                    Supports LinkedIn • Indeed • Glassdoor • YCombinator
                </p>
            </div>
        </div> */}

        {/* Daily Activity Stats */}
        <DailyStats stats={dailyStats} />

        {/* Status Overview */}
        <div>
          <h2 className="text-lg font-semibold mb-4">OVERALL STATUS</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatusCard title="BOOKMARKED" count={stats.bookmarked} />
            <StatusCard title="APPLYING" count={stats.applying} />
            <StatusCard title="APPLIED" count={stats.applied} />
            <StatusCard title="INTERVIEWING" count={stats.interviewing} variant="primary" />
            <StatusCard title="NEGOTIATING" count={stats.negotiating} />
            <StatusCard title="ACCEPTED" count={stats.accepted} />
          </div>
        </div>

        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {jobs.length} total • {filteredJobs.length} visible
            </span>
            {selectedJobs.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDeleteClick}>
                Delete Selected ({selectedJobs.length})
              </Button>
            )}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm whitespace-nowrap">Group by:</span>
              <Select defaultValue="none">
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ColumnsDropdown
              columns={visibleColumns}
              onToggleColumn={handleToggleColumn}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Menu className="h-4 w-4 mr-2" />
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleQuickTour}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Quick Tour
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchivedJobs}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archived Jobs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadData}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden md:block">
              <AddJobDialog
                onAddJob={addJob}
                initialData={extensionJobData}
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
              />
            </div>
          </div>
          {/* Mobile Add Button */}
          <div className="md:hidden w-full">
            <AddJobDialog
              onAddJob={addJob}
              initialData={extensionJobData}
              open={addDialogOpen}
              onOpenChange={setAddDialogOpen}
            />
          </div>
        </div>

        {/* Job Table */}
        <JobTable
          jobs={filteredJobs}
          selectedJobs={selectedJobs}
          onSelectJob={handleSelectJob}
          onSelectAll={handleSelectAll}
          onUpdateJob={updateJob}
          onDeleteJob={handleDeleteClick}
          onEditJob={handleEditJob}
          visibleColumns={visibleColumns}
        />

        {/* Edit Job Dialog */}
        <EditJobDialog
          job={editingJob}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdateJob={handleUpdateJob}
          onAutoSave={handleAutoSave}
        />

        <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {jobToDelete === "bulk"
                  ? `This action cannot be undone. This will permanently delete ${selectedJobs.length} selected jobs.`
                  : "This action cannot be undone. This will permanently delete this job."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
