
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { useCaretakerPatients } from "@/hooks/use-caretaker-patients"
import { useMedications } from "@/hooks/use-medications"
import { CaretakerHeader } from "./caretakerHeader"
import { PatientSelector } from "./patientSelector"
import { PatientOverview } from "./patientOverview"
import { MedicationGrid } from "@/components/medications/medicationGrid"
import { PatientActivity } from "./patientActivity"
import { PatientCalendar } from "./patientCalender"
import { AdherenceDashboard } from "./adherenceDashboard"
import NotificationSettings from "../NotificationSettings"
import { LoadingSpinner } from "@/components/shared/loadingSpinner"
import { useAuth } from "@/context/AuthContext"

const CaretakerDashboard = () => {
  const {  profile } = useAuth()
  const [activeTab, setActiveTab] = useState("patients")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

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

  if (!profile || profile.role !== "caretaker") {
    return (
      <div className="text-center py-8">
        <p>Access denied. This dashboard is only available for caretakers.</p>
      </div>
    )
  }

  if (patientsLoading) {
    return <LoadingSpinner size="lg" text="Loading caretaker dashboard..." />
  }

  if (!selectedPatientId) {
    return (
      <div className="space-y-6">
        <CaretakerHeader profile={profile} patients={patients} />

        <PatientSelector
          patients={patients}
          selectedPatientId={selectedPatientId}
          onSelectPatient={handleSelectPatient}
          onAddPatient={handleAddPatient}
          onRemovePatient={removePatient}
          onDeletePatientMedications={deletePatientMedications}
          onManageMedications={handleManageMedications}
          loading={patientsLoading}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onSearch={searchPatients}
          onClearSearch={clearSearch}
        />

        {patients.length > 0 && <AdherenceDashboard patientIds={patients.map((p) => p.user_id)} />}
      </div>
    )
  }

  // Show patient-specific dashboard
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackToPatients} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold">{selectedPatient?.name?.charAt(0) || "P"}</span>
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
          <PatientOverview patient={selectedPatient!} medications={patientMedications} profile={profile} />
        </TabsContent>

        <TabsContent value="medications" className="space-y-6">
          <MedicationGrid
            medications={patientMedications}
            loading={medicationsLoading}
            onAddMedication={addMedication}
            onUpdateMedication={updateMedication}
            onDeleteMedication={deleteMedication}
            canEdit={true}
            title={`${selectedPatient?.name}'s Medications`}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <PatientActivity patientId={selectedPatientId} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <PatientCalendar patientId={selectedPatientId} medications={patientMedications} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CaretakerDashboard
