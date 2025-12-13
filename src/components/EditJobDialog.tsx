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

import { formatDistanceToNow } from "date-fns";

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
import { Users, Plus, Link as LinkIcon, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  const [prevJobId, setPrevJobId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<AIMatchResult | null>(null);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

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
        checklist: job.checklist || {},
      });

      // Only reset UI state if we're opening a DIFFERENT job
      if (job.id !== prevJobId) {
        setMatchResult(null);
        setCoverLetter("");
        setActiveTab("details");
        setPrevJobId(job.id);

        // Fetch contacts for this job
        fetchJobContacts(job.id).then(setJobContacts);
      }
    }
  }, [job, prevJobId, fetchJobContacts]);

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
    };

    onUpdateJob(updatedJob);
    onOpenChange(false);
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'unknown source';
    }
  };

  const handleAnalyzeMatch = async () => {
    setIsAnalyzing(true);
    try {
      // In a real app, you'd pass the actual default resume content here
      const result = await AIHelper.analyzeMatch(formData.description, "Mock Resume Content");
      setMatchResult(result);
    } catch (error) {
      console.error("Failed to analyze match", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingLetter(true);
    try {
      const result = await AIHelper.generateCoverLetter(
        formData.description,
        "Mock Resume Content",
        formData.position,
        formData.company
      );
      setCoverLetter(result.coverLetter);
    } catch (error) {
      console.error("Failed to generate cover letter", error);
    } finally {
      setIsGeneratingLetter(false);
    }
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
      // Construct updated job for auto-save
      // We use the PREVIOUS formData but with the NEW checklist value
      // This is because setFormData is async/batched
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Edit Job Application</DialogTitle>
          {job.dateSaved && (
            <div className="text-xs text-muted-foreground mt-1">
              Saved {formatDistanceToNow(new Date(job.dateSaved), { addSuffix: true })}
              {job.jobUrl && ` on ${getDomainFromUrl(job.jobUrl)}`}
            </div>
          )}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="checklist">Check List</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="match">AI Match Score</TabsTrigger>
              <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
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
                        Compare this job description with your default resume to see how well you match and identify missing keywords.
                      </p>
                    </div>
                    <Button onClick={handleAnalyzeMatch} disabled={isAnalyzing}>
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
          </div>
        </Tabs>
      </DialogContent>
    </Dialog >
  );
}