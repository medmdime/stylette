import { useRef, useState } from 'react';
import { Alert, ScrollView, View, TouchableOpacity, Linking } from 'react-native';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { H1, P } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import { useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { validateEmail } from '~/utils/forms';
import { Eye, EyeOff, Square, CheckSquare } from 'lucide-react-native';
import { useTheme } from '@react-navigation/native';

import { OTPInput, OTPInputRef } from 'input-otp-native';
import { Slot } from '~/components/ui/Slot';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const router = useRouter();
  const theme = useTheme();
  const { isLoaded, signUp, setActive } = useSignUp();
  const ref = useRef<OTPInputRef>(null);

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
    if (password !== repeatPassword) {
      setPasswordError('Passwords do not match.');
      valid = false;
    }
    if (!legalAccepted) {
      setFormError('You must accept the Terms of Service to continue.');
      valid = false;
    }
    if (!valid) return;
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: email,
        password,
        legalAccepted: true,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      let message = 'An error occurred during sign up.';
      if (err && typeof err === 'object' && 'message' in err) {
        const clerkError = err as { errors?: { message: string }[] };
        message = clerkError.errors?.[0]?.message || (err as Error).message;
      }
      setFormError(message);
      console.error(JSON.stringify(err, null, 2));
    }
  }

  const onVerifyPress = async (code: string) => {
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
      let message = 'An error occurred during verification.';
      if (err && typeof err === 'object' && 'message' in err) {
        const clerkError = err as { errors?: { message: string }[] };
        message = clerkError.errors?.[0]?.message || (err as Error).message;
      }
      setFormError(message);
      Alert.alert(message, '', [{ text: 'OK' }]);
    }
  };

  if (pendingVerification) {
    return (
      <ScrollView contentContainerClassName="gap-2 mx-4 my-2" showsVerticalScrollIndicator={false}>
        <H1>Verify your email</H1>
        <P>Please enter the 6-digit code sent to your email address.</P>
        <OTPInput
          ref={ref}
          onComplete={onVerifyPress}
          maxLength={6}
          render={({ slots }) => (
            <View className="my-4 flex-row items-center justify-center gap-2">
              {slots.map((slot, idx) => (
                <Slot key={idx} {...slot} />
              ))}
            </View>
          )}
        />
        {formError ? (
          <View className="mb-2">
            <Text className="text-center text-sm text-destructive">{formError}</Text>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerClassName="gap-2 mx-4 my-2" showsVerticalScrollIndicator={false}>
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
      <View className="relative">
        <Input
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError('');
          }}
          value={password}
          secureTextEntry={!showPassword}
          placeholder="Password"
          autoCapitalize={'none'}
        />
        <TouchableOpacity
          className="absolute right-4 top-3"
          onPress={() => setShowPassword(!showPassword)}>
          {showPassword ? (
            <EyeOff size={20} color={theme.colors.text} />
          ) : (
            <Eye size={20} color={theme.colors.text} />
          )}
        </TouchableOpacity>
      </View>
      <View className="relative">
        <Input
          onChangeText={(text) => {
            setRepeatPassword(text);
            if (passwordError) setPasswordError('');
          }}
          value={repeatPassword}
          secureTextEntry={!showRepeatPassword}
          placeholder="Repeat Password"
          autoCapitalize={'none'}
        />
        <TouchableOpacity
          className="absolute right-4 top-3 "
          onPress={() => setShowRepeatPassword(!showRepeatPassword)}>
          {showRepeatPassword ? (
            <EyeOff size={20} color={theme.colors.text} />
          ) : (
            <Eye size={20} color={theme.colors.text} />
          )}
        </TouchableOpacity>
        {passwordError ? (
          <Text className="mt-1 text-sm text-destructive">{passwordError}</Text>
        ) : null}
      </View>

      <View className="my-2 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => setLegalAccepted(!legalAccepted)}>
          {legalAccepted ? (
            <CheckSquare size={20} color={theme.colors.primary} />
          ) : (
            <Square size={20} color={theme.colors.text} />
          )}
        </TouchableOpacity>
        <View className="flex-1 flex-row flex-wrap">
          <P nativeID="legal-label" className="text-sm">
            I agree to the{' '}
            <Text
              className="font-bold text-primary"
              onPress={() => Linking.openURL('https://stylette.info/terms-and-conditions')}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              className="font-bold text-primary"
              onPress={() => Linking.openURL('https://stylette.info/privacy')}>
              Privacy Policy
            </Text>
            .
          </P>
        </View>
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
  );
}
