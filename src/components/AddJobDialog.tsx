import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, X } from "lucide-react";
import { Job } from "@/types/job";

interface AddJobDialogProps {
  onAddJob: (job: Omit<Job, "id">) => void;
}

export function AddJobDialog({ onAddJob }: AddJobDialogProps) {
  const [open, setOpen] = useState(false);
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
    excitement: 3,
  });
  const [showExtensionBanner, setShowExtensionBanner] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newJob: Omit<Job, "id"> = {
      position: formData.position,
      jobUrl: formData.jobUrl || undefined,
      company: formData.company,
      location: formData.location || undefined,
      description: formData.description || undefined,
      minSalary: formData.minSalary ? parseInt(formData.minSalary) : undefined,
      maxSalary: formData.maxSalary ? parseInt(formData.maxSalary) : undefined,
      status: formData.status,
      datePosted: formData.datePosted || undefined,
      dateSaved: new Date().toISOString().split('T')[0],
      deadline: formData.deadline || undefined,
      dateApplied: formData.status === "Applied" ? new Date().toISOString().split('T')[0] : undefined,
      excitement: formData.excitement,
    };

    onAddJob(newJob);
    setOpen(false);
    setFormData({
      position: "",
      jobUrl: "",
      company: "",
      location: "",
      description: "",
      minSalary: "",
      maxSalary: "",
      status: "Bookmarked",
      datePosted: "",
      deadline: "",
      excitement: 3,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add a New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a New Job Post</DialogTitle>
        </DialogHeader>
        
        {showExtensionBanner && (
          <div className="bg-muted border rounded-lg p-3 mb-4 relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0"
              onClick={() => setShowExtensionBanner(false)}
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="flex items-center justify-between pr-6">
              <span className="text-sm text-muted-foreground">
                Add jobs in one click with the Teal Extension
              </span>
              <Button variant="default" size="sm" className="bg-primary">
                Learn More
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Job Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Job Title *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Job Title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company Name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobUrl">URL for Original Posting</Label>
            <Input
              id="jobUrl"
              type="url"
              value={formData.jobUrl}
              onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
              placeholder="URL for Original Posting"
            />
          </div>

          {/* Salary Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minSalary">Min Salary</Label>
              <Input
                id="minSalary"
                type="number"
                value={formData.minSalary}
                onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                placeholder="e.g. 60000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSalary">Max Salary</Label>
              <Input
                id="maxSalary"
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Remote, San Francisco"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
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
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="datePosted">Date Posted</Label>
              <Input
                id="datePosted"
                type="date"
                value={formData.datePosted}
                onChange={(e) => setFormData({ ...formData, datePosted: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Application Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          {/* Excitement Level */}
          <div className="space-y-2">
            <Label htmlFor="excitement">Excitement Level (1-5 stars)</Label>
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
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Job Description"
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Job</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}