# 📄 Documentación del Proyecto Gazelle Clone

## Visión General

Este proyecto es una implementación moderna de las funcionalidades clave de Gazelle.com, una plataforma líder en la compra y venta de dispositivos electrónicos reacondicionados.

## Arquitectura

### Monorepo con Turborepo

El proyecto utiliza una arquitectura monorepo gestionada con Turborepo para:
- Compartir código entre aplicaciones
- Builds optimizados y caching
- Desarrollo simplificado

### Aplicaciones

1. **Web (`apps/web`)** - Next.js 14+
   - Storefront principal para clientes
   - Catálogo de productos
   - Carrito y checkout
   - Sistema de trade-in

2. **API (`apps/api`)** - Express/TypeScript
   - REST API
   - Autenticación JWT
   - Integración con Stripe
   - Gestión de envíos

3. **Admin (`apps/admin`)** - Dashboard administrativo
   - Gestión de productos
   - Procesamiento de pedidos
   - Aprobación de trade-ins
   - Analytics

### Paquetes Compartidos

- **`@gazelle/database`** - Schema Prisma y cliente
- **`@gazelle/auth`** - Utilidades de autenticación
- **`@gazelle/ui`** - Componentes UI compartidos
- **`@gazelle/utils`** - Funciones utilitarias

## Base de Datos

### Modelo Entidad-Relación

El schema incluye las siguientes entidades principales:

#### Core Business
- **Product/ProductVariant**: Catálogo de dispositivos
- **Order/OrderItem**: Pedidos de compra
- **TradeIn**: Sistema de compra de dispositivos usados (C2B)
- **Inventory/InventoryLog**: Gestión de stock

#### Usuarios
- **User**: Clientes y administradores
- **Address**: Direcciones de envío/facturación
- **PaymentMethod**: Métodos de pago guardados

#### Transaccional
- **Payment**: Transacciones de pago
- **Shipment**: Envíos y tracking
- **Review**: Reseñas de productos

#### Soporte
- **Notification**: Notificaciones push/email
- **WishlistItem**: Lista de deseos
- **AuditLog**: Logging de auditoría

### Migraciones

```bash
# Ejecutar migraciones
pnpm db:migrate

# Ver studio (GUI de Prisma)
pnpm db:studio

# Seed inicial (datos de prueba)
pnpm db:seed
```

## Funcionalidades Principales

### 1. E-commerce B2C

#### Catálogo de Productos
- Navegación por categorías (Phones, Tablets, Laptops, etc.)
- Filtros por marca, condición, precio, capacidad
- Búsqueda full-text
- Páginas de producto detalladas
- Galería de imágenes
- Especificaciones técnicas

#### Carrito & Checkout
- Carrito persistente
- Cálculo de impuestos y envío
- Múltiples métodos de pago (Stripe, PayPal, Apple Pay)
- Checkout optimizado
- Confirmación por email

#### Cuenta de Usuario
- Historial de pedidos
- Tracking de envíos
- Direcciones guardadas
- Métodos de pago
- Lista de deseos
- Notificaciones

### 2. Sistema Trade-In (C2B)

#### Flujo de Venta
1. **Cotización**: Usuario selecciona dispositivo y condición
2. **Aceptación**: Usuario acepta la oferta
3. **Envío**: Generación de etiqueta prepagada
4. **Recepción**: Dispositivo llega al warehouse
5. **Inspección**: Verificación de condición
6. **Pago**: Usuario recibe pago (PayPal, check, gift card)

#### Condiciones de Dispositivos
- **Excellent**: Como nuevo, sin defectos
- **Good**: Signos menores de uso
- **Fair**: Defectos visibles pero funcional
- **Broken**: No funciona o dañado severamente
- **For Parts**: Solo para repuestos

#### Métodos de Pago Trade-In
- PayPal (instantáneo)
- Check por correo (5-7 días)
- Transferencia bancaria (2-3 días)
- Amazon Gift Card (bonus 5-10%)
- Donación a caridad

### 3. Panel Administrativo

#### Gestión de Productos
- CRUD de productos y variantes
- Gestión de inventario
- Precios y descuentos
- Imágenes y descripciones

#### Procesamiento de Pedidos
- Ver pedidos por estado
- Actualizar estados
- Generar etiquetas de envío
- Gestionar devoluciones

#### Trade-In Queue
- Revisar dispositivos recibidos
- Aprobar/rechazar basado en inspección
- Ajustar ofertas si condición difiere
- Procesar pagos

#### Analytics
- Ventas diarias/mensuales
- Productos más vendidos
- Tasa de conversión
- Valor promedio de trade-ins
- Métricas de satisfacción

## Stack Tecnológico Detallado

### Frontend (Next.js)

```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "@tanstack/react-query": "^5.28.0",
  "zustand": "^4.5.2",
  "tailwindcss": "^3.4.1",
  "stripe": "^14.25.0"
}
```

