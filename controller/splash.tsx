import { useAuth } from '@clerk/clerk-expo';
import { SplashScreen } from 'expo-router';

export function SplashScreenController() {
  const { isLoaded } = useAuth();

  if (isLoaded) {
    SplashScreen.hideAsync();
  }

  return null;
}
