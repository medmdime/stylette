import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { H1, P } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { ViewGradient } from '~/components/ViewGradient';
import { validateEmail } from '~/utils/forms';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const router = useRouter();

  const { signIn, setActive, isLoaded } = useSignIn();

  async function signInWithEmail() {
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
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(app)');
      } else {
        setFormError('Sign in failed. Please check your credentials.');
      }
    } catch (err) {
      let message = 'An error occurred.';
      if (err && typeof err === 'object' && 'message' in err) {
        message = (err as any).message;
      }
      setFormError(message);
      Alert.alert(message, '', [{ text: 'OK', onPress: () => console.log('OK Pressed') }]);

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
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              value={email}
              placeholder="email@address.com"
              autoCapitalize={'none'}
              inputMode="email"
            />
            {emailError ? (
              <Text className="text-destructive text-sm mt-1">{emailError}</Text>
            ) : null}
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
              <Text className="text-destructive text-sm mt-1">{passwordError}</Text>
            ) : null}
          </View>
          {formError ? (
            <View className="mb-2">
              <Text className="text-destructive text-sm text-center">{formError}</Text>
            </View>
          ) : null}
          <View>
            <Button disabled={!isLoaded} onPress={signInWithEmail}>
              <Text>Sign In</Text>
            </Button>
          </View>
          <View>
            <Button variant="link" onPress={() => router.push('./sign-up')}>
              <Text> New here? Sign up with email</Text>
            </Button>

            <Button variant="link" onPress={() => router.push('./forget-password')}>
              <Text> Forgot password ?</Text>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </ViewGradient>
  );
}
