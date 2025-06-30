import '~/global.css';

import { Theme, ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { PortalHost } from '@rn-primitives/portal';
import { ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};
export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const { isDarkColorScheme } = useColorScheme();
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <GestureHandlerRootView>
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
          <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />
          <RootNavigator />
          <PortalHost />
        </ThemeProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}

function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <ActivityIndicator color={'gray'} />;
  }

  return (
    <Stack
      screenOptions={{
        title: '',
        headerTransparent: true,
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
      }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen options={{ headerShown: false }} name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="forget-password" />
      </Stack.Protected>
    </Stack>
  );
}
