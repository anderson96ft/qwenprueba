/**
 * Servicio de Órdenes
 * Maneja creación, seguimiento y gestión de pedidos
 */

import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db, functions } from '../config';
import { httpsCallable } from 'firebase/functions';
import { Order, OrderStatus, OrderItem } from '../types';

const ORDERS_COLLECTION = 'orders';

/**
 * Crear una nueva orden
 */
export async function createOrder(orderData: {
  userId: string;
  items: OrderItem[];
  shippingAddress: any;
  billingAddress: any;
  paymentMethod: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
}): Promise<string> {
  try {
    const orderRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return orderRef.id;
  } catch (error: any) {
    console.error('Error al crear orden:', error);
    throw new Error(`Error al crear orden: ${error.message}`);
  }
}

/**
 * Obtener una orden por ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const docSnap = await getDoc(doc(db, ORDERS_COLLECTION, orderId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    return null;
  } catch (error: any) {
    console.error('Error al obtener orden:', error);
    throw new Error(`Error al obtener orden: ${error.message}`);
  }
}

/**
 * Obtener órdenes de un usuario
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
  } catch (error: any) {
    console.error('Error al obtener órdenes:', error);
    throw new Error(`Error al obtener órdenes: ${error.message}`);
  }
}

/**
 * Actualizar estado de una orden
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al actualizar estado:', error);
    throw new Error(`Error al actualizar estado: ${error.message}`);
  }
}

/**
 * Agregar tracking a una orden
 */
export async function addTrackingInfo(
  orderId: string,
  trackingNumber: string,
  carrier: string
): Promise<void> {
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      tracking: {
        number: trackingNumber,
        carrier,
        updatedAt: Timestamp.now()
      },
      status: 'shipped',
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al agregar tracking:', error);
    throw new Error(`Error al agregar tracking: ${error.message}`);
  }
}

/**
 * Cancelar una orden
 */
export async function cancelOrder(orderId: string, reason: string): Promise<void> {
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al cancelar orden:', error);
    throw new Error(`Error al cancelar orden: ${error.message}`);
  }
}

/**
 * Procesar pago con Stripe (vía Cloud Function)
 */
export async function processPayment(orderId: string, paymentData: any): Promise<any> {
  try {
    const processPaymentFn = httpsCallable(functions, 'processPayment');
    const result = await processPaymentFn({ orderId, ...paymentData });
    return result.data;
  } catch (error: any) {
    console.error('Error al procesar pago:', error);
    throw new Error(`Error al procesar pago: ${error.message}`);
  }
}

/**
 * Confirmar recepción de orden
 */
export async function confirmDelivery(orderId: string): Promise<void> {
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      status: 'delivered',
      deliveredAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al confirmar entrega:', error);
    throw new Error(`Error al confirmar entrega: ${error.message}`);
  }
}

/**
 * Solicitar devolución
 */
export async function requestReturn(
  orderId: string,
  itemId: string,
  reason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      returnRequest: {
        itemId,
        reason,
        status: 'pending',
        requestedAt: Timestamp.now()
      },
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al solicitar devolución:', error);
    throw new Error(`Error al solicitar devolución: ${error.message}`);
  }
}

/**
 * Obtener todas las órdenes (solo admin)
 */
export async function getAllOrders(limitCount: number = 50): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
  } catch (error: any) {
    console.error('Error al obtener todas las órdenes:', error);
    throw new Error(`Error al obtener órdenes: ${error.message}`);
  }
}
