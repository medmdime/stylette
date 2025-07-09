import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { H1, P } from '~/components/ui/typography';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Label } from '~/components/ui/label';
import { useUser } from '@clerk/clerk-expo';
import { useClient } from '~/utils/supabase';
import { useRouter } from 'expo-router';

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

type StylePreferences = Record<string, string | null>;

export default function UpdateStyleScreen() {
  const { user } = useUser();
  const supabase = useClient();
  const router = useRouter();
  const [preferences, setPreferences] = useState<StylePreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'personal_style, color_palette, go_to_outfit, pattern_preference, essential_accessory, style_goal, getting_ready_time'
      )
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching style preferences:', error);
      Alert.alert('Error', 'Could not load your style preferences.');
    } else if (data) {
      setPreferences(data);
    }
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdatePreference = (key: string, value: string) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update(preferences).eq('id', user.id);

    if (error) {
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
      console.error('Error updating preferences:', error);
    } else {
      Alert.alert('Success!', 'Your style preferences have been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center bg-background">
      <ScrollView className="w-full max-w-5xl" contentContainerClassName="p-6 gap-y-6">
        <View>
          <H1>Update Style</H1>
          <P className="text-muted-foreground">
            Customize your style preferences to get better recommendations.
          </P>
        </View>

        {questions.map(({ key, question, answers }) => (
          <View key={key} className="gap-y-2">
            <Label nativeID={key}>{question}</Label>
            <Select
              value={{
                value: preferences[key] ?? '',
                label: preferences[key] ?? 'Select an option',
              }}
              onValueChange={(option) => option && handleUpdatePreference(key, option.value)}>
              <SelectTrigger id={key} className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {answers.map((answer) => (
                    <SelectItem key={answer} label={answer} value={answer}>
                      {answer}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </View>
        ))}

        <Button onPress={handleSaveChanges} disabled={isSaving} className="mt-4">
          {isSaving ? <ActivityIndicator color="white" /> : <Text>Save Changes</Text>}
        </Button>
      </ScrollView>
    </View>
  );
}
