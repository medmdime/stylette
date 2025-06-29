import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '~/lib/utils';
import { useColorScheme } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/lib/constants';
import { hslToRgba } from '~/lib/utils';

function Input({
  className,
  placeholderClassName,
  ...props
}: TextInputProps & {
  ref?: React.RefObject<TextInput>;
}) {
  const { colorScheme } = useColorScheme();
  const backgroundHsl = NAV_THEME[colorScheme]?.background || NAV_THEME.dark.background;
  const backgroundColor = hslToRgba(backgroundHsl, 0.4); // 50% opacity
  return (
    <TextInput
      style={[{ backgroundColor }]}
      className={cn(
        'web:flex h-10 native:h-12 web:w-full rounded-md px-3 web:py-2 text-base lg:text-sm native:text-lg native:leading-[1.25] placeholder:text-gray-500 web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
        props.editable === false && 'opacity-50 web:cursor-not-allowed',
        className
      )}
      placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
      {...props}
    />
  );
}

export { Input };
