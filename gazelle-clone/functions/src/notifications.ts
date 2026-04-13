/**
 * Notification Cloud Functions
 * Handles push notifications, email notifications, and in-app notifications
 */

import * as functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const db = getFirestore();
const messaging = getMessaging();

export const notificationFunctions = {
  /**
   * Send push notification to user
   */
  sendPushNotification: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Check if user is admin (for system notifications)
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const isAdmin = userDoc.data()?.role === 'admin';

    const { userId, title, message, actionUrl, type = 'system' } = data;

    if (!userId && !isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can send notifications to other users'
      );
    }

    const targetUserId = userId || context.auth.uid;

    // Get user's FCM tokens
    const userRef = db.collection('users').doc(targetUserId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnap.data()!;
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${targetUserId}`);
      return { success: false, reason: 'no_tokens' };
    }

    // Create in-app notification
    const notificationData = {
      userId: targetUserId,
      type,
      title,
      message,
      read: false,
      actionUrl: actionUrl || null,
      createdAt: Timestamp.now(),
    };

    const notificationRef = await db.collection('notifications').add(notificationData);

    // Send push notification
    const payload = {
      notification: {
        title,
        body: message,
        clickAction: actionUrl ? `https://yourapp.com${actionUrl}` : undefined,
      },
      data: {
        notificationId: notificationRef.id,
        type,
        actionUrl: actionUrl || '',
      },
    };

    // Send to all tokens
    const response = await messaging.sendEachForMulticast({
      tokens: fcmTokens,
      ...payload,
    });

    // Remove invalid tokens
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        const error = resp.error?.code;
        if (error === 'messaging/invalid-registration-token' ||
            error === 'messaging/registration-token-not-registered') {
          invalidTokens.push(fcmTokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      const updatedTokens = fcmTokens.filter(token => !invalidTokens.includes(token));
      await userRef.update({
        fcmTokens: updatedTokens,
        updatedAt: Timestamp.now(),
      });
    }

    return {
      success: true,
      notificationId: notificationRef.id,
      sent: response.successCount,
      failed: response.failureCount,
    };
  }),

  /**
   * Mark notification as read
   */
  markNotificationAsRead: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { notificationId } = data;

    if (!notificationId) {
      throw new functions.https.HttpsError('invalid-argument', 'Notification ID is required');
    }

    const notificationRef = db.collection('notifications').doc(notificationId);
    const notificationSnap = await notificationRef.get();

    if (!notificationSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Notification not found');
    }

    const notificationData = notificationSnap.data()!;

    if (notificationData.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only mark your own notifications as read'
      );
    }

    await notificationRef.update({
      read: true,
      readAt: Timestamp.now(),
    });

    return { success: true };
  }),

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const unreadNotifications = await db.collection('notifications')
      .where('userId', '==', context.auth.uid)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    unreadNotifications.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: Timestamp.now(),
      });
    });

    await batch.commit();

    return { success: true, count: unreadNotifications.size };
  }),

  /**
   * Delete notification
   */
  deleteNotification: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { notificationId } = data;

    if (!notificationId) {
      throw new functions.https.HttpsError('invalid-argument', 'Notification ID is required');
    }

    const notificationRef = db.collection('notifications').doc(notificationId);
    const notificationSnap = await notificationRef.get();

    if (!notificationSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Notification not found');
    }

    const notificationData = notificationSnap.data()!;

    if (notificationData.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only delete your own notifications'
      );
    }

    await notificationRef.delete();

    return { success: true };
  }),

  /**
   * Save FCM token for user
   */
  saveFcmToken: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { token } = data;

    if (!token) {
      throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
    }

    const userRef = db.collection('users').doc(context.auth.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnap.data()!;
    const fcmTokens = userData.fcmTokens || [];

    if (!fcmTokens.includes(token)) {
      fcmTokens.push(token);
      
      await userRef.update({
        fcmTokens,
        updatedAt: Timestamp.now(),
      });
    }

    return { success: true };
  }),

  /**
   * Remove FCM token
   */
  removeFcmToken: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { token } = data;

    if (!token) {
      throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
    }

    const userRef = db.collection('users').doc(context.auth.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnap.data()!;
    const fcmTokens = userData.fcmTokens || [];

    const updatedTokens = fcmTokens.filter(t => t !== token);

    await userRef.update({
      fcmTokens: updatedTokens,
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  }),
};
