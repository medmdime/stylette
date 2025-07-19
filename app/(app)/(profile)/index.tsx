// src/app/(app)/(tabs)/profile.tsx

import { useUser } from '@clerk/clerk-expo';
import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { useState, useCallback } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { H1, P, Muted, Small } from '~/components/ui/typography';
import { ProfileAnalysisModal } from '~/components/ProfileAnalysisModal';
import { Settings, UserPen, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { OutfitAnalysisResult, ScannedItem, DisplayScannedItem } from '~/utils/types';
import { useClient } from '~/utils/supabase';
import { useTheme } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProfileScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedItem, setSelectedItem] = useState<OutfitAnalysisResult | null>(null);
  const supabase = useClient();
  const queryClient = useQueryClient();

  const {
    data: items,
    isLoading,
    isError,
    refetch: refetchItems,
    isRefetching,
  } = useQuery<DisplayScannedItem[]>({
    queryKey: ['scanned_items', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: rawItems, error: dbError } = await supabase
        .from('scanned_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbError) throw new Error(dbError.message);
      if (!rawItems) return [];

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
      return itemsWithUrls;
    },
    enabled: !!user,
  });

  const deleteItemMutation = useMutation({
    mutationFn: async ({ itemId }: { itemId: string }) => {
      const { error: dbError } = await supabase.from('scanned_items').delete().eq('id', itemId);
      if (dbError) throw new Error(dbError.message);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Item deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['scanned_items', user?.id] });
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to delete item. Please try again.');
    },
  });

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this scan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItemMutation.mutate({ itemId });
          },
        },
      ]
    );
  };

  const handleItemPress = useCallback((result: OutfitAnalysisResult) => {
    setSelectedItem(result);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const renderScannedItem = useCallback(
    ({ item }: { item: DisplayScannedItem }) => {
      if ('error' in item.result) return null;

      return (
        <View className="m-4 flex-1">
          <Card className="h-56 w-full self-center bg-card/70">
            <TouchableOpacity
              className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5"
              onPress={() => handleDeleteItem(item.id)}
              disabled={deleteItemMutation.isPending}>
              {deleteItemMutation.isPending && deleteItemMutation.variables?.itemId === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <X size={16} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="h-full w-full"
              onPress={() => handleItemPress(item.result)}>
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
            </TouchableOpacity>
          </Card>
        </View>
      );
    },
    [handleItemPress, handleDeleteItem, deleteItemMutation.isPending, deleteItemMutation.variables]
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
      <View className="absolute right-6 top-16 z-10">
        <TouchableOpacity onPress={() => router.push('/settings-profile')}>
          <Settings size={28} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View className="absolute left-6 top-16 z-10">
        <TouchableOpacity onPress={() => router.push('/update-style')}>
          <UserPen size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View className="items-center px-6 pt-24">
        <Image source={{ uri: user.imageUrl }} className="h-24 w-24 rounded-full" />
        <H1 className="mt-4">{user.fullName}</H1>
        <P className="text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</P>
      </View>

      <View className="mb-[100px] mt-8 h-full w-full flex-1">
        <P className="mb-3 px-6 text-lg font-bold">Your Recent Scans</P>
        {isLoading ? (
          <ActivityIndicator className="mt-8" />
        ) : isError ? (
          <P className="px-6 text-center text-destructive">Could not load your scans.</P>
        ) : items && items.length > 0 ? (
          <LegendList
            data={items}
            className="w-full flex-1"
            keyExtractor={(item) => item.id}
            renderItem={renderScannedItem}
            showsVerticalScrollIndicator={false}
            recycleItems
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetchItems}
                tintColor={colors.text}
                colors={[colors.text]}
              />
            }
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
  );
}
