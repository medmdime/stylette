import { useAuth, useUser } from '@clerk/clerk-expo';
import { useIsFocused } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { decode } from 'base64-arraybuffer';
import { Download, ImageUp, RefreshCw, X, Zap } from 'lucide-react-native';
import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { compressImage } from '~/utils/image';

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

const MemoizedHeader: FC<HeaderProps> = memo(
  ({ onRetake, onToggleFlash, onToggleCamera, flash, photoUri, onDownloadImage }) => {
    return (
      <View className="absolute left-0 right-0 top-0 z-10 flex-row items-center justify-between px-6 pt-5">
        {photoUri ? (
          <TouchableOpacity
            onPress={photoUri ? onRetake : () => {}}
            className="rounded-full bg-black/50 p-2">
            <X size={28} color={'#FFFFFF'} style={{ opacity: photoUri ? 1 : 0 }} />
          </TouchableOpacity>
        ) : (
          <View className="w-8" />
        )}
        <View className="flex-row items-center gap-4">
          {photoUri ? (
            <TouchableOpacity onPress={onDownloadImage} className="rounded-full bg-black/50 p-2">
              <Download size={28} color={'#FFFFFF'} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={onToggleFlash} className="rounded-full bg-black/50 p-2">
                <Zap
                  size={28}
                  color={flash === 'on' ? '#facc15' : '#FFFFFF'}
                  fill={flash === 'on' ? '#facc15' : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onToggleCamera} className="rounded-full bg-black/50 p-2">
                <RefreshCw size={28} color={'#FFFFFF'} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }
);

const MemoizedCaptureButton: FC<CaptureButtonProps> = memo(({ onPress, onUploadImage }) => {
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
        <ImageUp size={28} color={'#FFFFFF'} />
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
  const queryClient = useQueryClient(); // Get the query client

  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(cameraPosition);
  const camera = useRef<Camera>(null);

  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<OutfitAnalysisResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isPromptInputVisible, setIsPromptInputVisible] = useState(false);
  const initialVolume = useRef(0);

  const analyzeOutfitMutation = useMutation({
    mutationFn: async ({
      currentPhotoUri,
      promptTitle,
      userQuery,
    }: {
      currentPhotoUri: string;
      promptTitle: string;
      userQuery?: string;
    }) => {
      if (!userId || !user) throw new Error('User not authenticated.');

      // a. Upload image to storage
      const base64 = await FileSystem.readAsStringAsync(currentPhotoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const filePath = `${userId}/${new Date().toISOString()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('outfit-images')
        .upload(filePath, decode(base64), { contentType: 'image/jpeg' });
      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

      // b. Get signed URL for the function
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('outfit-images')
        .createSignedUrl(filePath, 600);
      if (urlError || !signedUrlData?.signedUrl)
        throw new Error(`URL Error: ${urlError?.message || 'Could not get image URL.'}`);

      const { data, error: err } = await supabase.functions.invoke('analyze-outfit', {
        body: { imageUrl: signedUrlData.signedUrl, promptTitle, userQuery },
      });
      if (err && err instanceof FunctionsHttpError) {
        const errorMessage = await err.context.json();
        throw new Error(`Analysis Error: ${errorMessage.message || 'Unknown error occurred.'}`);
      }
      // if (data.error)

      // d. Save the successful scan to the database
      const { error: dbError } = await supabase
        .from('scanned_items')
        .insert([{ user_id: user.id, result: data, image_url: filePath }]);
      if (dbError) console.error('DB save error, but analysis was successful:', dbError.message); // Log but don't fail the whole mutation

      return data as OutfitAnalysisResult;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setShowResultModal(true);
      queryClient.invalidateQueries({ queryKey: ['scanned_items', userId] });
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
    onSettled: () => {
      setPhotoUri(null);
    },
  });

  const handleRequestPermission = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!hasPermission) {
      handleRequestPermission();
    }
  }, [hasPermission, handleRequestPermission]);

  const handleTakePhoto = useCallback(async () => {
    if (analyzeOutfitMutation.isPending || photoUri || !camera.current) return;
    try {
      const photo = await camera.current.takePhoto({ flash });
      setPhotoUri(photo.path);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [flash, analyzeOutfitMutation.isPending, photoUri]);

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
      });
      if (!result.canceled) {
        const compressedUri = await compressImage(result.assets[0].uri); // Compress the image
        setPhotoUri(compressedUri);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      Alert.alert('Image Picker Error', errorMessage);
    }
  }, []);

  const handleDownloadImage = useCallback(async () => {
    if (!photoUri) return;
    await MediaLibrary.saveToLibraryAsync(photoUri);
    Alert.alert('Success', 'Image saved to your photo library!');
  }, [photoUri]);

  const handlePromptPress = (prompt: Prompt) => {
    if (!photoUri) return;
    if (prompt.requiresInput) {
      setSelectedPrompt(prompt);
      setIsPromptInputVisible(true);
    } else {
      analyzeOutfitMutation.mutate({ currentPhotoUri: photoUri, promptTitle: prompt.title });
    }
  };

  const handleSavePromptInput = (inputValue: string) => {
    if (selectedPrompt && photoUri) {
      analyzeOutfitMutation.mutate({
        currentPhotoUri: photoUri,
        promptTitle: selectedPrompt.title,
        userQuery: inputValue,
      });
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
        {/* --- 3. USE isPending FOR LOADING STATE --- */}
        {analyzeOutfitMutation.isPending ? (
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
