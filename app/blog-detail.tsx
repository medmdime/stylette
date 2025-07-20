import { View, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Text } from '~/components/ui/text';
import { H1 } from '~/components/ui/typography';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');

interface Blog {
  id: string;
  title: string;
  content: string;
  image_urls: string[];
  created_at: string;
}

export default function BlogDetailScreen() {
  const { blog: blogString } = useLocalSearchParams<{ blog: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const theme = useColorScheme();
  if (!blogString) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Blog post not found.</Text>
      </View>
    );
  }

  const blog: Blog = JSON.parse(blogString);

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const newIndex = Math.floor(contentOffset.x / viewSize.width);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          router.back();
        }}
        className="absolute left-6 top-16 z-10 rounded-full bg-background/50 p-1.5 ">
        <ChevronLeft size={26} color={colors.colors.text} />
      </TouchableOpacity>

      <Stack.Screen options={{ title: blog.title, headerBackTitle: 'Back', headerShown: false }} />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            style={{ width: width, height: width }}>
            {blog.image_urls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={{ width: width, height: width }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {blog.image_urls.length > 1 && (
            <View className="absolute bottom-4 right-4 flex-row rounded-full bg-black/60 px-3 py-1.5">
              <Text className="text-sm font-bold text-white">
                {activeIndex + 1} / {blog.image_urls.length}
              </Text>
            </View>
          )}
        </View>

        <View className="p-2">
          <H1 className="mb-2 text-3xl font-bold">{blog.title}</H1>
          <Text className="mb-6 text-sm text-muted-foreground">
            {new Date(blog.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Markdown
            style={{
              body: {
                fontSize: 16,
                lineHeight: 24,
                marginVertical: 3,
                marginHorizontal: 10,
                color: theme.colorScheme === 'dark' ? '#fff' : '#000',
              },
              heading1: {
                fontSize: 25,
                fontWeight: 'bold',
                marginVertical: 12,
                paddingVertical: 8,
              },
              heading2: {
                fontSize: 24,
                fontWeight: 'bold',
                marginVertical: 10,
              },
              heading3: {
                fontSize: 20,
                fontWeight: 'bold',
                marginVertical: 8,
              },
              heading4: {
                fontSize: 18,
                fontWeight: '600',
                marginVertical: 6,
              },
              heading5: {
                fontSize: 16,
                fontWeight: '600',
                marginVertical: 4,
              },
              heading6: {
                fontSize: 14,
                fontWeight: '600',
                marginVertical: 4,
              },
              paragraph: {
                fontSize: 16,
                lineHeight: 24,
                marginVertical: 8,
              },
              link: {
                textDecorationLine: 'underline',
                marginVertical: 4,
              },
              bullet_list: {
                paddingLeft: 16,
                marginVertical: 6,
              },
              ordered_list: {
                paddingLeft: 16,
                marginVertical: 6,
              },
              list_item: {
                fontSize: 16,
                marginVertical: 4,
              },
              strong: {
                fontWeight: 'bold',
              },
              em: {
                fontStyle: 'italic',
              },
              s: {
                textDecorationLine: 'line-through',
              },
              blockquote: {
                borderLeftWidth: 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginVertical: 8,
              },
              code_inline: {
                fontFamily: 'Courier',
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 4,
              },
              code_block: {
                fontFamily: 'Courier',
                padding: 12,
                borderRadius: 6,
                marginVertical: 12,
              },
              fence: {
                fontFamily: 'Courier',
                padding: 12,
                borderRadius: 6,
                marginVertical: 12,
              },
              pre: {
                padding: 12,
                borderRadius: 6,
                marginVertical: 12,
              },
              table: {
                borderWidth: 1,
                marginVertical: 8,
              },
              thead: {
                borderBottomWidth: 1,
              },
              tbody: {},
              th: {
                borderWidth: 1,
                padding: 8,
              },
              tr: {},
              td: {
                borderWidth: 1,
                padding: 8,
              },
              blocklink: {
                textDecorationLine: 'underline',
                marginVertical: 4,
              },
              image: {
                resizeMode: 'contain',
                marginVertical: 12,
              },
              text: {},
              textgroup: {
                marginVertical: 6,
              },
              hardbreak: {
                height: 0,
              },
              softbreak: {
                height: 0,
              },
              inline: {},
              span: {},
            }}>
            {blog.content}
          </Markdown>
        </View>
      </ScrollView>
    </>
  );
}
