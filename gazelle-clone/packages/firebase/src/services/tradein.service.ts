/**
 * Servicio de Trade-In (Compra a Vendedores)
 * Maneja cotizaciones, evaluaciones y pagos de dispositivos usados
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
  Timestamp
} from 'firebase/firestore';
import { db, functions } from '../config';
import { httpsCallable } from 'firebase/functions';
import { TradeIn, TradeInStatus, TradeInQuote } from '../types';

const TRADEIN_COLLECTION = 'tradeins';
const QUOTES_COLLECTION = 'quotes';

/**
 * Generar cotización para un dispositivo
 */
export async function generateQuote(quoteData: {
  deviceId: string;
  brand: string;
  model: string;
  storage: string;
  carrier: string;
  condition: string;
  userId?: string;
}): Promise<string> {
  try {
    // Calcular precio basado en condición y modelo
    const quoteRef = await addDoc(collection(db, QUOTES_COLLECTION), {
      ...quoteData,
      estimatedPrice: calculateEstimatedPrice(quoteData),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 días
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return quoteRef.id;
  } catch (error: any) {
    console.error('Error al generar cotización:', error);
    throw new Error(`Error al generar cotización: ${error.message}`);
  }
}

/**
 * Función auxiliar para calcular precio estimado
 */
function calculateEstimatedPrice(data: any): number {
  // Precios base por marca (ejemplo)
  const basePrices: Record<string, number> = {
    'Apple': 300,
    'Samsung': 250,
    'Google': 200,
    'OnePlus': 180
  };

  const basePrice = basePrices[data.brand] || 150;
  
  // Multiplicadores por condición
  const conditionMultipliers: Record<string, number> = {
    'excellent': 0.9,
    'good': 0.7,
    'fair': 0.5,
    'broken': 0.2
  };

  const conditionMultiplier = conditionMultipliers[data.condition] || 0.5;
  
  return Math.round(basePrice * conditionMultiplier);
}

/**
 * Obtener cotización por ID
 */
export async function getQuote(quoteId: string): Promise<TradeInQuote | null> {
  try {
    const docSnap = await getDoc(doc(db, QUOTES_COLLECTION, quoteId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as TradeInQuote;
    }
    return null;
  } catch (error: any) {
    console.error('Error al obtener cotización:', error);
    throw new Error(`Error al obtener cotización: ${error.message}`);
  }
}

/**
 * Crear trade-in desde cotización aceptada
 */
export async function createTradeInFromQuote(
  quoteId: string,
  userId: string,
  paymentMethod: 'paypal' | 'check' | 'giftcard',
  shippingAddress: any
): Promise<string> {
  try {
    const quote = await getQuote(quoteId);
    if (!quote) {
      throw new Error('Cotización no encontrada');
    }

    const tradeInRef = await addDoc(collection(db, TRADEIN_COLLECTION), {
      userId,
      quoteId,
      device: quote,
      paymentMethod,
      shippingAddress,
      status: 'pending_shipment',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Actualizar estado de la cotización
    await updateDoc(doc(db, QUOTES_COLLECTION, quoteId), {
      status: 'accepted',
      acceptedAt: Timestamp.now()
    });

    return tradeInRef.id;
  } catch (error: any) {
    console.error('Error al crear trade-in:', error);
    throw new Error(`Error al crear trade-in: ${error.message}`);
  }
}

/**
 * Obtener trade-in por ID
 */
export async function getTradeIn(tradeInId: string): Promise<TradeIn | null> {
  try {
    const docSnap = await getDoc(doc(db, TRADEIN_COLLECTION, tradeInId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as TradeIn;
    }
    return null;
  } catch (error: any) {
    console.error('Error al obtener trade-in:', error);
    throw new Error(`Error al obtener trade-in: ${error.message}`);
  }
}

/**
 * Obtener trade-ins de un usuario
 */
export async function getUserTradeIns(userId: string): Promise<TradeIn[]> {
  try {
    const q = query(
      collection(db, TRADEIN_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TradeIn[];
  } catch (error: any) {
    console.error('Error al obtener trade-ins:', error);
    throw new Error(`Error al obtener trade-ins: ${error.message}`);
  }
}

/**
 * Confirmar envío del dispositivo
 */
export async function confirmShipment(
  tradeInId: string,
  trackingNumber: string,
  carrier: string
): Promise<void> {
  try {
    await updateDoc(doc(db, TRADEIN_COLLECTION, tradeInId), {
      status: 'in_transit',
      shipment: {
        trackingNumber,
        carrier,
        shippedAt: Timestamp.now()
      },
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al confirmar envío:', error);
    throw new Error(`Error al confirmar envío: ${error.message}`);
  }
}

/**
 * Registrar recepción del dispositivo (admin)
 */
export async function confirmReceipt(tradeInId: string): Promise<void> {
  try {
    await updateDoc(doc(db, TRADEIN_COLLECTION, tradeInId), {
      status: 'received',
      receivedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al confirmar recepción:', error);
    throw new Error(`Error al confirmar recepción: ${error.message}`);
  }
}

/**
 * Evaluar dispositivo recibido y actualizar precio final
 */
export async function evaluateDevice(
  tradeInId: string,
  actualCondition: string,
  finalPrice: number,
  notes?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, TRADEIN_COLLECTION, tradeInId), {
      evaluation: {
        actualCondition,
        finalPrice,
        notes,
        evaluatedAt: Timestamp.now()
      },
      status: 'evaluated',
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al evaluar dispositivo:', error);
    throw new Error(`Error al evaluar dispositivo: ${error.message}`);
  }
}

/**
 * Aprobar evaluación y procesar pago
 */
export async function approveAndPay(tradeInId: string): Promise<void> {
  try {
    const processTradeInPaymentFn = httpsCallable(functions, 'processTradeInPayment');
    await processTradeInPaymentFn({ tradeInId });
    
    await updateDoc(doc(db, TRADEIN_COLLECTION, tradeInId), {
      status: 'paid',
      paidAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al procesar pago:', error);
    throw new Error(`Error al procesar pago: ${error.message}`);
  }
}

/**
 * Rechazar trade-in
 */
export async function rejectTradeIn(
  tradeInId: string,
  reason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, TRADEIN_COLLECTION, tradeInId), {
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al rechazar trade-in:', error);
    throw new Error(`Error al rechazar trade-in: ${error.message}`);
  }
}

/**
 * Generar etiqueta de envío prepagada
 */
export async function generateShippingLabel(tradeInId: string): Promise<string> {
  try {
    const generateLabelFn = httpsCallable(functions, 'generateShippingLabel');
    const result = await generateLabelFn({ tradeInId });
    return (result.data as any).labelUrl;
  } catch (error: any) {
    console.error('Error al generar etiqueta:', error);
    throw new Error(`Error al generar etiqueta: ${error.message}`);
  }
}

/**
 * Obtener todos los trade-ins (solo admin)
 */
export async function getAllTradeIns(limitCount: number = 50): Promise<TradeIn[]> {
  try {
    const q = query(
      collection(db, TRADEIN_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TradeIn[];
  } catch (error: any) {
    console.error('Error al obtener trade-ins:', error);
    throw new Error(`Error al obtener trade-ins: ${error.message}`);
  }
}
