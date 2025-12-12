
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { StatusCard } from "@/components/StatusCard";
import { JobTable } from "@/components/JobTable";
import { AddJobDialog } from "@/components/AddJobDialog";
import { EditJobDialog } from "@/components/EditJobDialog";
import { ColumnsDropdown, ColumnOption } from "@/components/ColumnsDropdown";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Menu, Archive, Download, FileText, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { JobStats, Job } from "@/types/job";

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

  const handleDeleteSelected = async () => {
    for (const jobId of selectedJobs) {
      await deleteJob(jobId);
    }
    setSelectedJobs([]);
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
        const fetchFullData = () => {
          // Request data from extension via postMessage (bridge script handles it)
          window.postMessage({
            type: 'TRACKMATE_FETCH_JOB_DATA',
            dataId: dataId
          }, window.location.origin);

          // Listen for response
          const messageHandler = (event: MessageEvent) => {
            if (event.data.type === 'TRACKMATE_JOB_DATA_RESPONSE' && event.origin === window.location.origin) {
              window.removeEventListener('message', messageHandler);
              
              const fullData = event.data.data;
              const jobData: Partial<Job> = fullData ? {
                position: fullData.position || searchParams.get('position') || '',
                company: fullData.company || searchParams.get('company') || '',
                jobUrl: fullData.jobUrl || searchParams.get('jobUrl') || undefined,
                location: fullData.location || searchParams.get('location') || undefined,
                description: fullData.description || undefined,
                minSalary: fullData.minSalary || (searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!) : undefined),
                maxSalary: fullData.maxSalary || (searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : undefined),
                status: 'Bookmarked',
                excitement: 3,
              } : {
                position: searchParams.get('position') || '',
                company: searchParams.get('company') || '',
                jobUrl: searchParams.get('jobUrl') || undefined,
                location: searchParams.get('location') || undefined,
                minSalary: searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!) : undefined,
                maxSalary: searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : undefined,
                status: 'Bookmarked',
                excitement: 3,
              };

              // Validate required fields
              if (!jobData.position || !jobData.company) {
                toast.error('Invalid job data: missing required fields');
                setSearchParams({});
                return;
              }

              setExtensionJobData(jobData);
              setAddDialogOpen(true);
              setSearchParams({});
              toast.success(`Job data received from extension! Ready to add as ${user.email}`);
            }
          };

          window.addEventListener('message', messageHandler);
          
          // Timeout fallback to URL params only
          setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            const jobData: Partial<Job> = {
              position: searchParams.get('position') || '',
              company: searchParams.get('company') || '',
              jobUrl: searchParams.get('jobUrl') || undefined,
              location: searchParams.get('location') || undefined,
              minSalary: searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!) : undefined,
              maxSalary: searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : undefined,
              status: 'Bookmarked',
              excitement: 3,
            };

            if (jobData.position && jobData.company) {
              setExtensionJobData(jobData);
              setAddDialogOpen(true);
              setSearchParams({});
              toast.success(`Job data received from extension! Ready to add as ${user.email}`);
            }
          }, 2000);
        };

        fetchFullData();
      } else {
        // Fallback: use URL params only (for backwards compatibility)
        const jobData: Partial<Job> = {
          position: searchParams.get('position') || '',
          company: searchParams.get('company') || '',
          jobUrl: searchParams.get('jobUrl') || undefined,
          location: searchParams.get('location') || undefined,
          minSalary: searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!) : undefined,
          maxSalary: searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : undefined,
          status: 'Bookmarked',
          excitement: 3,
        };

        if (jobData.position && jobData.company) {
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
        <Header />
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
      <Header />
      <div className="p-6 space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatusCard title="BOOKMARKED" count={stats.bookmarked} />
          <StatusCard title="APPLYING" count={stats.applying} />
          <StatusCard title="APPLIED" count={stats.applied} />
          <StatusCard title="INTERVIEWING" count={stats.interviewing} variant="primary" />
          <StatusCard title="NEGOTIATING" count={stats.negotiating} />
          <StatusCard title="ACCEPTED" count={stats.accepted} />
        </div>

        {/* Table Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {selectedJobs.length} selected
            </span>
            {selectedJobs.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                Delete Selected
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-sm">Group by:</span>
              <Select defaultValue="none">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ColumnsDropdown 
              columns={visibleColumns}
              onToggleColumn={handleToggleColumn}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
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
          jobs={jobs}
          selectedJobs={selectedJobs}
          onSelectJob={handleSelectJob}
          onSelectAll={handleSelectAll}
          onUpdateJob={updateJob}
          onDeleteJob={deleteJob}
          onEditJob={handleEditJob}
          visibleColumns={visibleColumns}
        />

        {/* Edit Job Dialog */}
        <EditJobDialog
          job={editingJob}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdateJob={handleUpdateJob}
        />
      </div>
    </div>
  );
}
