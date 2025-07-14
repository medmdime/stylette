// Create a new file, e.g., src/components/TabButton.tsx

import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HeaderProps = {
  goBack?: () => void;
  title?: string;
  canGoBack?: boolean;
};

export const Header: React.FC<HeaderProps> = ({ goBack, title, canGoBack }) => {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-row items-center justify-between bg-background px-4 py-2">
      {canGoBack && (
        <Pressable onPress={goBack} className="p-1">
          <ChevronLeft size={26} color={colors.colors.primary} />
        </Pressable>
      )}
      <Text className="text-lg font-bold text-foreground">{title}</Text>
      <View className="w-10" />
    </View>
  );
};
