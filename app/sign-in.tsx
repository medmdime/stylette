import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { H1, P } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { ViewGradient } from '~/components/ViewGradient';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const { signIn, setActive, isLoaded } = useSignIn();

  async function signInWithEmail() {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(app)');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }

  return (
    <ViewGradient>
      <ScrollView contentContainerClassName="mx-5 gap-2 flex-1">
        <KeyboardAvoidingView className="gap-2">
          <H1 className="mb-4 text-center">Sign In </H1>
          <P className="mb-2 text-center">Sign in to your account</P>
          <View>
            <Input
              onChangeText={(text) => setEmail(text)}
              value={email}
              placeholder="email@address.com"
              autoCapitalize={'none'}
              inputMode="email"
            />
          </View>
          <View>
            <Input
              onChangeText={(text) => setPassword(text)}
              value={password}
              secureTextEntry={true}
              placeholder="Password"
              autoCapitalize={'none'}
            />
          </View>
          <View>
            <Button disabled={!isLoaded} onPress={signInWithEmail}>
              <Text>Sign In</Text>
            </Button>
          </View>
          <View>
            <Button variant="link" onPress={() => router.push('./sign-up')}>
              <Text> New here? Sign up with email</Text>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </ViewGradient>
  );
}
