import * as ImageManipulator from "expo-image-manipulator"; // --- NEW ---

export const compressImage = async (uri: string): Promise<string> => {
    try {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
            uri,
            [
                { resize: { width: 720 } },
            ],
            {
                compress: 0.5,
                format: ImageManipulator.SaveFormat.JPEG,
            },
        );
        return manipulatedImage.uri;
    } catch (error) {
        console.error("Error compressing image:", error);
        throw error;
    }
};
