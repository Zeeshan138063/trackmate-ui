import { useState } from "react";
import { StatusCard } from "@/components/StatusCard";
import { JobTable } from "@/components/JobTable";
import { AddJobDialog } from "@/components/AddJobDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Columns, Menu } from "lucide-react";
import { Job, JobStats } from "@/types/job";

// Sample data
const initialJobs: Job[] = [
  {
    id: "1",
    position: "Python Engineer",
    company: "",
    status: "Interviewing",
    dateSaved: "12/20/2024",
    dateApplied: "12/20/2024",
    excitement: 0,
  },
  {
    id: "2",
    position: "Operations Manager - Sample Job",
    company: "Acme Corp",
    location: "remote",
    status: "Bookmarked",
    dateSaved: "01/19/2024",
    dateApplied: "01/19/2024",
    followUp: "01/22/2024",
    excitement: 3,
  },
  {
    id: "3",
    position: "Marketing Manager - Sample Job",
    company: "Acme Corp",
    location: "Anywhere, USA",
    status: "Bookmarked",
    dateSaved: "01/19/2024",
    dateApplied: "01/19/2024",
    followUp: "01/22/2024",
    excitement: 3,
  },
  {
    id: "4",
    position: "Product Designer - Sample Job",
    company: "Acme Corp",
    location: "Anywhere, USA",
    status: "Bookmarked",
    dateSaved: "01/19/2024",
    dateApplied: "01/19/2024",
    followUp: "01/22/2024",
    excitement: 3,
  },
];

export default function Trackers() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

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

  const handleAddJob = (newJob: Omit<Job, "id">) => {
    const job: Job = {
      ...newJob,
      id: Date.now().toString(),
    };
    setJobs([job, ...jobs]);
  };

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

  const handleUpdateJob = (updatedJob: Job) => {
    setJobs(prev => prev.map(job => 
      job.id === updatedJob.id ? updatedJob : job
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatusCard title="BOOKMARKED" count={stats.bookmarked} />
        <StatusCard title="APPLYING" count="--" />
        <StatusCard title="APPLIED" count="--" />
        <StatusCard title="INTERVIEWING" count={stats.interviewing} variant="primary" />
        <StatusCard title="NEGOTIATING" count="--" />
        <StatusCard title="ACCEPTED" count="--" />
      </div>

      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {selectedJobs.length} selected
          </span>
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
          <Button variant="outline" size="sm">
            <Columns className="h-4 w-4 mr-2" />
            Columns
          </Button>
          <Button variant="outline" size="sm">
            <Menu className="h-4 w-4 mr-2" />
            Menu
          </Button>
          <AddJobDialog onAddJob={handleAddJob} />
        </div>
      </div>

      {/* Job Table */}
      <JobTable
        jobs={jobs}
        selectedJobs={selectedJobs}
        onSelectJob={handleSelectJob}
        onSelectAll={handleSelectAll}
        onUpdateJob={handleUpdateJob}
      />
    </div>
  );
}