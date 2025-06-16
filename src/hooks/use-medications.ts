
import { useState, useEffect } from "react"
import {supabase} from "@/utils/supabase"

export interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  scheduled_time: string
  created_at: string
}

export interface MedicationFormData {
  name: string
  dosage: string
  frequency: string
  scheduled_time: string
}

export const useMedications = (userId: string | null) => {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMedications = async () => {
    if (!userId) {
      setMedications([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setMedications(data || [])
    } catch (error: any) {
      console.error("Error fetching medications:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addMedication = async (medicationData: MedicationFormData) => {
    console.log(medicationData,"medicationData is this ")
    if (!userId) throw new Error("No user ID provided")

    try {
      const { data, error: insertError } = await supabase
        .from("medications")
        .insert({
          user_id: userId,
          ...medicationData,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Refresh medications list
      await fetchMedications()

      return { success: true, message: "Medication added successfully", data }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const updateMedication = async (medicationId: string, medicationData: Partial<MedicationFormData>) => {
    if (!userId) throw new Error("No user ID provided")

    try {
      const { data, error: updateError } = await supabase
        .from("medications")
        .update(medicationData)
        .eq("id", medicationId)
        .eq("user_id", userId) // Ensure user can only update their own medications
        .select()
        .single()

      if (updateError) throw updateError

      // Refresh medications list
      await fetchMedications()

      return { success: true, message: "Medication updated successfully", data }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const deleteMedication = async (medicationId: string) => {
    if (!userId) throw new Error("No user ID provided")

    try {
      const { error: deleteError } = await supabase
        .from("medications")
        .delete()
        .eq("id", medicationId)
        .eq("user_id", userId) // Ensure user can only delete their own medications

      if (deleteError) throw deleteError

      // Refresh medications list
      await fetchMedications()

      return { success: true, message: "Medication deleted successfully" }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  useEffect(() => {
    fetchMedications()
  }, [userId])

  return {
    medications,
    loading,
    error,
    addMedication,
    updateMedication,
    deleteMedication,
    refreshMedications: fetchMedications,
  }
}
