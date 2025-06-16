import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, AlertTriangle, Camera } from "lucide-react"
import { format } from "date-fns"
import { usePatientData } from "@/hooks/use-patient-data"
import { LoadingSpinner } from "@/components/shared/loadingSpinner"
import { EmptyState } from "@/components/shared/emptyState"

interface PatientActivityProps {
  patientId: string
}

export const PatientActivity = ({ patientId }: PatientActivityProps) => {
  const { activities, loading, error } = usePatientData(patientId)

  const recentActivity = activities.slice(0, 10).map((activity) => ({
    date: activity.date,
    taken: activity.taken,
    time: activity.taken_time,
    hasPhoto: !!activity.proof_image_url,
    medicationName: activity.medication?.name || "Unknown Medication",
  }))

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading patient activity..." />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading activity: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Medication Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No Recent Activity"
            description="No recent medication activity found for this patient."
          />
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.taken ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {activity.taken ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{format(new Date(activity.date), "EEEE, MMMM d")}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.medicationName} - {activity.taken ? `Taken at ${activity.time}` : "Medication missed"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activity.hasPhoto && (
                    <Badge variant="outline">
                      <Camera className="w-3 h-3 mr-1" />
                      Photo
                    </Badge>
                  )}
                  <Badge variant={activity.taken ? "secondary" : "destructive"}>
                    {activity.taken ? "Completed" : "Missed"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
