import { View, Image, Alert } from 'react-native';
import { H1, H3, P } from '~/components/ui/typography';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useRouter } from 'expo-router';
import { useColorScheme } from '~/lib/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useTheme } from '@react-navigation/native';

const iconeDark = require('~/assets/backlogo.webp');
const iconeLight = require('~/assets/lightlogo.webp');

export default function PaywallScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const handleSubscribe = (plan: string) => {
    Alert.alert('Subscribed!', `You have subscribed to the ${plan} plan.`);
    router.replace('/(app)/camera');
  };

  const handleRestorePurchases = () => {
    Alert.alert('Purchases Restored', 'Your previous purchases have been restored.');
    router.replace('/(app)/camera');
  };

  return (
    <View className="flex-1 bg-background p-6" style={{ paddingTop: insets.top + 20 }}>
      <View className="mb-8 items-center">
        <Image
          source={colorScheme === 'light' ? iconeLight : iconeDark}
          className="h-16 w-48"
          resizeMode="contain"
        />
      </View>

      <View className="flex-1 items-center justify-center">
        <H1 className="mb-4 text-center text-4xl">Unlock Stylette Pro</H1>
        <P className="mb-10 text-center text-lg text-muted-foreground">
          Get unlimited access to all features and take your style to the next level.
        </P>

        <View className="w-full gap-y-4">
          <FeatureItem text="Unlimited outfit analysis" />
          <FeatureItem text="Advanced style suggestions" />
          <FeatureItem text="Save and organize your looks" />
          <FeatureItem text="Ad-free experience" />
        </View>
      </View>

      <View className="w-full gap-y-4 pb-4">
        <Button size="lg" onPress={() => handleSubscribe('yearly')}>
          <Text className="text-lg font-bold">Subscribe Yearly - $49.99 (Save 20%)</Text>
        </Button>
        <Button size="lg" variant="outline" onPress={() => handleSubscribe('monthly')}>
          <Text className="text-lg">Subscribe Monthly - $4.99</Text>
        </Button>
        <Button variant="link" onPress={handleRestorePurchases}>
          <Text className="text-muted-foreground">Restore Purchases</Text>
        </Button>
      </View>
    </View>
  );
}

function FeatureItem({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center gap-x-4">
      <Check size={24} color={colors.primary} />
      <H3 className="border-b-0 pb-0 text-lg font-semibold">{text}</H3>
    </View>
  );
}
