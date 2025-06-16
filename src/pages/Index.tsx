
import { useEffect, useState } from "react"
import { AuthModal } from "@/components/auth/auth-modal"
import { RoleSelector } from "@/components/role-selector"
import PatientDashboard from "@/components/patients/PatientDashboard"
import CaretakerDashboard from "@/components/catetaker/CaretakerDashboard"
import { Button } from "@/components/ui/button"
import { Users, User, LogOut, Loader2 } from "lucide-react"
import type { UserRole } from "@/types/types"
import { supabase } from "@/utils/supabase"
import { useAuth } from "@/context/AuthContext"

const Index = () => {
  const {user,profile,signOut,loading} = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient")
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setAuthModalOpen(true)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }
  
  useEffect(() =>{
    console.log(user, profile, loading)
  },[user, profile, loading])
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show role selector
  if (!user || !profile) {
    return (
      <>
        <RoleSelector onRoleSelect={handleRoleSelect} />
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultRole={selectedRole} />
      </>
    )
  }

  // Authenticated - show dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/20 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MediCare Companion</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile.name} ({profile.role === "patient" ? "Patient" : "Caretaker"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-accent transition-colors">
              {profile.role === "patient" ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              {profile.role === "patient" ? "Patient View" : "Caretaker View"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {profile.role === "patient" ? <PatientDashboard /> : <CaretakerDashboard />}
      </main>
    </div>
  )
}

export default Index
