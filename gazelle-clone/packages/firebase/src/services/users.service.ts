/**
 * Servicio de Usuarios
 * Maneja perfiles, direcciones y preferencias
 */

import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../config';
import { UserProfile, UserAddress, UserPreferences } from '../types';

const USERS_COLLECTION = 'users';

/**
 * Obtener perfil de usuario
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error: any) {
    console.error('Error al obtener perfil:', error);
    throw new Error(`Error al obtener perfil: ${error.message}`);
  }
}

/**
 * Actualizar perfil de usuario
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al actualizar perfil:', error);
    throw new Error(`Error al actualizar perfil: ${error.message}`);
  }
}

/**
 * Agregar dirección de usuario
 */
export async function addUserAddress(
  userId: string,
  address: Omit<UserAddress, 'id'>
): Promise<string> {
  try {
    const addressId = `addr_${Date.now()}`;
    const newAddress: UserAddress = {
      ...address,
      id: addressId,
      isDefault: false
    };

    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      addresses: arrayUnion(newAddress),
      updatedAt: Timestamp.now()
    });

    return addressId;
  } catch (error: any) {
    console.error('Error al agregar dirección:', error);
    throw new Error(`Error al agregar dirección: ${error.message}`);
  }
}

/**
 * Actualizar dirección existente
 */
export async function updateUserAddress(
  userId: string,
  addressId: string,
  updates: Partial<UserAddress>
): Promise<void> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile || !profile.addresses) {
      throw new Error('Perfil o direcciones no encontradas');
    }

    const updatedAddresses = profile.addresses.map(addr => {
      if (addr.id === addressId) {
        return { ...addr, ...updates };
      }
      return addr;
    });

    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      addresses: updatedAddresses,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al actualizar dirección:', error);
    throw new Error(`Error al actualizar dirección: ${error.message}`);
  }
}

/**
 * Eliminar dirección de usuario
 */
export async function removeUserAddress(
  userId: string,
  addressId: string
): Promise<void> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile || !profile.addresses) {
      throw new Error('Perfil o direcciones no encontradas');
    }

    const addressToRemove = profile.addresses.find(a => a.id === addressId);
    if (addressToRemove) {
      await updateDoc(doc(db, USERS_COLLECTION, userId), {
        addresses: arrayRemove(addressToRemove),
        updatedAt: Timestamp.now()
      });
    }
  } catch (error: any) {
    console.error('Error al eliminar dirección:', error);
    throw new Error(`Error al eliminar dirección: ${error.message}`);
  }
}

/**
 * Establecer dirección por defecto
 */
export async function setDefaultAddress(
  userId: string,
  addressId: string
): Promise<void> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile || !profile.addresses) {
      throw new Error('Perfil o direcciones no encontradas');
    }

    const updatedAddresses = profile.addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));

    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      addresses: updatedAddresses,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al establecer dirección por defecto:', error);
    throw new Error(`Error al establecer dirección: ${error.message}`);
  }
}

/**
 * Obtener dirección por defecto
 */
export async function getDefaultAddress(userId: string): Promise<UserAddress | null> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile || !profile.addresses) {
      return null;
    }

    const defaultAddr = profile.addresses.find(a => a.isDefault);
    return defaultAddr || profile.addresses[0] || null;
  } catch (error: any) {
    console.error('Error al obtener dirección por defecto:', error);
    throw new Error(`Error al obtener dirección: ${error.message}`);
  }
}

/**
 * Actualizar preferencias de usuario
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      preferences: {
        ...(await getUserProfile(userId)).preferences,
        ...preferences
      },
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al actualizar preferencias:', error);
    throw new Error(`Error al actualizar preferencias: ${error.message}`);
  }
}

/**
 * Agregar producto a favoritos
 */
export async function addToFavorites(
  userId: string,
  productId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      favorites: arrayUnion(productId),
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al agregar a favoritos:', error);
    throw new Error(`Error al agregar a favoritos: ${error.message}`);
  }
}

/**
 * Eliminar producto de favoritos
 */
export async function removeFromFavorites(
  userId: string,
  productId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      favorites: arrayRemove(productId),
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al eliminar de favoritos:', error);
    throw new Error(`Error al eliminar de favoritos: ${error.message}`);
  }
}

/**
 * Obtener todos los usuarios (solo admin)
 */
export async function getAllUsers(limitCount: number = 100): Promise<UserProfile[]> {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserProfile[];
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    throw new Error(`Error al obtener usuarios: ${error.message}`);
  }
}

/**
 * Actualizar rol de usuario (solo admin)
 */
export async function updateUserRole(
  userId: string,
  role: 'customer' | 'admin' | 'support'
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      role,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al actualizar rol:', error);
    throw new Error(`Error al actualizar rol: ${error.message}`);
  }
}

/**
 * Suspender cuenta de usuario (solo admin)
 */
export async function suspendUser(
  userId: string,
  reason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      status: 'suspended',
      suspensionReason: reason,
      suspendedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al suspender usuario:', error);
    throw new Error(`Error al suspender usuario: ${error.message}`);
  }
}
