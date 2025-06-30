import React, { useCallback, useEffect } from 'react';
import { ScrollView, Image, Platform } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { H1, P } from '~/components/ui/typography';
import { useRouter } from 'expo-router';
import { useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { ViewGradient } from '~/components/ViewGradient';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'web') void WebBrowser.warmUpAsync();
    return () => {
      if (Platform.OS !== 'web') void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function Auth() {
  const router = useRouter();
  useWarmUpBrowser();
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
        router.replace('/(app)');
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
        router.replace('/(app)');
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
    <ViewGradient style={{ flex: 1 }}>
      <ScrollView contentContainerClassName="mx-3 flex-1 gap-2  mt-40">
        <H1 className="mb-4  text-center">Hello User, Welcome to Stylette</H1>
        <P className="mb-2 text-center">Your AI style assistant</P>
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
          <Text className="font-medium text-black">Sign in with Google</Text>
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
          <Text className="font-medium text-white">Sign in with Apple</Text>
        </Button>
      </ScrollView>
    </ViewGradient>
  );
}
