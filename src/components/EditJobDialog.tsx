import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Job } from "@/types/job";

interface EditJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateJob: (job: Job) => void;
}

export function EditJobDialog({ job, open, onOpenChange, onUpdateJob }: EditJobDialogProps) {
  const [formData, setFormData] = useState({
    position: "",
    jobUrl: "",
    company: "",
    location: "",
    description: "",
    minSalary: "",
    maxSalary: "",
    status: "Bookmarked" as Job["status"],
    datePosted: "",
    deadline: "",
    dateApplied: "",
    followUp: "",
    excitement: 3,
  });

  useEffect(() => {
    if (job) {
      setFormData({
        position: job.position,
        jobUrl: job.jobUrl || "",
        company: job.company,
        location: job.location || "",
        description: job.description || "",
        minSalary: job.minSalary?.toString() || "",
        maxSalary: job.maxSalary?.toString() || "",
        status: job.status,
        datePosted: job.datePosted || "",
        deadline: job.deadline || "",
        dateApplied: job.dateApplied || "",
        followUp: job.followUp || "",
        excitement: job.excitement,
      });
    }
  }, [job]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job) return;

    const updatedJob: Job = {
      ...job,
      position: formData.position,
      jobUrl: formData.jobUrl || undefined,
      company: formData.company,
      location: formData.location || undefined,
      description: formData.description || undefined,
      minSalary: formData.minSalary ? parseInt(formData.minSalary) : undefined,
      maxSalary: formData.maxSalary ? parseInt(formData.maxSalary) : undefined,
      status: formData.status,
      datePosted: formData.datePosted || undefined,
      deadline: formData.deadline || undefined,
      dateApplied: formData.dateApplied || undefined,
      followUp: formData.followUp || undefined,
      excitement: formData.excitement,
    };

    onUpdateJob(updatedJob);
    onOpenChange(false);
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job Application</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Job Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-position">Job Title *</Label>
              <Input
                id="edit-position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Job Title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company Name *</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company Name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-jobUrl">URL for Original Posting</Label>
            <Input
              id="edit-jobUrl"
              type="url"
              value={formData.jobUrl}
              onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
              placeholder="URL for Original Posting"
            />
          </div>

          {/* Salary Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-minSalary">Min Salary</Label>
              <Input
                id="edit-minSalary"
                type="number"
                value={formData.minSalary}
                onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                placeholder="e.g. 60000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-maxSalary">Max Salary</Label>
              <Input
                id="edit-maxSalary"
                type="number"
                value={formData.maxSalary}
                onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                placeholder="e.g. 75000"
              />
            </div>
          </div>

          {/* Location and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Remote, San Francisco"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Job["status"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bookmarked">Bookmarked</SelectItem>
                  <SelectItem value="Applying">Applying</SelectItem>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Interviewing">Interviewing</SelectItem>
                  <SelectItem value="Negotiating">Negotiating</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-datePosted">Date Posted</Label>
              <Input
                id="edit-datePosted"
                type="date"
                value={formData.datePosted}
                onChange={(e) => setFormData({ ...formData, datePosted: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Application Deadline</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dateApplied">Date Applied</Label>
              <Input
                id="edit-dateApplied"
                type="date"
                value={formData.dateApplied}
                onChange={(e) => setFormData({ ...formData, dateApplied: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-followUp">Follow Up Date</Label>
              <Input
                id="edit-followUp"
                type="date"
                value={formData.followUp}
                onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
              />
            </div>
          </div>

          {/* Excitement Level */}
          <div className="space-y-2">
            <Label htmlFor="edit-excitement">Excitement Level (1-5 stars)</Label>
            <Select value={formData.excitement.toString()} onValueChange={(value) => setFormData({ ...formData, excitement: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">⭐ 1 Star</SelectItem>
                <SelectItem value="2">⭐⭐ 2 Stars</SelectItem>
                <SelectItem value="3">⭐⭐⭐ 3 Stars</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ 4 Stars</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Job Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Job Description"
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Job</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}