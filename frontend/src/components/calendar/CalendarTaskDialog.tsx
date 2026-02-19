import type { MouseEvent, FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TimeSelect } from '../TimeSelect';
import type { Task } from '../../types/index';

type NewTaskForm = {
  title: string;
  description: string;
  time: string;
  category: Task['category'];
};

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  newTask: NewTaskForm;
  setNewTask: React.Dispatch<React.SetStateAction<NewTaskForm>>;
  onSubmit: (e?: MouseEvent | FormEvent) => void;
}

export function CalendarTaskDialog({ isOpen, onOpenChange, selectedDate, newTask, setNewTask, onSubmit }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule a New Task</DialogTitle>
          <DialogDescription>Add a task for {selectedDate?.toLocaleDateString()}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              placeholder="e.g., Clean locker room"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
          </div>
          <TimeSelect
            id="task-time"
            label="Time"
            value={newTask.time}
            onChange={(time) => setNewTask({ ...newTask, time })}
          />
          <div>
            <Label htmlFor="task-category">Category</Label>
            <Select
              value={newTask.category}
              onValueChange={(value: Task['category']) => setNewTask({ ...newTask, category: value })}
            >
              <SelectTrigger id="task-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sanitation">🧼 Sanitation & Facilities</SelectItem>
                <SelectItem value="laundry">🧺 Laundry & Uniforms</SelectItem>
                <SelectItem value="food">🍽️ Food & Nutrition</SelectItem>
                <SelectItem value="communication">💬 Communication & Coordination</SelectItem>
                <SelectItem value="maintenance">🧰 Maintenance & Supplies</SelectItem>
                <SelectItem value="administration">💵 Administration & Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Task details..."
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          </div>
          <Button type="button" onClick={onSubmit} className="w-full">
            Add Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
