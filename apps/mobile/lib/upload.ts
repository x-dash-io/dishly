import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export type UploadPurpose = 'cover' | 'hero' | 'step' | 'avatar' | 'ai-input';

interface PickAndUploadOptions {
  purpose: UploadPurpose;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Dishly Image Upload Wrapper
 * 1. Picks image from library
 * 2. Gets pre-signed URL from API
 * 3. Uploads binary directly to R2
 */
export async function pickAndUpload(
  apiClient: { post: (path: string, body: any) => Promise<any> }, 
  options: PickAndUploadOptions
): Promise<{ publicUrl: string; key: string } | null> {
  try {
    // 1. Launch ImagePicker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    return pickAndUploadLogic(apiClient, asset, options.purpose);
  } catch (error) {
    console.error('pickAndUpload error:', error);
    throw error instanceof Error ? error : new Error('Unknown upload error');
  }
}

/**
 * Camera version of the upload flow
 */
export async function takeAndUpload(
  apiClient: { post: (path: string, body: any) => Promise<any> },
  options: PickAndUploadOptions
): Promise<{ publicUrl: string; key: string } | null> {
  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    return pickAndUploadLogic(apiClient, result.assets[0], options.purpose);
  } catch (error) {
    console.error('takeAndUpload error:', error);
    throw error instanceof Error ? error : new Error('Unknown camera upload error');
  }
}

/**
 * Shared logic for uploading an asset once picked
 */
async function pickAndUploadLogic(
  apiClient: { post: (path: string, body: any) => Promise<any> },
  asset: ImagePicker.ImagePickerAsset,
  purpose: UploadPurpose
): Promise<{ publicUrl: string; key: string }> {
  const uri = asset.uri;
  const contentType = asset.mimeType || 'image/jpeg';
  
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) throw new Error('File not found');

  // 2. Get pre-signed URL from our API
  const presignData: PresignResponse = await apiClient.post('/uploads/presign', {
    purpose,
    contentType,
    fileSizeBytes: fileInfo.size,
  });

  // 3. Upload directly to R2 using Expo's legacy FileSystem for reliable binary PUT
  const uploadResult = await FileSystem.uploadAsync(presignData.uploadUrl, uri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': contentType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`Upload failed (${uploadResult.status}): ${uploadResult.body}`);
  }

  return {
    publicUrl: presignData.publicUrl,
    key: presignData.key,
  };
}
