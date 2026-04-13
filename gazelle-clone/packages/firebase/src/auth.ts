import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';
import { createUserProfile, getUserProfile, updateUserProfile } from './firestore';
import { User } from './types';

// Sign Up
export const signUp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ user: FirebaseUser; profile: string }> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name
  await updateProfile(user, {
    displayName: `${firstName} ${lastName}`,
  });

  // Send email verification
  await sendEmailVerification(user);

  // Create user profile in Firestore
  const profileId = await createUserProfile({
    email: user.email!,
    firstName,
    lastName,
    role: 'customer',
    addresses: [],
    paymentMethods: [],
    emailVerified: false,
  });

  return { user, profile: profileId };
};

// Sign In
export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Update last login time
  if (userCredential.user) {
    await updateUserProfile(userCredential.user.uid, {
      lastLoginAt: new Date(),
    } as any);
  }
  
  return userCredential.user;
};

// Sign Out
export const logOut = async () => {
  await signOut(auth);
};

// Password Reset
export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

// Auth State Listener
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get Current User Profile
export const getCurrentUserProfile = async (): Promise<User | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return await getUserProfile(user.uid);
};

// Update User Profile
export const updateCurrentUserProfile = async (data: Partial<User>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  await updateUserProfile(user.uid, data);
};

// Upload Profile Picture
export const uploadProfilePicture = async (file: File): Promise<string> => {
  // This will be implemented with Firebase Storage
  throw new Error('Not implemented yet');
};
