import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './config';

// Upload File
export const uploadFile = async (
  file: File,
  path: string,
  filename?: string
): Promise<string> => {
  const fileName = filename || `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `${path}/${fileName}`);
  
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// Upload Multiple Files
export const uploadMultipleFiles = async (
  files: File[],
  path: string
): Promise<string[]> => {
  const uploadPromises = files.map((file) => uploadFile(file, path));
  return await Promise.all(uploadPromises);
};

// Delete File
export const deleteFile = async (url: string): Promise<void> => {
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
};

// Get Download URL
export const getDownloadUrl = async (path: string): Promise<string> => {
  const fileRef = ref(storage, path);
  return await getDownloadURL(fileRef);
};

// List Files in Directory
export const listFiles = async (path: string): Promise<string[]> => {
  const dirRef = ref(storage, path);
  const result = await listAll(dirRef);
  return await Promise.all(result.items.map((item) => getDownloadURL(item)));
};

// Upload Profile Picture
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  return await uploadFile(file, `users/${userId}/profile`, `avatar-${file.name}`);
};

// Upload Product Images
export const uploadProductImages = async (
  productId: string,
  files: File[]
): Promise<string[]> => {
  return await uploadMultipleFiles(files, `products/${productId}/images`);
};

// Upload Trade-In Images
export const uploadTradeInImages = async (
  tradeInId: string,
  files: File[]
): Promise<string[]> => {
  return await uploadMultipleFiles(files, `tradeIns/${tradeInId}/images`);
};

// Upload Device Model Images
export const uploadDeviceModelImages = async (
  deviceId: string,
  files: File[]
): Promise<string[]> => {
  return await uploadMultipleFiles(files, `devices/${deviceId}/images`);
};
