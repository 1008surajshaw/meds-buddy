
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Check, CalendarIcon, ImageIcon, User } from "lucide-react"
import { format, isToday, isBefore, startOfDay } from "date-fns"
import { useMedications } from "@/hooks/use-medications"
import MedicationTracker from "./MedicationTracker"
import { useMedicationCalendar } from "@/hooks/use-medication-calendar"
import { useAuth } from "@/context/AuthContext"

const PatientDashboard = () => {
  const { user, profile } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const {
    medications,
    loading: medicationsLoading,
    addMedication,
    updateMedication,
    deleteMedication,
  } = useMedications(profile?.user_id || null)

  const { takenDates, loading: calendarLoading } = useMedicationCalendar(profile?.user_id || null, medications)
  // Remove this line:
  // const [takenDates, setTakenDates] = useState<Set<string>>(new Set())

  const today = new Date()
  const todayStr = format(today, "yyyy-MM-dd")
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
  const isTodaySelected = isToday(selectedDate)
  const isSelectedDateTaken = takenDates.has(selectedDateStr)

  const handleMarkTaken = (date: string, imageFile?: File) => {
    // setTakenDates((prev) => new Set(prev).add(date))
    console.log("Medication marked as taken for:", date)
    if (imageFile) {
      console.log("Proof image uploaded:", imageFile.name)
    }
  }

  const getStreakCount = () => {
    let streak = 0
    const currentDate = new Date(today)

    while (takenDates.has(format(currentDate, "yyyy-MM-dd")) && streak < 30) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  }

  if (!profile || profile.role !== "patient") {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>Access denied. This dashboard is only available for patients.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"},{" "}
              {profile.name}!
            </h2>
            <p className="text-white/90 text-lg">Ready to stay on track with your medication?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{getStreakCount()}</div>
            <div className="text-white/80">Day Streak</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{takenDates.has(todayStr) ? "✓" : "○"}</div>
            <div className="text-white/80">Today's Status</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{Math.round((takenDates.size / 30) * 100)}%</div>
            <div className="text-white/80">Monthly Rate</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Medication */}
        <div className="lg:col-span-2">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
                {isTodaySelected ? "Today's Medication" : `Medication for ${format(selectedDate, "MMMM d, yyyy")}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MedicationTracker
                date={selectedDateStr}
                isTaken={isSelectedDateTaken}
                onMarkTaken={handleMarkTaken}
                isToday={isTodaySelected}
                medications={medications}
                loading={medicationsLoading}
                onAddMedication={addMedication}
                onUpdateMedication={updateMedication}
                onDeleteMedication={deleteMedication}
              />
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Medication Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="w-full"
                modifiersClassNames={{
                  selected: "bg-blue-600 text-white hover:bg-blue-700",
                }}
                components={{
                  DayContent: ({ date }) => {
                    const dateStr = format(date, "yyyy-MM-dd")
                    const isPast = isBefore(date, startOfDay(today))
                    const isCurrentDay = isToday(date)

                    // Check if any medication was active on this date
                    const hasActiveMedications = medications.some((med) => {
                      const medCreatedDate = format(new Date(med.created_at), "yyyy-MM-dd")
                      return dateStr >= medCreatedDate
                    })

                    // Only show indicators if medications were active on this date
                    const isTaken = hasActiveMedications && takenDates.has(dateStr)
                    const isMissed = hasActiveMedications && !takenDates.has(dateStr) && isPast && !isCurrentDay

                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span className={!hasActiveMedications && isPast ? "text-gray-300" : ""}>{date.getDate()}</span>
                        {isTaken && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {isMissed && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full"></div>}
                        {isCurrentDay && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <ImageIcon className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                    )
                  },
                }}
              />

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Medication taken</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Missed medication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>No medications active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PatientDashboard
