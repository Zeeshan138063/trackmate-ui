import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Send } from "lucide-react";
import { toast } from "sonner";

interface JobApplicationsChartProps {
  appliedCount: number;
}

export function JobApplicationsChart({ appliedCount }: JobApplicationsChartProps) {
  const [goal, setGoal] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editGoal, setEditGoal] = useState(goal);

  const handleSaveGoal = () => {
    setGoal(editGoal);
    setIsEditing(false);
    toast.success("Application goal updated!");
  };

  const percentage = goal > 0 ? Math.min((appliedCount / goal) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <Send className="h-5 w-5 text-primary" />
          <CardTitle>Job Applications</CardTitle>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Application Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="applicationGoal">Weekly Application Goal</Label>
                <Input
                  id="applicationGoal"
                  type="number"
                  min="1"
                  value={editGoal}
                  onChange={(e) => setEditGoal(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGoal}>
                  Save Goal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-in-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold">{appliedCount}</div>
            <div className="text-xs text-muted-foreground text-center">
              applications<br />sent
            </div>
          </div>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground">
          Goal: {goal}
        </Button>
        <p className="text-xs text-center text-muted-foreground max-w-48">
          Make sure to move jobs to "Applied" in your Job Tracker to see your weekly goal progress
        </p>
      </CardContent>
    </Card>
  );
}