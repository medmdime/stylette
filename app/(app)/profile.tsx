import { useUser } from '@clerk/clerk-expo';
import { View, Text, Image, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { useClient } from '../../utils/supabase';

interface ScannedItem {
  id: string;
  user_id: string;
  image_url?: string;
  result: any;
  created_at: string;
}

export default function ProfileScreen() {
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
    <View style={{ flex: 1, alignItems: 'center', padding: 20 }}>
      <Image
        source={{ uri: user.imageUrl }}
        style={{ width: 100, height: 100, borderRadius: 50 }}
      />
      <Text style={{ fontSize: 20, marginVertical: 10 }}>{user.fullName}</Text>
      <Text style={{ fontSize: 16, color: 'gray' }}>{user.primaryEmailAddress?.emailAddress}</Text>
      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>Scanned Items:</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 8 }}>
            <Text>{JSON.stringify(item.result)}</Text>
            {item.image_url && (
              <Image source={{ uri: item.image_url }} style={{ width: 80, height: 80 }} />
            )}
          </View>
        )}
      />
    </View>
  );
}
