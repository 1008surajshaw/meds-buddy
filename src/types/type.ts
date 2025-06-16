export type UserRole = "patient" | "caretaker"

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  user_id: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  name: string
  role: UserRole
}

export interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}


export interface PatientProfile {
  user_id: string
  name: string
  email: string
  created_at: string
  last_active: string | null
}

export interface PatientMedicationSummary {
  patient_id: string
  total_medications: number
  active_medications: number
  completed_today: number
  missed_today: number
  next_dose_time: string | null
}

export interface PatientDashboardData {
  profile: PatientProfile
  medications: Medication[]
  todayActivity: MedicationActivity[]
  stats: MedicationStats
}


export interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  scheduled_time: string
  created_at: string
}

export interface MedicationFormData {
  name: string
  dosage: string
  frequency: string
  scheduled_time: string
}

export interface MedicationActivity {
  id: string
  user_id: string
  medication_id: string
  date: string
  taken: boolean
  taken_time: string | null
  proof_image_url: string | null
  created_at: string
  medication?: Medication
}

export interface DailyMedicationStatus {
  medication_id: string
  medication_name: string
  scheduled_time: string
  frequency: string
  dosage: string
  taken_today: boolean
  taken_times: string[]
  next_dose_time: string | null
  is_complete_for_day: boolean
}

export type MedicationFrequency =
  | "once_daily"
  | "twice_daily"
  | "three_times_daily"
  | "four_times_daily"
  | "every_other_day"
  | "weekly"
  | "as_needed"

export interface MedicationStats {
  total_medications: number
  taken_today: number
  missed_today: number
  adherence_rate: number
  current_streak: number
}

export interface PatientWithStats {
  user_id: string
  name: string
  created_at: string
  adherence_rate: number
  current_streak: number
  missed_doses: number
  last_taken: string | null
  total_medications: number
}

export interface PatientSearchResult {
  user_id: string
  name: string
  created_at: string
  already_assigned: boolean
}

export interface AdherenceMetrics {
  overall_rate: number
  current_streak: number
  longest_streak: number
  missed_doses_this_week: number
  missed_doses_this_month: number
  total_medications: number
  days_tracked: number
  weekly_trend: number[]
  monthly_trend: { date: string; rate: number }[]
}

export interface PatientAdherence {
  patient_id: string
  patient_name: string
  metrics: AdherenceMetrics
  last_updated: string
}

export interface MedicationActivity {
  // Define the MedicationActivity interface here
  activity_id: string
  patient_id: string
  medication_name: string
  activity_date: string
  status: "taken" | "missed"
}

export interface CaretakerDashboardData {
  patients: PatientWithStats[]
  totalPatients: number
  averageAdherence: number
  alertsCount: number
  recentActivity: MedicationActivity[]
}

export interface CaretakerPatientRelation {
  id: string
  caretaker_id: string
  patient_id: string
  created_at: string
  status: "active" | "pending" | "inactive"
}
