
import { useState, useEffect, useCallback } from "react"
import {supabase} from "@/utils/supabase"

export interface PatientWithStats {
  user_id: string
  name: string
  created_at: string
  adherence_rate: number
  current_streak: number
  missed_doses: number
  last_taken: string | null
  total_medications: number
}

export interface PatientSearchResult {
  user_id: string
  name: string
  created_at: string
  already_assigned: boolean
}

export const useCaretakerPatients = (caretakerId: string | null) => {
  const [patients, setPatients] = useState<PatientWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const fetchPatients = async () => {
    if (!caretakerId) {
      setPatients([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // First, get the caretaker-patient relationships
      const { data: relationships, error: relationError } = await supabase
        .from("caretaker_patients")
        .select("patient_id")
        .eq("caretaker_id", caretakerId)

      if (relationError) {
        console.error("Relation error:", relationError)
        throw relationError
      }

      if (!relationships || relationships.length === 0) {
        setPatients([])
        setLoading(false)
        return
      }

      // Get patient IDs
      const patientIds = relationships.map((rel) => rel.patient_id)

      // Get patient profiles
      const { data: patientProfiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id, name, created_at")
        .in("user_id", patientIds)

      if (profileError) {
        console.error("Profile error:", profileError)
        throw profileError
      }

      if (!patientProfiles) {
        setPatients([])
        setLoading(false)
        return
      }

      // Calculate stats for each patient
      const patientsWithStats = await Promise.all(
        patientProfiles.map(async (patient) => {
          try {
            // Get patient's medications count
            const { data: medications, error: medError } = await supabase
              .from("medications")
              .select("id")
              .eq("user_id", patient.user_id)

            if (medError) {
              console.error("Medication error for patient", patient.user_id, medError)
            }

            // Get medication activity for the last 30 days
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data: activities, error: activityError } = await supabase
              .from("medication_activity")
              .select("date, taken")
              .eq("user_id", patient.user_id)
              .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
              .order("date", { ascending: false })

            if (activityError) {
              console.error("Activity error for patient", patient.user_id, activityError)
            }

            // Calculate stats with fallbacks
            const totalActivities = activities?.length || 0
            const takenActivities = activities?.filter((a) => a.taken === true).length || 0
            const adherenceRate = totalActivities > 0 ? Math.round((takenActivities / totalActivities) * 100) : 0

            // Calculate current streak
            let currentStreak = 0
            if (activities && activities.length > 0) {
              const sortedActivities = [...activities].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
              )

              for (const activity of sortedActivities) {
                if (activity.taken === true) {
                  currentStreak++
                } else {
                  break
                }
              }
            }

            // Count missed doses
            const missedDoses = activities?.filter((a) => a.taken === false).length || 0

            // Get last taken date
            const lastTakenActivity = activities?.find((a) => a.taken === true)
            const lastTaken = lastTakenActivity?.date || null

            return {
              user_id: patient.user_id,
              name: patient.name || "Unknown Patient",
              created_at: patient.created_at,
              adherence_rate: adherenceRate,
              current_streak: currentStreak,
              missed_doses: missedDoses,
              last_taken: lastTaken,
              total_medications: medications?.length || 0,
            }
          } catch (patientError) {
            console.error("Error processing patient", patient.user_id, patientError)
            // Return default stats if there's an error
            return {
              user_id: patient.user_id,
              name: patient.name || "Unknown Patient",
              created_at: patient.created_at,
              adherence_rate: 0,
              current_streak: 0,
              missed_doses: 0,
              last_taken: null,
              total_medications: 0,
            }
          }
        }),
      )

      setPatients(patientsWithStats)
    } catch (error: any) {
      console.error("Error fetching patients:", error)
      setError(error.message || "Failed to fetch patients")
    } finally {
      setLoading(false)
    }
  }

  const searchPatients = useCallback(
    async (searchTerm: string) => {
      if (!caretakerId || !searchTerm.trim() || searchTerm.trim().length < 2) {
        setSearchResults([])
        return
      }

      try {
        setSearchLoading(true)

        // Get current assigned patient IDs
        const { data: currentPatients } = await supabase
          .from("caretaker_patients")
          .select("patient_id")
          .eq("caretaker_id", caretakerId)

        const assignedPatientIds = currentPatients?.map((p) => p.patient_id) || []

        // Search for patients by name
        const { data: searchData, error: searchError } = await supabase
          .from("user_profiles")
          .select("user_id, name, created_at")
          .eq("role", "patient")
          .ilike("name", `%${searchTerm.trim()}%`)
          .limit(10)

        if (searchError) {
          console.error("Search error:", searchError)
          throw searchError
        }

        // Format results with assignment status
        const results: PatientSearchResult[] =
          searchData?.map((patient) => ({
            user_id: patient.user_id,
            name: patient.name || "Unknown Patient",
            created_at: patient.created_at,
            already_assigned: assignedPatientIds.includes(patient.user_id),
          })) || []

        setSearchResults(results)
      } catch (error: any) {
        console.error("Error searching patients:", error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    },
    [caretakerId],
  )

  const addPatientById = async (patientId: string) => {
    if (!caretakerId) throw new Error("No caretaker ID provided")

    try {
      // Check if relationship already exists
      const { data: existing } = await supabase
        .from("caretaker_patients")
        .select("id")
        .eq("caretaker_id", caretakerId)
        .eq("patient_id", patientId)
        .maybeSingle()

      if (existing) {
        throw new Error("Patient is already assigned to you")
      }

      // Create the relationship
      const { error: insertError } = await supabase.from("caretaker_patients").insert({
        caretaker_id: caretakerId,
        patient_id: patientId,
      })

      if (insertError) throw insertError

      // Refresh the patients list
      await fetchPatients()

      // Clear search results
      setSearchResults([])

      return { success: true, message: "Patient added successfully" }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const removePatient = async (patientId: string) => {
    if (!caretakerId) throw new Error("No caretaker ID provided")

    try {
      const { error } = await supabase
        .from("caretaker_patients")
        .delete()
        .eq("caretaker_id", caretakerId)
        .eq("patient_id", patientId)

      if (error) throw error

      // Refresh the patients list
      await fetchPatients()

      return { success: true, message: "Patient removed successfully" }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const deletePatientMedications = async (patientId: string) => {
    if (!caretakerId) throw new Error("No caretaker ID provided")

    try {
      // First, verify that this caretaker has access to this patient
      const { data: relationship } = await supabase
        .from("caretaker_patients")
        .select("id")
        .eq("caretaker_id", caretakerId)
        .eq("patient_id", patientId)
        .maybeSingle()

      if (!relationship) {
        throw new Error("You don't have permission to manage this patient's medications")
      }

      // Get all medications for this patient
      const { data: medications, error: medicationsError } = await supabase
        .from("medications")
        .select("id")
        .eq("user_id", patientId)

      if (medicationsError) throw medicationsError

      if (!medications || medications.length === 0) {
        return { success: true, message: "No medications found to delete", deletedCount: 0 }
      }

      const medicationIds = medications.map((med) => med.id)

      // Delete all medication activities first (due to foreign key constraints)
      const { error: activitiesError } = await supabase.from("medication_activity").delete().eq("user_id", patientId)

      if (activitiesError) {
        console.error("Error deleting medication activities:", activitiesError)
        // Continue anyway, as this might not be critical
      }

      // Delete all medications for this patient
      const { error: medicationsDeleteError } = await supabase.from("medications").delete().eq("user_id", patientId)

      if (medicationsDeleteError) throw medicationsDeleteError

      // Refresh the patients list to update medication counts
      await fetchPatients()

      return {
        success: true,
        message: `Successfully deleted ${medications.length} medication(s) and related activities`,
        deletedCount: medications.length,
      }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const clearSearch = useCallback(() => {
    setSearchResults([])
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [caretakerId])

  return {
    patients,
    loading,
    error,
    searchResults,
    searchLoading,
    searchPatients,
    addPatientById,
    removePatient,
    deletePatientMedications, // New function
    clearSearch,
    refreshPatients: fetchPatients,
  }
}
