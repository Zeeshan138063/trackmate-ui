import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Send, Target } from "lucide-react";
import { toast } from "sonner";

interface JobApplicationsChartProps {
  appliedCount: number;
}

export function JobApplicationsChart({ appliedCount }: JobApplicationsChartProps) {
  const [goal, setGoal] = useState(5);
  const [isEditing, setIsEditing] = useState(false);
  const [editGoal, setEditGoal] = useState(goal);

  const handleSaveGoal = () => {
    setGoal(editGoal);
    setIsEditing(false);
    toast.success("Application goal updated!");
  };

  const percentage = goal > 0 ? Math.min((appliedCount / goal) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/30 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Send className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-bold uppercase tracking-widest">Applications</CardTitle>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-primary">
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Weekly Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="applicationGoal">Target applications per week</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="applicationGoal"
                    type="number"
                    min="1"
                    className="pl-9"
                    value={editGoal}
                    onChange={(e) => setEditGoal(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGoal}>
                  Confirm Goal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-2 pb-6">
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl scale-75" />

          <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
              fill="none"
              strokeOpacity="0.3"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="url(#progressGradient)"
              strokeWidth="6"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-in-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
            <div className="text-4xl font-black tracking-tighter tabular-nums text-foreground">{appliedCount}</div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] -mt-1 opacity-60">
              Sent
            </div>
          </div>
        </div>

        <div className="mt-4 w-full px-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 mb-3">
            <Target className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Weekly Target: {goal}</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium italic leading-tight">
            Track your velocity against weekly targets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}