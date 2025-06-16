"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Trash2, TrendingUp, Calendar, Loader2, Search, Pill, AlertTriangle } from "lucide-react"
import type { PatientWithStats } from "@/hooks/use-caretaker-patients"
import { PatientSearch } from "./patientSearch"
import { AdherenceDashboard } from "./adherenceDashboard"

interface PatientSelectorProps {
  patients: PatientWithStats[]
  selectedPatientId: string | null
  onSelectPatient: (patientId: string) => void
  onAddPatient: (patientId: string, patientName: string) => Promise<{ success: boolean; message: string }>
  onRemovePatient: (patientId: string) => Promise<{ success: boolean; message: string }>
  onDeletePatientMedications: (
    patientId: string,
  ) => Promise<{ success: boolean; message: string; deletedCount?: number }>
  onManageMedications: (patientId: string, patientName: string) => void
  loading: boolean
  searchResults: any[]
  searchLoading: boolean
  onSearch: (searchTerm: string) => void
  onClearSearch: () => void
}

export const PatientSelector = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onAddPatient,
  onRemovePatient,
  onDeletePatientMedications,
  onManageMedications,
  loading,
  searchResults,
  searchLoading,
  onSearch,
  onClearSearch,
}: PatientSelectorProps) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deletingMedicationsId, setDeletingMedicationsId] = useState<string | null>(null)

  const handleAddPatient = async (patientId: string, patientName: string) => {
    const result = await onAddPatient(patientId, patientName)
    if (result.success) {
      setAddDialogOpen(false)
    }
    return result
  }

  const handleRemovePatient = async (patientId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to remove ${patientName} from your patient list?`)) {
      return
    }

    try {
      await onRemovePatient(patientId)
    } catch (error: any) {
      alert(`Error removing patient: ${error.message}`)
    }
  }

  const handleDeletePatientMedications = async (patientId: string, patientName: string) => {
    const patient = patients.find((p) => p.user_id === patientId)
    const medicationCount = patient?.total_medications || 0

    if (medicationCount === 0) {
      alert(`${patientName} has no medications to delete.`)
      return
    }

    const confirmMessage = `⚠️ WARNING: This will permanently delete ALL ${medicationCount} medication(s) and their history for ${patientName}.\n\nThis action cannot be undone. Are you sure you want to continue?`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setDeletingMedicationsId(patientId)
      const result = await onDeletePatientMedications(patientId)

      if (result.success) {
        alert(`✅ ${result.message}`)
      }
    } catch (error: any) {
      alert(`❌ Error deleting medications: ${error.message}`)
    } finally {
      setDeletingMedicationsId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading patients...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Your Patients ({patients.length})
        </h3>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Search className="w-4 h-4 mr-2" />
              Find Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Find and Add Patient</DialogTitle>
            </DialogHeader>
            <PatientSearch
              searchResults={searchResults}
              searchLoading={searchLoading}
              onSearch={onSearch}
              onAddPatient={handleAddPatient}
              onClearSearch={onClearSearch}
            />
          </DialogContent>
        </Dialog>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-xl font-medium mb-2">No Patients Yet</h4>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Search for patients by name and add them to your care list to start monitoring their medication adherence.
            </p>
            <Button onClick={() => setAddDialogOpen(true)} size="lg">
              <Search className="w-4 h-4 mr-2" />
              Find Your First Patient
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {patients.map((patient) => (
              <Card
                key={patient.user_id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPatientId === patient.user_id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => onSelectPatient(patient.user_id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{patient.name}</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemovePatient(patient.user_id, patient.name)
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="font-medium">{patient.adherence_rate}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      <span>{patient.current_streak} days</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {patient.total_medications} meds
                    </Badge>
                    {patient.missed_doses > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {patient.missed_doses} missed
                      </Badge>
                    )}
                  </div>

                  {patient.last_taken && (
                    <p className="text-xs text-muted-foreground">
                      Last taken: {new Date(patient.last_taken).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onManageMedications(patient.user_id, patient.name)
                      }}
                      className="flex-1 text-xs"
                    >
                      <Pill className="w-3 h-3 mr-1" />
                      Medications
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePatientMedications(patient.user_id, patient.name)
                      }}
                      disabled={deletingMedicationsId === patient.user_id || patient.total_medications === 0}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                      title={patient.total_medications === 0 ? "No medications to delete" : "Delete all medications"}
                    >
                      {deletingMedicationsId === patient.user_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                        </>
                      )}
                    </Button>
                  </div>

                  {patient.total_medications === 0 && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-xs">No medications found for this patient</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          

        </div>
      )}
    </div>
  )
}
