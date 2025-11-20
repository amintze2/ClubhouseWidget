import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { useState } from 'react';

interface WeeklyCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tasksPerDay: Map<string, number>;
  gameTypesPerDay?: Map<string, 'home' | 'away' | 'both'>;
}

export function WeeklyCalendar({ selectedDate, onSelectDate, tasksPerDay, gameTypesPerDay }: WeeklyCalendarProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const getWeekDates = (date: Date) => {
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay(); // First day is Sunday
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr);
      day.setDate(first + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(selectedDate);
  
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    onSelectDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    onSelectDate(newDate);
  };

  const goToToday = () => {
    onSelectDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const getTaskCount = (date: Date) => {
    return tasksPerDay.get(date.toDateString()) || 0;
  };

  const getGameType = (date: Date): 'home' | 'away' | 'both' | null => {
    return gameTypesPerDay?.get(date.toDateString()) || null;
  };

  const getMonthYear = () => {
    const firstDay = weekDates[0];
    const lastDay = weekDates[6];
    
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return `${firstDay.toLocaleDateString('en-US', { month: 'short' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{getMonthYear()}</h3>
          <p className="text-sm text-gray-500">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Today
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onSelectDate(date);
                    setIsDatePickerOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, index) => {
          const taskCount = getTaskCount(date);
          const dayIsToday = isToday(date);
          const dayIsSelected = isSelected(date);
          const gameType = getGameType(date);

          // Determine background and border colors based on game type
          let bgColor = '';
          let borderColor = '';
          let textColor = '';
          
          if (dayIsSelected) {
            if (gameType === 'home') {
              bgColor = 'bg-green-50';
              borderColor = 'border-green-600';
              textColor = 'text-green-600';
            } else if (gameType === 'away') {
              bgColor = 'bg-orange-50';
              borderColor = 'border-orange-600';
              textColor = 'text-orange-600';
            } else if (gameType === 'both') {
              bgColor = 'bg-purple-50';
              borderColor = 'border-purple-600';
              textColor = 'text-purple-600';
            } else {
              bgColor = 'bg-blue-50';
              borderColor = 'border-blue-600';
              textColor = 'text-blue-600';
            }
          } else {
            if (gameType === 'home') {
              bgColor = 'bg-green-50/50';
              borderColor = 'border-green-300';
              textColor = 'text-green-700';
            } else if (gameType === 'away') {
              bgColor = 'bg-orange-50/50';
              borderColor = 'border-orange-300';
              textColor = 'text-orange-700';
            } else if (gameType === 'both') {
              bgColor = 'bg-purple-50/50';
              borderColor = 'border-purple-300';
              textColor = 'text-purple-700';
            } else if (dayIsToday) {
              borderColor = 'border-blue-400';
            } else {
              borderColor = 'border-gray-200 hover:border-gray-300';
              bgColor = 'hover:bg-gray-50';
            }
          }

          return (
            <button
              key={index}
              onClick={() => onSelectDate(date)}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${bgColor}
                ${borderColor}
              `}
            >
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-xl mb-1 ${textColor || (dayIsToday ? 'text-blue-500' : '')}`}>
                  {date.getDate()}
                </div>
                {gameType && (
                  <div className={`
                    text-xs px-2 py-0.5 rounded-full inline-block mb-1
                    ${gameType === 'home' 
                      ? (dayIsSelected ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800')
                      : gameType === 'away'
                      ? (dayIsSelected ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800')
                      : (dayIsSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800')
                    }
                  `}>
                    {gameType === 'home' ? '🏠 Home' : gameType === 'away' ? '✈️ Away' : '🏠✈️ Both'}
                  </div>
                )}
                {dayIsToday && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
