import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useClient } from '~/utils/supabase';
import { useQuery } from '@tanstack/react-query';

export default function LoadingScreen() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useClient();

  // 1. Get the status and data from useQuery.
  const { data, isSuccess, isError, isLoading } = useQuery({
    queryKey: ['onboarding_status', user?.id],

    // 2. The queryFn is now "pure". It only fetches and returns data or throws an error.
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      // For any error (including profile not found), we throw. 'isError' will become true.
      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      // We even throw for the "profile not found" case to simplify logic in useEffect.
      if (!data) {
        throw new Error('Profile not found.');
      }

      return data;
    },
    enabled: isLoaded && !!user && isSignedIn,
    refetchOnWindowFocus: false,
    retry: true,
  });

  useEffect(() => {
    if (isSuccess) {
      if (data?.onboarding_completed) {
        router.replace('/(app)/camera');
      } else {
        router.replace('/onboarding');
      }
    } else if (isError) {
      router.replace('/onboarding');
    }
  }, [isSuccess, isError, data, router]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" />
    </View>
  );
}
