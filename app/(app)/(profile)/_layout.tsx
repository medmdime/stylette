import { Stack } from 'expo-router';
import { ViewGradient } from '~/components/ViewGradient';

export default function ProfileStackLayout() {
  return (
    <ViewGradient>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          options={{
            title: 'Settings',
            presentation: 'modal',
          }}
          name="settings-profile"
        />
      </Stack>
    </ViewGradient>
  );
}
