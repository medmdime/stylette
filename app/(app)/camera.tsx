import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Zap, Send, RefreshCw } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { Text } from '~/components/ui/text';
import { ProfileAnalysisModal } from '~/components/ProfileAnalysisModal';
import type { OutfitAnalysisResult } from '~/utils/types';
import { useIsFocused } from '@react-navigation/native';
import { useClient } from '~/utils/supabase';
import { useHeaderHeight } from '@react-navigation/elements';

const MemoizedHeader = React.memo(
  ({ onBack, onToggleFlash, onToggleCamera, flash, photoUri, topInset }: any) => (
    <View className="absolute right-0 top-5 z-10 flex-row items-center justify-between px-6">
      {!photoUri && (
        <View className=" gap-4">
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
        </View>
      )}
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
  ({ onRetake, onSend }: { onRetake: () => void; onSend: () => void }) => (
    <View className="w-full max-w-xs flex-row items-center justify-around">
      <TouchableOpacity
        onPress={onRetake}
        className="h-16 w-16 items-center justify-center rounded-full bg-white/30">
        <X size={32} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSend}
        className="h-20 w-20 items-center justify-center rounded-full bg-primary">
        <Send size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  )
);

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
  const [analysisResult, setAnalysisResult] = useState<OutfitAnalysisResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const handleRequestPermission = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!hasPermission) {
      handleRequestPermission();
    }
  }, [hasPermission, handleRequestPermission]);

  const handleTakePhoto = useCallback(async () => {
    if (!camera.current) return;
    try {
      const photo = await camera.current.takePhoto({ flash });
      setPhotoUri(photo.path);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [flash]);

  const saveScan = useCallback(
    async (result: any, imageUrl?: string) => {
      if (!user) return;
      await supabase
        .from('scanned_items')
        .insert([{ user_id: user.id, result, image_url: imageUrl }]);
    },
    [user]
  );

  const handleSend = useCallback(async () => {
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
      const imageUrl = signedUrlData?.signedUrl;
      if (!imageUrl) throw new Error('Could not create a secure link for the image.');

      const { data, error } = await supabase.functions.invoke('analyze-outfit', {
        body: { imageUrl },
      });
      if (error) throw error;
      if (data?.error) {
        Alert.alert('Analysis Error', data.message);
        return;
      }

      await saveScan(data, imageUrl);
      setAnalysisResult(data as OutfitAnalysisResult);
      setShowResultModal(true);
      setPhotoUri(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [photoUri, userId, saveScan]);

  const toggleCameraPosition = () => {
    setCameraPosition((pos) => (pos === 'back' ? 'front' : 'back'));
  };

  const doubleTap = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(2)
    .onStart(() => {
      runOnJS(toggleCameraPosition)();
    });

  if (!hasPermission) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (!device) {
    return <Text>No camera device found.</Text>;
  }

  return (
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
          source={{ uri: 'file://' + photoUri }}
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
          resizeMode="cover"
        />
      )}

      <MemoizedHeader
        onBack={() => router.back()}
        onToggleFlash={() => setFlash((f) => (f === 'on' ? 'off' : 'on'))}
        onToggleCamera={toggleCameraPosition}
        flash={flash}
        photoUri={photoUri}
        topInset={insets.top}
      />

      {/* Bottom Controls */}
      <View
        className="absolute bottom-0 left-0 right-0 items-center"
        style={{ marginBottom: insets.bottom > 0 ? insets.bottom + 10 : 30 }}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : photoUri ? (
          <MemoizedPreviewControls onRetake={() => setPhotoUri(null)} onSend={handleSend} />
        ) : (
          <MemoizedCaptureButton onPress={handleTakePhoto} />
        )}
      </View>

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
