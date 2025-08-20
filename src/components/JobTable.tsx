
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, StarHalf, Trash2, Edit } from "lucide-react";
import { Job } from "@/types/job";
import { ColumnOption } from "@/components/ColumnsDropdown";

interface JobTableProps {
  jobs: Job[];
  selectedJobs: string[];
  onSelectJob: (jobId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob?: (jobId: string) => void;
  onEditJob?: (job: Job) => void;
  visibleColumns: ColumnOption[];
}

export function JobTable({ 
  jobs, 
  selectedJobs, 
  onSelectJob, 
  onSelectAll,
  onUpdateJob,
  onDeleteJob,
  onEditJob,
  visibleColumns
}: JobTableProps) {
  const isAllSelected = jobs.length > 0 && selectedJobs.length === jobs.length;
  const isIndeterminate = selectedJobs.length > 0 && selectedJobs.length < jobs.length;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Bookmarked": "outline",
      "Applying": "secondary",
      "Applied": "default",
      "Interviewing": "default",
      "Negotiating": "secondary",
      "Accepted": "default",
      "Rejected": "destructive"
    };

    return (
      <Badge variant={variants[status] || "outline"} className="whitespace-nowrap">
        {status}
      </Badge>
    );
  };

  const handleStarClick = (job: Job, newRating: number) => {
    onUpdateJob({ ...job, excitement: newRating });
  };

  const renderStars = (job: Job) => {
    const rating = job.excitement;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={i}
          className="h-4 w-4 fill-warning text-warning cursor-pointer"
          onClick={() => handleStarClick(job, i + 1)}
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf
          key="half"
          className="h-4 w-4 fill-warning text-warning cursor-pointer"
          onClick={() => handleStarClick(job, fullStars + 1)}
        />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-warning"
          onClick={() => handleStarClick(job, fullStars + i + 1 + (hasHalfStar ? 1 : 0))}
        />
      );
    }

    return <div className="flex">{stars}</div>;
  };

  const isColumnVisible = (columnId: string) => {
    const column = visibleColumns.find(col => col.id === columnId);
    return column ? column.checked : true;
  };

  return (
    <div className="border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                className={isIndeterminate ? "data-[state=indeterminate]:bg-primary" : ""}
              />
            </TableHead>
            <TableHead>Job Position</TableHead>
            <TableHead>Company</TableHead>
            {isColumnVisible('minSalary') && <TableHead>Min. Salary</TableHead>}
            {isColumnVisible('maxSalary') && <TableHead>Max. Salary</TableHead>}
            {isColumnVisible('location') && <TableHead>Location</TableHead>}
            {isColumnVisible('status') && <TableHead>Status</TableHead>}
            {isColumnVisible('datePosted') && <TableHead>Date Posted</TableHead>}
            {isColumnVisible('dateSaved') && <TableHead>Date Saved</TableHead>}
            {isColumnVisible('deadline') && <TableHead>Deadline</TableHead>}
            {isColumnVisible('dateApplied') && <TableHead>Date Applied</TableHead>}
            {isColumnVisible('followUp') && <TableHead>Follow up</TableHead>}
            {isColumnVisible('excitement') && <TableHead>Excitement</TableHead>}
            {(onEditJob || onDeleteJob) && <TableHead className="w-24">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className="hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  checked={selectedJobs.includes(job.id)}
                  onCheckedChange={() => onSelectJob(job.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{job.position}</TableCell>
              <TableCell>{job.company}</TableCell>
              {isColumnVisible('minSalary') && (
                <TableCell>
                  {job.minSalary ? `$${job.minSalary.toLocaleString()}` : "$0.00"}
                </TableCell>
              )}
              {isColumnVisible('maxSalary') && (
                <TableCell>
                  {job.maxSalary ? `$${job.maxSalary.toLocaleString()}` : "$0.00"}
                </TableCell>
              )}
              {isColumnVisible('location') && <TableCell>{job.location || "Add location"}</TableCell>}
              {isColumnVisible('status') && <TableCell>{getStatusBadge(job.status)}</TableCell>}
              {isColumnVisible('datePosted') && <TableCell>{job.datePosted || "N/A"}</TableCell>}
              {isColumnVisible('dateSaved') && <TableCell>{job.dateSaved}</TableCell>}
              {isColumnVisible('deadline') && <TableCell>{job.deadline || "N/A"}</TableCell>}
              {isColumnVisible('dateApplied') && <TableCell>{job.dateApplied || "N/A"}</TableCell>}
              {isColumnVisible('followUp') && <TableCell>{job.followUp || "Add date"}</TableCell>}
              {isColumnVisible('excitement') && <TableCell>{renderStars(job)}</TableCell>}
              {(onEditJob || onDeleteJob) && (
                <TableCell>
                  <div className="flex gap-1">
                    {onEditJob && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditJob(job)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeleteJob && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteJob(job.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
