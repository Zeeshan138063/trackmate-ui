import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { InterviewFeedback, Interviewer, QuestionAnswer } from "@/types/interview";
import { useJobs } from "@/hooks/useJobs";

const formSchema = z.object({
  job_id: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  interview_date: z.string().min(1, "Interview date is required"),
  interview_time: z.string().optional(),
  interview_type: z.string().min(1, "Interview type is required"),
  interview_round: z.string().min(1, "Interview round is required"),
  interview_format: z.string().min(1, "Interview format is required"),
  duration_minutes: z.number().optional(),
  location_platform: z.string().optional(),
  interviewers: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    title: z.string().min(1, "Title is required"),
    email: z.string().optional(),
  })),
  questions_answers: z.array(z.object({
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required"),
    notes: z.string().optional(),
  })),
  technical_assessment: z.boolean(),
  salary_discussed: z.boolean(),
  overall_rating: z.number().min(1).max(10).optional(),
  feedback_notes: z.string().optional(),
  outcome: z.string().optional(),
  next_steps: z.string().optional(),
  follow_up_date: z.string().optional(),
});

interface Props {
  onSubmit: (feedback: Omit<InterviewFeedback, "id" | "user_id" | "created_at" | "updated_at">) => void;
}

export const AddInterviewFeedbackDialog = ({ onSubmit }: Props) => {
  const [open, setOpen] = useState(false);
  const { jobs = [] } = useJobs();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job_id: "",
      company: "",
      position: "",
      interview_date: "",
      interview_time: "",
      interview_type: "",
      interview_round: "",
      interview_format: "",
      duration_minutes: undefined,
      location_platform: "",
      interviewers: [{ name: "", title: "", email: "" }],
      questions_answers: [{ question: "", answer: "", notes: "" }],
      technical_assessment: false,
      salary_discussed: false,
      overall_rating: undefined,
      feedback_notes: "",
      outcome: "",
      next_steps: "",
      follow_up_date: "",
    },
  });

  const { fields: interviewerFields, append: appendInterviewer, remove: removeInterviewer } = useFieldArray({
    control: form.control,
    name: "interviewers",
  });

  const { fields: qaFields, append: appendQA, remove: removeQA } = useFieldArray({
    control: form.control,
    name: "questions_answers",
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const feedbackData: Omit<InterviewFeedback, "id" | "user_id" | "created_at" | "updated_at"> = {
      job_id: values.job_id || undefined,
      company: values.company,
      position: values.position,
      interview_date: values.interview_date,
      interview_time: values.interview_time || undefined,
      interview_type: values.interview_type,
      interview_round: values.interview_round,
      interview_format: values.interview_format,
      duration_minutes: values.duration_minutes || undefined,
      location_platform: values.location_platform || undefined,
      interviewers: values.interviewers.filter(i => i.name && i.title) as Interviewer[],
      questions_answers: values.questions_answers.filter(qa => qa.question && qa.answer) as QuestionAnswer[],
      technical_assessment: values.technical_assessment,
      salary_discussed: values.salary_discussed,
      overall_rating: values.overall_rating || undefined,
      feedback_notes: values.feedback_notes || undefined,
      outcome: values.outcome || undefined,
      next_steps: values.next_steps || undefined,
      follow_up_date: values.follow_up_date || undefined,
    };
    
    onSubmit(feedbackData);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Interview Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Interview Feedback</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="job_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Job Tracker (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value === "manual" ? "" : value);
                      if (value && value !== "manual") {
                        const selectedJob = jobs.find(job => job.id === value);
                        if (selectedJob) {
                          form.setValue("company", selectedJob.company);
                          form.setValue("position", selectedJob.position);
                        }
                      } else {
                        form.setValue("company", "");
                        form.setValue("position", "");
                      }
                    }} 
                    defaultValue={field.value || "manual"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job from your tracker or leave blank for manual entry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">Manual entry (no link)</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.position} at {job.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={!!form.watch("job_id") && form.watch("job_id") !== "manual"}
                        placeholder={form.watch("job_id") && form.watch("job_id") !== "manual" ? "Auto-filled from selected job" : "Enter company name"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={!!form.watch("job_id") && form.watch("job_id") !== "manual"}
                        placeholder={form.watch("job_id") && form.watch("job_id") !== "manual" ? "Auto-filled from selected job" : "Enter position title"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="interview_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interview_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="interview_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="behavioral">Behavioral</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interview_round"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Round</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select round" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1st round">1st Round</SelectItem>
                        <SelectItem value="2nd round">2nd Round</SelectItem>
                        <SelectItem value="3rd round">3rd Round</SelectItem>
                        <SelectItem value="final">Final Round</SelectItem>
                        <SelectItem value="technical">Technical Round</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interview_format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-on-1">1-on-1</SelectItem>
                        <SelectItem value="panel">Panel</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location_platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location/Platform</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Zoom, Office Address, Teams" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Interviewers</FormLabel>
              {interviewerFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end mt-2">
                  <FormField
                    control={form.control}
                    name={`interviewers.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`interviewers.${index}.title`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`interviewers.${index}.email`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Email (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {interviewerFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeInterviewer(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => appendInterviewer({ name: "", title: "", email: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Interviewer
              </Button>
            </div>

            <div>
              <FormLabel>Questions & Answers</FormLabel>
              {qaFields.map((field, index) => (
                <div key={field.id} className="space-y-2 mt-2 p-4 border rounded">
                  <FormField
                    control={form.control}
                    name={`questions_answers.${index}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="Question asked..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`questions_answers.${index}.answer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="Your answer..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`questions_answers.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="Additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {qaFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeQA(index)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Q&A
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => appendQA({ question: "", answer: "", notes: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question & Answer
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="technical_assessment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Technical Assessment Included</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salary_discussed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Salary Discussed</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="overall_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Rating (1-10)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="10" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outcome</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="next_round">Next Round</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="offer_received">Offer Received</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="follow_up_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="feedback_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Overall feedback and impressions..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Steps</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What are the next steps mentioned?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Feedback</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};