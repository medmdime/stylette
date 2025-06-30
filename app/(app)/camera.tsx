// app/camera.tsx

import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useAuth } from '@clerk/clerk-expo';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import { Button } from '~/components/ui/button'; // Using your existing UI components
import { Text } from '~/components/ui/text';
import { useClient } from '~/utils/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

export default function OutfitCameraScreen() {
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const { userId, sessionClaims } = useAuth();
  const supabase = useClient();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const handleTakePhoto = async () => {
    if (!camera.current || !userId) {
      Alert.alert('Error', 'Camera is not ready or user is not available.');
      return;
    }

    setIsLoading(true);

    try {
      const photo = await camera.current.takePhoto();
      const base64 = await FileSystem.readAsStringAsync(photo.path, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const filePath = `${userId}/${new Date().toISOString()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('outfit-images')
        .upload(filePath, decode(base64), { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;
      console.log('Image uploaded successfully.');

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('outfit-images')
        .createSignedUrl(filePath, 60 * 60); // The URL will be valid for 60 minutes

      if (signedUrlError) {
        throw signedUrlError;
      }
      const imageUrl = signedUrlData.signedUrl;
      if (!imageUrl) {
        throw new Error('Could not get public URL for the uploaded image.');
      }
      console.log('Image URL:', imageUrl);

      console.log('Invoking edge function...');
      const { data: analysisData, error: functionError } = await supabase.functions.invoke(
        'analyze-outfit',
        {
          body: { imageUrl },
        }
      );

      console.log('Function response:', {
        headers: {
          Authorization: `Bearer ${sessionClaims.__raw}`,
          'Content-Type': 'application/json',
        },
        body: { imageUrl },
      });

      if (functionError && functionError instanceof FunctionsHttpError) {
        const errorMessage = await functionError.context.json();
        console.log('Function returned an error', errorMessage);
      }

      console.log('Outfit Analysis Complete:', JSON.stringify(analysisData, null, 2));
      Alert.alert('Analysis Complete', 'We have received your style review!');
    } catch (error: any) {
      console.error(error);
      if (error?.message) Alert.alert('An Error Occurred', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (!device) {
    return <Text>No camera device found.</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <Button onPress={handleTakePhoto}>
            <Text>Analyze My Outfit</Text>
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
});
