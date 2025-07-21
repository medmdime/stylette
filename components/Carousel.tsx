import React, { useState } from 'react';
import { View, Image, Dimensions } from 'react-native';
import { Card, CardContent } from '~/components/ui/card';
import { H3, Muted } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 8; // Corresponds to p-6 on each side of the screen

interface Blog {
  id: string;
  title: string;
  content: string;
  image_urls: string[];
  created_at: string;
}

interface CarouselProps {
  item: Blog;
}

export default function Carousel({ item }: CarouselProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const newIndex = Math.floor(contentOffset.x / viewSize.width);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handlePress = () => {
    router.navigate({
      pathname: '/blog-detail',
      params: { blog: JSON.stringify(item) },
    });
  };

  return (
    <Card className=" mb-8 flex  w-full self-center overflow-hidden bg-card/70">
      <Pressable onPress={handlePress}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            style={{ width: CARD_WIDTH, height: 400 }}>
            {item.image_urls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={{ width: CARD_WIDTH, height: '100%' }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {item.image_urls.length > 1 && (
            <View className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-2.5 py-1.5">
              <Text className="text-xs font-bold text-white">
                {activeIndex + 1} / {item.image_urls.length}
              </Text>
            </View>
          )}
        </View>

        <CardContent className="p-2">
          <H3 className="font-bold">{item.title}</H3>
          <Muted className="mt-1 text-xs">{new Date(item.created_at).toLocaleDateString()}</Muted>
        </CardContent>
      </Pressable>
    </Card>
  );
}
