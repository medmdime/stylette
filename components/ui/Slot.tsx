import { View } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/lib/constants';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
} from 'react-native-reanimated';
import { cn, hslToRgba } from '~/lib/utils';
import { Text } from '~/components/ui/text';
import { useEffect } from 'react';
import { SlotProps } from 'input-otp-native';

export function Slot({ char, isActive, hasFakeCaret }: SlotProps) {
  const { colorScheme } = useColorScheme();
  const backgroundHsl = NAV_THEME[colorScheme]?.text || NAV_THEME.dark.background;
  const backgroundColor = hslToRgba(backgroundHsl, 0.12); // 40% opacity
  return (
    <View
      style={{ backgroundColor }}
      className={cn('bg-text/10 h-[50px] w-[50px] items-center justify-center rounded-lg', {
        'border-2 border-primary': isActive,
      })}>
      {char !== null && <Text className="text-2xl font-medium text-foreground">{char}</Text>}
      {hasFakeCaret && <FakeCaret />}
    </View>
  );
}

function FakeCaret() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const baseStyle = {
    width: 2,
    height: 28,
    backgroundColor: '#000',
    borderRadius: 1,
  };

  return (
    <View className="absolute h-full w-full items-center justify-center">
      <Animated.View style={[baseStyle, animatedStyle]} />
    </View>
  );
}
