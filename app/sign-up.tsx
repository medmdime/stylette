import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { H1, P } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import { useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { validateEmail } from '~/utils/forms';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const router = useRouter();

  const { isLoaded, signUp, setActive } = useSignUp();

  async function signUpWithEmail() {
    setEmailError('');
    setPasswordError('');
    setFormError('');
    let valid = true;
    if (!email) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    }
    if (!valid) return;
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      let message = 'An error occurred.';
      if (err && typeof err === 'object' && 'message' in err) {
        message = (err as any).message;
      }
      setFormError(message);
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
        router.replace('/loading');
      }
    } catch (err) {
      let message = 'An error occurred.';
      if (err && typeof err === 'object' && 'message' in err) {
        message = (err as any).message;
      }
      setFormError(message);
      Alert.alert(message, '', [{ text: 'OK', onPress: () => console.log('OK Pressed') }]);
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <ScrollView
          contentContainerClassName="gap-2 w-full max-w-md"
          showsVerticalScrollIndicator={false}>
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
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-4">
      <ScrollView
        contentContainerClassName="gap-2 w-full max-w-md"
        showsVerticalScrollIndicator={false}>
        <P className="mb-2 text-center">Create your account to get started</P>
        <View>
          <Input
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            value={email}
            placeholder="email@address.com"
            autoCapitalize={'none'}
            inputMode="email"
          />
          {emailError ? <Text className="mt-1 text-sm text-destructive">{emailError}</Text> : null}
        </View>
        <View>
          <Input
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            value={password}
            secureTextEntry={true}
            placeholder="Password"
            autoCapitalize={'none'}
          />
          {passwordError ? (
            <Text className="mt-1 text-sm text-destructive">{passwordError}</Text>
          ) : null}
        </View>
        {formError ? (
          <View className="mb-2">
            <Text className="text-center text-sm text-destructive">{formError}</Text>
          </View>
        ) : null}
        <View>
          <Button disabled={!isLoaded} onPress={signUpWithEmail}>
            <Text>Sign up</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
