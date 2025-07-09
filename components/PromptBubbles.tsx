import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { H3 } from '~/components/ui/typography';
import { Badge } from '~/components/ui/badge';
import { Pressable } from 'react-native-gesture-handler';

const PROMPTS = [
  { title: 'Rate my outfit' },
  { title: 'Suggest improvements' },
  { title: 'Is this spicy? 🌶️' },
  { title: 'Complete this look' },
  { title: 'Make it more flattering' },
  {
    title: 'Change the vibe',
    requiresInput: true,
    placeholder: 'e.g., more casual, professional...',
  },
  {
    title: 'Suit my occasion',
    requiresInput: true,
    placeholder: 'e.g., a summer wedding, a concert...',
  },
  {
    title: 'Is this dress code appropriate?',
    requiresInput: true,
    placeholder: 'e.g., business casual, black tie...',
  },
];

interface PromptBubblesProps {
  onSelectPrompt: (prompt: (typeof PROMPTS)[number]) => void;
}

export function PromptBubbles({ onSelectPrompt }: PromptBubblesProps) {
  return (
    <View className="w-full">
      <View className="mb-4 items-center">
        <H3 className="font-bold text-white">How can I help?</H3>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View
          // This container wraps the badges into two vertical rows and allows horizontal scrolling of these columns.
          className="h-[208px] flex-col flex-wrap pr-4"
          style={{ paddingHorizontal: 16, gap: 12 }}>
          {PROMPTS.map((prompt) => (
            <Pressable
              key={prompt.title}
              onPress={() => {
                onSelectPrompt(prompt);
              }}
              // Fixed width to ensure two badges fit per vertical column before wrapping horizontally.
              className="w-[150px]">
              <Badge variant="secondary" className="h-12 justify-center border-0 bg-black/90 px-5">
                <Text className="text-base font-bold text-white">{prompt.title}</Text>
              </Badge>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
