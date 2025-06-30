import { useClerk, useUser } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { H1, P } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useClient } from '../../utils/supabase';
import { View, FlatList, Image } from 'react-native';

interface ScannedItem {
  id: string;
  user_id: string;
  image_url?: string;
  result: any;
  created_at: string;
}

export default function Welcome() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const supabase = useClient();
  const [items, setItems] = useState<ScannedItem[]>([]);

  async function handleSignOut() {
    await signOut();
    Linking.openURL(Linking.createURL('/'));
  }

  useEffect(() => {
    if (user) {
      supabase
        .from('scanned_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setItems(data || []));
    }
  }, [user]);

  if (!user) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <H1 className="mb-4 text-center">Welcome to Stylette!</H1>
      <P className="mb-8 text-center">
        You are signed in. Enjoy your AI style assistant experience.
      </P>
      <Button variant="destructive" onPress={handleSignOut}>
        <Text> Sign out </Text>
      </Button>
      <Button
        variant="outline"
        onPress={() => {
          router.push('/(app)/camera');
        }}>
        <Text> camera </Text>
      </Button>
    </View>
  );
}

export function ItemsScreen() {
  const { user } = useUser();
  const supabase = useClient();
  const [items, setItems] = useState<ScannedItem[]>([]);

  useEffect(() => {
    if (user) {
      supabase
        .from('scanned_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setItems(data || []));
    }
  }, [user]);

  if (!user) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>My Scanned Items</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
            {item.image_url && (
              <Image
                source={{ uri: item.image_url }}
                style={{ width: 60, height: 60, marginRight: 12, borderRadius: 8 }}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2}>{JSON.stringify(item.result)}</Text>
              <Text style={{ color: 'gray', fontSize: 12 }}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
