import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Alert, TouchableOpacity, Image, Platform } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Zap, Send, RefreshCw, MessageSquarePlus, Download, ImageUp } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { VolumeManager } from 'react-native-volume-manager';

import { Text } from '~/components/ui/text';
import { ProfileAnalysisModal } from '~/components/ProfileAnalysisModal';
import type { OutfitAnalysisResult } from '~/utils/types';
import { useIsFocused } from '@react-navigation/native';
import { useClient } from '~/utils/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Input } from '~/components/ui/input';

// ... All memoized components (Header, Buttons, Modals) remain unchanged ...
const MemoizedHeader = React.memo(
  ({
    onRetake,
    onToggleFlash,
    onToggleCamera,
    flash,
    photoUri,
    onUploadImage,
    onDownloadImage,
  }: any) => (
    <View className="absolute left-0 right-0 top-0 z-10 flex-row items-center justify-between px-6 pt-5">
      {/* Show Retake ('X') button on the left when in preview mode */}
      <TouchableOpacity
        onPress={photoUri ? onRetake : () => {}}
        className="rounded-full bg-black/50 p-2">
        <X size={28} color="#fff" style={{ opacity: photoUri ? 1 : 0 }} />
      </TouchableOpacity>

      <View className="items-center gap-4">
        {photoUri ? (
          // NEW: Download button in preview mode
          <TouchableOpacity onPress={onDownloadImage} className="rounded-full bg-black/50 p-2">
            <Download size={28} color="#fff" />
          </TouchableOpacity>
        ) : (
          // UPDATED: Added Upload button to camera mode controls
          <>
            <TouchableOpacity onPress={onUploadImage} className="rounded-full bg-black/50 p-2">
              <ImageUp size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onToggleFlash} className="rounded-full bg-black/50 p-2">
              <Zap
                size={28}
                color={flash === 'on' ? '#facc15' : '#fff'}
                fill={flash === 'on' ? '#facc15' : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onToggleCamera} className="rounded-full bg-black/50 p-2">
              <RefreshCw size={28} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
);

const MemoizedCaptureButton = React.memo(({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/50 bg-white/30"
  />
));

const MemoizedPreviewControls = React.memo(
  ({ onSend, onAddContext }: { onSend: () => void; onAddContext: () => void }) => (
    <View className="w-full max-w-xs flex-row items-center justify-around">
      <TouchableOpacity
        onPress={onAddContext}
        className="h-16 w-16 items-center justify-center rounded-full bg-white/30">
        <MessageSquarePlus size={28} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSend}
        className="h-20 w-20 items-center justify-center rounded-full bg-primary">
        <Send size={32} color="#fff" />
      </TouchableOpacity>
      {/* The retake button was here, now moved to the header for better UX */}
      <View className="h-16 w-16" />
    </View>
  )
);

const ContextInputModal = ({ isVisible, onClose, onSave, initialValue }: any) => {
  const [context, setContext] = useState(initialValue);

  useEffect(() => {
    setContext(initialValue);
  }, [initialValue]);

  return (
    <AlertDialog open={isVisible} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add Context for Stylette</AlertDialogTitle>
          <AlertDialogDescription>
            Give the AI some context for a better review. For example: "I'm going to a casual
            wedding," or "What do you think of this for a work event?"
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          placeholder="e.g., Is this good for a date night?"
          defaultValue={context}
          onChangeText={setContext}
          className="my-4"
        />
        <AlertDialogFooter>
          <AlertDialogCancel onPress={onClose}>
            <Text>Cancel</Text>
          </AlertDialogCancel>
          <AlertDialogAction onPress={() => onSave(context)}>
            <Text>Save Context</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default function OutfitCameraScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const { userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const supabase = useClient();
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(cameraPosition);
  const camera = useRef<Camera>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [userContext, setUserContext] = useState('');
  const [isContextModalVisible, setIsContextModalVisible] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<OutfitAnalysisResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  // NEW: Ref to store the volume level when the screen is focused
  const initialVolume = useRef(0);

  const handleRequestPermission = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!hasPermission) {
      handleRequestPermission();
    }
  }, [hasPermission, handleRequestPermission]);

  const handleTakePhoto = useCallback(async () => {
    if (isLoading || photoUri) return;
    if (!camera.current) return;
    try {
      // Set loading true here to prevent multiple triggers
      setIsLoading(true);
      const photo = await camera.current.takePhoto({ flash });
      setPhotoUri(photo.path);
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setIsLoading(false); // Reset loading on error
    } finally {
      // We don't reset loading here because we transition to preview
    }
  }, [flash, isLoading, photoUri]);

  // UPDATED: The volume control logic is now more robust
  useEffect(() => {
    let volumeListener: { remove: () => void } | undefined;

    const setupVolumeControl = async () => {
      if (isFocused && !photoUri) {
        // 1. Store the current volume when the listener is set up
        const volResult = await VolumeManager.getVolume();
        initialVolume.current = volResult.volume;

        if (Platform.OS === 'android') {
          VolumeManager.showNativeVolumeUI({ enabled: false });
        }

        volumeListener = VolumeManager.addVolumeListener(() => {
          runOnJS(handleTakePhoto)();
          VolumeManager.setVolume(initialVolume.current, { showUI: false });
        });
      }
    };

    setupVolumeControl();

    return () => {
      if (volumeListener) {
        volumeListener.remove();
      }
      if (Platform.OS === 'android') {
        VolumeManager.showNativeVolumeUI({ enabled: true });
      }
    };
  }, [isFocused, photoUri, handleTakePhoto]);

  // ... All other handlers (handleUploadImage, handleDownloadImage, saveScan, handleSend) remain the same ...

  const handleUploadImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const handleDownloadImage = useCallback(async () => {
    if (!photoUri) return;

    if (mediaPermission?.status !== 'granted') {
      const { status } = await requestMediaPermission();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Stylette needs permission to save photos to your device.'
        );
        return;
      }
    }

    try {
      await MediaLibrary.saveToLibraryAsync(photoUri);
      Alert.alert('Success', 'Image saved to your photo library!');
    } catch (error) {
      Alert.alert('Error', 'Could not save the image. Please try again.');
    }
  }, [photoUri, mediaPermission, requestMediaPermission]);

  const saveScan = useCallback(
    async (result: any, imagePath?: string) => {
      if (!user) return;
      await supabase
        .from('scanned_items')
        .insert([{ user_id: user.id, result, image_url: imagePath }]);
    },
    [user]
  );
  const handleSend = useCallback(async () => {
    // ... (This function remains unchanged)
    if (!photoUri || !userId) return;
    setIsLoading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const filePath = `${userId}/${new Date().toISOString()}.jpg`;

      await supabase.storage
        .from('outfit-images')
        .upload(filePath, decode(base64), { contentType: 'image/jpeg' });

      const { data: signedUrlData } = await supabase.storage
        .from('outfit-images')
        .createSignedUrl(filePath, 300);

      const imageUrlForAI = signedUrlData?.signedUrl;
      if (!imageUrlForAI) throw new Error('Could not create a secure link for the image.');

      const { data, error } = await supabase.functions.invoke('analyze-outfit', {
        body: { imageUrl: imageUrlForAI, userQuery: userContext },
      });
      if (error) throw error;
      if (data?.error) {
        Alert.alert('Analysis Error', data.message);
        return;
      }

      await saveScan(data, filePath);

      setAnalysisResult(data as OutfitAnalysisResult);
      setShowResultModal(true);
      setPhotoUri(null);
      setUserContext('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [photoUri, userId, saveScan, userContext]);

  const toggleCameraPosition = () => {
    // ... (This function remains unchanged)
    setCameraPosition((pos) => (pos === 'back' ? 'front' : 'back'));
  };

  const doubleTap = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(2)
    .onStart(() => {
      runOnJS(toggleCameraPosition)();
    });

  if (!hasPermission || !device) {
    // ... This permission view remains unchanged
    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="text-center">
          {!hasPermission
            ? 'Stylette needs camera permission to analyze your outfits.'
            : 'No camera device found on this phone.'}
        </Text>
        <TouchableOpacity
          onPress={handleRequestPermission}
          className="mt-4 rounded-md bg-primary p-3">
          <Text className="text-primary-foreground">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    // ... The main JSX render remains the same
    <View
      className="flex-1 overflow-hidden rounded-2xl "
      style={{ marginBottom: insets.bottom + 60, marginTop: insets.top }}>
      <GestureDetector gesture={doubleTap}>
        <Camera
          ref={camera}
          device={device}
          isActive={isFocused && !photoUri}
          photo
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
          torch={flash}
          enableZoomGesture
          resizeMode="cover"
        />
      </GestureDetector>
      {photoUri && (
        <Image
          source={{ uri: photoUri.startsWith('file://') ? photoUri : 'file://' + photoUri }}
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
          resizeMode="cover"
        />
      )}

      {/* UPDATED: Pass new handlers to the header */}
      <MemoizedHeader
        onRetake={() => {
          setPhotoUri(null);
          setIsLoading(false); // Also reset loading state when retaking
        }}
        onToggleFlash={() => setFlash((f) => (f === 'on' ? 'off' : 'on'))}
        onToggleCamera={toggleCameraPosition}
        flash={flash}
        photoUri={photoUri}
        onUploadImage={handleUploadImage}
        onDownloadImage={handleDownloadImage}
      />

      <View
        className="absolute bottom-0 left-0 right-0 items-center"
        style={{ marginBottom: insets.bottom > 0 ? insets.bottom + 10 : 30 }}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : photoUri ? (
          <MemoizedPreviewControls
            onSend={handleSend}
            onAddContext={() => setIsContextModalVisible(true)}
          />
        ) : (
          <MemoizedCaptureButton onPress={handleTakePhoto} />
        )}
      </View>

      <ContextInputModal
        isVisible={isContextModalVisible}
        onClose={() => setIsContextModalVisible(false)}
        onSave={(context: string) => {
          setUserContext(context);
          setIsContextModalVisible(false);
        }}
        initialValue={userContext}
      />

      {analysisResult && (
        <ProfileAnalysisModal
          open={showResultModal}
          onClose={() => {
            setShowResultModal(false);
            setAnalysisResult(null);
            router.back();
          }}
          result={analysisResult}
        />
      )}
    </View>
  );
}
