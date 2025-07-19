import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useClient } from '~/utils/supabase';
import Purchases from 'react-native-purchases';

export default function LoadingScreen() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useClient();

  useEffect(() => {
    if (!isLoaded || !user || !isSignedIn) {
      if (isLoaded && !isSignedIn) {
        router.replace('/');
      }
      return;
    }

    const checkSubscriptionAndOnboarding = async () => {
      try {
        Purchases.configure({
          apiKey: 'appl_daEMbmtxqfEBHmoBIJGCuaUOtcd',
          appUserID: user.id,
        });

        if (user.primaryEmailAddress) {
          await Purchases.setEmail(user.primaryEmailAddress.emailAddress);
        }

        const customerInfo = await Purchases.getCustomerInfo();
        const isPro = customerInfo.entitlements.active['pro'] !== undefined;

        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        console.log('Customer Info:', data, 'error:', error);

        if (error && error.code === 'PGRST116') {
          router.replace('/onboarding');
          return;
        }

        if (!isPro) {
          router.replace('/paywall');
          return;
        }

        if (data?.onboarding_completed) {
          router.replace('/(app)/camera');
        } else {
          router.replace('/onboarding');
        }
      } catch (e) {
        console.error('Error in subscription/onboarding check:', e);
        router.replace('/onboarding');
      }
    };

    checkSubscriptionAndOnboarding();
  }, [isLoaded, user, isSignedIn, router, supabase]);

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
