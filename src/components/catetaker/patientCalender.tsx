
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Check, AlertTriangle, Clock, CalendarIcon } from "lucide-react"
import { format, isToday, isBefore, startOfDay } from "date-fns"
import { usePatientData } from "@/hooks/use-patient-data"
import { formatTime } from "@/utils/medication-helpers"
import type { Medication } from "@/types/type"

interface PatientCalendarProps {
  patientId: string
  medications: Medication[]
}

export const PatientCalendar = ({ patientId, medications }: PatientCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { activities } = usePatientData(patientId)

  // Calculate taken dates for calendar
  const takenDates = new Set(activities.filter((a) => a.taken).map((a) => a.date))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medication Calendar Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
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
                  const isPast = isBefore(date, startOfDay(new Date()))
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
                          <Clock className="w-2 h-2 text-white" />
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
          </div>

          <div>
            <h4 className="font-medium mb-4">Details for {format(selectedDate, "MMMM d, yyyy")}</h4>

            <div className="space-y-4">
              {(() => {
                const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
                const dayActivities = activities.filter((a) => a.date === selectedDateStr)
                const takenActivities = dayActivities.filter((a) => a.taken)
                const missedMedications = medications.filter((med) => {
                  const medCreatedDate = format(new Date(med.created_at), "yyyy-MM-dd")
                  const isAfterCreation = selectedDateStr >= medCreatedDate
                  const hasTakenActivity = dayActivities.some((a) => a.medication_id === med.id && a.taken)
                  return isAfterCreation && !hasTakenActivity && isBefore(selectedDate, startOfDay(new Date()))
                })

                if (takenActivities.length > 0) {
                  return (
                    <div className="space-y-3">
                      {takenActivities.map((activity, index) => (
                        <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800">
                              {activity.medication?.name || "Unknown Medication"} - Taken
                            </span>
                          </div>
                          <p className="text-sm text-green-700">
                            Taken at {activity.taken_time} on this day
                            {activity.proof_image_url && " • Photo proof provided"}
                          </p>
                        </div>
                      ))}
                      {missedMedications.length > 0 && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span className="font-medium text-red-800">Missed Medications</span>
                          </div>
                          <div className="space-y-1">
                            {missedMedications.map((med) => (
                              <p key={med.id} className="text-sm text-red-700">
                                • {med.name} ({med.dosage}) - scheduled at {formatTime(med.scheduled_time)}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                } else if (missedMedications.length > 0) {
                  return (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-800">All Medications Missed</span>
                      </div>
                      <div className="space-y-1">
                        {missedMedications.map((med) => (
                          <p key={med.id} className="text-sm text-red-700">
                            • {med.name} ({med.dosage}) - scheduled at {formatTime(med.scheduled_time)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )
                } else if (isToday(selectedDate)) {
                  return (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Today</span>
                      </div>
                      <p className="text-sm text-blue-700">Monitor medication status for today.</p>
                      {medications.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium text-blue-800">Today's Schedule:</p>
                          {medications.map((med) => (
                            <p key={med.id} className="text-sm text-blue-700">
                              • {med.name} at {formatTime(med.scheduled_time)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                } else {
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-800">No Activity</span>
                      </div>
                      <p className="text-sm text-gray-700">No medication activity recorded for this date.</p>
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
