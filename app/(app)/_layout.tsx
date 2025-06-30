import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ViewGradient } from '~/components/ViewGradient';

export default function AppLayout() {
  return (
    <ViewGradient>
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
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            position: 'absolute',
          },
          sceneStyle: {
            backgroundColor: 'transparent',
          },
        })}>
        <Tabs.Screen name="index" options={{ title: 'Items' }} />
        <Tabs.Screen name="camera" options={{ title: 'Camera' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </ViewGradient>
  );
}
