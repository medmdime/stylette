import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Button } from '~/components/ui/button';
import { H2, Muted, P } from '~/components/ui/typography';
import type { OutfitAnalysisResult, SuccessfulAnalysis } from '~/utils/types';
import Markdown from 'react-native-markdown-display';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { JSX } from 'react/jsx-runtime';
import { X } from 'lucide-react-native';
import { useTheme } from '@react-navigation/native';
import { Portal } from '@gorhom/portal';

const MarkdownRenderer = ({ content }: { content: string }) => {
  return <Markdown>{content}</Markdown>;
};

interface ProfileAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  result: OutfitAnalysisResult;
}
export function ProfileAnalysisModal({ open, onClose, result }: ProfileAnalysisModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { height } = useWindowDimensions();
  const snapPoints = useMemo(() => [height * 0.5, height * 0.85], [height]);
  const colors = useTheme().colors;
  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [open]);
  console.log('open:', open);
  const isSuccess = (res: OutfitAnalysisResult): res is SuccessfulAnalysis => {
    return 'markdownResponse' in res && !(res as any).error;
  };

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

  const renderFooter = useCallback(
    () => (
      <View style={{ position: 'absolute', top: -5, right: 0, padding: 0 }}>
        <Button variant="ghost" onPress={onClose}>
          <X size={24} color={colors.text} />
        </Button>
      </View>
    ),
    [onClose]
  );

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableDynamicSizing={false}
        enableOverDrag={false}
        onClose={onClose}
        backdropComponent={renderBackdrop}>
        <BottomSheetView className="flex-1 bg-background pb-0">
          {isSuccess(result) ? (
            <>
              <View className="items-center pb-4">
                <H2 className="border-b-0 pb-0 text-center text-2xl">{result.prompt.title}</H2>
                {result.prompt.userQuery && (
                  <Muted className="text-center italic">For: "{result.prompt.userQuery}"</Muted>
                )}
              </View>
              <BottomSheetScrollView className="flex-1 px-4 pb-12">
                <MarkdownRenderer content={result.markdownResponse} />
                <View className="h-[100px]" />
              </BottomSheetScrollView>
            </>
          ) : (
            <View>
              <H2 className="border-b-0 pb-2 text-center text-2xl">Analysis Error</H2>
              <P className="py-4 text-center text-muted-foreground">{result.message}</P>
            </View>
          )}
          {renderFooter()}
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
}
