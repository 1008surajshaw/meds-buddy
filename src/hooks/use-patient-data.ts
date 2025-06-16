
import { useState, useEffect } from "react"
import {supabase} from "@/utils/supabase"

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  scheduled_time: string
  created_at: string
}

export interface MedicationActivity {
  id: string
  medication_id: string
  date: string
  taken: boolean
  taken_time: string | null
  proof_image_url: string | null
  created_at: string
  medication: Medication
}

export const usePatientData = (patientId: string | null) => {
  const [medications, setMedications] = useState<Medication[]>([])
  const [activities, setActivities] = useState<MedicationActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPatientData = async () => {
    if (!patientId) {
      setMedications([])
      setActivities([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch medications
      const { data: medsData, error: medsError } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", patientId)
        .order("created_at", { ascending: false })

      if (medsError) throw medsError

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: activitiesData, error: activitiesError } = await supabase
        .from("medication_activity")
        .select(`
          *,
          medication:medications(*)
        `)
        .eq("user_id", patientId)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false })

      if (activitiesError) throw activitiesError

      setMedications(medsData || [])
      setActivities(activitiesData || [])
    } catch (error: any) {
      console.error("Error fetching patient data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatientData()
  }, [patientId])

  return {
    medications,
    activities,
    loading,
    error,
    refreshData: fetchPatientData,
  }
}
