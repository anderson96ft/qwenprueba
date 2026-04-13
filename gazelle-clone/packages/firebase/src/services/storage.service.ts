/**
 * Servicio de Storage (Firebase Storage)
 * Maneja subida, descarga y gestión de archivos
 */

import { 
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadResult,
  FirebaseError
} from 'firebase/storage';
import { storage } from '../config';

/**
 * Subir imagen de producto
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  imageName: string
): Promise<string> {
  try {
    const storageRef = ref(storage, `products/${productId}/${imageName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error('Error al subir imagen de producto:', error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
}

/**
 * Subir imagen de perfil de usuario
 */
export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<string> {
  try {
    const storageRef = ref(storage, `profiles/${userId}/avatar.jpg`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error('Error al subir imagen de perfil:', error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
}

/**
 * Subir documento de trade-in (fotos del dispositivo)
 */
export async function uploadTradeInImages(
  tradeInId: string,
  files: File[]
): Promise<string[]> {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const storageRef = ref(storage, `tradeins/${tradeInId}/photo_${index}.${file.type.split('/')[1]}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    });

    return await Promise.all(uploadPromises);
  } catch (error: any) {
    console.error('Error al subir imágenes de trade-in:', error);
    throw new Error(`Error al subir imágenes: ${error.message}`);
  }
}

/**
 * Subir archivo genérico
 */
export async function uploadFile(
  path: string,
  file: File,
  customName?: string
): Promise<string> {
  try {
    const fileName = customName || file.name;
    const storageRef = ref(storage, `${path}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error('Error al subir archivo:', error);
    throw new Error(`Error al subir archivo: ${error.message}`);
  }
}

/**
 * Eliminar archivo
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Obtener referencia desde la URL
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  } catch (error: any) {
    console.error('Error al eliminar archivo:', error);
    throw new Error(`Error al eliminar archivo: ${error.message}`);
  }
}

/**
 * Listar archivos en una carpeta
 */
export async function listFiles(path: string): Promise<{
  names: string[];
  prefixes: string[];
}> {
  try {
    const folderRef = ref(storage, path);
    const result = await listAll(folderRef);
    
    return {
      names: result.items.map(item => item.name),
      prefixes: result.prefixes.map(prefix => prefix.name)
    };
  } catch (error: any) {
    console.error('Error al listar archivos:', error);
    throw new Error(`Error al listar archivos: ${error.message}`);
  }
}

/**
 * Obtener URL de descarga
 */
export async function getFileDownloadUrl(filePath: string): Promise<string> {
  try {
    const storageRef = ref(storage, filePath);
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    console.error('Error al obtener URL:', error);
    throw new Error(`Error al obtener URL: ${error.message}`);
  }
}

/**
 * Subir múltiples imágenes de producto
 */
export async function uploadProductGallery(
  productId: string,
  files: File[]
): Promise<string[]> {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const ext = file.type.split('/')[1] || 'jpg';
      const storageRef = ref(storage, `products/${productId}/gallery/image_${index}.${ext}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    });

    return await Promise.all(uploadPromises);
  } catch (error: any) {
    console.error('Error al subir galería:', error);
    throw new Error(`Error al subir galería: ${error.message}`);
  }
}

/**
 * Validar tipo de archivo (solo imágenes)
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type);
}

/**
 * Validar tamaño de archivo (máximo 5MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
