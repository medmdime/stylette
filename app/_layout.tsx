import '~/global.css';

import { Theme, ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalProvider } from '@gorhom/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '~/components/Header';

const queryClient = new QueryClient();

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
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <PortalProvider>
            <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
              <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />
              <RootNavigator />
            </ThemeProvider>
          </PortalProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
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
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerLargeTitle: false,
        title: '',

        header: ({ navigation }) => (
          <Header
            goBack={navigation.canGoBack() ? navigation.goBack : undefined}
            title={''}
            canGoBack={navigation.canGoBack()}
          />
        ),
      }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen options={{ headerShown: false }} name="sso-callback" />
      </Stack.Protected>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen options={{ headerShown: false }} name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen options={{ headerShown: false }} name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen options={{ headerShown: false }} name="paywall" />
      </Stack.Protected>

      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen options={{ headerShown: false }} name="blog-detail" />
      </Stack.Protected>

      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen options={{ headerShown: true }} name="settings-profile" />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" options={{ title: 'Sign In' }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-up" options={{ title: 'Sign Up for Stylette' }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="forget-password" options={{ title: 'Forgot Password' }} />
      </Stack.Protected>
    </Stack>
  );
}
