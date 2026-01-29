
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Job } from "@/types/job";

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJobs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Only fetch jobs for the current logged-in user
      // The user_id is automatically set when adding jobs via addJob()
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id) // Filter by current user
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to match our Job interface
      const transformedJobs: Job[] = (data as any)?.map((job: any) => ({
        id: job.id,
        position: job.position,
        company: job.company,
        jobUrl: job.job_url || undefined,
        minSalary: job.min_salary || undefined,
        maxSalary: job.max_salary || undefined,
        location: job.location || undefined,
        description: job.description || undefined,
        status: job.status as Job["status"],
        datePosted: job.date_posted || undefined,
        dateSaved: job.date_saved,
        deadline: job.deadline || undefined,
        dateApplied: job.date_applied || undefined,
        followUp: job.follow_up || undefined,
        excitement: job.excitement,
        checklist: job.checklist || {},
        notes: job.notes || undefined,
        createdAt: job.created_at,
      })) || [];

      setJobs(transformedJobs);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error fetching jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addJob = async (newJob: Omit<Job, "id">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          position: newJob.position,
          company: newJob.company,
          job_url: newJob.jobUrl,
          min_salary: newJob.minSalary,
          max_salary: newJob.maxSalary,
          location: newJob.location,
          description: newJob.description,
          status: newJob.status,
          date_posted: newJob.datePosted,
          date_saved: newJob.dateSaved,
          deadline: newJob.deadline,
          date_applied: newJob.dateApplied,
          follow_up: newJob.followUp,
          excitement: newJob.excitement,
          checklist: newJob.checklist || {},
          notes: newJob.notes,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Transform and add to local state
      const transformedJob: Job = {
        id: (data as any).id,
        position: (data as any).position,
        company: (data as any).company,
        jobUrl: (data as any).job_url || undefined,
        minSalary: (data as any).min_salary || undefined,
        maxSalary: (data as any).max_salary || undefined,
        location: (data as any).location || undefined,
        description: (data as any).description || undefined,
        status: (data as any).status as Job["status"],
        datePosted: (data as any).date_posted || undefined,
        dateSaved: (data as any).date_saved,
        deadline: (data as any).deadline || undefined,
        dateApplied: (data as any).date_applied || undefined,
        followUp: (data as any).follow_up || undefined,
        excitement: (data as any).excitement,
        checklist: (data as any).checklist || {},
        notes: (data as any).notes || undefined,
        createdAt: (data as any).created_at,
      };

      setJobs(prev => [transformedJob, ...prev]);

      toast({
        title: "Job added successfully",
        description: `${newJob.position} at ${newJob.company} has been added.`,
      });
    } catch (error: any) {
      console.error('Error adding job:', error);
      toast({
        title: "Error adding job",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateJob = async (updatedJob: Job) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          position: updatedJob.position,
          company: updatedJob.company,
          job_url: updatedJob.jobUrl,
          min_salary: updatedJob.minSalary,
          max_salary: updatedJob.maxSalary,
          location: updatedJob.location,
          description: updatedJob.description,
          status: updatedJob.status,
          date_posted: updatedJob.datePosted,
          deadline: updatedJob.deadline,
          date_applied: updatedJob.dateApplied,
          follow_up: updatedJob.followUp,
          excitement: updatedJob.excitement,
          checklist: updatedJob.checklist,
          notes: updatedJob.notes,
        })
        .eq('id', updatedJob.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setJobs(prev => prev.map(job =>
        job.id === updatedJob.id ? updatedJob : job
      ));

      toast({
        title: "Job updated successfully",
        description: `${updatedJob.position} has been updated.`,
      });
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast({
        title: "Error updating job",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setJobs(prev => prev.filter(job => job.id !== jobId));

      toast({
        title: "Job deleted successfully",
        description: "The job has been removed from your tracker.",
      });
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  return {
    jobs,
    loading,
    addJob,
    updateJob,
    deleteJob,
    refetch: fetchJobs,
  };
}
