
import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, ImageIcon, Camera, Clock, Plus, Pill, Bell } from "lucide-react"
import { format } from "date-fns"
import { MedicationForm } from "../medications/medicationForm"
import { useMedicationActivity, type DailyMedicationStatus } from "@/hooks/use-medication-activity"
import type { Medication, MedicationFormData } from "@/hooks/use-medications"

interface MedicationTrackerProps {
  date: string
  isTaken: boolean
  onMarkTaken: (date: string, imageFile?: File) => void
  isToday: boolean
  medications: Medication[]
  loading: boolean
  onAddMedication: (data: MedicationFormData) => Promise<{ success: boolean; message: string }>
  onUpdateMedication: (id: string, data: Partial<MedicationFormData>) => Promise<{ success: boolean; message: string }>
  onDeleteMedication: (id: string) => Promise<{ success: boolean; message: string }>
}

const MedicationTracker = ({
  date,
  isTaken,
  onMarkTaken,
  isToday,
  medications,
  loading,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
}: MedicationTrackerProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>("")
  const [dailyStatuses, setDailyStatuses] = useState<DailyMedicationStatus[]>([])
  const [dayComplete, setDayComplete] = useState(false)
  const [nextDoseAlert, setNextDoseAlert] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    markMedicationTaken,
    getDailyMedicationStatus,
    isDayComplete,
    loading: activityLoading,
  } = useMedicationActivity(medications.length > 0 ? medications[0].user_id : null)

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

  // Load daily medication status
  useEffect(() => {
    const loadDailyStatus = async () => {
      if (medications.length > 0) {
        const statuses = await getDailyMedicationStatus(date, medications)
        setDailyStatuses(statuses)

        const complete = await isDayComplete(date, medications)
        setDayComplete(complete)

        // Set default selection for single medication
        if (medications.length === 1) {
          setSelectedMedicationId(medications[0].id)
        }
      }
    }

    loadDailyStatus()
  }, [date, medications])

  // Use actual medications or fallback to default
  const dailyMedication =
    medications.length > 0
      ? {
          name: medications.length === 1 ? medications[0].name : `${medications.length} Medications`,
          time: medications.length === 1 ? formatTime(medications[0].scheduled_time) : "Multiple times",
          description:
            medications.length === 1
              ? `${medications[0].dosage} - ${medications[0].frequency.replace("_", " ")}`
              : "Complete set of daily medications",
        }
      : {
          name: "No Medications",
          time: "Add medications",
          description: " medication will be added by your care taker",
        }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMarkTaken = async () => {
    try {
      if (medications.length === 1) {
        // Single medication - use it directly
        const result = await markMedicationTaken(medications[0].id, date, selectedImage || undefined)

        if (result.nextDoseTime) {
          setNextDoseAlert(`Next dose at ${formatTime(result.nextDoseTime)}`)
          setTimeout(() => setNextDoseAlert(null), 5000) // Clear after 5 seconds
        }
      } else if (selectedMedicationId) {
        // Multiple medications - use selected one
        const result = await markMedicationTaken(selectedMedicationId, date, selectedImage || undefined)

        if (result.nextDoseTime) {
          const selectedMed = medications.find((m) => m.id === selectedMedicationId)
          setNextDoseAlert(`Next ${selectedMed?.name} dose at ${formatTime(result.nextDoseTime)}`)
          setTimeout(() => setNextDoseAlert(null), 5000)
        }
      } else {
        alert("Please select a medication first")
        return
      }

      // Clear form
      setSelectedImage(null)
      setImagePreview(null)
      setSelectedMedicationId(medications.length === 1 ? medications[0].id : "")

      // Refresh status
      const statuses = await getDailyMedicationStatus(date, medications)
      setDailyStatuses(statuses)

      const complete = await isDayComplete(date, medications)
      setDayComplete(complete)

      // Call original callback for UI updates
      onMarkTaken(date, selectedImage || undefined)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  if (loading || activityLoading) {
    return (
      <div className="space-y-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-gray-400 font-medium">...</span>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (dayComplete && isToday) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8 bg-green-50 rounded-xl border-2 border-green-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">All Medications Completed!</h3>
            <p className="text-green-600">
              Excellent! You've completed all your medications for {format(new Date(date), "MMMM d, yyyy")}.
            </p>
          </div>
        </div>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-800">{dailyMedication.name}</h4>
                <p className="text-sm text-green-600">{dailyMedication.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Clock className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show add medication prompt if no medications exist
  if (medications.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="hover:shadow-md transition-shadow border-dashed border-2">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Pill className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">{dailyMedication.name}</h4>
                <p className="text-sm text-muted-foreground">{dailyMedication.description}</p>
              </div>
            </div>
          
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="p-6">
            <div className="text-center">
              <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No Medications Added</h3>
              <p className="text-sm text-muted-foreground mb-4">
                 Medications will be added by your care taker .
              </p>
              
            </div>
          </CardContent>
        </Card>

       
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Next Dose Alert */}
      {nextDoseAlert && (
        <Alert className="border-blue-200 bg-blue-50">
          <Bell className="w-4 h-4" />
          <AlertDescription className="text-blue-800">{nextDoseAlert}</AlertDescription>
        </Alert>
      )}

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">{medications.length}</span>
            </div>
            <div>
              <h4 className="font-medium">{dailyMedication.name}</h4>
              <p className="text-sm text-muted-foreground">{dailyMedication.description}</p>
            </div>
          </div>
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {dailyMedication.time}
          </Badge>
        </CardContent>
      </Card>

      {/* Show individual medications status */}
      {dailyStatuses.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-muted-foreground">Today's Progress:</h5>
          {dailyStatuses.map((status, index) => (
            <Card
              key={status.medication_id}
              className={`border-l-4 ${status.is_complete_for_day ? "border-l-green-500" : "border-l-blue-500"}`}
            >
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      status.is_complete_for_day ? "bg-green-100" : "bg-blue-100"
                    }`}
                  >
                    {status.is_complete_for_day ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <span className="text-blue-600 text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <h6 className="text-sm font-medium">{status.medication_name}</h6>
                    <p className="text-xs text-muted-foreground">
                      {status.dosage} • {status.taken_times.length} of{" "}
                      {status.frequency === "twice_daily"
                        ? "2"
                        : status.frequency === "three_times_daily"
                          ? "3"
                          : status.frequency === "four_times_daily"
                            ? "4"
                            : "1"}{" "}
                      taken
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={status.is_complete_for_day ? "secondary" : "outline"} className="text-xs">
                    {status.is_complete_for_day ? "Complete" : formatTime(status.scheduled_time)}
                  </Badge>
                  {status.next_dose_time && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      Next: {formatTime(status.next_dose_time)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Medication Selection for Multiple Medications */}
      {medications.length > 1 && isToday && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <h5 className="text-sm font-medium mb-3">Which medication are you taking now?</h5>
            <Select value={selectedMedicationId} onValueChange={setSelectedMedicationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select medication to mark as taken" />
              </SelectTrigger>
              <SelectContent>
                {medications.map((med) => {
                  const status = dailyStatuses.find((s) => s.medication_id === med.id)
                  return (
                    <SelectItem key={med.id} value={med.id} disabled={status?.is_complete_for_day}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {med.name} - {med.dosage}
                        </span>
                        {status?.is_complete_for_day && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Complete
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Image Upload Section */}
      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="p-6">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Add Proof Photo (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Take a photo of your medication or pill organizer as confirmation
            </p>

            <input type="file" accept="image/*" onChange={handleImageSelect} ref={fileInputRef} className="hidden" />

            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mb-4">
              <Camera className="w-4 h-4 mr-2" />
              {selectedImage ? "Change Photo" : "Take Photo"}
            </Button>

            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Medication proof"
                  className="max-w-full h-32 object-cover rounded-lg mx-auto border-2 border-border"
                />
                <p className="text-sm text-muted-foreground mt-2">Photo selected: {selectedImage?.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mark as Taken Button */}
      <Button
        onClick={handleMarkTaken}
        className="w-full py-4 text-lg bg-green-600 hover:bg-green-700 text-white"
        disabled={!isToday || (medications.length > 1 && !selectedMedicationId)}
      >
        <Check className="w-5 h-5 mr-2" />
        {isToday ? "Mark as Taken" : "Cannot mark future dates"}
      </Button>

      {!isToday && (
        <p className="text-center text-sm text-muted-foreground">You can only mark today's medication as taken</p>
      )}

      {medications.length > 1 && !selectedMedicationId && isToday && (
        <p className="text-center text-sm text-muted-foreground">Please select a medication first</p>
      )}

      {/* Add Medication Dialog */}
      <MedicationForm
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={onAddMedication}
        title="Add New Medication"
      />
    </div>
  )
}

export default MedicationTracker
