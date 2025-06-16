
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pill, Plus, Clock, MoreVertical, Edit, Trash2, Loader2 } from "lucide-react"
import type { Medication, MedicationFormData } from "@/hooks/use-medications"
import { MedicationForm } from "./medication-form"

interface MedicationListProps {
  medications: Medication[]
  loading: boolean
  onAddMedication: (data: MedicationFormData) => Promise<{ success: boolean; message: string }>
  onUpdateMedication: (id: string, data: Partial<MedicationFormData>) => Promise<{ success: boolean; message: string }>
  onDeleteMedication: (id: string) => Promise<{ success: boolean; message: string }>
  canEdit?: boolean
}

const frequencyLabels: Record<string, string> = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  three_times_daily: "Three times daily",
  four_times_daily: "Four times daily",
  every_other_day: "Every other day",
  weekly: "Weekly",
  as_needed: "As needed",
}

export const MedicationList = ({
  medications,
  loading,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  canEdit = true,
}: MedicationListProps) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication)
    setEditDialogOpen(true)
  }

  const handleDelete = async (medication: Medication) => {
    if (!confirm(`Are you sure you want to delete ${medication.name}?`)) {
      return
    }

    try {
      setDeletingId(medication.id)
      await onDeleteMedication(medication.id)
    } catch (error: any) {
      alert(`Error deleting medication: ${error.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpdateMedication = async (data: MedicationFormData) => {
    if (!editingMedication) throw new Error("No medication selected for editing")
    return await onUpdateMedication(editingMedication.id, data)
  }

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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading medications...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Medications ({medications.length})
        </h3>

        {canEdit && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        )}
      </div>

      {medications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-xl font-medium mb-2">No Medications Yet</h4>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {canEdit
                ? "Add medications to start tracking adherence and managing your health routine."
                : "This patient hasn't added any medications yet."}
            </p>
            {canEdit && (
              <Button onClick={() => setAddDialogOpen(true)} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Medication
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {medications.map((medication) => (
            <Card key={medication.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="w-4 h-4 text-blue-600" />
                    {medication.name}
                  </CardTitle>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(medication)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(medication)}
                          className="text-red-600"
                          disabled={deletingId === medication.id}
                        >
                          {deletingId === medication.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dosage:</span>
                    <span className="font-medium">{medication.dosage}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Frequency:</span>
                    <Badge variant="secondary" className="text-xs">
                      {frequencyLabels[medication.frequency] || medication.frequency}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(medication.scheduled_time)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(medication.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Medication Dialog */}
      <MedicationForm
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={onAddMedication}
        title="Add New Medication"
      />

      {/* Edit Medication Dialog */}
      <MedicationForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdateMedication}
        medication={editingMedication}
        title="Edit Medication"
      />
    </div>
  )
}
