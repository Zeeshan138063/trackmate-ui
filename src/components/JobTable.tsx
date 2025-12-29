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
import { Star, StarHalf, Trash2, Edit, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Job } from "@/types/job";
import { ColumnOption } from "@/components/ColumnsDropdown";

export type SortDirection = 'asc' | 'desc';
export interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface JobTableProps {
  jobs: Job[];
  selectedJobs: string[];
  onSelectJob: (jobId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob?: (jobId: string) => void;
  onEditJob?: (job: Job) => void;
  visibleColumns: ColumnOption[];
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
}

export function JobTable({
  jobs,
  selectedJobs,
  onSelectJob,
  onSelectAll,
  onUpdateJob,
  onDeleteJob,
  onEditJob,
  visibleColumns,
  sortConfig,
  onSort
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

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const SortableHead = ({ id, label, className }: { id: string, label: string, className?: string }) => {
    if (!onSort) return <TableHead className={className}>{label}</TableHead>;

    return (
      <TableHead
        className={`${className} cursor-pointer hover:bg-muted/50 transition-colors group select-none`}
        onClick={() => onSort(id)}
      >
        <div className="flex items-center">
          {label}
          <SortIcon columnKey={id} />
        </div>
      </TableHead>
    );
  };

  return (
    <div className="rounded-lg bg-card border h-[600px] overflow-auto relative">
      <Table>
        <TableHeader className="sticky top-0 z-50 bg-card shadow-sm">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 bg-card">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                className={isIndeterminate ? "data-[state=indeterminate]:bg-primary" : ""}
              />
            </TableHead>
            <SortableHead id="position" label="Job Position" className="bg-card" />
            <SortableHead id="company" label="Company" className="bg-card" />
            {isColumnVisible('minSalary') && <SortableHead id="minSalary" label="Min. Salary" className="bg-card" />}
            {isColumnVisible('maxSalary') && <SortableHead id="maxSalary" label="Max. Salary" className="bg-card" />}
            {isColumnVisible('location') && <SortableHead id="location" label="Location" className="bg-card" />}
            {isColumnVisible('status') && <SortableHead id="status" label="Status" className="bg-card" />}
            {isColumnVisible('datePosted') && <SortableHead id="datePosted" label="Date Posted" className="bg-card" />}
            {isColumnVisible('dateSaved') && <SortableHead id="dateSaved" label="Date Saved" className="bg-card" />}
            {isColumnVisible('deadline') && <SortableHead id="deadline" label="Deadline" className="bg-card" />}
            {isColumnVisible('dateApplied') && <SortableHead id="dateApplied" label="Date Applied" className="bg-card" />}
            {isColumnVisible('followUp') && <SortableHead id="followUp" label="Follow up" className="bg-card" />}
            {isColumnVisible('excitement') && <SortableHead id="excitement" label="Excitement" className="bg-card" />}
            {isColumnVisible('source') && <SortableHead id="source" label="Source" className="bg-card" />}
            {(onEditJob || onDeleteJob) && <TableHead className="w-24 bg-card sticky right-0 z-10 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">Actions</TableHead>}
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
              <TableCell className="font-medium">
                {job.jobUrl ? (
                  <a
                    href={job.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {job.position}
                  </a>
                ) : (
                  job.position
                )}
              </TableCell>
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
              {isColumnVisible('source') && (
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 text-xs font-normal">
                    {job.source || 'Manual'}
                  </Badge>
                </TableCell>
              )}
              {(onEditJob || onDeleteJob) && (
                <TableCell className="bg-card sticky right-0 z-10 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)] dark:shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.3)]">
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
