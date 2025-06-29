import React, { useCallback, useEffect } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
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
      <ScrollView contentContainerClassName="mx-3 flex-1 mt-40">
        <KeyboardAvoidingView className="gap-2">
          <H1 className="mb-4  text-center">Hello User, Welcome to Stylette</H1>
          <P className="mb-2 text-center">Your AI style assistant</P>
          <P className="mb-6 text-center">Sign in with us to get started!</P>

          <View>
            <Button onPress={signInWithEmail}>
              <Text>Sign in with email</Text>
            </Button>
          </View>

          <View>
            <Button onPress={onPress}>
              <Text>Sign in with Google</Text>
            </Button>
          </View>
          <View>
            <Button onPress={onPressApple}>
              <Text>Sign in with Apple</Text>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </ViewGradient>
  );
}
