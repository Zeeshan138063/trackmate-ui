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
import { Plus, X } from "lucide-react";
import { Job } from "@/types/job";

interface AddJobDialogProps {
  onAddJob: (job: Omit<Job, "id">) => void;
}

export function AddJobDialog({ onAddJob }: AddJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    position: "",
    url: "",
    company: "",
    location: "",
    description: "",
  });
  const [showExtensionBanner, setShowExtensionBanner] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newJob: Omit<Job, "id"> = {
      position: formData.position,
      url: formData.url || undefined,
      company: formData.company,
      location: formData.location || undefined,
      description: formData.description || undefined,
      status: "Bookmarked",
      dateSaved: new Date().toISOString().split('T')[0],
      excitement: 3,
    };

    onAddJob(newJob);
    setOpen(false);
    setFormData({
      position: "",
      url: "",
      company: "",
      location: "",
      description: "",
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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
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
          <div className="space-y-2">
            <Label htmlFor="position">Job Title</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Job Title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL for Original Posting</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="URL for Original Posting"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Company Name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Location"
            />
          </div>

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