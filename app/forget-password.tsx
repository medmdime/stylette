import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { H1 } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { validateEmail } from '~/utils/forms';

export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [code, setCode] = useState('');

  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const router = useRouter();

  const { signIn, setActive, isLoaded } = useSignIn();

  async function signInWithEmail() {
    setEmailError('');
    setFormError('');
    let valid = true;
    if (!email) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }

    if (!valid) return;
    if (!isLoaded) return;
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setSuccessfulCreation(true);
    } catch (err) {
      let message = 'An error occurred.';
      if (err && typeof err === 'object' && 'message' in err) {
        message = (err as any).message;
      }
      setFormError(message);
      console.error(JSON.stringify(err, null, 2));
    }
  }

  async function onVerifyPress() {
    setPasswordError('');
    setFormError('');

    let valid = true;

    if (!valid) return;
    if (!isLoaded) return;
    try {
      const signInAttempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(app)/camera');
      }
    } catch (err) {
      let message = 'An error occurred.';
      if (err && typeof err === 'object' && 'message' in err) {
        message = (err as any).message;
      }
      setFormError(message);
      Alert.alert(message, '', [{ text: 'OK', onPress: () => console.log('OK Pressed') }]);
    }
  }

  if (successfulCreation) {
    return (
      <ScrollView contentContainerClassName="mx-5 gap-2">
        <H1>Verify your code</H1>
        <Input
          value={code}
          placeholder="Enter your verification code"
          onChangeText={(code) => setCode(code)}
        />
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
        <Button onPress={onVerifyPress}>
          <Text>Verify</Text>
        </Button>
      </ScrollView>
    );
  }
  return (
    <ScrollView contentContainerClassName="mx-5 gap-2 flex-1">
      <KeyboardAvoidingView className="gap-2">
        <H1 className="mb-4 text-center">Change password</H1>
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

        {formError ? (
          <View className="mb-2">
            <Text className="text-center text-sm text-destructive">{formError}</Text>
          </View>
        ) : null}
        <View>
          <Button disabled={!isLoaded} onPress={signInWithEmail}>
            <Text>Reset Password</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}
