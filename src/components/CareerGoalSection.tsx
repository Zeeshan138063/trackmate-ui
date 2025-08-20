import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Target } from "lucide-react";
import { toast } from "sonner";

interface CareerGoal {
  targetTitle: string;
  targetDate: string;
  salaryMin: number;
  salaryMax: number;
}

export function CareerGoalSection() {
  const [goal, setGoal] = useState<CareerGoal>({
    targetTitle: "python software engineer",
    targetDate: "January 2025",
    salaryMin: 76000,
    salaryMax: 100000
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(goal);

  const handleSave = () => {
    setGoal(editForm);
    setIsEditing(false);
    toast.success("Career goal updated successfully!");
  };

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Next Career Goal: Land a new job in a new career path</CardTitle>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Goals
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Career Goals</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="targetTitle">Target Title</Label>
                <Input
                  id="targetTitle"
                  value={editForm.targetTitle}
                  onChange={(e) => setEditForm({ ...editForm, targetTitle: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  value={editForm.targetDate}
                  onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salaryMin">Min Salary ($)</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={editForm.salaryMin}
                    onChange={(e) => setEditForm({ ...editForm, salaryMin: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="salaryMax">Max Salary ($)</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={editForm.salaryMax}
                    onChange={(e) => setEditForm({ ...editForm, salaryMax: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Target Title</div>
            <div className="font-semibold">{goal.targetTitle}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Target Date</div>
            <div className="font-semibold">{goal.targetDate}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Target Salary Range</div>
            <div className="font-semibold">
              {formatSalary(goal.salaryMin)} to {formatSalary(goal.salaryMax)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}