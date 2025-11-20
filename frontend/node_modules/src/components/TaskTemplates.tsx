import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2 } from 'lucide-react';

export interface TemplateTask {
  id: string;
  title: string;
  description: string;
  category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration';
}

interface TaskTemplatesProps {
  nonGameDayTasks: TemplateTask[];
  gameDayTasks: Array<TemplateTask & { timePeriod: 'morning' | 'pre-game' | 'post-game' }>;
  onAddNonGameDayTask: (task: Omit<TemplateTask, 'id'>) => void;
  onDeleteNonGameDayTask: (taskId: string) => void;
}

export function TaskTemplates({ 
  nonGameDayTasks,
  gameDayTasks,
  onAddNonGameDayTask,
  onDeleteNonGameDayTask,
}: TaskTemplatesProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'sanitation' as 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration',
  });

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;

    const task = {
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      category: newTask.category,
    };

    onAddNonGameDayTask(task);

    setNewTask({
      title: '',
      description: '',
      category: 'sanitation',
    });
    setOpenDialog(false);
  };

  const getCategoryBadgeColor = (category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration') => {
    switch (category) {
      case 'sanitation':
        return 'bg-blue-100 text-blue-800';
      case 'laundry':
        return 'bg-purple-100 text-purple-800';
      case 'food':
        return 'bg-orange-100 text-orange-800';
      case 'communication':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800';
      case 'administration':
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getCategoryLabel = (category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration') => {
    switch (category) {
      case 'sanitation':
        return '🧼 Sanitation & Facilities';
      case 'laundry':
        return '🧺 Laundry & Uniforms';
      case 'food':
        return '🍽️ Food & Nutrition';
      case 'communication':
        return '💬 Communication & Coordination';
      case 'maintenance':
        return '🧰 Maintenance & Supplies';
      case 'administration':
        return '💵 Administration & Compliance';
    }
  };

  const renderTaskList = (tasks: TemplateTask[], onDelete: (id: string) => void, emptyMessage: string) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Template Tasks</CardTitle>
          <CardDescription>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>{emptyMessage}</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span>{task.title}</span>
                      <Badge className={getCategoryBadgeColor(task.category)}>
                        {getCategoryLabel(task.category)}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600">{task.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(task.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Task Templates</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage standard tasks for non-game days and game days
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task Template</DialogTitle>
              <DialogDescription>
                Create a new task template for clubhouse managers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-title">Task Title</Label>
                <Input
                  id="template-title"
                  placeholder="Enter task title..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description (Optional)</Label>
                <Textarea
                  id="template-description"
                  placeholder="Add task details..."
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Select
                  value={newTask.category}
                  onValueChange={(value: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration') => 
                    setNewTask({ ...newTask, category: value })
                  }
                >
                  <SelectTrigger id="template-category">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask}>
                Add Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="non-game-day">
        <TabsList>
          <TabsTrigger value="non-game-day">Non-Game Day Tasks ({nonGameDayTasks.length})</TabsTrigger>
          <TabsTrigger value="game-day">Game Day Tasks ({gameDayTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="non-game-day" className="mt-6">
          {renderTaskList(
            nonGameDayTasks, 
            onDeleteNonGameDayTask,
            'No non-game day tasks defined yet.'
          )}
        </TabsContent>

        <TabsContent value="game-day" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Day Tasks</CardTitle>
              <CardDescription>
                Standard tasks organized by time period (automatically reset daily)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Morning / Pre-Arrival */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Morning / Pre-Arrival</h3>
                <div className="space-y-3">
                  {gameDayTasks.filter(t => t.timePeriod === 'morning').map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-orange-50 border-orange-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span>{task.title}</span>
                          <Badge className={getCategoryBadgeColor(task.category)}>
                            {getCategoryLabel(task.category)}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pre-Game */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Pre-Game</h3>
                <div className="space-y-3">
                  {gameDayTasks.filter(t => t.timePeriod === 'pre-game').map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span>{task.title}</span>
                          <Badge className={getCategoryBadgeColor(task.category)}>
                            {getCategoryLabel(task.category)}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-Game / End of Day */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Post-Game / End of Day</h3>
                <div className="space-y-3">
                  {gameDayTasks.filter(t => t.timePeriod === 'post-game').map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span>{task.title}</span>
                          <Badge className={getCategoryBadgeColor(task.category)}>
                            {getCategoryLabel(task.category)}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Task Templates</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Non-Game Day Tasks:</strong> These tasks automatically appear for clubhouse managers on non-game days. 
            Task completion status persists across consecutive non-game days and resets on 
            the first non-game day after a game series ends.
          </p>
          <p>
            <strong>Game Day Tasks:</strong> These tasks automatically appear for clubhouse managers on game days, organized by time period. 
            Task completion status resets each game day.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
