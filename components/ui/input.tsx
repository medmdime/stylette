import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn, hslToRgba } from '~/lib/utils';
import { useColorScheme } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/lib/constants';

function Input({
  className,
  placeholderClassName,
  ...props
}: TextInputProps & {
  ref?: React.RefObject<TextInput>;
}) {
  const { colorScheme } = useColorScheme();
  const backgroundHsl = NAV_THEME[colorScheme]?.text || NAV_THEME.dark.background;
  const backgroundColor = hslToRgba(backgroundHsl, 0.12); // 40% opacity
  return (
    <TextInput
      style={[{ backgroundColor }]}
      className={cn(
        'native:h-12 native:text-lg native:leading-[1.25] h-10 rounded-md px-3 text-base text-foreground file:border-0 file:bg-transparent file:font-medium placeholder:text-gray-500 web:flex web:w-full web:py-2 web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 lg:text-sm',
        props.editable === false && 'opacity-50 web:cursor-not-allowed',
        className
      )}
      placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
      {...props}
    />
  );
}

export { Input };
