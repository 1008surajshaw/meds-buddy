import React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Pill, AlertCircle, Clock, PillIcon as Capsule } from "lucide-react"
import { toast } from "sonner"
import type { Medication, MedicationFormData } from "@/types/type"

interface MedicationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: MedicationFormData) => Promise<{ success: boolean; message: string }>
  medication?: Medication | null
  title?: string
}

interface FormErrors {
  name?: string
  dosage?: string
  frequency?: string
  scheduled_time?: string
  general?: string
}

const frequencyOptions = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "three_times_daily", label: "Three times daily" },
  { value: "four_times_daily", label: "Four times daily" },
  { value: "every_other_day", label: "Every other day" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As needed" },
]

export const MedicationForm = ({
  open,
  onOpenChange,
  onSubmit,
  medication = null,
  title = "Add New Medication",
}: MedicationFormProps) => {
  const [formData, setFormData] = useState<MedicationFormData>({
    name: medication?.name || "",
    dosage: medication?.dosage || "",
    frequency: medication?.frequency || "",
    scheduled_time: medication?.scheduled_time || "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validateMedicationName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "Medication name is required"
    }
    if (name.trim().length < 2) {
      return "Medication name must be at least 2 characters"
    }
    if (name.trim().length > 100) {
      return "Medication name must be less than 100 characters"
    }
    // Check for valid characters (letters, numbers, spaces, hyphens, parentheses)
    if (!/^[a-zA-Z0-9\s\-().,]+$/.test(name.trim())) {
      return "Medication name contains invalid characters"
    }
    return undefined
  }

  const validateDosage = (dosage: string): string | undefined => {
    if (!dosage.trim()) {
      return "Dosage is required"
    }
    if (dosage.trim().length < 2) {
      return "Please provide a valid dosage (e.g., 100mg, 2 tablets)"
    }
    if (dosage.trim().length > 50) {
      return "Dosage description is too long"
    }
    return undefined
  }

  const validateFrequency = (frequency: string): string | undefined => {
    if (!frequency) {
      return "Please select a frequency"
    }
    const validFrequencies = frequencyOptions.map((opt) => opt.value)
    if (!validFrequencies.includes(frequency)) {
      return "Please select a valid frequency"
    }
    return undefined
  }

  const validateScheduledTime = (time: string): string | undefined => {
    if (!time) {
      return "Scheduled time is required"
    }
    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(time)) {
      return "Please enter a valid time (HH:MM format)"
    }
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    const nameError = validateMedicationName(formData.name)
    if (nameError) newErrors.name = nameError

    const dosageError = validateDosage(formData.dosage)
    if (dosageError) newErrors.dosage = dosageError

    const frequencyError = validateFrequency(formData.frequency)
    if (frequencyError) newErrors.frequency = frequencyError

    const timeError = validateScheduledTime(formData.scheduled_time)
    if (timeError) newErrors.scheduled_time = timeError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form", {
        description: "Check all required fields and try again",
      })
      return
    }

    setLoading(true)

    try {
      const result = await onSubmit({
        ...formData,
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
      })

      if (result.success) {
        const isEditing = !!medication

        toast.success(isEditing ? "Medication updated successfully!" : "Medication added successfully!", {
          description: isEditing
            ? `${formData.name} has been updated in your medication list`
            : `${formData.name} has been added to your medication list`,
        })

        onOpenChange(false)
        // Reset form
        setFormData({
          name: "",
          dosage: "",
          frequency: "",
          scheduled_time: "",
        })
        setErrors({})
      } else {
        toast.error("Failed to save medication", {
          description: result.message || "Please try again",
        })
        setErrors({ general: result.message || "Failed to save medication" })
      }
    } catch (error: any) {
      console.error("Medication form error:", error)

      let errorMessage = error.message || "An unexpected error occurred"
      let toastTitle = "Error"

      if (error.message.includes("duplicate") || error.message.includes("already exists")) {
        errorMessage = "A medication with this name already exists"
        toastTitle = "Duplicate Medication"

        toast.error(toastTitle, {
          description: "You already have a medication with this name",
        })
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again"
        toastTitle = "Connection Error"

        toast.error(toastTitle, {
          description: "Please check your internet connection and try again",
        })
      } else if (error.message.includes("unauthorized") || error.message.includes("permission")) {
        errorMessage = "You don't have permission to perform this action"
        toastTitle = "Permission Denied"

        toast.error(toastTitle, {
          description: "Please sign in again and try again",
        })
      } else {
        toast.error("Something went wrong", {
          description: errorMessage,
        })
      }

      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof MedicationFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    // Clear general error when user makes changes
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }))
    }
  }

  const handleSelectChange = (field: keyof MedicationFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear field-specific error when user makes selection
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    // Clear general error when user makes changes
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }))
    }
  }

  // Reset form when dialog opens/closes or medication changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: medication?.name || "",
        dosage: medication?.dosage || "",
        frequency: medication?.frequency || "",
        scheduled_time: medication?.scheduled_time || "",
      })
      setErrors({})
    }
  }, [open, medication])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Capsule className="w-4 h-4" />
              Medication Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Aspirin, Metformin, Lisinopril"
              value={formData.name}
              onChange={handleInputChange("name")}
              className={errors.name ? "border-red-500 focus:border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              type="text"
              placeholder="e.g., 100mg, 2 tablets, 5ml"
              value={formData.dosage}
              onChange={handleInputChange("dosage")}
              className={errors.dosage ? "border-red-500 focus:border-red-500" : ""}
            />
            {errors.dosage && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.dosage}
              </p>
            )}
            {!errors.dosage && (
              <p className="text-xs text-muted-foreground">Include the amount and unit (e.g., mg, tablets, ml)</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select value={formData.frequency} onValueChange={handleSelectChange("frequency")}>
              <SelectTrigger className={errors.frequency ? "border-red-500 focus:border-red-500" : ""}>
                <SelectValue placeholder="Select how often to take" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.frequency && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.frequency}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Scheduled Time *
            </Label>
            <Input
              id="scheduled_time"
              type="time"
              value={formData.scheduled_time}
              onChange={handleInputChange("scheduled_time")}
              className={errors.scheduled_time ? "border-red-500 focus:border-red-500" : ""}
            />
            {errors.scheduled_time && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.scheduled_time}
              </p>
            )}
            {!errors.scheduled_time && (
              <p className="text-xs text-muted-foreground">Time when you typically take this medication</p>
            )}
          </div>

          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {medication ? "Update Medication" : "Add Medication"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
