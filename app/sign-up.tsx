import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { H1, P } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import { useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { ViewGradient } from '~/components/ViewGradient';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const router = useRouter();

  const { isLoaded, signUp, setActive } = useSignUp();

  async function signUpWithEmail() {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(app)');
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <ScrollView contentContainerClassName="mx-5 gap-2">
        <H1>Verify your email</H1>
        <Input
          value={code}
          placeholder="Enter your verification code"
          onChangeText={(code) => setCode(code)}
        />
        <Button onPress={onVerifyPress}>
          <Text>Verify</Text>
        </Button>
      </ScrollView>
    );
  }

  return (
    <ViewGradient>
      <ScrollView contentContainerClassName="mx-5 gap-2">
        <H1 className="mb-4 text-center">Sign up for Stylette</H1>
        <P className="mb-2 text-center">Create your account to get started</P>
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
          <Button disabled={!isLoaded} onPress={signUpWithEmail}>
            <Text>Sign up</Text>
          </Button>
        </View>
      </ScrollView>
    </ViewGradient>
  );
}
