
import React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Pill } from "lucide-react"
import type { Medication, MedicationFormData } from "@/hooks/use-medications"

interface MedicationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: MedicationFormData) => Promise<{ success: boolean; message: string }>
  medication?: Medication | null
  title?: string
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
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error("Medication name is required")
      }
      if (!formData.dosage.trim()) {
        throw new Error("Dosage is required")
      }
      if (!formData.frequency) {
        throw new Error("Frequency is required")
      }
      if (!formData.scheduled_time) {
        throw new Error("Scheduled time is required")
      }

      const result = await onSubmit(formData)
      if (result.success) {
        onOpenChange(false)
        // Reset form
        setFormData({
          name: "",
          dosage: "",
          frequency: "",
          scheduled_time: "",
        })
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof MedicationFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSelectChange = (field: keyof MedicationFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
      setError(null)
    }
  }, [open, medication])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Medication Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Aspirin, Metformin"
              value={formData.name}
              onChange={handleInputChange("name")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              type="text"
              placeholder="e.g., 100mg, 2 tablets"
              value={formData.dosage}
              onChange={handleInputChange("dosage")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select value={formData.frequency} onValueChange={handleSelectChange("frequency")}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_time">Scheduled Time *</Label>
            <Input
              id="scheduled_time"
              type="time"
              value={formData.scheduled_time}
              onChange={handleInputChange("scheduled_time")}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {medication ? "Update Medication" : "Add Medication"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
