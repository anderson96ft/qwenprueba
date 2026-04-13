/**
 * Servicio de Autenticación
 * Maneja registro, login, logout y gestión de usuarios
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config';
import { UserRole, UserProfile } from '../types';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

/**
 * Registrar un nuevo usuario con email/password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Actualizar perfil con displayName
    await updateProfile(userCredential.user, { displayName });
    
    // Crear perfil en Firestore
    await createUserProfile(userCredential.user.uid, {
      email,
      displayName,
      role: 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return userCredential;
  } catch (error: any) {
    throw new Error(`Error al registrar: ${error.message}`);
  }
}

/**
 * Iniciar sesión con email/password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw new Error(`Error al iniciar sesión: ${error.message}`);
  }
}

/**
 * Iniciar sesión con Google
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Verificar si existe el perfil, si no crearlo
    const profile = await getUserProfile(result.user.uid);
    if (!profile) {
      await createUserProfile(result.user.uid, {
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || undefined,
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return result;
  } catch (error: any) {
    throw new Error(`Error al iniciar con Google: ${error.message}`);
  }
}

/**
 * Iniciar sesión con Facebook
 */
export async function signInWithFacebook(): Promise<UserCredential> {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    
    // Verificar si existe el perfil, si no crearlo
    const profile = await getUserProfile(result.user.uid);
    if (!profile) {
      await createUserProfile(result.user.uid, {
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || undefined,
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return result;
  } catch (error: any) {
    throw new Error(`Error al iniciar con Facebook: ${error.message}`);
  }
}

/**
 * Cerrar sesión
 */
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(`Error al cerrar sesión: ${error.message}`);
  }
}

/**
 * Enviar email para resetear contraseña
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(`Error al enviar email de recuperación: ${error.message}`);
  }
}

/**
 * Crear perfil de usuario en Firestore
 */
export async function createUserProfile(
  uid: string,
  profile: Omit<UserProfile, 'id'>
): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...profile,
      id: uid
    });
  } catch (error: any) {
    throw new Error(`Error al crear perfil: ${error.message}`);
  }
}

/**
 * Obtener perfil de usuario desde Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Error al obtener perfil: ${error.message}`);
  }
}

/**
 * Actualizar perfil de usuario
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    throw new Error(`Error al actualizar perfil: ${error.message}`);
  }
}

/**
 * Escuchar cambios en el estado de autenticación
 */
export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Verificar si el usuario actual es admin
 */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  
  const profile = await getUserProfile(user.uid);
  return profile?.role === 'admin';
}

/**
 * Obtener usuario actual
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
