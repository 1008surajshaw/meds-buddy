
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Users, ArrowRight } from "lucide-react"
import type { UserRole } from "@/types/types"

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void
}

export const RoleSelector = ({ onRoleSelect }: RoleSelectorProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to MediCare Companion</h1>
          <p className="text-muted-foreground text-lg">Choose your role to get started</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => onRoleSelect("patient")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">I'm a Patient</CardTitle>
              <CardDescription className="text-base">
                Manage your medications, track adherence, and maintain your health routine
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Track your daily medications
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Upload proof photos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  View adherence statistics
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Set medication reminders
                </li>
              </ul>
              <Button className="w-full group-hover:bg-blue-600 bg-blue-700 transition-colors">
                Continue as Patient
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => onRoleSelect("caretaker")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">I'm a Caretaker</CardTitle>
              <CardDescription className="text-base">
                Monitor and support your patients' medication adherence and health
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Monitor patient adherence
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  View medication logs
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Manage multiple patients
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Generate reports
                </li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700 transition-colors">
                Continue as Caretaker
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
