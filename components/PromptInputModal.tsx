import BottomSheet, {
  BottomSheetView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { useTheme } from '@react-navigation/native';
import { FC, useState, useRef, useMemo, useEffect, useCallback, JSX } from 'react';
import { View } from 'react-native';
import { H3, P } from './ui/typography';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';

interface Prompt {
  title: string;
  requiresInput?: boolean;
  placeholder?: string;
  spicy?: boolean;
}

interface PromptInputModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (inputValue: string) => void;
  prompt: Prompt | null;
}

export const PromptInputModal: FC<PromptInputModalProps> = ({
  isVisible,
  onClose,
  onSave,
  prompt,
}) => {
  const [inputValue, setInputValue] = useState('');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['35%'], []);
  const { colors } = useTheme();

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);
  console.log('isVisible:', isVisible);
  const renderBackdrop = useCallback(
    (props: JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop
        opacity={0.5}
        {...props}
        pressBehavior="close"
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );
  if (!prompt) return null;

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onClose={onClose}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.text }}
        backdropComponent={renderBackdrop}>
        <BottomSheetView className="flex-1 p-6">
          <H3 className="text-center text-lg font-bold">{prompt.title}</H3>
          <P className="mt-1 text-center text-muted-foreground">
            Please provide a bit more context.
          </P>

          <BottomSheetTextInput
            placeholder={prompt.placeholder || 'Your context here...'}
            defaultValue={inputValue}
            onChangeText={setInputValue}
            style={{
              marginTop: 16,
              marginBottom: 16,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 12,
              fontSize: 16,
              color: colors.text,
              backgroundColor: colors.background,
            }}
            placeholderTextColor={colors.text}
          />
          <View className="gap-y-2">
            <Button
              onPress={() => {
                onSave(inputValue);
              }}>
              <Text>Analyze</Text>
            </Button>
            <Button variant="ghost" onPress={onClose}>
              <Text>Cancel</Text>
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
};
