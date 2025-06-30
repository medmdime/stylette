import { useClerk } from '@clerk/clerk-expo';
import React from 'react';
import { View } from 'react-native';
import { Button } from '~/components/ui/button';
import { H1, P } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export default function Welcome() {
  const { signOut } = useClerk();
  async function handleSignOut() {
    await signOut();
    Linking.openURL(Linking.createURL('/'));
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <H1 className="mb-4 text-center">Welcome to Stylette!</H1>
      <P className="mb-8 text-center">
        You are signed in. Enjoy your AI style assistant experience.
      </P>
      <Button variant="destructive" onPress={handleSignOut}>
        <Text> Sign out </Text>
      </Button>
      <Button
        variant="outline"
        onPress={() => {
          router.push('/(app)/camera');
        }}>
        <Text> camera </Text>
      </Button>
    </View>
  );
}
