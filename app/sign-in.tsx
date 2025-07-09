import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { H1, P } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { validateEmail } from '~/utils/forms';
import { useHeaderHeight } from '@react-navigation/elements';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const router = useRouter();
  const headerHeight = useHeaderHeight();
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
        router.replace('/loading');
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
    <View className="flex-1 items-center justify-center p-4">
      <ScrollView
        contentContainerClassName="gap-2 w-full max-w-md"
        showsVerticalScrollIndicator={false}>
        <KeyboardAvoidingView className="gap-2">
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
              <Text className="mt-1 text-sm text-destructive">{emailError}</Text>
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
              <Text className="mt-1 text-sm text-destructive">{passwordError}</Text>
            ) : null}
          </View>
          {formError ? (
            <View className="mb-2">
              <Text className="text-center text-sm text-destructive">{formError}</Text>
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
    </View>
  );
}
