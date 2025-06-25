"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/lib/types/database.types";

export interface AuthUser {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth(): AuthUser {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        setUser(session?.user ?? null);

        // Fetch profile if user exists
        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
            setError(profileError.message);
          } else {
            setProfile(profileData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch profile for new user
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
            setError(profileError.message);
          } else {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, isLoading, error };
}

export function useRequireAuth() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      window.location.href = '/auth/login';
    }
  }, [auth.isLoading, auth.user]);

  return auth;
}