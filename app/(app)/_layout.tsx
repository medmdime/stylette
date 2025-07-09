import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: 'home' | 'camera' | 'person' = 'home';
          if (route.name === 'index') iconName = 'home';
          else if (route.name === 'camera') iconName = 'camera';
          else if (route.name === 'profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
        },
      })}>
      <Tabs.Screen name="camera" options={{ title: 'Camera' }} />
      <Tabs.Screen name="(profile)" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
