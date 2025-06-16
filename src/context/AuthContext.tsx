import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";
import type { UserProfile, UserRole } from "@/types/type";
import { toast } from "sonner"


interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  // Fetch profile helper
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle to avoid error if no row

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data || null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  // Create profile helper
  const createUserProfile = async (userId: string, name: string, role: UserRole): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          name,
          role,
          onboarded: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  };

  const createProfileFromMetadata = async (user: User) => {
    try {
      const name = user.user_metadata?.name || user.email?.split("@")[0] || "User";
      const role = user.user_metadata?.role || "patient";
      const profile = await createUserProfile(user.id, name, role);
      return profile;
    } catch (error) {
      console.error("Failed to create profile from metadata:", error);
      return null;
    }
  };

  const handleSessionUpdate = async (session: any) => {
    if (session?.user) {
      let profile = await fetchUserProfile(session.user.id);

      if (
        !profile &&
        session.user.user_metadata &&
        (session.user.user_metadata.name || session.user.user_metadata.role)
      ) {
        profile = await createProfileFromMetadata(session.user);
      }

      setState({
        user: session.user,
        profile,
        loading: false,
        error: null,
      });
    } else {
      setState({
        user: null,
        profile: null,
        loading: false,
        error: null,
      });
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      });

      if (error) throw error;

      // If user is returned, create profile (no email confirmation required)
      if (data.user) {
        if (!data.session) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: null,
          }));
          throw new Error("Please check your email and click the confirmation link to complete your registration.");
        }

        try {
          const profile = await createUserProfile(data.user.id, name, role);
          setState((prev) => ({
            ...prev,
            user: data.user,
            profile,
            loading: false,
          }));
        } catch (profileError: any) {
          console.warn("Profile creation failed, will retry:", profileError.message);
          setState((prev) => ({
            ...prev,
            user: data.user,
            profile: null,
            loading: false,
          }));
        }
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        let profile = await fetchUserProfile(data.user.id);

        // If no profile exists, create from metadata
        if (!profile && data.user.user_metadata) {
          profile = await createProfileFromMetadata(data.user);
        }

        setState((prev) => ({
          ...prev,
          user: data.user,
          profile,
          loading: false,
        }));
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        user: null,
        profile: null,
        loading: false,
        error: null,
      });

      toast.success("Signed out successfully", {
        description: "You have been logged out of your account",
      })

    } catch (error: any) {
      toast.error("Error signing out", {
        description: error.message || "Please try again",
      })
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!state.user) throw new Error("No user logged in");

      setState((prev) => ({ ...prev, loading: true }));
      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", state.user.id)
        .select()
        .single();

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        profile: data,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  };

  // Listen for session changes
  useEffect(() => {
    let ignore = false;

    const getInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!ignore) await handleSessionUpdate(data.session);
    };
    getInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionUpdate(session);
    });

    return () => {
      ignore = true;
      listener?.subscription.unsubscribe();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        profile: state.profile,
        loading: state.loading,
        error: state.error,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContextProvider");
  return ctx;
};