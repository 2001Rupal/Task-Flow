import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedTask } from '../taskSlice'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addYears, subYears, startOfWeek, endOfWeek } from 'date-fns'

export default function CalendarView({ projectId }) {
  const dispatch = useDispatch()
  const { list: tasks } = useSelector(s => s.tasks)
  const [current, setCurrent] = useState(new Date())

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const getTasksForDay = (day) =>
    tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day))

  // Better structured Asana-style color mapping
  const getTaskStyle = (task) => {
    if (task.status === 'Done') {
      return 'bg-muted/30 text-muted-foreground opacity-80'
    }
    const styles = {
      Urgent: 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30',
      High:   'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30',
      Medium: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30',
      Low:    'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30',
    }
    return styles[task.priority] || 'bg-muted/40 text-foreground hover:bg-muted/60'
  }

  const handleMonthChange = (e) => {
    if (e.target.value) {
      const [year, month] = e.target.value.split('-')
      const newDate = new Date(current)
      newDate.setFullYear(parseInt(year), parseInt(month) - 1, 1)
      setCurrent(newDate)
    }
  }

  return (
    <div className="p-6 h-full flex flex-col max-w-[1400px] mx-auto w-full">
      {/* Refined Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-6">
          
          {/* Quick-Jump Native Month Picker Title */}
          <div className="relative group flex items-center cursor-pointer rounded-md hover:bg-muted/50 transition-colors px-2 py-1 -ml-2" title="Click to jump to a specific month or year">
            <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {format(current, 'MMMM yyyy')}
            </h2>
            <input 
              type="month" 
              className="absolute inset-0 opacity-0 w-full cursor-pointer"
              value={format(current, 'yyyy-MM')}
              onChange={handleMonthChange}
            />
          </div>
          
          {/* Segmented control for navigation */}
          <div className="flex items-center rounded-lg border border-border/80 bg-background shadow-sm overflow-hidden h-8">
            <button 
              onClick={() => setCurrent(new Date())} 
              className="px-3 h-full text-[12px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border-r border-border/80"
              title="Jump to current month"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrent(d => subYears(d, 1))} 
              className="px-2 h-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border-r border-border/80 flex items-center justify-center"
              title="Previous Year"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setCurrent(d => subMonths(d, 1))} 
              className="px-2 h-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border-r border-border/80 flex items-center justify-center"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setCurrent(d => addMonths(d, 1))} 
              className="px-2 h-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border-r border-border/80 flex items-center justify-center"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setCurrent(d => addYears(d, 1))} 
              className="px-2 h-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center"
              title="Next Year"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container (Spreadsheet style) */}
      <div className="flex-1 flex flex-col border border-border/80 rounded-xl overflow-hidden bg-background card-shadow">
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border/80 bg-muted/20">
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
            <div 
              key={d} 
              className="text-center text-[11px] font-bold text-muted-foreground py-2.5 border-r border-border/80 last:border-r-0 tracking-widest"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(110px,1fr)] overflow-y-auto custom-scrollbar">
          {days.map((day, i) => {
            const dayTasks = getTasksForDay(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, current)
            const isRightEdge = (i + 1) % 7 === 0
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'border-b border-border/60 p-1.5 flex flex-col transition-colors hover:bg-muted/20',
                  !isRightEdge && 'border-r',
                  !isCurrentMonth && 'bg-muted/10 opacity-70'
                )}
              >
                {/* Date Number Top Right */}
                <div className="flex justify-end mb-1">
                  <div className={cn(
                    'text-[12px] font-medium h-6 w-6 flex items-center justify-center rounded-full',
                    isToday ? 'bg-primary text-primary-foreground shadow-sm' : isCurrentMonth ? 'text-foreground hover:bg-muted' : 'text-muted-foreground'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Task Pills */}
                <div className="space-y-[3px] flex-1 overflow-y-auto pr-0.5 custom-scrollbar">
                  {dayTasks.slice(0, 4).map(t => {
                    const isDone = t.status === 'Done'
                    return (
                      <button
                        key={t._id}
                        onClick={() => dispatch(setSelectedTask(t))}
                        className={cn(
                          'w-full text-left px-2 py-1.5 rounded-[6px] transition-all flex items-center gap-2 group',
                          getTaskStyle(t)
                        )}
                      >
                        {/* Inline Checkbox Visual */}
                        <div className={cn(
                          'shrink-0 h-3.5 w-3.5 rounded-full border transition-all flex items-center justify-center',
                          isDone 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-current opacity-40 group-hover:opacity-100 group-hover:bg-background/50'
                        )}>
                          {isDone && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                        </div>
                        
                        <span className={cn('text-[11.5px] font-medium truncate', isDone && 'opacity-60')}>{t.title}</span>
                      </button>
                    )
                  })}
                  {dayTasks.length > 4 && (
                    <button 
                      className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 hover:text-foreground hover:bg-muted w-full text-left rounded-md transition-colors"
                      onClick={() => { /* Potential: Go to specific day view */ }}
                    >
                      +{dayTasks.length - 4} more
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
