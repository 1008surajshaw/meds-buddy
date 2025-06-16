
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Calendar, Target, Award, AlertTriangle } from "lucide-react"
import { useAdherenceTracking } from "@/hooks/use-adherence-tracking"

interface AdherenceDashboardProps {
  patientIds: string[]
}

export const AdherenceDashboard = ({ patientIds }: AdherenceDashboardProps) => {
  const { adherenceData, loading, error, refreshAdherence } = useAdherenceTracking(patientIds)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading adherence data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading adherence data: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (adherenceData.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-medium mb-2">No Adherence Data</h4>
          <p className="text-muted-foreground">Add patients to start tracking medication adherence.</p>
        </CardContent>
      </Card>
    )
  }

  const overallStats = {
    averageAdherence: Math.round(
      adherenceData.reduce((sum, patient) => sum + patient.metrics.overall_rate, 0) / adherenceData.length,
    ),
    totalPatients: adherenceData.length,
    highAdherencePatients: adherenceData.filter((p) => p.metrics.overall_rate >= 80).length,
    lowAdherencePatients: adherenceData.filter((p) => p.metrics.overall_rate < 60).length,
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Adherence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageAdherence}%</div>
            <Progress value={overallStats.averageAdherence} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Under your care</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Adherence</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.highAdherencePatients}</div>
            <p className="text-xs text-muted-foreground">≥80% adherence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overallStats.lowAdherencePatients}</div>
            <p className="text-xs text-muted-foreground">{"<60% adherence"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Patient Cards */}
      <div className="grid gap-4">
        {adherenceData.map((patient) => (
          <Card key={patient.patient_id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{patient.patient_name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      patient.metrics.overall_rate >= 80
                        ? "secondary"
                        : patient.metrics.overall_rate >= 60
                          ? "outline"
                          : "destructive"
                    }
                  >
                    {patient.metrics.overall_rate}% Adherence
                  </Badge>
                  {patient.metrics.current_streak > 0 && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      <Award className="w-3 h-3 mr-1" />
                      {patient.metrics.current_streak} day streak
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{patient.metrics.total_medications}</div>
                  <div className="text-xs text-muted-foreground">Medications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{patient.metrics.current_streak}</div>
                  <div className="text-xs text-muted-foreground">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{patient.metrics.longest_streak}</div>
                  <div className="text-xs text-muted-foreground">Best Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{patient.metrics.missed_doses_this_week}</div>
                  <div className="text-xs text-muted-foreground">Missed This Week</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{patient.metrics.days_tracked}</div>
                  <div className="text-xs text-muted-foreground">Days Tracked</div>
                </div>
              </div>

              {/* Weekly Trend */}
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Weekly Trend</h5>
                <div className="flex gap-1">
                  {patient.metrics.weekly_trend.map((rate, index) => (
                    <div key={index} className="flex-1">
                      <div
                        className={`h-8 rounded-sm ${
                          rate >= 80
                            ? "bg-green-500"
                            : rate >= 60
                              ? "bg-yellow-500"
                              : rate > 0
                                ? "bg-red-500"
                                : "bg-gray-200"
                        }`}
                        style={{ height: `${Math.max((rate / 100) * 32, 4)}px` }}
                      />
                      <div className="text-xs text-center mt-1 text-muted-foreground">
                        {["S", "M", "T", "W", "T", "F", "S"][index]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
