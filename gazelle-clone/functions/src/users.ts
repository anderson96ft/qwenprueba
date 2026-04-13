/**
 * User Cloud Functions
 * Handles user management, profile updates, and admin functions
 */

import * as functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

const db = getFirestore();

export const userFunctions = {
  /**
   * Update user profile
   */
  updateProfile: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { firstName, lastName, phone, avatarUrl } = data;

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (firstName !== undefined) {
      updateData.firstName = firstName;
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    await db.collection('users').doc(context.auth.uid).update(updateData);

    // Also update Firebase Auth profile
    await admin.auth().updateUser(context.auth.uid, {
      displayName: `${firstName || ''} ${lastName || ''}`.trim(),
    });

    return { success: true };
  }),

  /**
   * Add address to user profile
   */
  addAddress: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { address } = data;

    if (!address) {
      throw new functions.https.HttpsError('invalid-argument', 'Address is required');
    }

    const userRef = db.collection('users').doc(context.auth.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnap.data()!;
    const addresses = userData.addresses || [];

    // If this is set as default, unset others
    if (address.isDefault) {
      addresses.forEach((a: any) => {
        a.isDefault = false;
      });
    } else if (addresses.length === 0) {
      // First address is always default
      address.isDefault = true;
    }

    const newAddress = {
      id: `addr_${Date.now()}`,
      ...address,
      createdAt: Timestamp.now(),
    };

    addresses.push(newAddress);

    await userRef.update({
      addresses,
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      addressId: newAddress.id,
    };
  }),

  /**
   * Update address
   */
  updateAddress: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { addressId, address } = data;

    if (!addressId || !address) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Address ID and address data are required'
      );
    }

    const userRef = db.collection('users').doc(context.auth.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnap.data()!;
    const addresses = userData.addresses || [];

    const addressIndex = addresses.findIndex((a: any) => a.id === addressId);

    if (addressIndex === -1) {
      throw new functions.https.HttpsError('not-found', 'Address not found');
    }

    // If setting as default, unset others
    if (address.isDefault) {
      addresses.forEach((a: any) => {
        a.isDefault = false;
      });
    }

    addresses[addressIndex] = {
      ...addresses[addressIndex],
      ...address,
      updatedAt: Timestamp.now(),
    };

    await userRef.update({
      addresses,
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  }),

  /**
   * Delete address
   */
  deleteAddress: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { addressId } = data;

    if (!addressId) {
      throw new functions.https.HttpsError('invalid-argument', 'Address ID is required');
    }

    const userRef = db.collection('users').doc(context.auth.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnap.data()!;
    const addresses = userData.addresses || [];

    const filteredAddresses = addresses.filter((a: any) => a.id !== addressId);

    // If deleted address was default, set first remaining as default
    if (filteredAddresses.length > 0 && !filteredAddresses.some((a: any) => a.isDefault)) {
      filteredAddresses[0].isDefault = true;
    }

    await userRef.update({
      addresses: filteredAddresses,
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  }),

  /**
   * Get user profile (Admin only for other users)
   */
  getUserProfile: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { userId } = data;
    const targetUserId = userId || context.auth.uid;

    // Check if user is requesting their own profile or is admin
    if (targetUserId !== context.auth.uid) {
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      if (userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You can only view your own profile'
        );
      }
    }

    const userSnap = await db.collection('users').doc(targetUserId).get();

    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    return {
      id: userSnap.id,
      ...userSnap.data(),
    };
  }),

  /**
   * Update user role (Admin only)
   */
  updateUserRole: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (userDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can update user roles'
      );
    }

    const { userId, role } = data;

    if (!userId || !role) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'User ID and role are required'
      );
    }

    const validRoles = ['customer', 'support', 'admin'];
    if (!validRoles.includes(role)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid role. Must be one of: customer, support, admin'
      );
    }

    await db.collection('users').doc(userId).update({
      role,
      updatedAt: Timestamp.now(),
    });

    // Set custom claim for Firebase Auth
    await admin.auth().setCustomUserClaims(userId, { role });

    return { success: true };
  }),

  /**
   * Get user orders (Admin only for other users)
   */
  getUserOrders: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { userId } = data;
    const targetUserId = userId || context.auth.uid;

    // Check if user is requesting their own orders or is admin
    if (targetUserId !== context.auth.uid) {
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      if (userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You can only view your own orders'
        );
      }
    }

    const ordersSnap = await db.collection('orders')
      .where('userId', '==', targetUserId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const orders = ordersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { orders };
  }),

  /**
   * Get user trade-ins (Admin only for other users)
   */
  getUserTradeIns: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { userId } = data;
    const targetUserId = userId || context.auth.uid;

    // Check if user is requesting their own trade-ins or is admin
    if (targetUserId !== context.auth.uid) {
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      if (userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You can only view your own trade-ins'
        );
      }
    }

    const tradeInsSnap = await db.collection('tradeIns')
      .where('userId', '==', targetUserId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const tradeIns = tradeInsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { tradeIns };
  }),
};
