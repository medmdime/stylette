// Create a new file, e.g., src/components/TabButton.tsx

import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TabTriggerSlotProps } from 'expo-router/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type TabButtonProps = TabTriggerSlotProps & {
  icon: IconName;
  focusedIcon: IconName;
};

export const TabButton = React.forwardRef<View, TabButtonProps>(
  ({ icon, focusedIcon, isFocused, children, ...props }, ref) => {
    return (
      <Pressable {...props} style={styles.button}>
        <Ionicons
          name={isFocused ? focusedIcon : icon}
          size={26}
          color={isFocused ? 'white' : 'rgba(255, 255, 255, 0.6)'}
        />
        <Text style={[styles.label, { color: isFocused ? 'white' : 'rgba(255, 255, 255, 0.6)' }]}>
          {children}
        </Text>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  label: {
    fontSize: 12,
  },
});
