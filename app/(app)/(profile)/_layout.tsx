import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        options={{
          title: 'Settings',
          presentation: 'modal',
        }}
        name="settings-profile"
      />
      <Stack.Screen
        options={{
          title: 'Update Style',
          presentation: 'modal',
        }}
        name="update-style"
      />
    </Stack>
  );
}
