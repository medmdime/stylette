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
import { Portal } from '@gorhom/portal';
import { useTheme } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';

const MarkdownRenderer = ({ content }: { content: string }) => {
  const theme = useColorScheme();
  return (
    <Markdown
      style={{
        body: {
          fontSize: 16,
          lineHeight: 24,
          marginVertical: 6,
          color: theme.colorScheme === 'dark' ? '#fff' : '#000',
        },
        heading1: {
          fontSize: 25,
          fontWeight: 'bold',
          marginVertical: 12,
          paddingVertical: 8,
        },
        heading2: {
          fontSize: 24,
          fontWeight: 'bold',
          marginVertical: 10,
        },
        heading3: {
          fontSize: 20,
          fontWeight: 'bold',
          marginVertical: 8,
        },
        heading4: {
          fontSize: 18,
          fontWeight: '600',
          marginVertical: 6,
        },
        heading5: {
          fontSize: 16,
          fontWeight: '600',
          marginVertical: 4,
        },
        heading6: {
          fontSize: 14,
          fontWeight: '600',
          marginVertical: 4,
        },
        paragraph: {
          fontSize: 16,
          lineHeight: 24,
          marginVertical: 8,
        },
        link: {
          textDecorationLine: 'underline',
          marginVertical: 4,
        },
        bullet_list: {
          paddingLeft: 16,
          marginVertical: 6,
        },
        ordered_list: {
          paddingLeft: 16,
          marginVertical: 6,
        },
        list_item: {
          fontSize: 16,
          marginVertical: 4,
        },
        strong: {
          fontWeight: 'bold',
        },
        em: {
          fontStyle: 'italic',
        },
        s: {
          textDecorationLine: 'line-through',
        },
        blockquote: {
          borderLeftWidth: 4,
          paddingHorizontal: 12,
          paddingVertical: 8,
          marginVertical: 8,
        },
        code_inline: {
          fontFamily: 'Courier',
          paddingHorizontal: 4,
          paddingVertical: 2,
          borderRadius: 4,
        },
        code_block: {
          fontFamily: 'Courier',
          padding: 12,
          borderRadius: 6,
          marginVertical: 12,
        },
        fence: {
          fontFamily: 'Courier',
          padding: 12,
          borderRadius: 6,
          marginVertical: 12,
        },
        pre: {
          padding: 12,
          borderRadius: 6,
          marginVertical: 12,
        },
        table: {
          borderWidth: 1,
          marginVertical: 8,
        },
        thead: {
          borderBottomWidth: 1,
        },
        tbody: {},
        th: {
          borderWidth: 1,
          padding: 8,
        },
        tr: {},
        td: {
          borderWidth: 1,
          padding: 8,
        },
        blocklink: {
          textDecorationLine: 'underline',
          marginVertical: 4,
        },
        image: {
          resizeMode: 'contain',
          marginVertical: 12,
        },
        text: {},
        textgroup: {
          marginVertical: 6,
        },
        hardbreak: {
          height: 0,
        },
        softbreak: {
          height: 0,
        },
        inline: {},
        span: {},
      }}>
      {content}
    </Markdown>
  );
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
        handleIndicatorStyle={{ backgroundColor: colors.text }}
        handleStyle={{
          backgroundColor: colors.card,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
        backdropComponent={renderBackdrop}>
        <BottomSheetView className="flex-1 bg-card pb-0">
          {isSuccess(result) ? (
            <>
              <View className="items-center pb-4">
                <H2 className="border-b-0 pb-0 text-center text-2xl">{result.prompt.title}</H2>
                {result.prompt.userQuery && (
                  <Muted className="text-center italic text-foreground">
                    For: "{result.prompt.userQuery}"
                  </Muted>
                )}
              </View>
              <BottomSheetScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1 px-4 pb-12 text-center">
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
