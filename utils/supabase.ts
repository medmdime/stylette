import { useAuth } from "@clerk/clerk-expo";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const useClient = () => {
  const { sessionClaims } = useAuth();

  function createClerkSupabaseClient() {
    return createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        accessToken: async () => sessionClaims?.__raw ?? null,
      },
    );
  }

  return createClerkSupabaseClient();
};
