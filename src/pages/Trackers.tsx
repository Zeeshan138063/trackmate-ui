
import { useState } from "react";
import { StatusCard } from "@/components/StatusCard";
import { JobTable } from "@/components/JobTable";
import { AddJobDialog } from "@/components/AddJobDialog";
import { ColumnsDropdown, ColumnOption } from "@/components/ColumnsDropdown";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Menu } from "lucide-react";
import { JobStats } from "@/types/job";
import { useJobs } from "@/hooks/useJobs";

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
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<ColumnOption[]>(defaultColumns);

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
            <Button variant="outline" size="sm">
              <Menu className="h-4 w-4 mr-2" />
              Menu
            </Button>
            <AddJobDialog onAddJob={addJob} />
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
          visibleColumns={visibleColumns}
        />
      </div>
    </div>
  );
}
