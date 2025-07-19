import { useState } from 'react';
import { View, Image } from 'react-native';
import { H1 } from '~/components/ui/typography';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { Progress } from '~/components/ui/progress';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useClient } from '~/utils/supabase';
import { useColorScheme } from '~/lib/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const iconeDark = require('~/assets/backlogo.webp');
const iconeLight = require('~/assets/lightlogo.webp');

const questions = [
  {
    key: 'personal_style',
    question: 'What word best describes your personal style?',
    answers: ['Classic', 'Trendy', 'Minimalist', 'Bohemian', 'Edgy'],
  },
  {
    key: 'color_palette',
    question: 'Which color palette do you prefer?',
    answers: ['Neutrals', 'Pastels', 'Brights', 'Darks', 'Monochrome'],
  },
  {
    key: 'go_to_outfit',
    question: 'What is your go-to outfit for a casual day out?',
    answers: [
      'Jeans and a T-shirt',
      'A comfortable dress',
      'Athleisure wear',
      'A skirt and top',
      'Shorts and a blouse',
    ],
  },
  {
    key: 'pattern_preference',
    question: 'How do you feel about patterns?',
    answers: [
      'Love them!',
      'A little goes a long way',
      'I prefer solids',
      'Only on accessories',
      'It depends on the pattern',
    ],
  },
  {
    key: 'essential_accessory',
    question: 'Which accessory can you not live without?',
    answers: [
      'A statement necklace',
      'A classic watch',
      'A stylish handbag',
      'Comfortable sneakers',
      'Sunglasses',
    ],
  },
  {
    key: 'style_goal',
    question: 'What is your primary style goal?',
    answers: [
      'To look more professional',
      'To feel more confident',
      'To be more comfortable',
      'To express my creativity',
      'To follow the latest trends',
    ],
  },
  {
    key: 'getting_ready_time',
    question: 'How much time do you like to spend getting ready?',
    answers: [
      'Under 15 minutes',
      '15-30 minutes',
      '30-45 minutes',
      '45-60 minutes',
      'Over an hour',
    ],
  },
];

export default function OnboardingScreen() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();
  const supabase = useClient();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const exitOnboarding = () => {
    signOut();
  };

  const finishOnboarding = async () => {
    if (!user) return;

    const preferences = Object.fromEntries(
      Object.entries(answers).map(([index, answer]) => [questions[parseInt(index, 10)].key, answer])
    );

    const { error } = await supabase
      .from('profiles')
      .insert({ ...preferences, user_id: user.id, onboarding_completed: true });
    if (error) {
      console.error('Error updating profile:', error);
    } else {
      router.replace('/paywall');
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View className="flex-1 bg-background p-2" style={{ paddingTop: insets.top }}>
      <View className="mb-8 flex flex-row items-center">
        <Image
          source={colorScheme === 'light' ? iconeLight : iconeDark}
          className="h-24 w-[20%]"
          resizeMode="contain"
        />
        <Progress value={progress} max={7} className="w-[75%]" />
      </View>

      <View className="justify-center">
        <H1 className="mb-10 text-center text-2xl">{currentQuestion.question}</H1>
        <View className="gap-y-4">
          {currentQuestion.answers.map((answer) => (
            <Button key={answer} variant="outline" size="lg" onPress={() => handleAnswer(answer)}>
              <Text>{answer}</Text>
            </Button>
          ))}
        </View>
      </View>
      <Button variant="outline" className="mt-48" onPress={exitOnboarding}>
        <Text>Exit</Text>
      </Button>
    </View>
  );
}
