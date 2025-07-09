import { useAuth, useUser } from '@clerk/clerk-expo';
import { useIsFocused, useTheme } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { decode } from 'base64-arraybuffer';
import { Download, ImageUp, RefreshCw, X, Zap } from 'lucide-react-native';
import React, { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  EmitterSubscription,
  Image,
  Platform,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { VolumeManager } from 'react-native-volume-manager';
import { PromptBubbles } from '~/components/PromptBubbles';
import { ProfileAnalysisModal } from '~/components/ProfileAnalysisModal';
import { Text } from '~/components/ui/text';
import { useClient } from '~/utils/supabase';
import type { OutfitAnalysisResult } from '~/utils/types';
import { PromptInputModal } from '~/components/PromptInputModal';

interface HeaderProps {
  onRetake: () => void;
  onToggleFlash: () => void;
  onToggleCamera: () => void;
  onDownloadImage: () => void;
  onUploadImage: () => void;
  flash: 'on' | 'off';
  photoUri: string | null;
}

interface CaptureButtonProps {
  onPress: () => void;
  onUploadImage: () => void;
}

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

const MemoizedHeader: FC<HeaderProps> = memo(
  ({ onRetake, onToggleFlash, onToggleCamera, flash, photoUri, onDownloadImage }) => {
    const { colors } = useTheme();
    return (
      <View className="absolute left-0 right-0 top-0 z-10 flex-row items-center justify-between px-6 pt-5">
        {photoUri ? (
          <TouchableOpacity
            onPress={photoUri ? onRetake : () => {}}
            className="rounded-full bg-black/50 p-2">
            <X size={28} color={colors.background} style={{ opacity: photoUri ? 1 : 0 }} />
          </TouchableOpacity>
        ) : (
          <View className="w-8" />
        )}
        <View className="flex-row items-center gap-4">
          {photoUri ? (
            <TouchableOpacity onPress={onDownloadImage} className="rounded-full bg-black/50 p-2">
              <Download size={28} color={colors.background} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={onToggleFlash} className="rounded-full bg-black/50 p-2">
                <Zap
                  size={28}
                  color={flash === 'on' ? '#facc15' : colors.background}
                  fill={flash === 'on' ? '#facc15' : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onToggleCamera} className="rounded-full bg-black/50 p-2">
                <RefreshCw size={28} color={colors.background} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }
);

const MemoizedCaptureButton: FC<CaptureButtonProps> = memo(({ onPress, onUploadImage }) => {
  const { colors } = useTheme();
  return (
    <View className="w-full flex-row items-center justify-center gap-x-12">
      <View className="h-16 w-16" />
      <TouchableOpacity
        onPress={onPress}
        className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/50 bg-white/30"
      />
      <TouchableOpacity
        onPress={onUploadImage}
        className="h-16 w-16 items-center justify-center rounded-full bg-black/50">
        <ImageUp size={28} color={colors.background} />
      </TouchableOpacity>
    </View>
  );
});

export default function OutfitCameraScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const { userId } = useAuth();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const supabase = useClient();

  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(cameraPosition);
  const camera = useRef<Camera>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<OutfitAnalysisResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isPromptInputVisible, setIsPromptInputVisible] = useState(false);
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
    if (isLoading || photoUri || !camera.current) return;
    try {
      setIsLoading(true);
      const photo = await camera.current.takePhoto({ flash });
      setPhotoUri(photo.path);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [flash, isLoading, photoUri]);

  useEffect(() => {
    let volumeListener: EmitterSubscription | undefined;
    const setupVolumeControl = async () => {
      if (isFocused && !photoUri) {
        try {
          const volResult = await VolumeManager.getVolume();
          initialVolume.current = typeof volResult === 'number' ? volResult : volResult.volume;
          if (Platform.OS === 'android') {
            VolumeManager.showNativeVolumeUI({ enabled: false });
          }
          volumeListener = VolumeManager.addVolumeListener(() => {
            runOnJS(handleTakePhoto)();
            VolumeManager.setVolume(initialVolume.current, { showUI: false });
          });
        } catch (e) {
          console.log('Could not set up volume listener:', e);
        }
      }
    };
    setupVolumeControl();
    return () => {
      volumeListener?.remove();
      if (Platform.OS === 'android') {
        VolumeManager.showNativeVolumeUI({ enabled: true });
      }
    };
  }, [isFocused, photoUri, handleTakePhoto]);

  const handleUploadImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      Alert.alert('Image Picker Error', errorMessage);
    }
  }, []);

  const handleDownloadImage = useCallback(async () => {
    if (!photoUri) return;

    const currentPermission = mediaPermission ?? (await requestMediaPermission());
    if (currentPermission.status !== 'granted') {
      Alert.alert('Permission needed', 'Stylette needs permission to save photos.');
      return;
    }

    await MediaLibrary.saveToLibraryAsync(photoUri);
    Alert.alert('Success', 'Image saved to your photo library!');
  }, [photoUri, mediaPermission, requestMediaPermission]);

  const saveScan = useCallback(
    async (result: OutfitAnalysisResult, imagePath: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('scanned_items')
        .insert([{ user_id: user.id, result, image_url: imagePath }]);
      if (error) {
        Alert.alert('Database Error', 'Could not save your scan. Please try again.');
      }
    },
    [user, supabase]
  );

  const handleSend = useCallback(
    async (promptTitle: string, userQuery?: string) => {
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
          .createSignedUrl(filePath, 600);

        if (!signedUrlData?.signedUrl) {
          throw new Error('Could not get image URL for AI.');
        }
        console.log('Image uploaded to:', signedUrlData.signedUrl);
        const { data, error } = await supabase.functions.invoke('analyze-outfit', {
          body: { imageUrl: signedUrlData.signedUrl, promptTitle, userQuery },
        });

        if (error) throw error;
        if (data.error) {
          Alert.alert('Analysis Error', data.message);
          setIsLoading(false);
          return;
        }

        await saveScan(data, filePath);
        setAnalysisResult(data as OutfitAnalysisResult);
        setShowResultModal(true);
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setIsLoading(false);
        setPhotoUri(null);
      }
    },
    [photoUri, userId, saveScan, supabase]
  );

  const handlePromptPress = (prompt: Prompt) => {
    if (prompt.requiresInput) {
      setSelectedPrompt(prompt);
      setIsPromptInputVisible(true);
    } else {
      handleSend(prompt.title);
    }
  };

  const handleSavePromptInput = (inputValue: string) => {
    if (selectedPrompt) {
      handleSend(selectedPrompt.title, inputValue);
    }
    setIsPromptInputVisible(false);
    setSelectedPrompt(null);
  };

  const toggleCameraPosition = () => setCameraPosition((p) => (p === 'back' ? 'front' : 'back'));
  const doubleTap = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(2)
    .onStart(() => {
      runOnJS(toggleCameraPosition)();
    });

  if (!hasPermission || !device) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="text-center">
          {!hasPermission ? 'Stylette needs camera permission.' : 'No camera device found.'}
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
    <View
      className="flex-1 overflow-hidden rounded-2xl"
      style={{ marginBottom: insets.bottom + 60, marginTop: insets.top }}>
      <GestureDetector gesture={doubleTap}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused && !photoUri}
          photo
          torch={flash}
          enableZoomGesture
          resizeMode="cover"
        />
      </GestureDetector>
      {photoUri && (
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      <MemoizedHeader
        onRetake={() => setPhotoUri(null)}
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
          <PromptBubbles onSelectPrompt={handlePromptPress} />
        ) : (
          <MemoizedCaptureButton onPress={handleTakePhoto} onUploadImage={handleUploadImage} />
        )}
      </View>

      <PromptInputModal
        isVisible={isPromptInputVisible}
        onClose={() => setIsPromptInputVisible(false)}
        onSave={handleSavePromptInput}
        prompt={selectedPrompt}
      />

      {analysisResult && (
        <ProfileAnalysisModal
          open={showResultModal}
          onClose={() => {
            setShowResultModal(false);
            setAnalysisResult(null);
          }}
          result={analysisResult}
        />
      )}
    </View>
  );
}
