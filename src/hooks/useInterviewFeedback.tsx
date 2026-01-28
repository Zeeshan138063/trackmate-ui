import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import type { InterviewFeedback, InterviewFeedbackInsert } from "@/types/interview";

export const useInterviewFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<InterviewFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFeedbacks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interview_feedback")
        .select("*")
        .eq("user_id", user.id)
        .order("interview_date", { ascending: false });

      if (error) throw error;

      // Transform the data to match our TypeScript interface
      const transformedData = (data || []).map(item => ({
        ...item,
        duration_minutes: item.duration_minutes || undefined,
        overall_rating: item.overall_rating || undefined,
        interview_time: item.interview_time || undefined,
        location_platform: item.location_platform || undefined,
        feedback_notes: item.feedback_notes || undefined,
        outcome: item.outcome || undefined,
        next_steps: item.next_steps || undefined,
        follow_up_date: item.follow_up_date || undefined,
        interviewers: Array.isArray(item.interviewers) ? item.interviewers as any[] : [],
        questions_answers: Array.isArray(item.questions_answers) ? item.questions_answers as any[] : [],
      })) as InterviewFeedback[];

      setFeedbacks(transformedData);
    } catch (error) {
      console.error("Error fetching interview feedback:", error);
      toast({
        title: "Error",
        description: "Failed to fetch interview feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFeedback = async (newFeedback: Omit<InterviewFeedback, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;

    try {
      const insertData: InterviewFeedbackInsert = {
        ...newFeedback,
        user_id: user.id,
        interviewers: newFeedback.interviewers,
        questions_answers: newFeedback.questions_answers,
      };

      const { data, error } = await supabase
        .from("interview_feedback")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Transform the returned data
      const transformedData = {
        ...data,
        duration_minutes: data.duration_minutes || undefined,
        overall_rating: data.overall_rating || undefined,
        interview_time: data.interview_time || undefined,
        location_platform: data.location_platform || undefined,
        feedback_notes: data.feedback_notes || undefined,
        outcome: data.outcome || undefined,
        next_steps: data.next_steps || undefined,
        follow_up_date: data.follow_up_date || undefined,
        interviewers: Array.isArray(data.interviewers) ? data.interviewers as any[] : [],
        questions_answers: Array.isArray(data.questions_answers) ? data.questions_answers as any[] : [],
      } as InterviewFeedback;

      setFeedbacks(prev => [transformedData, ...prev]);
      toast({
        title: "Success",
        description: "Interview feedback added successfully",
      });
    } catch (error) {
      console.error("Error adding interview feedback:", error);
      toast({
        title: "Error",
        description: "Failed to add interview feedback",
        variant: "destructive",
      });
    }
  };

  const updateFeedback = async (updatedFeedback: InterviewFeedback) => {
    try {
      const updateData: Partial<InterviewFeedbackInsert> = {
        ...updatedFeedback,
        interviewers: updatedFeedback.interviewers,
        questions_answers: updatedFeedback.questions_answers,
      };

      const { error } = await supabase
        .from("interview_feedback")
        .update(updateData)
        .eq("id", updatedFeedback.id);

      if (error) throw error;

      setFeedbacks(prev =>
        prev.map(feedback =>
          feedback.id === updatedFeedback.id ? updatedFeedback : feedback
        )
      );
      toast({
        title: "Success",
        description: "Interview feedback updated successfully",
      });
    } catch (error) {
      console.error("Error updating interview feedback:", error);
      toast({
        title: "Error",
        description: "Failed to update interview feedback",
        variant: "destructive",
      });
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from("interview_feedback")
        .delete()
        .eq("id", feedbackId);

      if (error) throw error;

      setFeedbacks(prev => prev.filter(feedback => feedback.id !== feedbackId));
      toast({
        title: "Success",
        description: "Interview feedback deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting interview feedback:", error);
      toast({
        title: "Error",
        description: "Failed to delete interview feedback",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeedbacks();
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    feedbacks,
    loading,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    refetch: fetchFeedbacks,
  };
};