import { describe, it, expect } from "vitest"

describe("Medication Utility Functions", () => {

  // Helper function to get required doses per day
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

  describe("getRequiredDosesPerDay", () => {
    it("should return correct doses for once daily medication", () => {
      expect(getRequiredDosesPerDay("once_daily")).toBe(1)
    })

    it("should return correct doses for twice daily medication", () => {
      expect(getRequiredDosesPerDay("twice_daily")).toBe(2)
    })

    it("should return correct doses for three times daily medication", () => {
      expect(getRequiredDosesPerDay("three_times_daily")).toBe(3)
    })

    it("should return correct doses for four times daily medication", () => {
      expect(getRequiredDosesPerDay("four_times_daily")).toBe(4)
    })

    it("should return 1 for every other day medication", () => {
      expect(getRequiredDosesPerDay("every_other_day")).toBe(1)
    })

    it("should return 1 for weekly medication", () => {
      expect(getRequiredDosesPerDay("weekly")).toBe(1)
    })

    it("should return 1 for as needed medication", () => {
      expect(getRequiredDosesPerDay("as_needed")).toBe(1)
    })

    it("should return 1 for unknown frequency", () => {
      expect(getRequiredDosesPerDay("unknown_frequency")).toBe(1)
    })

    it("should handle empty string frequency", () => {
      expect(getRequiredDosesPerDay("")).toBe(1)
    })
  })

  describe("calculateNextDoseTime", () => {
    it("should return scheduled time for first dose of once daily medication", () => {
      const result = calculateNextDoseTime("08:00", "once_daily", [])
      expect(result).toBe("08:00")
    })

    it("should return null when once daily medication is already taken", () => {
      const result = calculateNextDoseTime("08:00", "once_daily", ["08:00"])
      expect(result).toBe(null)
    })

    it("should return scheduled time for first dose of twice daily medication", () => {
      const result = calculateNextDoseTime("08:00", "twice_daily", [])
      expect(result).toBe("08:00")
    })

    it("should calculate next dose time for twice daily medication after first dose", () => {
      const result = calculateNextDoseTime("08:00", "twice_daily", ["08:00"])
      expect(result).toBe("20:00") // 8 AM + 12 hours = 8 PM
    })

    it("should return null when twice daily medication is complete", () => {
      const result = calculateNextDoseTime("08:00", "twice_daily", ["08:00", "20:00"])
      expect(result).toBe(null)
    })

    it("should handle three times daily medication progression", () => {
      // First dose
      expect(calculateNextDoseTime("08:00", "three_times_daily", [])).toBe("08:00")

      // Second dose (8 hours later)
      expect(calculateNextDoseTime("08:00", "three_times_daily", ["08:00"])).toBe("16:00")

      // Third dose (16 hours after start)
      expect(calculateNextDoseTime("08:00", "three_times_daily", ["08:00", "16:00"])).toBe("00:00")

      // Complete - no more doses
      expect(calculateNextDoseTime("08:00", "three_times_daily", ["08:00", "16:00", "00:00"])).toBe(null)
    })

    it("should handle four times daily medication with 6-hour intervals", () => {
      // First dose
      expect(calculateNextDoseTime("06:00", "four_times_daily", [])).toBe("06:00")

      // Second dose (6 hours later)
      expect(calculateNextDoseTime("06:00", "four_times_daily", ["06:00"])).toBe("12:00")

      // Third dose (12 hours after start)
      expect(calculateNextDoseTime("06:00", "four_times_daily", ["06:00", "12:00"])).toBe("18:00")

      // Fourth dose (18 hours after start)
      expect(calculateNextDoseTime("06:00", "four_times_daily", ["06:00", "12:00", "18:00"])).toBe("00:00")

      // Complete - no more doses
      expect(calculateNextDoseTime("06:00", "four_times_daily", ["06:00", "12:00", "18:00", "00:00"])).toBe(null)
    })

    it("should handle edge case with midnight times", () => {
      const result = calculateNextDoseTime("00:00", "twice_daily", [])
      expect(result).toBe("00:00")
    })

    it("should handle unknown frequency as once daily", () => {
      expect(calculateNextDoseTime("08:00", "unknown_frequency", [])).toBe("08:00")
      expect(calculateNextDoseTime("08:00", "unknown_frequency", ["08:00"])).toBe(null)
    })
  })
})
