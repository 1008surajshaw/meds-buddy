import { Users } from "lucide-react"
import type { UserProfile, PatientWithStats } from "@/types/type"

interface CaretakerHeaderProps {
  profile: UserProfile
  patients: PatientWithStats[]
}

export const CaretakerHeader = ({ profile, patients }: CaretakerHeaderProps) => {
  const averageAdherence =
    patients.length > 0 ? Math.round(patients.reduce((sum, p) => sum + p.adherence_rate, 0) / patients.length) : 0

  const highAdherenceCount = patients.filter((p) => p.adherence_rate >= 80).length
  const lowAdherenceCount = patients.filter((p) => p.adherence_rate < 60).length

  return (
    <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Caretaker Dashboard</h2>
          <p className="text-white/90 text-lg">Welcome back, {profile.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold">{patients.length}</div>
          <div className="text-white/80">Total Patients</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold">{averageAdherence}%</div>
          <div className="text-white/80">Avg Adherence</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold text-green-200">{highAdherenceCount}</div>
          <div className="text-white/80">High Adherence</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-2xl font-bold text-red-200">{lowAdherenceCount}</div>
          <div className="text-white/80">Need Attention</div>
        </div>
      </div>
    </div>
  )
}
