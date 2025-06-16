import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarIcon, Mail, Bell} from "lucide-react"
import { format } from "date-fns"
import { AdherenceDashboard } from "./adherenceDashboard"
import { formatTime } from "@/utils/medication-helpers"
import type { PatientWithStats, Medication, UserProfile } from "@/types/type"

interface PatientOverviewProps {
  patient: PatientWithStats
  medications: Medication[]
  profile: UserProfile
}

export const PatientOverview = ({ patient, medications, profile }: PatientOverviewProps) => {

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Today's Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medications.length === 0 ? (
              <p className="text-muted-foreground">No medications found for this patient.</p>
            ) : (
              <div className="space-y-3">
                {medications.map((med) => (
                  <div key={med.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{med.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {med.dosage} - {formatTime(med.scheduled_time)}
                      </p>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

     

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Send Reminder Email
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Bell className="w-4 h-4 mr-2" />
              Configure Notifications
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CalendarIcon className="w-4 h-4 mr-2" />
              View Full Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

    

      <Card>
        <CardHeader>
          <CardTitle>Monthly Adherence Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{patient.adherence_rate}%</span>
            </div>
            <Progress value={patient.adherence_rate} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-medium text-green-600">{Math.round((30 * patient.adherence_rate) / 100)} days</div>
                <div className="text-muted-foreground">Taken</div>
              </div>
              <div>
                <div className="font-medium text-red-600">{patient.missed_doses} days</div>
                <div className="text-muted-foreground">Missed</div>
              </div>
              <div>
                <div className="font-medium text-blue-600">
                  {30 - Math.round((30 * patient.adherence_rate) / 100) - patient.missed_doses} days
                </div>
                <div className="text-muted-foreground">Remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <AdherenceDashboard patientIds={[patient.user_id]} /> */}
    </div>
  )
}
