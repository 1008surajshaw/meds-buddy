import { format, isToday, isBefore, startOfDay } from "date-fns"

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, "yyyy-MM-dd")
}

export const formatDisplayDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, "MMMM d, yyyy")
}

export const formatDisplayDateTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, "MMM d, h:mm a")
}

export const isDateToday = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return isToday(dateObj)
}

export const isDatePast = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return isBefore(dateObj, startOfDay(new Date()))
}

export const getTodayString = (): string => {
  return format(new Date(), "yyyy-MM-dd")
}

export const getDateDaysAgo = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return format(date, "yyyy-MM-dd")
}
