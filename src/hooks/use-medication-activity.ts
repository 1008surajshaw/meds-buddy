
import { useState } from "react"
import {supabase} from "@/utils/supabase"

export interface MedicationActivity {
  id: string
  user_id: string
  medication_id: string
  date: string
  taken: boolean
  taken_time: string | null
  proof_image_url: string | null
  created_at: string
}

export interface DailyMedicationStatus {
  medication_id: string
  medication_name: string
  scheduled_time: string
  frequency: string
  dosage: string
  taken_today: boolean
  taken_times: string[]
  next_dose_time: string | null
  is_complete_for_day: boolean
}

export const useMedicationActivity = (userId: string | null) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage.from("imagebucket").upload(fileName, file)

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("imagebucket").getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      return null
    }
  }

  const getDailyMedicationStatus = async (date: string, medications: any[]): Promise<DailyMedicationStatus[]> => {
    if (!userId || medications.length === 0) return []

    try {
      const { data: activities, error } = await supabase
        .from("medication_activity")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)

      if (error) throw error

      const activitiesMap = new Map()
      activities?.forEach((activity) => {
        if (!activitiesMap.has(activity.medication_id)) {
          activitiesMap.set(activity.medication_id, [])
        }
        if (activity.taken) {
          activitiesMap.get(activity.medication_id).push(activity.taken_time)
        }
      })

      return medications.map((med) => {
        const takenTimes = activitiesMap.get(med.id) || []
        const requiredDoses = getRequiredDosesPerDay(med.frequency)
        const isCompleteForDay = takenTimes.length >= requiredDoses

        let nextDoseTime = null
        if (!isCompleteForDay) {
          nextDoseTime = calculateNextDoseTime(med.scheduled_time, med.frequency, takenTimes)
        }

        return {
          medication_id: med.id,
          medication_name: med.name,
          scheduled_time: med.scheduled_time,
          frequency: med.frequency,
          dosage: med.dosage,
          taken_today: takenTimes.length > 0,
          taken_times: takenTimes,
          next_dose_time: nextDoseTime,
          is_complete_for_day: isCompleteForDay,
        }
      })
    } catch (error) {
      console.error("Error getting daily status:", error)
      return []
    }
  }

  const getRequiredDosesPerDay = (frequency: string): number => {
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

  const calculateNextDoseTime = (scheduledTime: string, frequency: string, takenTimes: string[]): string | null => {
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
          // Next dose 12 hours later
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

  const markMedicationTaken = async (
    medicationId: string,
    date: string,
    imageFile?: File,
  ): Promise<{ success: boolean; message: string; nextDoseTime?: string }> => {
    if (!userId) throw new Error("No user ID provided")

    try {
      setLoading(true)
      setError(null)

      let imageUrl = null
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, userId)
      }

      const currentTime = new Date().toTimeString().slice(0, 5)

      const { error: insertError } = await supabase.from("medication_activity").insert({
        user_id: userId,
        medication_id: medicationId,
        date: date,
        taken: true,
        taken_time: currentTime,
        proof_image_url: imageUrl,
      })

      if (insertError) throw insertError

      // Get updated status to check for next dose
      const { data: medication } = await supabase.from("medications").select("*").eq("id", medicationId).single()

      if (medication) {
        const { data: todayActivities } = await supabase
          .from("medication_activity")
          .select("taken_time")
          .eq("user_id", userId)
          .eq("medication_id", medicationId)
          .eq("date", date)
          .eq("taken", true)

        const takenTimes = todayActivities?.map((a) => a.taken_time) || []
        const nextDoseTime = calculateNextDoseTime(medication.scheduled_time, medication.frequency, takenTimes)

        return {
          success: true,
          message: "Medication marked as taken successfully",
          nextDoseTime,
        }
      }

      return { success: true, message: "Medication marked as taken successfully" }
    } catch (error: any) {
      setError(error.message)
      throw new Error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const isDayComplete = async (date: string, medications: any[]): Promise<boolean> => {
    if (!userId || medications.length === 0) return false

    const statuses = await getDailyMedicationStatus(date, medications)
    return statuses.every((status) => status.is_complete_for_day)
  }

  return {
    loading,
    error,
    markMedicationTaken,
    getDailyMedicationStatus,
    isDayComplete,
  }
}
