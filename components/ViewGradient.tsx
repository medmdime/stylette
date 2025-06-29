import React from 'react';
import { ImageBackground, ViewProps } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useColorScheme } from '~/lib/useColorScheme';

interface ViewGradientProps extends ViewProps {
  children?: React.ReactNode;
}

export const ViewGradient: React.FC<ViewGradientProps> = ({ children, style, ...props }) => {
  const { isDarkColorScheme } = useColorScheme();

  // Use different images for light and dark mode
  const source = isDarkColorScheme
    ? require('~/assets/bg-dark.jpg')
    : require('~/assets/bg-light.jpg');

  const headerHeight = useHeaderHeight();
  return (
    <ImageBackground
      source={source}
      style={[{ flex: 1, paddingTop: headerHeight }, style]}
      resizeMode="cover"
      {...props}>
      {children}
    </ImageBackground>
  );
};
