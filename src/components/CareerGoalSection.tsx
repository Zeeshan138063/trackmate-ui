import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Target } from "lucide-react";
import { useCareerGoals, type CareerGoal } from "@/hooks/useCareerGoals";

export function CareerGoalSection() {
  const { goals, addGoal, updateGoal, loading } = useCareerGoals();
  const [isEditing, setIsEditing] = useState(false);

  // Use existing goal or default values
  const currentGoal = goals[0] || {
    targetTitle: "Set your target role",
    targetDate: "-",
    salaryMin: 0,
    salaryMax: 0
  };

  const [editForm, setEditForm] = useState(currentGoal);

  const handleSave = async () => {
    if (goals.length > 0) {
      await updateGoal(goals[0].id, editForm);
    } else {
      await addGoal(editForm);
    }
    setIsEditing(false);
  };

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Next Career Goal</CardTitle>
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
            <div className="font-semibold">{currentGoal.targetTitle}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Target Date</div>
            <div className="font-semibold">{currentGoal.targetDate}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Target Salary Range</div>
            <div className="font-semibold">
              {formatSalary(currentGoal.salaryMin)} to {formatSalary(currentGoal.salaryMax)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}