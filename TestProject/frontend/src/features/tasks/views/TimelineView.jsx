import { useSelector, useDispatch } from 'react-redux'
import { setSelectedTask, updateTask } from '../taskSlice'
import { Check, CalendarRange, Clock, CircleDashed } from 'lucide-react'
import { format, differenceInDays, startOfDay, addDays, min, max, isSameDay } from 'date-fns'
import { cn } from '../../../lib/utils'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip'

const DAY_WIDTH = 48 // Expanded px per day for breathable text
const LEFT_W = 280 // Fixed width for sticky left pane

export default function TimelineView({ projectId }) {
  const dispatch = useDispatch()
  const { list: tasks } = useSelector(s => s.tasks)

  const tasksWithDates = tasks.filter(t => t.startDate || t.dueDate)

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No tasks with dates to display. Add start/due dates to see the timeline.
      </div>
    )
  }

  const allDates = tasksWithDates.flatMap(t => [
    t.startDate ? new Date(t.startDate) : null,
    t.dueDate ? new Date(t.dueDate) : null
  ].filter(Boolean))

  const timelineStart = startOfDay(addDays(min(allDates), -2))
  const timelineEnd = startOfDay(addDays(max(allDates), 5))
  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1
  const totalWidth = totalDays * DAY_WIDTH

  const today = startOfDay(new Date())
  const todayOffset = differenceInDays(today, timelineStart) * DAY_WIDTH

  // Generate day array
  const days = Array.from({ length: totalDays }, (_, i) => addDays(timelineStart, i))

  // Group months for header
  const months = []
  let currentMonth = null
  days.forEach((d) => {
    const m = format(d, 'MMMM yyyy')
    if (currentMonth !== m) {
      months.push({ label: m, count: 1 })
      currentMonth = m
    } else {
      months[months.length - 1].count++
    }
  })

  const getTaskStyle = (task) => {
    if (task.status === 'Done') {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 outline outline-1 outline-emerald-300/60 dark:outline-emerald-700 font-bold shadow-sm'
    }
    if (task.status === 'In Progress') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 outline outline-1 outline-blue-300/60 dark:outline-blue-700 font-bold shadow-sm'
    }
    
    // For To-Do tasks, fallback to their Priority coloring
    const styles = {
      Urgent: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 outline outline-1 outline-red-300/60 dark:outline-red-700 font-semibold shadow-sm',
      High:   'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 outline outline-1 outline-orange-300/60 dark:outline-orange-700 font-semibold shadow-sm',
      Medium: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 outline outline-1 outline-amber-300/60 dark:outline-amber-700 font-semibold shadow-sm',
      Low:    'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 outline outline-1 outline-slate-300/60 dark:outline-slate-700 font-semibold shadow-sm',
    }
    return styles[task.priority] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 outline outline-1 outline-border font-medium shadow-sm'
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex-1 overflow-auto h-full bg-background custom-scrollbar relative">
        <div style={{ minWidth: LEFT_W + totalWidth }} className="inline-block min-h-full pb-8 flex flex-col">
        
        {/* Header Row */}
        <div className="flex sticky top-0 z-40 bg-background border-b border-border/80 shadow-sm">
          
          {/* Sticky Left Header */}
          <div className="shrink-0 sticky left-0 z-50 bg-background border-r border-border/80 flex flex-col justify-end px-5 py-3 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]" style={{ width: LEFT_W }}>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Task Name</span>
          </div>

          {/* Right Header (Timeline Canvas) */}
          <div className="flex flex-col relative bg-muted/10" style={{ width: totalWidth }}>
            
            {/* Top Tier: Months */}
            <div className="flex border-b border-border/60">
              {months.map(m => (
                <div key={m.label} style={{ width: m.count * DAY_WIDTH }} className="px-3 py-1.5 text-[11.5px] font-bold text-foreground border-r border-border/60 truncate">
                  {m.label}
                </div>
              ))}
            </div>

            {/* Bottom Tier: Days */}
            <div className="flex">
              {days.map((d, i) => {
                const dayType = format(d, 'E')
                const isWeekend = dayType === 'Sun' || dayType === 'Sat'
                const isToday = isSameDay(d, today)
                
                return (
                  <div key={i} style={{ width: DAY_WIDTH }} className={cn("flex flex-col items-center py-1.5 border-r border-border/50", isWeekend && "bg-muted/30")}>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{format(d, 'eeeee')}</span>
                    <span className={cn("text-[11px] font-bold h-5 w-5 flex items-center justify-center rounded-full mt-0.5", isToday && "bg-primary text-primary-foreground shadow-sm")}>
                      {format(d, 'd')}
                    </span>
                  </div>
                )
              })}
            </div>

          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 relative min-h-[300px]">
          
          {/* Vertical Background Foundation (Grid + Left Pane Extension) */}
          <div className="absolute top-0 bottom-0 flex z-0 pointer-events-none" style={{ width: totalWidth + LEFT_W, minWidth: '100%' }}>
            
            {/* Left Column Structural Extension */}
            <div 
              className="shrink-0 bg-background border-r border-border/80 sticky left-0 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]" 
              style={{ width: LEFT_W }} 
            />
            
            {/* Right Canvas Grid Lines */}
            <div className="flex relative" style={{ width: totalWidth }}>
              {days.map((d, i) => {
                const isWeekend = format(d, 'E') === 'Sun' || format(d, 'E') === 'Sat'
                return (
                  <div key={i} style={{ width: DAY_WIDTH }} className={cn("border-r border-border/40", isWeekend && "bg-muted/10")} />
                )
              })}
            </div>

          </div>

          {/* Today Indicator Line */}
          <div className="absolute top-0 bottom-0 w-px bg-primary z-20 pointer-events-none" style={{ left: LEFT_W + todayOffset + (DAY_WIDTH / 2) }}>
            <div className="absolute -top-[1px] -left-[3px] w-2 h-2 rounded-full bg-primary ring-2 ring-background shadow-sm" />
          </div>

          {/* Task Rows */}
          <div className="relative z-10 flex flex-col w-full">
            {tasksWithDates.map(task => {
              const start = task.startDate ? startOfDay(new Date(task.startDate)) : startOfDay(new Date(task.dueDate))
              const end = task.dueDate ? startOfDay(new Date(task.dueDate)) : start
              const left = differenceInDays(start, timelineStart) * DAY_WIDTH
              const width = Math.max((differenceInDays(end, start) + 1) * DAY_WIDTH, DAY_WIDTH)
              const isDone = task.status === 'Done'

              return (
                <div key={task._id} className="flex border-b border-border/40 hover:bg-muted/20 transition-colors group">
                  
                  {/* Sticky Task Label Column */}
                  <div 
                    className="shrink-0 sticky left-0 z-30 bg-background group-hover:bg-muted/30 border-r border-border/80 px-5 py-3 flex items-center shadow-[1px_0_0_0_rgba(0,0,0,0.02)] transition-colors" 
                    style={{ width: LEFT_W }}
                  >
                    <button onClick={() => dispatch(setSelectedTask(task))} className="flex items-center gap-3 w-full text-left truncate">
                      <div className={cn(
                        "shrink-0 h-4 w-4 rounded-[4px] border flex flex-col items-center justify-center transition-all duration-200", 
                        isDone ? "bg-green-500 border-green-500 shadow-sm" : "border-muted-foreground/40 group-hover:border-primary/50"
                      )}>
                        {isDone && <Check strokeWidth={3} className="h-3 w-3 text-white" />}
                      </div>
                      <span className={cn("text-[13px] font-medium truncate w-full", isDone && "text-emerald-800 dark:text-emerald-400 opacity-90")}>
                        {task.title}
                      </span>
                    </button>
                  </div>
                  
                  {/* Timeline Row */}
                  <div className="relative h-[48px] shrink-0 flex items-center" style={{ width: totalWidth }}>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            'absolute h-[26px] rounded-md px-1.5 flex items-center gap-1.5 justify-start transition-all hover:brightness-95 shadow-sm group/pill overflow-hidden border', 
                            getTaskStyle(task)
                          )}
                          style={{ left: left + 4, width: Math.max(width - 8, 8) }}
                          onClick={() => dispatch(setSelectedTask(task))}
                        >
                          {/* Status Icon */}
                          <div className="shrink-0 opacity-80">
                            {isDone ? (
                              <Check className="h-3 w-3" strokeWidth={3} />
                            ) : task.status === 'In Progress' ? (
                              <Clock className="h-3 w-3" strokeWidth={2.5} />
                            ) : (
                              <CircleDashed className="h-3 w-3" strokeWidth={2} />
                            )}
                          </div>
                          <span className={cn(
                            "text-[10.5px] whitespace-nowrap font-semibold transition-colors w-full text-left truncate leading-none", 
                            isDone && "opacity-90"
                          )}>
                            {task.title}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6} className="bg-popover text-popover-foreground border border-border shadow-lg flex flex-col gap-1 p-3">
                        <p className="font-semibold text-sm max-w-[250px] leading-tight">{task.title}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><CalendarRange className="h-3 w-3" /> Due {format(startOfDay(new Date(task.dueDate || task.startDate)), 'MMM d')}</span>
                          <span>•</span>
                          <span>{task.priority || 'No Priority'}</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
    </TooltipProvider>
  )
}
