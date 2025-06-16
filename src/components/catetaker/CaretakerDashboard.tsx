"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Users, Bell, CalendarIcon, Mail, AlertTriangle, Check, Clock, Camera, ArrowLeft } from "lucide-react"
import { format, isToday, isBefore, startOfDay } from "date-fns"
import { useCaretakerPatients } from "@/hooks/use-caretaker-patients"
import { usePatientData } from "@/hooks/use-patient-data"
import { useMedications } from "@/hooks/use-medications"
import { PatientSelector } from "./patient-selector"
import { MedicationList } from "../medications/medication-list"
import NotificationSettings from "../NotificationSettings"
import { AdherenceDashboard } from "./adherence-dashboard"
import { useAuth } from "@/context/AuthContext"

const formatTime = (time: string) => {
  try {
    const [hours, minutes] = time.split(":")
    const date = new Date()
    date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  } catch {
    return time
  }
}

const CaretakerDashboard = () => {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState("patients")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const {
    patients,
    loading: patientsLoading,
    error: patientsError,
    searchResults,
    searchLoading,
    searchPatients,
    addPatientById,
    removePatient,
    deletePatientMedications,
    clearSearch,
  } = useCaretakerPatients(profile?.user_id || null)

  const { medications, activities, loading: patientDataLoading } = usePatientData(selectedPatientId)

  // Get medications hook for the selected patient
  const {
    medications: patientMedications,
    loading: medicationsLoading,
    addMedication,
    updateMedication,
    deleteMedication,
  } = useMedications(selectedPatientId)

  const selectedPatient = patients.find((p) => p.user_id === selectedPatientId)

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId)
    setActiveTab("overview")
  }

  const handleBackToPatients = () => {
    setSelectedPatientId(null)
    setActiveTab("patients")
  }

  const handleAddPatient = async (patientId: string, patientName: string) => {
    return await addPatientById(patientId)
  }

  const handleManageMedications = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId)
    setActiveTab("medications")
  }

  // Calculate taken dates for calendar
  const takenDates = new Set(activities.filter((a) => a.taken).map((a) => a.date))

  const recentActivity = activities.slice(0, 5).map((activity) => ({
    date: activity.date,
    taken: activity.taken,
    time: activity.taken_time,
    hasPhoto: !!activity.proof_image_url,
    medicationName: activity.medication?.name || "Unknown Medication",
  }))

  if (!profile || profile.role !== "caretaker") {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>Access denied. This dashboard is only available for caretakers.</p>
        </CardContent>
      </Card>
    )
  }

  // Show patient selector if no patient is selected
  if (!selectedPatientId) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Caretaker Dashboard</h2>
              <p className="text-white/90 text-lg">Welcome back, {profile.name}</p>
            </div>
          </div>
        </div>

        <PatientSelector
          patients={patients}
          selectedPatientId={selectedPatientId}
          onSelectPatient={handleSelectPatient}
          onAddPatient={handleAddPatient}
          onRemovePatient={removePatient}
          onDeletePatientMedications={deletePatientMedications} // Add this
          onManageMedications={handleManageMedications}
          loading={patientsLoading}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onSearch={searchPatients}
          onClearSearch={clearSearch}
        />
      </div>
    )
  }

  // Show patient-specific dashboard
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackToPatients} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Monitoring {selectedPatient?.name}</h2>
            <p className="text-white/90 text-lg">Medication adherence dashboard</p>
          </div>
        </div>

        {selectedPatient && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{selectedPatient.adherence_rate}%</div>
              <div className="text-white/80">Adherence Rate</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{selectedPatient.current_streak}</div>
              <div className="text-white/80">Current Streak</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{selectedPatient.missed_doses}</div>
              <div className="text-white/80">Missed This Month</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{selectedPatient.total_medications}</div>
              <div className="text-white/80">Total Medications</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Today's Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  Today's Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientMedications.length === 0 ? (
                  <p className="text-muted-foreground">No medications found for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {patientMedications.map((med) => {
                      const todayActivity = activities.find(
                        (a) => a.medication_id === med.id && a.date === format(new Date(), "yyyy-MM-dd"),
                      )

                      return (
                        <div key={med.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{med.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {med.dosage} - {med.scheduled_time}
                            </p>
                          </div>
                          <Badge variant={todayActivity?.taken ? "secondary" : "destructive"}>
                            {todayActivity?.taken ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

         
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reminder Email
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Configure Notifications
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("calendar")}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  View Full Calendar
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Adherence Dashboard */}

          {/* Existing Adherence Progress - keep this too */}
          {selectedPatient && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Adherence Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{selectedPatient.adherence_rate}%</span>
                  </div>
                  <Progress value={selectedPatient.adherence_rate} className="h-3" />
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="font-medium text-green-600">
                        {Math.round((30 * selectedPatient.adherence_rate) / 100)} days
                      </div>
                      <div className="text-muted-foreground">Taken</div>
                    </div>
                    <div>
                      <div className="font-medium text-red-600">{selectedPatient.missed_doses} days</div>
                      <div className="text-muted-foreground">Missed</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-600">
                        {30 - Math.round((30 * selectedPatient.adherence_rate) / 100) - selectedPatient.missed_doses}{" "}
                        days
                      </div>
                      <div className="text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="medications" className="space-y-6">
          <MedicationList
            medications={patientMedications}
            loading={medicationsLoading}
            onAddMedication={addMedication}
            onUpdateMedication={updateMedication}
            onDeleteMedication={deleteMedication}
            canEdit={true} // Caretakers can manage patient medications
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Medication Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recent activity found.</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.taken ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {activity.taken ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{format(new Date(activity.date), "EEEE, MMMM d")}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.medicationName} -{" "}
                            {activity.taken ? `Taken at ${activity.time}` : "Medication missed"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.hasPhoto && (
                          <Badge variant="outline">
                            <Camera className="w-3 h-3 mr-1" />
                            Photo
                          </Badge>
                        )}
                        <Badge variant={activity.taken ? "secondary" : "destructive"}>
                          {activity.taken ? "Completed" : "Missed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
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
                        const hasActiveMedications = patientMedications.some((med) => {
                          const medCreatedDate = format(new Date(med.created_at), "yyyy-MM-dd")
                          return dateStr >= medCreatedDate
                        })

                        // Only show indicators if medications were active on this date
                        const isTaken = hasActiveMedications && takenDates.has(dateStr)
                        const isMissed = hasActiveMedications && !takenDates.has(dateStr) && isPast && !isCurrentDay

                        return (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span className={!hasActiveMedications && isPast ? "text-gray-300" : ""}>
                              {date.getDate()}
                            </span>
                            {isTaken && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-2 h-2 text-white" />
                              </div>
                            )}
                            {isMissed && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full"></div>
                            )}
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
                      const missedMedications = patientMedications.filter((med) => {
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
                            <p className="text-sm text-blue-700">
                              Monitor {selectedPatient?.name}'s medication status for today.
                            </p>
                            {patientMedications.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <p className="text-sm font-medium text-blue-800">Today's Schedule:</p>
                                {patientMedications.map((med) => (
                                  <p key={med.id} className="text-sm text-blue-700">
                                    • {med.name} at {formatTime(med.scheduled_time)}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      } else if (isBefore(selectedDate, startOfDay(new Date()))) {
                        // Past date with no medications (before any medication was created)
                        const hasAnyMedicationForDate = patientMedications.some((med) => {
                          const medCreatedDate = format(new Date(med.created_at), "yyyy-MM-dd")
                          return selectedDateStr >= medCreatedDate
                        })

                        if (!hasAnyMedicationForDate) {
                          return (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <CalendarIcon className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-800">No Medications</span>
                              </div>
                              <p className="text-sm text-gray-700">No medications were active on this date.</p>
                            </div>
                          )
                        }

                        return (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarIcon className="w-5 h-5 text-gray-600" />
                              <span className="font-medium text-gray-800">No Activity</span>
                            </div>
                            <p className="text-sm text-gray-700">No medication activity recorded for this date.</p>
                          </div>
                        )
                      } else {
                        return (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarIcon className="w-5 h-5 text-gray-600" />
                              <span className="font-medium text-gray-800">Future Date</span>
                            </div>
                            <p className="text-sm text-gray-700">This date is in the future.</p>
                          </div>
                        )
                      }
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CaretakerDashboard
