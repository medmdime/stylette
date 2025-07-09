import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useClient } from '~/utils/supabase';

export default function LoadingScreen() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useClient();

  useEffect(() => {
    if (!isLoaded || !user || !isSignedIn) {
      return;
    }

    const checkOnboardingStatus = async () => {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      console.log('Onboarding data:', data, 'Error:', error, 'Count:', count);

      if (error && error.code !== 'PGRST116') {
        router.replace('/onboarding');
      }

      if (data) {
        router.replace('/(app)/camera');
      } else {
        router.replace('/onboarding');
      }
    };

    checkOnboardingStatus();
  }, [isLoaded, user]);

  if (!isSignedIn) {
    router.replace('/');
    return null;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
