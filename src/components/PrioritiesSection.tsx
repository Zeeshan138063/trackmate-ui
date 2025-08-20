import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Priority {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  important: boolean;
}

export function PrioritiesSection() {
  const [priorities, setPriorities] = useState<Priority[]>([
    {
      id: '1',
      title: 'Update LinkedIn profile',
      description: 'Add recent project experience and skills',
      completed: false,
      important: true
    },
    {
      id: '2', 
      title: 'Follow up with ABC Company',
      description: 'Send thank you email after interview',
      completed: false,
      important: false
    }
  ]);

  const [isAddingPriority, setIsAddingPriority] = useState(false);
  const [newPriority, setNewPriority] = useState({ title: '', description: '', important: false });

  const handleAddPriority = () => {
    if (!newPriority.title.trim()) return;
    
    const priority: Priority = {
      id: Date.now().toString(),
      title: newPriority.title,
      description: newPriority.description,
      completed: false,
      important: newPriority.important
    };
    
    setPriorities(prev => [...prev, priority]);
    setNewPriority({ title: '', description: '', important: false });
    setIsAddingPriority(false);
    toast.success("Priority added!");
  };

  const handleToggleComplete = (id: string) => {
    setPriorities(prev => 
      prev.map(p => p.id === id ? { ...p, completed: !p.completed } : p)
    );
  };

  const handleToggleImportant = (id: string) => {
    setPriorities(prev => 
      prev.map(p => p.id === id ? { ...p, important: !p.important } : p)
    );
  };

  const handleDeletePriority = (id: string) => {
    setPriorities(prev => prev.filter(p => p.id !== id));
    toast.success("Priority deleted!");
  };

  const sortedPriorities = [...priorities].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.important !== b.important) return b.important ? 1 : -1;
    return 0;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-primary" />
          <CardTitle>Priorities</CardTitle>
        </div>
        <Dialog open={isAddingPriority} onOpenChange={setIsAddingPriority}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Priority
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Priority</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Priority title..."
                  value={newPriority.title}
                  onChange={(e) => setNewPriority({ ...newPriority, title: e.target.value })}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description (optional)..."
                  value={newPriority.description}
                  onChange={(e) => setNewPriority({ ...newPriority, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="important"
                  checked={newPriority.important}
                  onChange={(e) => setNewPriority({ ...newPriority, important: e.target.checked })}
                />
                <label htmlFor="important" className="text-sm">Mark as important</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingPriority(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPriority}>
                  Add Priority
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedPriorities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No priorities set. Add your first priority to get started!</p>
            </div>
          ) : (
            sortedPriorities.map((priority) => (
              <div
                key={priority.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  priority.completed ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <button
                  onClick={() => handleToggleComplete(priority.id)}
                  className="mt-0.5"
                >
                  {priority.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium ${priority.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {priority.title}
                    </h4>
                    {priority.important && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Important
                      </Badge>
                    )}
                  </div>
                  {priority.description && (
                    <p className={`text-sm mt-1 ${priority.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                      {priority.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleToggleImportant(priority.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Star className={`h-4 w-4 ${priority.important ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                  <button
                    onClick={() => handleDeletePriority(priority.id)}
                    className="p-1 hover:bg-muted rounded text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}