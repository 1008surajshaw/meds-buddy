
import { useState, useEffect } from "react"
import {supabase} from "@/utils/supabase"
import { format, subDays } from "date-fns"

export interface AdherenceMetrics {
  overall_rate: number
  current_streak: number
  longest_streak: number
  missed_doses_this_week: number
  missed_doses_this_month: number
  total_medications: number
  days_tracked: number
  weekly_trend: number[]
  monthly_trend: { date: string; rate: number }[]
}

export interface PatientAdherence {
  patient_id: string
  patient_name: string
  metrics: AdherenceMetrics
  last_updated: string
}

export const useAdherenceTracking = (patientIds: string[] = []) => {
  const [adherenceData, setAdherenceData] = useState<PatientAdherence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateAdherenceMetrics = async (patientId: string): Promise<AdherenceMetrics> => {
    try {
      // Get patient's medications
      const { data: medications } = await supabase.from("medications").select("*").eq("user_id", patientId)

      if (!medications || medications.length === 0) {
        return {
          overall_rate: 0,
          current_streak: 0,
          longest_streak: 0,
          missed_doses_this_week: 0,
          missed_doses_this_month: 0,
          total_medications: 0,
          days_tracked: 0,
          weekly_trend: [0, 0, 0, 0, 0, 0, 0],
          monthly_trend: [],
        }
      }

      // Get earliest medication creation date
      const earliestMedDate = medications.reduce((earliest, med) => {
        const medDate = new Date(med.created_at)
        return medDate < earliest ? medDate : earliest
      }, new Date(medications[0].created_at))

      const startDate = format(earliestMedDate, "yyyy-MM-dd")
      const endDate = format(new Date(), "yyyy-MM-dd")

      // Get all medication activities
      const { data: activities } = await supabase
        .from("medication_activity")
        .select("*")
        .eq("user_id", patientId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true })

      // Calculate metrics
      const metrics = calculateMetricsFromActivities(activities || [], medications, earliestMedDate)

      return metrics
    } catch (error) {
      console.error("Error calculating adherence metrics:", error)
      return {
        overall_rate: 0,
        current_streak: 0,
        longest_streak: 0,
        missed_doses_this_week: 0,
        missed_doses_this_month: 0,
        total_medications: 0,
        days_tracked: 0,
        weekly_trend: [0, 0, 0, 0, 0, 0, 0],
        monthly_trend: [],
      }
    }
  }

  const calculateMetricsFromActivities = (activities: any[], medications: any[], startDate: Date): AdherenceMetrics => {
    const today = new Date()
    const daysTracked = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Group activities by date
    const activitiesByDate = new Map<string, any[]>()
    activities.forEach((activity) => {
      if (!activitiesByDate.has(activity.date)) {
        activitiesByDate.set(activity.date, [])
      }
      activitiesByDate.get(activity.date)?.push(activity)
    })

    // Calculate daily adherence rates
    const dailyRates: { date: string; rate: number }[] = []
    let totalDays = 0
    let adherentDays = 0

    for (let i = 0; i < daysTracked; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + i)
      const dateStr = format(currentDate, "yyyy-MM-dd")

      // Get medications active on this date
      const activeMedications = medications.filter((med) => {
        const medCreatedDate = format(new Date(med.created_at), "yyyy-MM-dd")
        return dateStr >= medCreatedDate
      })

      if (activeMedications.length === 0) continue

      const dayActivities = activitiesByDate.get(dateStr) || []
      const takenCount = dayActivities.filter((a) => a.taken).length
      const requiredCount = activeMedications.reduce((sum, med) => sum + getRequiredDosesPerDay(med.frequency), 0)

      const dayRate = requiredCount > 0 ? (takenCount / requiredCount) * 100 : 0
      dailyRates.push({ date: dateStr, rate: dayRate })

      totalDays++
      if (dayRate >= 80) adherentDays++ // Consider 80%+ as adherent day
    }

    // Calculate overall rate
    const overallRate = totalDays > 0 ? Math.round((adherentDays / totalDays) * 100) : 0

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(dailyRates)

    // Calculate weekly trend (last 7 days)
    const weeklyTrend = dailyRates.slice(-7).map((d) => Math.round(d.rate))
    while (weeklyTrend.length < 7) {
      weeklyTrend.unshift(0)
    }

    // Calculate missed doses
    const oneWeekAgo = format(subDays(today, 7), "yyyy-MM-dd")
    const oneMonthAgo = format(subDays(today, 30), "yyyy-MM-dd")

    const missedThisWeek = activities.filter(
      (a) => !a.taken && a.date >= oneWeekAgo && a.date <= format(today, "yyyy-MM-dd"),
    ).length

    const missedThisMonth = activities.filter(
      (a) => !a.taken && a.date >= oneMonthAgo && a.date <= format(today, "yyyy-MM-dd"),
    ).length

    return {
      overall_rate: overallRate,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      missed_doses_this_week: missedThisWeek,
      missed_doses_this_month: missedThisMonth,
      total_medications: medications.length,
      days_tracked: totalDays,
      weekly_trend: weeklyTrend,
      monthly_trend: dailyRates.slice(-30), // Last 30 days
    }
  }

  const calculateStreaks = (dailyRates: { date: string; rate: number }[]) => {
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Calculate current streak (from today backwards)
    for (let i = dailyRates.length - 1; i >= 0; i--) {
      if (dailyRates[i].rate >= 80) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    dailyRates.forEach((day) => {
      if (day.rate >= 80) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    })

    return { currentStreak, longestStreak }
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

  const loadAdherenceData = async () => {
    if (patientIds.length === 0) {
      setAdherenceData([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const adherencePromises = patientIds.map(async (patientId) => {
        // Get patient name
        const { data: patient } = await supabase.from("user_profiles").select("name").eq("user_id", patientId).single()

        const metrics = await calculateAdherenceMetrics(patientId)

        return {
          patient_id: patientId,
          patient_name: patient?.name || "Unknown Patient",
          metrics,
          last_updated: new Date().toISOString(),
        }
      })

      const results = await Promise.all(adherencePromises)
      setAdherenceData(results)
    } catch (error: any) {
      console.error("Error loading adherence data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdherenceData()
  }, [patientIds])

  const refreshAdherence = () => {
    loadAdherenceData()
  }

  return {
    adherenceData,
    loading,
    error,
    refreshAdherence,
  }
}
