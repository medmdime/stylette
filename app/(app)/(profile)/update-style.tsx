import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { H1, P } from '~/components/ui/typography';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { useUser } from '@clerk/clerk-expo';
import { useClient } from '~/utils/supabase';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [preferences, setPreferences] = useState<StylePreferences>({});

  const { data: initialPreferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['style_preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'personal_style, color_palette, go_to_outfit, pattern_preference, essential_accessory, style_goal, getting_ready_time'
        )
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    }
  }, [initialPreferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updatedPreferences: StylePreferences) => {
      if (!user) throw new Error('User not found');
      const { error } = await supabase
        .from('profiles')
        .update(updatedPreferences)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style_preferences', user?.id] });
      Alert.alert('Success!', 'Your style preferences have been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to save your preferences.');
    },
  });

  const handleUpdatePreference = (key: string, value: string) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoadingPreferences) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="w-full" contentContainerClassName="p-4 gap-y-6">
        <View>
          <H1>Update Style</H1>
          <P className="text-muted-foreground">
            Customize your style preferences to get better recommendations.
          </P>
        </View>

        <View className="overflow-hidden rounded-lg bg-card">
          {questions.map(({ key, question, answers }, index) => (
            <DropdownMenu.Root key={key}>
              <DropdownMenu.Trigger asChild>
                <TouchableOpacity
                  className={`flex-row items-center justify-between p-4 ${
                    index < questions.length - 1 ? 'border-b border-border' : ''
                  }`}>
                  <Text className="w-2/4 ">{question}</Text>
                  <View className=" w-2/4 flex-row items-center justify-end gap-2">
                    <Text className="w-2/3  text-muted-foreground/60" numberOfLines={1}>
                      {preferences[key] ?? 'Select'}
                    </Text>
                    <ChevronRight size={16} color={colors.text} />
                  </View>
                </TouchableOpacity>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {answers.map((answer) => (
                  <DropdownMenu.Item
                    key={answer}
                    onSelect={() => handleUpdatePreference(key, answer)}>
                    <DropdownMenu.ItemTitle>{answer}</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ))}
        </View>

        <Button
          onPress={() => updatePreferencesMutation.mutate(preferences)}
          disabled={updatePreferencesMutation.isPending}
          className="mt-4">
          {updatePreferencesMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text>Save Changes</Text>
          )}
        </Button>
      </ScrollView>
    </View>
  );
}
