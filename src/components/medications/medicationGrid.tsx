
import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/shared/loadingSpinner"
import { EmptyState } from "@/components/shared/emptyState"
import { MedicationCard } from "./medicationCard"
import { MedicationForm } from "./medicationForm"
import type { Medication, MedicationFormData } from "@/types/type"
import { Pill } from "lucide-react"

interface MedicationGridProps {
  medications: Medication[]
  loading: boolean
  onAddMedication: (data: MedicationFormData) => Promise<{ success: boolean; message: string }>
  onUpdateMedication: (id: string, data: Partial<MedicationFormData>) => Promise<{ success: boolean; message: string }>
  onDeleteMedication: (id: string) => Promise<{ success: boolean; message: string }>
  canEdit?: boolean
  title?: string
}

export const MedicationGrid = ({
  medications,
  loading,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  canEdit = true,
  title = "Medications",
}: MedicationGridProps) => {
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

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading medications..." />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Pill className="w-5 h-5" />
          {title} ({medications.length})
        </h3>

        {canEdit && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        )}
      </div>

      {medications.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No Medications Yet"
          description={
            canEdit
              ? "Add medications to start tracking adherence and managing your health routine."
              : "This patient hasn't added any medications yet."
          }
          actionLabel={canEdit ? "Add Your First Medication" : undefined}
          onAction={canEdit ? () => setAddDialogOpen(true) : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {medications.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canEdit ? handleDelete : undefined}
              canEdit={canEdit}
              isDeleting={deletingId === medication.id}
            />
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
