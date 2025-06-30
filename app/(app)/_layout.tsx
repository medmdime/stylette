import { Stack } from 'expo-router';

export default function appStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
