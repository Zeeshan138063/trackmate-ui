import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Button
} from "@/components/ui/button";
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

import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { AIHelper, AIMatchResult } from "@/utils/ai-helper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { JobChecklist } from "@/components/JobChecklist";
import { JobChecklist as JobChecklistType } from "@/types/job";
import { useContacts } from "@/hooks/useContacts";
import { ContactCard } from "@/components/ContactCard";
import { AddContactDialog } from "@/components/AddContactDialog";
import { Contact, JobContact } from "@/types/contact";
import { Users, Plus, Link as LinkIcon, X, Printer, Loader2, Edit, Mail } from "lucide-react";
import { useResume } from "@/hooks/useResume";
import { ResumeAIHelper as ResumeAI } from "@/utils/resume-ai-helper";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { MasterProfileEditor } from "./resume/MasterProfileEditor";
import { MasterProfile } from "@/types/resume";
import { s3Helper } from "@/utils/s3-helper";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { extractTextFromPDF } from "@/utils/pdf-helper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EditJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateJob: (job: Job) => void;
  onAutoSave?: (job: Job) => void;
}


export function EditJobDialog({ job, open, onOpenChange, onUpdateJob, onAutoSave }: EditJobDialogProps) {
  const [activeTab, setActiveTab] = useState("details");

  // Resume Source State
  const [resumeSource, setResumeSource] = useState<'master' | 'tailored' | 'upload'>('master');
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedFileText, setUploadedFileText] = useState<string>("");

  const [prevJobId, setPrevJobId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<AIMatchResult | null>(null);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [isConvertingEmail, setIsConvertingEmail] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  // Resume Tailoring State
  const { masterProfile } = useResume();
  const [tailoredResume, setTailoredResume] = useState<MasterProfile | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isEditingResume, setIsEditingResume] = useState(false);

  // Contacts state
  const {
    contacts: allContacts,
    fetchJobContacts,
    linkContactToJob,
    removeContactFromJob,
    addContact,
    updateContact
  } = useContacts();
  const [jobContacts, setJobContacts] = useState<JobContact[]>([]);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

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
    checklist: {} as JobChecklistType,
    notes: "",
  });

  useEffect(() => {
    if (job && job.id !== prevJobId) {
      // Only reset form data when opening a new job
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
        checklist: job.checklist || {},
        notes: job.notes || "",
      });

      setMatchResult(null);
      setCoverLetter("");

      setMatchResult(null);
      setCoverLetter("");

      // Load attached resume (S3 or Local)
      const loadAttachedResume = async () => {
        if (job.resumeS3Key) {
          try {
            const resumeData = await s3Helper.getResume(job.resumeS3Key);
            setTailoredResume(resumeData);
            return;
          } catch (e) {
            console.error("Failed to load resume from S3", e);
            // Fallthrough to check attachedResume as backup
          }
        }

        if (job.attachedResume) {
          try {
            setTailoredResume(JSON.parse(job.attachedResume));
          } catch (e) {
            console.error("Failed to parse attached resume", e);
            setTailoredResume(null);
          }
        } else {
          setTailoredResume(null);
        }
      };

      loadAttachedResume();

      setActiveTab("details");
      setPrevJobId(job.id);

      // Fetch contacts for this job
      fetchJobContacts(job.id).then(setJobContacts);
    }
  }, [job?.id, prevJobId, fetchJobContacts]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Debounced auto-save for notes
  useEffect(() => {
    // Skip initial render or if notes haven't changed from original DB value
    const currentNotes = formData.notes || "";
    const originalNotes = job?.notes || "";

    if (!job || currentNotes === originalNotes) {
      if (currentNotes === originalNotes) setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');

    const timeoutId = setTimeout(() => {
      if (onAutoSave) {
        const updatedJob: Job = {
          ...job,
          position: formData.position,
          company: formData.company,
          jobUrl: formData.jobUrl || undefined,
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
          checklist: formData.checklist,
          notes: formData.notes,
          attachedResume: job.attachedResume // Persist existing attached resume
        };
        onAutoSave(updatedJob);
        setSaveStatus('saved');
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData.notes, onAutoSave, job]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setFormData(prev => ({ ...prev, notes: newNotes }));
  };

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
      checklist: formData.checklist,
      notes: formData.notes,
      attachedResume: job.attachedResume // Persist existing attached resume
    };

    onUpdateJob(updatedJob);
    onOpenChange(false);
  };

  // Update status UI
  const getSaveStatusDisplay = () => {
    if (saveStatus === 'saving') return <span className="text-amber-500">Saving...</span>;
    if (saveStatus === 'saved') return <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Saved</span>;
    return null;
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'unknown source';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file");
      return;
    }

    try {
      const text = await extractTextFromPDF(file);
      setUploadedFileText(text);
      setUploadedFileName(file.name);
      setResumeSource('upload');
      toast.success("Resume text extracted from PDF!");
    } catch (error) {
      toast.error("Failed to read PDF");
    }
  };

  const getResumeContentForAI = (): string | null => {
    if (resumeSource === 'master') {
      if (!masterProfile) return null;
      return JSON.stringify(masterProfile);
    }
    if (resumeSource === 'tailored') {
      if (!tailoredResume) return null;
      return JSON.stringify(tailoredResume);
    }
    if (resumeSource === 'upload') {
      if (!uploadedFileText) return null;
      return uploadedFileText;
    }
    return null;
  };

  const handleAnalyzeMatch = async () => {
    const resumeContent = getResumeContentForAI();

    if (!resumeContent) {
      if (resumeSource === 'upload') toast.error("Please upload a resume PDF first");
      else if (resumeSource === 'tailored') toast.error("Please create a tailored resume first");
      else toast.error("Please set up your Master Resume first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await AIHelper.analyzeMatch(formData.description, resumeContent);
      setMatchResult(result);
    } catch (error) {
      console.error("Failed to analyze match", error);
      toast.error("Failed to analyze match");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    const resumeContent = getResumeContentForAI();

    if (!resumeContent) {
      // Only master profile is strictly checked for bio generation usually, but here we use the generic source
      if (!masterProfile) { // Specific legacy check or just use generic?
        toast.error("Please set up your Master Resume first");
        return;
      }
      // Fallback to master if others fail? No, strict selection is better.
      // Actually let's assume if they want cover letter they probably want it based on master or tailored.
      // Let's use the same logic.
    }

    // Double check just for safety if getResumeContent returns null but master exists (e.g. upload selected but empty)
    // We'll enforce the selection.
    if (!resumeContent) {
      toast.error("Resume content missing for selected source");
      return;
    }

    setIsGeneratingLetter(true);
    try {
      const result = await AIHelper.generateCoverLetter(
        formData.description,
        resumeContent,
        formData.position,
        formData.company
      );
      setCoverLetter(result.coverLetter);
      setActiveTab("cover-letter");
      toast.success("Cover letter generated!");
    } catch (error) {
      console.error("Failed to generate cover letter", error);
      toast.error("Failed to generate cover letter");
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleConvertToEmail = async () => {
    if (!coverLetter) return;

    setIsConvertingEmail(true);
    try {
      const emailFormat = await AIHelper.generateEmailFromLetter(
        coverLetter,
        formData.position,
        formData.company
      );
      setCoverLetter(emailFormat);
      toast.success("Converted to email format!");
    } catch (error) {
      console.error("Failed to convert to email", error);
      toast.error("Failed to convert to email format");
    } finally {
      setIsConvertingEmail(false);
    }
  };

  const handleTailorResume = async () => {
    if (!masterProfile || !job) {
      toast.error("Missing Master Profile or Job Description");
      return;
    }

    setIsTailoring(true);
    try {
      const tailored = await ResumeAI.tailorResume(job.description || "", masterProfile);
      setTailoredResume(tailored);
      toast.success("Resume tailored successfully!");
    } catch (error) {
      console.error("Tailoring failed", error);
      toast.error("Failed to tailor resume. Please check your AI settings.");
    } finally {
      setIsTailoring(false);
    }
  };

  const handlePrintResume = async () => {
    if (!tailoredResume && !masterProfile) return;

    // Auto-save the used resume to the job record
    if (job && tailoredResume) {
      const resumeJson = JSON.stringify(tailoredResume);
      let updatedJob: Job = { ...job };

      try {
        // Try S3 upload first
        const s3Key = await s3Helper.uploadResume(job.id, resumeJson);
        updatedJob.resumeS3Key = s3Key;
        // If S3 succeeds, we can opt to clear attachedResume or keep it as backup. 
        // For now, let's keep attachedResume empty to save DB space if S3 is used.
        updatedJob.attachedResume = undefined;
        toast.success("Resume saved to S3 and attached to job");
      } catch (error: any) {
        // Fallback to local storage
        console.error("S3 Upload failed:", error);

        let errorMessage = "Unknown error";
        if (typeof error === 'object' && error !== null) {
          if (error.name === 'NetworkingError' || error.message?.includes('Network Error')) {
            errorMessage = "Network Error (CORS? Check bucket settings)";
          } else if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
            errorMessage = "Invalid Credentials";
          } else {
            errorMessage = error.message || error.name;
          }
        }

        toast.warning(`S3 Upload Failed: ${errorMessage}. Saved locally instead.`);
        updatedJob.attachedResume = resumeJson;
        // CRITICAL: Clear the S3 key so we don't load stale data from S3 next time
        // since we now have the latest version in local storage.
        updatedJob.resumeS3Key = undefined;
      }

      onAutoSave?.(updatedJob);
    }

    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleChecklistToggle = (id: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [id]: checked
      }
    }));

    if (onAutoSave && job) {
      const updatedChecklist = { ...formData.checklist, [id]: checked };

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
        checklist: updatedChecklist,
      };

      onAutoSave(updatedJob);
    }
  };

  const handleAddContact = async (contactData: Omit<Contact, "id" | "user_id" | "created_at">) => {
    if (!job) return;
    const newContact = await addContact(contactData);
    if (newContact) {
      const linked = await linkContactToJob(job.id, newContact.id, contactData.position || "Contact");
      if (linked) {
        setJobContacts(prev => [...prev, linked as unknown as JobContact]);
      }
    }
  };

  const handleUpdateContact = async (contactData: Omit<Contact, "id" | "user_id" | "created_at">) => {
    if (editingContact) {
      await updateContact(editingContact.id, contactData);
      setJobContacts(prev => prev.map(jc =>
        jc.contact?.id === editingContact.id
          ? { ...jc, contact: { ...jc.contact, ...contactData } as Contact }
          : jc
      ));
      setEditingContact(null);
    }
  };

  const handleLinkContact = async (contactId: string) => {
    if (!job) return;
    const contact = allContacts.find(c => c.id === contactId);
    const linked = await linkContactToJob(job.id, contactId, contact?.position || "Contact");
    if (linked) {
      setJobContacts(prev => [...prev, linked as unknown as JobContact]);
      setIsLinkPopoverOpen(false);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!job) return;
    const success = await removeContactFromJob(job.id, contactId);
    if (success) {
      setJobContacts(prev => prev.filter(jc => jc.contact_id !== contactId));
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Edit Job Application</DialogTitle>
          {job.dateSaved && (
            <div className="text-xs text-muted-foreground mt-1">
              Saved {formatDistanceToNow(new Date(job.dateSaved), { addSuffix: true })}
              {job.jobUrl && ` on ${getDomainFromUrl(job.jobUrl)} `}
            </div>
          )}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-6 sm:grid-cols-7">
              {/* Added sm:grid-cols-7 because we have 7 items now */}
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="checklist">Check List</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="match">Match</TabsTrigger>
              <TabsTrigger value="cover-letter">Letter</TabsTrigger>
              <TabsTrigger value="resume">Resume</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <TabsContent value="details" className="mt-0 space-y-4">
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
            </TabsContent>

            <TabsContent value="notes" className="mt-0 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold ml-1">
                  Job Notes
                </p>
                <div className="text-xs text-muted-foreground animate-pulse">
                  {getSaveStatusDisplay()}
                </div>
              </div>
              <div className="flex-1 bg-background rounded-md border shadow-sm relative group overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary">
                <Textarea
                  value={formData.notes || ""}
                  onChange={handleNotesChange}
                  placeholder="Capture your thoughts, interview questions, or key details here..."
                  className="w-full h-full min-h-[400px] resize-none border-0 focus-visible:ring-0 p-6 text-base leading-relaxed"
                />
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(formData.notes || "");
                      toast.success("Notes copied to clipboard");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="mt-0">
              <JobChecklist
                checklist={formData.checklist}
                onToggle={handleChecklistToggle}
              />
              {/* Auto-save enabled, no manual button needed */}
            </TabsContent>

            <TabsContent value="contacts" className="mt-0 space-y-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Job Contacts
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      People associated with this application (Recruiters, Interviewers, etc.)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Link Existing
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[250px]" align="end">
                        <Command>
                          <CommandInput placeholder="Search contacts..." />
                          <CommandList>
                            <CommandEmpty>No contacts found.</CommandEmpty>
                            <CommandGroup>
                              {allContacts.filter(c => !jobContacts.some(jc => jc.contact_id === c.id)).map(contact => (
                                <CommandItem
                                  key={contact.id}
                                  onSelect={() => handleLinkContact(contact.id)}
                                  className="cursor-pointer"
                                >
                                  {contact.name}
                                  {contact.company && <span className="ml-2 text-muted-foreground text-xs">({contact.company})</span>}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Button size="sm" onClick={() => setIsContactDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New
                    </Button>
                  </div>
                </div>

                {jobContacts.length === 0 ? (
                  <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                    <p className="text-muted-foreground text-sm">No contacts linked to this job yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {jobContacts.map(jc => jc.contact && (
                      <ContactCard
                        key={jc.id}
                        contact={jc.contact}
                        interactionType={jc.interaction_type}
                        onEdit={(c) => {
                          setEditingContact(c);
                          setIsContactDialogOpen(true);
                        }}
                        onDelete={() => handleRemoveContact(jc.contact!.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <AddContactDialog
                open={isContactDialogOpen}
                onOpenChange={(open: boolean) => {
                  setIsContactDialogOpen(open);
                  if (!open) setEditingContact(null);
                }}
                onSave={editingContact ? handleUpdateContact : handleAddContact}
                initialData={editingContact}
              />
            </TabsContent>

            <TabsContent value="match" className="mt-0 space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                {!matchResult ? (
                  <>
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Analyze Job Match</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                        Compare this job description with your resume to see how well you match.
                      </p>
                    </div>

                    {/* Resume Source Selector */}
                    <div className="w-full max-w-md bg-muted/30 p-4 rounded-lg border text-left space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Resume Source</Label>
                      <RadioGroup value={resumeSource} onValueChange={(v: any) => setResumeSource(v)} className="flex flex-col gap-2">

                        {/* Master Profile Option */}
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="master" id="source-master" />
                          <Label htmlFor="source-master" className="cursor-pointer font-normal">
                            Master Profile <span className="text-muted-foreground text-xs">(Default)</span>
                          </Label>
                        </div>

                        {/* Tailored Option - Disabled if not present */}
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="tailored" id="source-tailored" disabled={!tailoredResume} />
                          <Label htmlFor="source-tailored" className={`cursor - pointer font - normal ${!tailoredResume ? 'text-muted-foreground' : ''} `}>
                            Tailored Resume {tailoredResume ? <span className="text-green-600 text-xs font-bold">(Ready)</span> : <span className="text-xs text-muted-foreground">(Not created yet)</span>}
                          </Label>
                        </div>

                        {/* Upload Option */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="upload" id="source-upload" />
                            <Label htmlFor="source-upload" className="cursor-pointer font-normal">
                              Upload PDF
                            </Label>
                          </div>

                          {resumeSource === 'upload' && (
                            <div className="pl-6 animate-in slide-in-from-top-2 fade-in duration-200">
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                className="h-9 text-xs cursor-pointer bg-white"
                              />
                              {uploadedFileName && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> {uploadedFileName}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </RadioGroup>
                    </div>

                    <Button onClick={handleAnalyzeMatch} disabled={isAnalyzing} className="w-full max-w-xs">
                      {isAnalyzing ? "Analyzing..." : "Analyze Match"}
                    </Button>
                  </>
                ) : (
                  <div className="w-full space-y-6 text-left">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-lg">Match Score</h4>
                        <p className="text-sm text-muted-foreground">Based on skill & keyword analysis</p>
                      </div>
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary">
                        <span className="text-xl font-bold text-primary">{matchResult.score}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Missing Keywords
                      </h4>
                      <p className="text-sm text-muted-foreground">Add these to your resume to pass the ATS:</p>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.missingKeywords.map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md border">
                        {matchResult.explanation}
                      </p>
                    </div>

                    <Button onClick={() => setMatchResult(null)} variant="outline" className="w-full">
                      Run Analysis Again
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cover-letter" className="mt-0 space-y-6">
              <div className="flex flex-col space-y-4">
                {!coverLetter ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full mx-auto w-fit">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Generate Cover Letter</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                        Create a tailored cover letter for {formData.company} based on this job description.
                      </p>
                    </div>
                    <Button onClick={handleGenerateCoverLetter} disabled={isGeneratingLetter}>
                      {isGeneratingLetter ? "Generating..." : "Generate Draft"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Your Draft</h3>
                      <Button variant="outline" size="sm" onClick={() => {
                        const blob = new Blob([coverLetter], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Cover_Letter_${formData.company.replace(/\s+/g, '_')}.txt`;
                        a.click();
                      }}>
                        Download .txt
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleConvertToEmail} disabled={isConvertingEmail}>
                        {isConvertingEmail ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Convert to Email
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="min-h-[300px] font-mono text-sm leading-relaxed"
                    />
                    <Button onClick={() => setCoverLetter("")} variant="ghost" className="w-full">
                      Discard & Start Over
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="resume" className="mt-0 space-y-6">
              <div className="flex justify-between items-center mb-4">
                {(job.resumeS3Key || job.attachedResume) && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Resume Attached {job.resumeS3Key ? "(S3)" : "(Local)"}
                  </div>
                )}
              </div>

              {!masterProfile ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Master Profile Not Found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                    You need to set up your Master Profile first before you can generate tailored resumes.
                  </p>
                  <Button variant="outline" onClick={() => window.open('/resume-builder', '_blank')}>
                    Go to Resume Builder
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col space-y-4 print:hidden">
                    {(tailoredResume || masterProfile) && createPortal(
                      <div id="resume-print-portal">
                        <ResumePreview data={tailoredResume || masterProfile} />
                      </div>,
                      document.body
                    )}
                    {!tailoredResume ? (
                      <div className="text-center py-6 space-y-4">
                        <div className="p-4 bg-primary/10 rounded-full mx-auto w-fit">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Tailor Your Resume</h3>
                          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                            Generate an ATS-optimized resume specifically for <strong>{formData.company}</strong>.
                            The AI will select relevant projects and rewrite your experience to match the job description.
                          </p>
                        </div>
                        <Button onClick={handleTailorResume} disabled={isTailoring}>
                          {isTailoring ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Tailoring Resume...
                            </>
                          ) : "Generate Tailored Resume"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                        <div>
                          <h3 className="font-semibold">Tailored Resume Ready</h3>
                          <p className="text-sm text-muted-foreground"> optimized for {formData.company}</p>
                        </div>
                        <div className="flex gap-2">
                          {!isEditingResume ? (
                            <Button variant="outline" onClick={() => setIsEditingResume(true)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          ) : (
                            <Button variant="outline" onClick={() => setIsEditingResume(false)}>
                              Cancel Edit
                            </Button>
                          )}
                          <Button variant="outline" onClick={() => setTailoredResume(null)}>
                            Regenerate
                          </Button>
                          <Button onClick={handlePrintResume} disabled={isEditingResume}>
                            <Printer className="mr-2 h-4 w-4" />
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resume Preview Area */}
                  {(tailoredResume || (isTailoring && !tailoredResume)) && (
                    <div className="border rounded-lg bg-gray-50 p-6 overflow-auto max-h-[600px] print:max-h-none print:p-0 print:border-none print:overflow-visible">
                      {isTailoring && !tailoredResume && (
                        <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-muted-foreground">Analyzing Job Description...</p>
                          <p className="text-xs text-muted-foreground">Selecting best projects...</p>
                        </div>
                      )}
                      {tailoredResume && !isEditingResume && (
                        <ResumePreview data={tailoredResume} />
                      )}
                      {tailoredResume && isEditingResume && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <MasterProfileEditor
                            profile={tailoredResume}
                            resumeId={null}
                            isSaving={false}
                            onSave={(updatedProfile) => {
                              setTailoredResume(updatedProfile);
                              // We don't close edit mode automatically, letting user make multiple changes.
                              // But we could show a toast.
                              toast.success("Changes applied to preview");
                            }}
                          />
                          <div className="mt-4 flex justify-end">
                            <Button onClick={() => setIsEditingResume(false)}>Done Editing</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog >
  );
}