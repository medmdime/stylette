import React, { useCallback, useEffect } from 'react';
import { ScrollView, Image, Platform, View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { H1, H3, P } from '~/components/ui/typography';
import { useRouter } from 'expo-router';
import { useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'web') void WebBrowser.warmUpAsync();
    return () => {
      if (Platform.OS !== 'web') void WebBrowser.coolDownAsync();
    };
  }, []);
};

const iconeDark = require('~/assets/backlogo.webp');
const iconeLight = require('~/assets/lightlogo.webp');

export default function Auth() {
  const router = useRouter();
  useWarmUpBrowser();
  const theme = useColorScheme();
  const { startSSOFlow } = useSSO();
  const [isLoading, setIsLoading] = React.useState(false);

  const onPress = useCallback(async () => {
    try {
      setIsLoading(true);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/(app)/camera');
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onPressApple = useCallback(async () => {
    try {
      setIsLoading(true);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_apple',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/(app)/camera');
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithEmail = () => {
    router.push('./sign-in');
  };

  return (
    <View className="flex-1 items-center justify-center p-4">
      <ScrollView
        contentContainerClassName="gap-2 w-full max-w-md"
        showsVerticalScrollIndicator={false}>
        <Image
          source={theme.colorScheme === 'light' ? iconeLight : iconeDark}
          className="h-48 w-full rounded-lg"
          style={{ resizeMode: 'cover' }}
        />
        <H1 className="mb-4  text-center">Hello, Welcome to Stylette</H1>
        <H3 className="mb-2 text-center">Your AI style assistant</H3>
        <P className="mb-6 text-center">Sign in with us to get started!</P>

        <Button disabled={isLoading} onPress={signInWithEmail}>
          <Text>Sign in with email</Text>
        </Button>

        <Button
          onPress={onPress}
          disabled={isLoading}
          className="flex-row items-center justify-center border border-gray-200 bg-white"
          style={{ minHeight: 48 }}>
          <Image
            source={require('~/assets/google.webp')}
            style={{ width: 22, height: 22, marginRight: 10 }}
          />
          <Text className="font-medium text-black">Continue with Google</Text>
        </Button>

        <Button
          onPress={onPressApple}
          disabled={isLoading}
          className="flex-row items-center justify-center bg-black"
          style={{ minHeight: 48 }}>
          <Image
            source={require('~/assets/apple.png')}
            tintColor={'white'}
            style={{ width: 45, height: 45, marginRight: 0 }}
          />
          <Text className="font-medium text-white">Continue with Apple</Text>
        </Button>
      </ScrollView>
    </View>
  );
}
