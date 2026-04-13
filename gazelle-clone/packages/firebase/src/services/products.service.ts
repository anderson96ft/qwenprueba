/**
 * Servicio de Productos
 * Maneja catálogo, inventario y búsqueda de dispositivos
 */

import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../config';
import { Product, ProductCondition, ProductCategory } from '../types';

const PRODUCTS_COLLECTION = 'products';

/**
 * Obtener un producto por ID
 */
export async function getProduct(productId: string): Promise<Product | null> {
  try {
    const docSnap = await getDoc(doc(db, PRODUCTS_COLLECTION, productId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  } catch (error: any) {
    console.error('Error al obtener producto:', error);
    throw new Error(`Error al obtener producto: ${error.message}`);
  }
}

/**
 * Obtener todos los productos (paginación)
 */
export async function getProducts(
  pageSize: number = 20,
  lastVisible?: QueryDocumentSnapshot
): Promise<{ products: Product[]; lastVisible: QueryDocumentSnapshot | null }> {
  try {
    let q = query(
      collection(db, PRODUCTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastVisible) {
      q = query(
        collection(db, PRODUCTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    return {
      products,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null
    };
  } catch (error: any) {
    console.error('Error al obtener productos:', error);
    throw new Error(`Error al obtener productos: ${error.message}`);
  }
}

/**
 * Buscar productos por categoría
 */
export async function getProductsByCategory(
  category: ProductCategory,
  pageSize: number = 20
): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('category', '==', category),
      where('status', '==', 'active'),
      orderBy('price', 'asc'),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error: any) {
    console.error('Error al buscar productos por categoría:', error);
    throw new Error(`Error al buscar productos: ${error.message}`);
  }
}

/**
 * Buscar productos por marca y modelo
 */
export async function searchProducts(
  brand: string,
  model?: string,
  condition?: ProductCondition
): Promise<Product[]> {
  try {
    let q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('brand', '==', brand),
      where('status', '==', 'active')
    );

    // Nota: Firestore requiere índices compuestos para múltiples where
    // Si hay error, crear índice en la consola de Firebase
    
    const snapshot = await getDocs(q);
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    // Filtrado adicional en cliente si es necesario
    if (model) {
      products = products.filter(p => 
        p.model.toLowerCase().includes(model.toLowerCase())
      );
    }

    if (condition) {
      products = products.filter(p => p.condition === condition);
    }

    return products;
  } catch (error: any) {
    console.error('Error al buscar productos:', error);
    throw new Error(`Error al buscar productos: ${error.message}`);
  }
}

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(limitCount: number = 8): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('featured', '==', true),
      where('status', '==', 'active'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error: any) {
    console.error('Error al obtener destacados:', error);
    throw new Error(`Error al obtener destacados: ${error.message}`);
  }
}

/**
 * Crear un nuevo producto (solo admin)
 */
export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    throw new Error(`Error al crear producto: ${error.message}`);
  }
}

/**
 * Actualizar un producto existente (solo admin)
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Product>
): Promise<void> {
  try {
    await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    throw new Error(`Error al actualizar producto: ${error.message}`);
  }
}

/**
 * Eliminar un producto (solo admin)
 */
export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    throw new Error(`Error al eliminar producto: ${error.message}`);
  }
}

/**
 * Actualizar inventario de un producto
 */
export async function updateProductInventory(
  productId: string,
  quantity: number
): Promise<void> {
  try {
    const product = await getProduct(productId);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    const newQuantity = Math.max(0, product.stock + quantity);
    const status = newQuantity > 0 ? 'active' : 'out_of_stock';

    await updateProduct(productId, {
      stock: newQuantity,
      status
    });
  } catch (error: any) {
    console.error('Error al actualizar inventario:', error);
    throw new Error(`Error al actualizar inventario: ${error.message}`);
  }
}

/**
 * Obtener productos relacionados
 */
export async function getRelatedProducts(
  productId: string,
  category: ProductCategory,
  limitCount: number = 4
): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('category', '==', category),
      where('status', '==', 'active'),
      limit(limitCount + 1)
    );

    const snapshot = await getDocs(q);
    const products = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as Product)
      .filter(p => p.id !== productId);

    return products.slice(0, limitCount);
  } catch (error: any) {
    console.error('Error al obtener relacionados:', error);
    throw new Error(`Error al obtener relacionados: ${error.message}`);
  }
}
