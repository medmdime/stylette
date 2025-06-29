import React, { useCallback, useEffect } from 'react';
import { ScrollView, Image } from 'react-native';
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
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function Auth() {
  const router = useRouter();

  const { startSSOFlow } = useSSO();

  const onPress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, []);

  const onPressApple = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_apple',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
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

        <Button onPress={signInWithEmail}>
          <Text>Sign in with email</Text>
        </Button>

        <Button
          onPress={onPress}
          className="flex-row items-center justify-center bg-white border border-gray-200"
          style={{ minHeight: 48 }}>
          <Image
            source={require('~/assets/google.webp')}
            style={{ width: 22, height: 22, marginRight: 10 }}
          />
          <Text className="text-black font-medium">Sign in with Google</Text>
        </Button>

        <Button
          onPress={onPressApple}
          className="flex-row items-center justify-center bg-black"
          style={{ minHeight: 48 }}>
          <Image
            source={require('~/assets/apple.png')}
            tintColor={'white'}
            style={{ width: 45, height: 45, marginRight: 0 }}
          />
          <Text className="text-white font-medium">Sign in with Apple</Text>
        </Button>
      </ScrollView>
    </ViewGradient>
  );
}
