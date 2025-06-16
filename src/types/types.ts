
export interface UserAuth {
    id: string; // UUID from auth.users
    email: string;
    created_at: string;
  }
  
  export interface UserProfile {
    user_id: string;  // same as auth.users.id
    name: string | null;
    role: UserRole;
    onboarded: boolean;
    created_at: string;
  }
  
  export interface Medication {
    id: string; 
    user_id: string; 
    name: string;
    dosage: string | null;
    frequency: string | null;
    scheduled_time: string | null; // time only: 'HH:MM:SS'
    created_at: string;
  }
  
  // ✅ Medication activity log
  export interface MedicationActivity {
    id: string; // UUID
    medication_id: string; // FK to Medication
    user_id: string; // FK to user_profiles
    date: string; // YYYY-MM-DD
    taken: boolean;
    taken_time: string | null; // time only
    proof_image_url: string | null;
    created_at: string;
  }
  
  // ✅ Caretaker-patient relation
  export interface CaretakerPatient {
    id: string; // UUID
    caretaker_id: string; // user_profiles.user_id
    patient_id: string;   // user_profiles.user_id
    created_at: string;
  }
  
  // ✅ Optional: useful for joining medication with activity
  export interface MedicationWithActivity extends Medication {
    activity: MedicationActivity[];
  }
  
  // ✅ Optional: adherence stats
  export interface AdherenceStats {
    adherenceRate: number; // e.g., 90 for 90%
    currentStreak: number; // e.g., 5 days in a row
    missedDoses: number;
  }
  
  // ✅ Example: context shape for React Auth
  export interface SessionUser {
    auth: UserAuth;
    profile: UserProfile;
  }
  



  export interface UserProfile {
    user_id: string
    name: string | null
    role: "patient" | "caretaker"
    onboarded: boolean
    created_at: string
  }

  ///
  
  export type UserRole = "patient" | "caretaker"
  
  export interface AuthUser {
    id: string
    email: string
  }
  
  export interface AuthState {
    user: AuthUser | null
    profile: UserProfile | null
    loading: boolean
    error: string | null
  }
  
  export interface AuthContextType extends AuthState {
    signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  }
  