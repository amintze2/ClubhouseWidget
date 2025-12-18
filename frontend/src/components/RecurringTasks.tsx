// Management UI for recurring tasks.
// - Lets users define off-day and game-day tasks that repeat automatically.
// - Saves recurring definitions to Supabase so they can be materialized per date in other views.
// - Supports editing and deleting existing recurring tasks.
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Clock, Plus, Trash2, Edit, Calendar, CheckCircle2, Home, CalendarDays } from 'lucide-react';

export interface RecurringTask {
  id: string;
  title: string;
  description: string;
  category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration';
  taskType: 'off-day' | 'game-day';
  time: string;
  timePeriod?: 'morning' | 'pre-game' | 'post-game'; // Only for game-day tasks
  enabled: boolean;
}

interface RecurringTasksProps {
  tasks: RecurringTask[];
  onAddTask: (task: Omit<RecurringTask, 'id'>) => void;
  onUpdateTask: (task: RecurringTask) => void;
  onDeleteTask: (taskId: string) => void;
}

const categoryColors: Record<string, string> = {
  sanitation: 'bg-blue-100 text-blue-800 border-blue-200',
  laundry: 'bg-purple-100 text-purple-800 border-purple-200',
  food: 'bg-green-100 text-green-800 border-green-200',
  communication: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
  administration: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function RecurringTasks({ tasks, onAddTask, onUpdateTask, onDeleteTask }: RecurringTasksProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RecurringTask['category']>('sanitation');
  const [taskType, setTaskType] = useState<RecurringTask['taskType']>('off-day');
  const [time, setTime] = useState('09:00 AM');
  const [timePeriod, setTimePeriod] = useState<'morning' | 'pre-game' | 'post-game'>('morning');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('sanitation');
    setTaskType('off-day');
    setTime('09:00 AM');
    setTimePeriod('morning');
    setEditingTask(null);
  };

  const handleOpenDialog = (task?: RecurringTask) => {
    if (task) {
      setEditingTask(task);
      setTitle(task.title);
      setDescription(task.description);
      setCategory(task.category);
      setTaskType(task.taskType);
      setTime(task.time);
      setTimePeriod(task.timePeriod || 'morning');
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const taskData: Omit<RecurringTask, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      category,
      taskType,
      time,
      enabled: true,
      ...(taskType === 'game-day' ? { timePeriod } : {}),
    };

    if (editingTask) {
      onUpdateTask({ ...taskData, id: editingTask.id, enabled: editingTask.enabled });
    } else {
      onAddTask(taskData);
    }

    setIsDialogOpen(false);
    resetForm();
  };



  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Recurring Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage automated tasks that repeat on a schedule
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Recurring Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Edit Recurring Task' : 'Add Recurring Task'}
              </DialogTitle>
              <DialogDescription>
                Create a task that automatically repeats on your chosen schedule
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any additional details..."
                  rows={3}
                />
              </div>
              
              {/* Task Type Toggle */}
              <div className="space-y-2">
                <Label>Task Type</Label>
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3 flex-1">
                    <Home className={`h-5 w-5 ${taskType === 'off-day' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="font-medium">Off Day Tasks</div>
                      <div className="text-xs text-gray-500">Tasks for non-game days</div>
                    </div>
                  </div>
                  <Switch
                    checked={taskType === 'game-day'}
                    onCheckedChange={(checked) => setTaskType(checked ? 'game-day' : 'off-day')}
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <CalendarDays className={`h-5 w-5 ${taskType === 'game-day' ? 'text-green-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="font-medium">Game Day Tasks</div>
                      <div className="text-xs text-gray-500">Tasks for scheduled games</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as RecurringTask['category'])}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sanitation">Sanitation</SelectItem>
                    <SelectItem value="laundry">Laundry</SelectItem>
                    <SelectItem value="food">Food & Beverage</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Period Selection (only for game-day tasks) */}
              {taskType === 'game-day' && (
                <div className="space-y-2">
                  <Label htmlFor="timePeriod">Game Day Time Period</Label>
                  <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as 'morning' | 'pre-game' | 'post-game')}>
                    <SelectTrigger id="timePeriod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning / Pre-Arrival</SelectItem>
                      <SelectItem value="pre-game">Pre-Game</SelectItem>
                      <SelectItem value="post-game">Post-Game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="time">Default Time</Label>
                <Input
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="09:00 AM"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingTask ? 'Update Task' : 'Add Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg mb-2">No Recurring Tasks</h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Create automated tasks that repeat on a schedule
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>All Recurring Tasks</CardTitle>
                <CardDescription>
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} scheduled
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg transition-all ${
                        task.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{task.title}</h4>
                              {!task.enabled && (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                              {task.taskType === 'off-day' ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                                  <Home className="h-3 w-3" />
                                  Off Day
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  Game Day - {task.timePeriod === 'morning' ? 'Morning' : task.timePeriod === 'pre-game' ? 'Pre-Game' : 'Post-Game'}
                                </Badge>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.time}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600">{task.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={categoryColors[task.category]}>
                            {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUpdateTask({ ...task, enabled: !task.enabled })}
                          title={task.enabled ? 'Disable task' : 'Enable task'}
                        >
                          <CheckCircle2 className={`h-4 w-4 ${task.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
      )}
    </div>
  );
}
