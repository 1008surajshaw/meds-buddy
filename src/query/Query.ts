
import { supabase }  from '../utils/supabase'


export async function getUserProfile(userId: string) {
    
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data ;
}


export async function createUserProfile(profile: UserProfile) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([profile])
    .single();
  if (error) throw error;
  return data ;
}


export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data ;
}