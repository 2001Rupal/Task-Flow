import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const PRIORITY_COLORS = {
  Low:    'text-green-500',
  Medium: 'text-yellow-500',
  High:   'text-orange-500',
  Urgent: 'text-red-500'
}

export const PRIORITY_BG = {
  Low:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  High:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

export function formatDate(date) {
  if (!date) return null
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'Done') return false
  return new Date(dueDate) < new Date()
}

export function getInitials(name, email) {
  const str = name || email || '?'
  return str.slice(0, 2).toUpperCase()
}
