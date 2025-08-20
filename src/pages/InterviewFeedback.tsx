import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Star, Edit, Trash2 } from "lucide-react";
import { AddInterviewFeedbackDialog } from "@/components/AddInterviewFeedbackDialog";
import { useInterviewFeedback } from "@/hooks/useInterviewFeedback";
import { format } from "date-fns";
import type { InterviewFeedback } from "@/types/interview";

const InterviewFeedbackPage = () => {
  const { feedbacks, loading, addFeedback, deleteFeedback } = useInterviewFeedback();

  const getOutcomeBadgeVariant = (outcome?: string) => {
    switch (outcome) {
      case "offer_received":
        return "default";
      case "next_round":
        return "secondary";
      case "rejected":
        return "destructive";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getOutcomeText = (outcome?: string) => {
    switch (outcome) {
      case "offer_received":
        return "Offer Received";
      case "next_round":
        return "Next Round";
      case "rejected":
        return "Rejected";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Interview Feedback</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Interview Feedback</h1>
          <p className="text-muted-foreground">Track and review your interview experiences</p>
        </div>
        <AddInterviewFeedbackDialog onSubmit={addFeedback} />
      </div>

      {feedbacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No interview feedback yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your interview experiences to improve your performance
            </p>
            <AddInterviewFeedbackDialog onSubmit={addFeedback} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{feedback.position}</CardTitle>
                    <p className="text-lg text-muted-foreground">{feedback.company}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {feedback.overall_rating && (
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>{feedback.overall_rating}/10</span>
                      </Badge>
                    )}
                    {feedback.outcome && (
                      <Badge variant={getOutcomeBadgeVariant(feedback.outcome)}>
                        {getOutcomeText(feedback.outcome)}
                      </Badge>
                    )}
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteFeedback(feedback.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(feedback.interview_date), "MMM dd, yyyy")}</span>
                    {feedback.interview_time && (
                      <>
                        <Clock className="h-4 w-4 ml-2" />
                        <span>{feedback.interview_time}</span>
                      </>
                    )}
                  </div>
                  {feedback.location_platform && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{feedback.location_platform}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{feedback.interview_type}</Badge>
                  <Badge variant="secondary">{feedback.interview_round}</Badge>
                  <Badge variant="secondary">{feedback.interview_format}</Badge>
                  {feedback.technical_assessment && (
                    <Badge variant="outline">Technical Assessment</Badge>
                  )}
                  {feedback.salary_discussed && (
                    <Badge variant="outline">Salary Discussed</Badge>
                  )}
                  {feedback.duration_minutes && (
                    <Badge variant="outline">{feedback.duration_minutes} min</Badge>
                  )}
                </div>

                {feedback.interviewers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Interviewers:</h4>
                    <div className="space-y-1">
                      {feedback.interviewers.map((interviewer, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {interviewer.name} - {interviewer.title}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {feedback.questions_answers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Questions & Answers:</h4>
                    <div className="space-y-3">
                      {feedback.questions_answers.slice(0, 2).map((qa, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium text-foreground">Q: {qa.question}</p>
                          <p className="text-muted-foreground mt-1">A: {qa.answer}</p>
                          {qa.notes && (
                            <p className="text-muted-foreground text-xs mt-1 italic">
                              Notes: {qa.notes}
                            </p>
                          )}
                        </div>
                      ))}
                      {feedback.questions_answers.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{feedback.questions_answers.length - 2} more questions...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {feedback.feedback_notes && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Feedback Notes:</h4>
                    <p className="text-sm text-muted-foreground">{feedback.feedback_notes}</p>
                  </div>
                )}

                {feedback.next_steps && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Next Steps:</h4>
                    <p className="text-sm text-muted-foreground">{feedback.next_steps}</p>
                  </div>
                )}

                {feedback.follow_up_date && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Follow-up: {format(new Date(feedback.follow_up_date), "MMM dd, yyyy")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewFeedbackPage;