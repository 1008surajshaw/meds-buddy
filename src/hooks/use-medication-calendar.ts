
import { useState, useEffect } from "react"
import {supabase} from "@/utils/supabase"
import { format } from "date-fns"

export const useMedicationCalendar = (userId: string | null, medications: any[]) => {
  const [takenDates, setTakenDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMedicationActivity = async () => {
      if (!userId || medications.length === 0) {
        setTakenDates(new Set())
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Get the earliest medication creation date
        const earliestMedDate = medications.reduce((earliest, med) => {
          const medDate = new Date(med.created_at)
          return medDate < earliest ? medDate : earliest
        }, new Date(medications[0].created_at))

        const startDate = format(earliestMedDate, "yyyy-MM-dd")

        // Get all medication activities from the earliest medication date
        const { data: activities, error } = await supabase
          .from("medication_activity")
          .select("date, taken, medication_id")
          .eq("user_id", userId)
          .eq("taken", true)
          .gte("date", startDate)

        if (error) throw error

        // Group activities by date and check if any medication was taken each day
        const takenDatesSet = new Set<string>()
        const activitiesByDate = new Map<string, Set<string>>()

        activities?.forEach((activity) => {
          if (!activitiesByDate.has(activity.date)) {
            activitiesByDate.set(activity.date, new Set())
          }
          activitiesByDate.get(activity.date)?.add(activity.medication_id)
        })

        // A date is "taken" if at least one medication was taken that day
        activitiesByDate.forEach((medicationIds, date) => {
          if (medicationIds.size > 0) {
            takenDatesSet.add(date)
          }
        })

        setTakenDates(takenDatesSet)
      } catch (error) {
        console.error("Error loading medication calendar:", error)
        setTakenDates(new Set())
      } finally {
        setLoading(false)
      }
    }

    loadMedicationActivity()
  }, [userId, medications])

  return { takenDates, loading }
}
