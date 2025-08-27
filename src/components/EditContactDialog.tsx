import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import type { Contact } from "@/types/contact";

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  department: z.string().optional(),
  contact_type: z.enum(['recruiter', 'hiring_manager', 'employee', 'referral', 'networking', 'other']),
  seniority_level: z.enum(['junior', 'mid', 'senior', 'director', 'vp', 'c_level']).optional(),
  linkedin_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  twitter_url: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
  github_url: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  personal_website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  how_we_met: z.enum(['job_application', 'networking_event', 'referral', 'linkedin', 'twitter', 'github', 'personal_website', 'conference', 'cold_outreach', 'other']).optional(),
  relationship_strength: z.enum(['cold', 'neutral', 'warm', 'strong', 'advocate']),
  last_contact_date: z.string().optional(),
  next_follow_up_date: z.string().optional(),
  communication_frequency: z.enum(['weekly', 'monthly', 'quarterly', 'as_needed']).optional(),
  notes: z.string().optional(),
});

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSubmit: (contact: Contact) => void;
}

export default function EditContactDialog({ open, onOpenChange, contact, onSubmit }: EditContactDialogProps) {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: contact ? { ...contact } : undefined,
  });

  useEffect(() => {
    if (contact) {
      form.reset({ ...contact });
      setTags(contact.tags || []);
    }
  }, [contact]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => setTags(tags.filter(t => t !== tagToRemove));

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!contact) return;
    const updated: Contact = {
      ...contact,
      ...values,
      email: values.email || undefined,
      linkedin_url: values.linkedin_url || undefined,
      twitter_url: values.twitter_url || undefined,
      github_url: values.github_url || undefined,
      personal_website: values.personal_website || undefined,
      notes: values.notes || undefined,
      tags,
    };
    onSubmit(updated);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        {contact && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Job Title *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="company" render={({ field }) => (
                    <FormItem><FormLabel>Company *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contact_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select contact type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                          <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="networking">Networking</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="seniority_level" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seniority Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="mid">Mid-Level</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="vp">VP</SelectItem>
                          <SelectItem value="c_level">C-Level</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Social & Professional Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social & Professional Links</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="linkedin_url" render={({ field }) => (
                    <FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="twitter_url" render={({ field }) => (
                    <FormItem><FormLabel>Twitter URL</FormLabel><FormControl><Input placeholder="https://twitter.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="github_url" render={({ field }) => (
                    <FormItem><FormLabel>GitHub URL</FormLabel><FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="personal_website" render={({ field }) => (
                    <FormItem><FormLabel>Personal Website</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              {/* Relationship Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Relationship Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="how_we_met" render={({ field }) => (
                    <FormItem>
                      <FormLabel>How We Met</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select how you met" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="job_application">Job Application</SelectItem>
                          <SelectItem value="networking_event">Networking Event</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="personal_website">Personal Website</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="relationship_strength" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship Strength *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select strength" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="cold">Cold</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                          <SelectItem value="strong">Strong</SelectItem>
                          <SelectItem value="advocate">Advocate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Communication Tracking */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Communication Tracking</h3>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="last_contact_date" render={({ field }) => (
                    <FormItem><FormLabel>Last Contact Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="next_follow_up_date" render={({ field }) => (
                    <FormItem><FormLabel>Next Follow-up Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="communication_frequency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="as_needed">As Needed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tags</h3>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input placeholder="Add a tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                    <Button type="button" onClick={addTag} variant="outline"><Plus className="h-4 w-4" /></Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          <span>{tag}</span>
                          <Button type="button" variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeTag(tag)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}


