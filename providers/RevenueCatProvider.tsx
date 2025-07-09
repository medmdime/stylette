import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// IMPORTANT: You need to add your RevenueCat API keys to your .env file.
// Create a new file `.env` in your root project folder if it doesn't exist.
// Add the following lines:
// EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_ios_api_key
// EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your_android_api_key

const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
};

interface RevenueCatProviderProps {
  children: React.ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  useEffect(() => {
    const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

    if (!apiKey) {
      console.warn('RevenueCat API key is not set. Please add it to your .env file.');
      return;
    }

    // Enable debug logs before calling `configure`
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

    Purchases.configure({ apiKey });
  }, []);

  return <>{children}</>;
}
