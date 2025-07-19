import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Purchases, { CustomerInfo, PurchasesStoreTransaction } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { H1 } from '~/components/ui/typography';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [rcConfigured, setRcConfigured] = useState(false);

  useEffect(() => {
    const configureRevenueCat = async () => {
      try {
        if (user?.id) {
          Purchases.configure({
            apiKey: 'appl_daEMbmtxqfEBHmoBIJGCuaUOtcd',
            appUserID: user.id,
          });

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
    console.log('Purchase completed:', customerInfo, storeTransaction);
    router.replace('/(app)/camera');
  };

  const onRestoreCompleted = ({ customerInfo }: { customerInfo: CustomerInfo }) => {
    console.log('Restore completed:', customerInfo);
    router.replace('/(app)/camera');
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
          displayCloseButton: true,
        }}
        onPurchaseCompleted={onPurchaseCompleted}
        onRestoreCompleted={onRestoreCompleted}
        onDismiss={() => {
          signOut();
        }}
      />
    </View>
  );
}