**Características:**
- Server-Side Rendering (SSR) para SEO
- Static Site Generation (SSG) para páginas estáticas
- Incremental Static Regeneration (ISR)
- Optimización de imágenes automática
- Code splitting automático

### Backend (Express/TypeScript)

```json
{
  "express": "^4.19.2",
  "prisma": "^5.12.1",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "zod": "^3.22.4",
  "winston": "^3.12.0"
}
```

**Características:**
- RESTful API design
- Validación con Zod
- Autenticación JWT
- Rate limiting
- CORS configurado
- Logging estructurado

### Base de Datos

- **PostgreSQL 15**: Base de datos relacional
- **Prisma ORM**: Type-safe database access
- **Redis**: Caché y sesiones

### Infraestructura

- **Docker**: Contenerización
- **Vercel/AWS**: Hosting
- **GitHub Actions**: CI/CD
- **Sentry**: Error tracking
- **Plausible**: Analytics privacy-first

## Guía de Desarrollo

### Prerrequisitos

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL (local o Docker)

### Setup Inicial

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd gazelle-clone

# 2. Instalar dependencias
pnpm install

# 3. Copiar variables de entorno
cp .env.example .env

# 4. Iniciar servicios (PostgreSQL, Redis)
docker-compose up -d

# 5. Ejecutar migraciones
pnpm db:migrate

# 6. Seed inicial (opcional)
pnpm db:seed

# 7. Iniciar desarrollo
pnpm dev
```

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar web + API
pnpm dev:web          # Solo frontend
pnpm dev:api          # Solo backend

# Build
pnpm build            # Build completo
pnpm build:web        # Solo frontend
pnpm build:api        # Solo backend

# Database
pnpm db:migrate       # Ejecutar migraciones
pnpm db:seed          # Seed de datos
pnpm db:studio        # Abrir Prisma Studio

# Docker
pnpm docker:up        # Iniciar contenedores
pnpm docker:down      # Detener contenedores

# Testing & Linting
pnpm test             # Ejecutar tests
pnpm lint             # Lint codebase
```

## API Endpoints (Principales)

### Autenticación
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/profile
```

### Productos
```
GET    /api/products           # Listar productos
GET    /api/products/:slug     # Producto por slug
GET    /api/products/:id/variants
POST   /api/products           # [Admin] Crear producto
PUT    /api/products/:id       # [Admin] Actualizar
DELETE /api/products/:id       # [Admin] Eliminar
```

### Órdenes
```
GET    /api/orders             # Mis órdenes
GET    /api/orders/:id         # Detalle de orden
POST   /api/orders             # Crear orden
POST   /api/orders/:id/cancel  # Cancelar orden
```

### Trade-In
```
POST   /api/tradein/quote      # Obtener cotización
POST   /api/tradein            # Crear trade-in
GET    /api/tradein            # Mis trade-ins
GET    /api/tradein/:id        # Detalle trade-in
POST   /api/tradein/:id/accept # Aceptar oferta
```

### Checkout
```
POST   /api/checkout/session   # Crear sesión Stripe
POST   /api/checkout/webhook   # Webhook Stripe
```

## Consideraciones de Producción

### Seguridad

- [ ] HTTPS obligatorio
- [ ] Headers de seguridad (Helmet)
- [ ] Rate limiting en API
- [ ] Sanitización de inputs
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection prevention (Prisma ayuda)

### Performance

- [ ] CDN para assets estáticos
- [ ] Caché de consultas frecuentes
- [ ] Lazy loading de imágenes
- [ ] Code splitting
- [ ] Database indexing
- [ ] Query optimization

### Compliance

- [ ] PCI DSS (pagos)
- [ ] GDPR/CCPA (privacidad)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Return policy
- [ ] Accessibility (WCAG)

## Roadmap

### Fase 1 - MVP (Semana 1-4)
- [ ] Setup del proyecto
- [ ] Schema de base de datos
- [ ] Autenticación básica
- [ ] Catálogo de productos
- [ ] Carrito simple
- [ ] Checkout con Stripe

### Fase 2 - Trade-In (Semana 5-8)
- [ ] Formulario de cotización
- [ ] Sistema de evaluación
- [ ] Generación de etiquetas
- [ ] Dashboard de trade-ins
- [ ] Pagos a vendedores

### Fase 3 - Admin Panel (Semana 9-12)
- [ ] Dashboard administrativo
- [ ] Gestión de productos
- [ ] Procesamiento de pedidos
- [ ] Aprobación de trade-ins
- [ ] Reportes básicos

### Fase 4 - Características Avanzadas (Semana 13+)
- [ ] Sistema de reseñas
- [ ] Email marketing
- [ ] Programa de referidos
- [ ] Chat en vivo
- [ ] Analytics avanzado
- [ ] Mobile app (React Native)

## Contribución

Ver `CONTRIBUTING.md` para guías de contribución.

## Licencia

MIT License - ver archivo LICENSE para detalles.

---

**Nota**: Este proyecto es para fines educativos/de referencia. Para un negocio real, consulta con profesionales legales, financieros y de cumplimiento normativo.
