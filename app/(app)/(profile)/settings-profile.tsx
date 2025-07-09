import React from 'react';
import { View, Alert } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { H1, P } from '~/components/ui/typography';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { Separator } from '~/components/ui/separator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await user?.delete();
              Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Error', err.errors[0]?.message || 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 items-center p-6" style={{ paddingTop: insets.top + 20 }}>
      <View className="w-full max-w-md">
        <H1 className="mb-8">Settings</H1>
        <P className="mb-4 text-muted-foreground">Manage your account and app settings.</P>
        <Separator className="my-6" />
        <Button onPress={handleSignOut} className="mb-4">
          <Text>Sign Out</Text>
        </Button>
        <Button
          variant="outline"
          onPress={() => router.push('/(app)/(profile)/update-style')}
          className="mb-4">
          <Text>Update Style Preferences</Text>
        </Button>
        <Button variant="destructive" onPress={handleDeleteAccount}>
          <Text>Delete Account</Text>
        </Button>
      </View>
    </View>
  );
}
