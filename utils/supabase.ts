import { useAuth, useSession, useUser } from "@clerk/clerk-expo";
import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const useClient = () => {
  const { isLoaded, session, isSignedIn } = useSession();

  function createClerkSupabaseClient() {
    return createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        accessToken: async () => {
          return session?.getToken() ?? null;
        },
      },
    );
  }

  useEffect(() => {
    if (!session) {
      console.warn("No session found, Supabase client will not be created.");
      return;
    }
    createClerkSupabaseClient();
  }, [session, isLoaded, isSignedIn]);

  return createClerkSupabaseClient();
};
