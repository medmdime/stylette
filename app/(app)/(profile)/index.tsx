import { useUser } from '@clerk/clerk-expo';
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { H1, P, Muted, Small } from '~/components/ui/typography';
import { ProfileAnalysisModal } from '~/components/ProfileAnalysisModal';
import { Settings } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import type { OutfitAnalysisResult, ScannedItem, DisplayScannedItem } from '~/utils/types';
import { useClient } from '~/utils/supabase';
import { useTheme } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user } = useUser();
  const router = useRouter();
  const color = useTheme().colors.text;
  const [items, setItems] = useState<DisplayScannedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<OutfitAnalysisResult | null>(null);
  const supabase = useClient();

  const fetchItemsAndGenerateUrls = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data: rawItems, error } = await supabase
      .from('scanned_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !rawItems) {
      setIsLoading(false);
      return;
    }

    const itemsWithUrls = await Promise.all(
      rawItems.map(async (item: ScannedItem) => {
        if (!item.image_url) {
          return { ...item, display_url: undefined };
        }
        const { data: signedUrlData } = await supabase.storage
          .from('outfit-images')
          .createSignedUrl(item.image_url, 3600);

        return { ...item, display_url: signedUrlData?.signedUrl };
      })
    );

    setItems(itemsWithUrls);
    setIsLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchItemsAndGenerateUrls();
    }, [fetchItemsAndGenerateUrls])
  );

  const handleItemPress = useCallback((result: OutfitAnalysisResult) => {
    setSelectedItem(result);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const renderScannedItem = useCallback(
    ({ item }: { item: DisplayScannedItem }) => {
      // Do not render items that resulted in an error from the AI.
      if ('error' in item.result) {
        return null;
      }

      return (
        <TouchableOpacity className="m-4" onPress={() => handleItemPress(item.result)}>
          <Card className="h-56 w-full self-center bg-card/70">
            {item.display_url ? (
              <Image source={{ uri: item.display_url }} className="h-3/5 w-full rounded-t-lg" />
            ) : (
              <View className="h-3/5 w-full rounded-t-lg bg-muted" />
            )}
            <CardContent className="flex-1 justify-center p-2">
              <Small className="font-bold" numberOfLines={2}>
                {item.result.summary}
              </Small>
              <Muted className="mt-1 text-xs">
                {new Date(item.created_at).toLocaleDateString()}
              </Muted>
            </CardContent>
          </Card>
        </TouchableOpacity>
      );
    },
    [handleItemPress]
  );

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center">
      <View className="w-full max-w-5xl">
        <View className="absolute right-6 top-16 z-10">
          <TouchableOpacity onPress={() => router.push('/settings-profile')}>
            <Settings size={28} color={color} />
          </TouchableOpacity>
        </View>

        <View className="items-center px-6 pt-24">
          <Image source={{ uri: user.imageUrl }} className="h-24 w-24 rounded-full" />
          <H1 className="mt-4">{user.fullName}</H1>
          <P className="text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</P>
        </View>

        <View className="mb-[100px] mt-8 h-full flex-1">
          <P className="mb-3 px-6 text-lg font-bold">Your Recent Scans</P>
          {isLoading ? (
            <ActivityIndicator className="mt-8" />
          ) : items.length > 0 ? (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderScannedItem}
              showsHorizontalScrollIndicator={false}
              numColumns={Platform.OS === 'web' ? 4 : 1}
            />
          ) : (
            <P className="px-6 text-muted-foreground">You have no scanned items yet.</P>
          )}
        </View>

        {selectedItem && (
          <ProfileAnalysisModal
            open={!!selectedItem}
            onClose={handleCloseModal}
            result={selectedItem}
          />
        )}
      </View>
    </View>
  );
}
