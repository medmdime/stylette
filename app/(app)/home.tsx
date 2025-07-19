import { View, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useClient } from '~/utils/supabase';
import { H1, P } from '~/components/ui/typography';
import Carousel from '~/components/Carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { LegendList } from '@legendapp/list';
import { useTheme } from '@react-navigation/native';

interface Blog {
  id: string;
  title: string;
  content: string;
  image_urls: string[];
  created_at: string;
}
const iconeDark = require('~/assets/backlogo.webp');
const iconeLight = require('~/assets/lightlogo.webp');

const fetchBlogs = async (supabase: any) => {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

export default function HomeScreen() {
  const supabase = useClient();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();
  const colors = useTheme();
  const {
    data: blogs,
    isLoading,
    isError,
    refetch: refetchItems,
    isRefetching,
  } = useQuery<Blog[]>({
    queryKey: ['blogs'],
    queryFn: () => fetchBlogs(supabase),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="p- flex-1 items-center justify-center" style={{ paddingTop: insets.top }}>
        <H1 className="mb-4">Oops!</H1>
        <P className="text-center text-destructive">
          Could not load the style feed. Please try again later.
        </P>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: 100 }}>
      <View className="w-full p-2 ">
        <View className=" bg-text flex w-full flex-row items-center">
          <Image
            source={theme.colorScheme === 'light' ? iconeLight : iconeDark}
            className="h-24 w-24 rounded-lg"
            style={{ resizeMode: 'contain' }}
          />
          <View className="ml-4">
            <H1 className="text-3xl font-bold italic">Stylette</H1>
            <P className="text-muted-foreground">Your digital fashion assistant.</P>
          </View>
        </View>
      </View>
      <View className="px-4 " style={{ paddingBottom: 90 }}>
        <LegendList
          data={blogs || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Carousel item={item} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetchItems}
              tintColor={colors.colors.text}
              colors={[colors.colors.text]}
            />
          }
        />
      </View>
    </View>
  );
}
