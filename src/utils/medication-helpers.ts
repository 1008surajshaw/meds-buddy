import { MedicationFrequency } from "@/types/type"

export const getRequiredDosesPerDay = (frequency: MedicationFrequency): number => {
  switch (frequency) {
    case "once_daily":
      return 1
    case "twice_daily":
      return 2
    case "three_times_daily":
      return 3
    case "four_times_daily":
      return 4
    case "every_other_day":
      return 1
    case "weekly":
      return 1
    case "as_needed":
      return 1
    default:
      return 1
  }
}

export const calculateNextDoseTime = (
  scheduledTime: string,
  frequency: MedicationFrequency,
  takenTimes: string[],
): string | null => {
  const requiredDoses = getRequiredDosesPerDay(frequency)
  if (takenTimes.length >= requiredDoses) return null

  const [hours, minutes] = scheduledTime.split(":").map(Number)
  const baseTime = new Date()
  baseTime.setHours(hours, minutes, 0, 0)

  switch (frequency) {
    case "twice_daily":
      if (takenTimes.length === 0) {
        return scheduledTime
      } else {
        const nextTime = new Date(baseTime)
        nextTime.setHours(nextTime.getHours() + 12)
        return nextTime.toTimeString().slice(0, 5)
      }
    case "three_times_daily":
      if (takenTimes.length === 0) {
        return scheduledTime
      } else if (takenTimes.length === 1) {
        const nextTime = new Date(baseTime)
        nextTime.setHours(nextTime.getHours() + 8)
        return nextTime.toTimeString().slice(0, 5)
      } else {
        const nextTime = new Date(baseTime)
        nextTime.setHours(nextTime.getHours() + 16)
        return nextTime.toTimeString().slice(0, 5)
      }
    case "four_times_daily":
      const intervals = [0, 6, 12, 18]
      const nextInterval = intervals[takenTimes.length]
      if (nextInterval !== undefined) {
        const nextTime = new Date(baseTime)
        nextTime.setHours(hours + nextInterval)
        return nextTime.toTimeString().slice(0, 5)
      }
      return null
    default:
      return takenTimes.length === 0 ? scheduledTime : null
  }
}

export const formatTime = (time: string): string => {
  try {
    const [hours, minutes] = time.split(":")
    const date = new Date()
    date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  } catch {
    return time
  }
}

export const frequencyLabels: Record<MedicationFrequency, string> = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  three_times_daily: "Three times daily",
  four_times_daily: "Four times daily",
  every_other_day: "Every other day",
  weekly: "Weekly",
  as_needed: "As needed",
}

export const frequencyOptions = [
  { value: "once_daily" as const, label: "Once daily" },
  { value: "twice_daily" as const, label: "Twice daily" },
  { value: "three_times_daily" as const, label: "Three times daily" },
  { value: "four_times_daily" as const, label: "Four times daily" },
  { value: "every_other_day" as const, label: "Every other day" },
  { value: "weekly" as const, label: "Weekly" },
  { value: "as_needed" as const, label: "As needed" },
]
