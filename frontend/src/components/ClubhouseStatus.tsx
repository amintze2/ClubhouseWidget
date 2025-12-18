import { useState } from 'react';
// High-level status dashboard for managers.
// - Summarizes task completion and other operational metrics.
// - Intended primarily for general managers to get a quick health check of the clubhouse.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { CheckCircle2, Circle, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { formatTime12Hour } from '../utils/timeFormat';
import { Task } from '../App';

interface ClubhouseStatusProps {
  tasks: Task[];
}

export function ClubhouseStatus({ tasks }: ClubhouseStatusProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getTasksForDate = (dateStr: string) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return tasks.filter(task => 
      task.date.toDateString() === date.toDateString()
    );
  };

  const getTasksByCategory = (dateTasks: Task[], category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration') => {
    return dateTasks.filter(task => task.category === category)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const calculateProgress = (items: Task[]) => {
    if (items.length === 0) return 0;
    const completed = items.filter(item => item.completed).length;
    return (completed / items.length) * 100;
  };

  const dateTasks = getTasksForDate(selectedDate);
  const sanitationItems = getTasksByCategory(dateTasks, 'sanitation');
  const laundryItems = getTasksByCategory(dateTasks, 'laundry');
  const foodItems = getTasksByCategory(dateTasks, 'food');
  const communicationItems = getTasksByCategory(dateTasks, 'communication');
  const maintenanceItems = getTasksByCategory(dateTasks, 'maintenance');
  const administrationItems = getTasksByCategory(dateTasks, 'administration');

  const sanitationProgress = calculateProgress(sanitationItems);
  const laundryProgress = calculateProgress(laundryItems);
  const foodProgress = calculateProgress(foodItems);
  const communicationProgress = calculateProgress(communicationItems);
  const maintenanceProgress = calculateProgress(maintenanceItems);
  const administrationProgress = calculateProgress(administrationItems);
  const overallProgress = calculateProgress(dateTasks);

  const renderTaskList = (items: Task[], category: string, color: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          <p className="text-sm">No {category.toLowerCase()} tasks scheduled for this day</p>
        </div>
      );
    }

    return (
      <ScrollArea className="max-h-[300px]">
        <div className="space-y-2">
          {items.map((task) => (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="mt-0.5">
                {task.completed ? (
                  <CheckCircle2 className={`h-5 w-5 ${color}`} />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-medium ${task.completed ? 'text-gray-600' : ''}`}>
                    {task.title}
                  </h4>
                  {task.completed && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      Completed
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime12Hour(task.time)}
                  </span>
                  {task.assignedTo && (
                    <span className="text-gray-600">• {task.assignedTo}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
          <CardDescription>View clubhouse tasks for a specific day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="date-picker">Date</Label>
              <Input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {(() => {
                  const [year, month, day] = selectedDate.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  });
                })()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Status</CardTitle>
          <CardDescription>
            {dateTasks.filter(t => t.completed).length} of {dateTasks.length} tasks completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="mb-2" />
          <p className="text-sm text-gray-600">{Math.round(overallProgress)}% Complete</p>
        </CardContent>
      </Card>

      {/* Category Progress Overview */}
      <Accordion type="single" collapsible className="space-y-2" defaultValue="sanitation">
        <AccordionItem value="sanitation" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="text-left">
                <h3 className="font-semibold">🧼 Sanitation & Facilities</h3>
                <p className="text-sm text-gray-500">
                  {sanitationItems.filter(i => i.completed).length} of {sanitationItems.length} completed
                </p>
              </div>
              <Badge variant="secondary" className="ml-4">
                {sanitationItems.length === 0 ? '0' : Math.round(sanitationProgress)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="mb-4">
              <Progress value={sanitationProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(sanitationProgress)}% Complete</p>
            </div>
            {renderTaskList(sanitationItems, 'Sanitation & Facilities', 'text-green-600')}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="laundry" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="text-left">
                <h3 className="font-semibold">🧺 Laundry & Uniforms</h3>
                <p className="text-sm text-gray-500">
                  {laundryItems.filter(i => i.completed).length} of {laundryItems.length} completed
                </p>
              </div>
              <Badge variant="secondary" className="ml-4">
                {laundryItems.length === 0 ? '0' : Math.round(laundryProgress)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="mb-4">
              <Progress value={laundryProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(laundryProgress)}% Complete</p>
            </div>
            {renderTaskList(laundryItems, 'Laundry & Uniforms', 'text-green-600')}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="food" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="text-left">
                <h3 className="font-semibold">🍽️ Food & Nutrition</h3>
                <p className="text-sm text-gray-500">
                  {foodItems.filter(i => i.completed).length} of {foodItems.length} completed
                </p>
              </div>
              <Badge variant="secondary" className="ml-4">
                {foodItems.length === 0 ? '0' : Math.round(foodProgress)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="mb-4">
              <Progress value={foodProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(foodProgress)}% Complete</p>
            </div>
            {renderTaskList(foodItems, 'Food & Nutrition', 'text-green-600')}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="communication" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="text-left">
                <h3 className="font-semibold">💬 Communication & Coordination</h3>
                <p className="text-sm text-gray-500">
                  {communicationItems.filter(i => i.completed).length} of {communicationItems.length} completed
                </p>
              </div>
              <Badge variant="secondary" className="ml-4">
                {communicationItems.length === 0 ? '0' : Math.round(communicationProgress)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="mb-4">
              <Progress value={communicationProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(communicationProgress)}% Complete</p>
            </div>
            {renderTaskList(communicationItems, 'Communication & Coordination', 'text-green-600')}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="maintenance" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="text-left">
                <h3 className="font-semibold">🧰 Maintenance & Supplies</h3>
                <p className="text-sm text-gray-500">
                  {maintenanceItems.filter(i => i.completed).length} of {maintenanceItems.length} completed
                </p>
              </div>
              <Badge variant="secondary" className="ml-4">
                {maintenanceItems.length === 0 ? '0' : Math.round(maintenanceProgress)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="mb-4">
              <Progress value={maintenanceProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(maintenanceProgress)}% Complete</p>
            </div>
            {renderTaskList(maintenanceItems, 'Maintenance & Supplies', 'text-green-600')}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="administration" className="border rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="text-left">
                <h3 className="font-semibold">💵 Administration & Compliance</h3>
                <p className="text-sm text-gray-500">
                  {administrationItems.filter(i => i.completed).length} of {administrationItems.length} completed
                </p>
              </div>
              <Badge variant="secondary" className="ml-4">
                {administrationItems.length === 0 ? '0' : Math.round(administrationProgress)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <div className="mb-4">
              <Progress value={administrationProgress} className="mb-2" />
              <p className="text-sm text-gray-600">{Math.round(administrationProgress)}% Complete</p>
            </div>
            {renderTaskList(administrationItems, 'Administration & Compliance', 'text-green-600')}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
