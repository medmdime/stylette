import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Purchases, { CustomerInfo, PurchasesStoreTransaction } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { useUser } from '@clerk/clerk-expo';
import { H1 } from '~/components/ui/typography';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [rcConfigured, setRcConfigured] = useState(false);

  useEffect(() => {
    const configureRevenueCat = async () => {
      try {
        if (user?.id) {
          if (Platform.OS === 'ios') {
            Purchases.configure({
              apiKey: 'appl_daEMbmtxqfEBHmoBIJGCuaUOtcd',
              appUserID: user.id,
            });
          } else if (Platform.OS === 'android') {
            Purchases.configure({
              apiKey: 'goog_zQmTuXJRbHZvzftvPCdjwrcviaL',
              appUserID: user.id,
            });
          } else if (Platform.OS === 'web') {
            Purchases.configure({
              apiKey: 'rcb_JaxJpQObShHvSaWyfwkCALMbdknZ',
              appUserID: user.id,
            });
          }
          if (user.primaryEmailAddress) {
            await Purchases.setEmail(user.primaryEmailAddress.emailAddress);
          }
          setRcConfigured(true);
        }
      } catch (e) {
        console.error('Error configuring RevenueCat:', e);
      }
    };

    configureRevenueCat();
  }, [user]);

  const onPurchaseCompleted = ({
    customerInfo,
    storeTransaction,
  }: {
    customerInfo: CustomerInfo;
    storeTransaction: PurchasesStoreTransaction;
  }) => {
    router.replace('/(app)/camera');
  };

  const onRestoreCompleted = ({ customerInfo }: { customerInfo: CustomerInfo }) => {
    if (customerInfo.entitlements.active['pro']) {
      router.replace('/(app)/camera');
    }
  };

  if (!rcConfigured) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <H1>Loading Paywall...</H1>
        <ActivityIndicator size="large" color="gray" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <RevenueCatUI.Paywall
        options={{
          displayCloseButton: false,
        }}
        onPurchaseCompleted={onPurchaseCompleted}
        onRestoreCompleted={onRestoreCompleted}
        onPurchaseCancelled={() => {
          console.log('Purchase cancelled');
        }}
      />
    </View>
  );
}
