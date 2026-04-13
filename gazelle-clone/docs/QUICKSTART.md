# 🚀 Guía de Inicio Rápido - Gazelle Clone

## ¿Qué es Gazelle Clone?

Gazelle Clone es una implementación moderna y completa de las funcionalidades principales de Gazelle.com, diseñada para lanzar tu propia plataforma de compra-venta de dispositivos electrónicos reacondicionados.

## Características Principales

### ✅ Para Clientes (B2C)
- Catálogo de dispositivos reacondicionados
- Búsqueda y filtros avanzados
- Carrito de compras
- Checkout seguro con Stripe
- Tracking de pedidos
- Sistema de reseñas

### ✅ Para Vendedores (C2B - Trade-In)
- Cotización instantánea de dispositivos
- Evaluación por condiciones (Excellent, Good, Fair, etc.)
- Etiquetas de envío prepagadas
- Múltiples métodos de pago (PayPal, Check, Gift Card)
- Dashboard de ventas

### ✅ Para Administradores
- Panel de control completo
- Gestión de inventario
- Procesamiento de trade-ins
- Analytics y reportes
- Gestión de usuarios

## Stack Tecnológico

```
Frontend:  Next.js 14 + TypeScript + Tailwind CSS
Backend:   Node.js + Express + TypeScript
Database:  PostgreSQL + Prisma ORM
Cache:     Redis
Payments:  Stripe
Shipping:  EasyPost/Shippo
Hosting:   Vercel/AWS
```

## Instalación en 5 Minutos

### Paso 1: Clonar el repositorio

```bash
git clone <tu-repositorio>
cd gazelle-clone
```

### Paso 2: Instalar dependencias

```bash
pnpm install
```

### Paso 3: Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y configura al menos:
- `DATABASE_URL` (ya configurada para Docker local)
- `STRIPE_SECRET_KEY` y `STRIPE_PUBLISHABLE_KEY`
- `JWT_SECRET`

### Paso 4: Iniciar servicios de infraestructura

```bash
docker-compose up -d
```

Esto inicia:
- PostgreSQL (puerto 5432)
- Redis (puerto 6379)
- Adminer (puerto 8080) - GUI para database

### Paso 5: Configurar base de datos

```bash
pnpm db:migrate
pnpm db:seed  # Opcional: datos de prueba
```

### Paso 6: Iniciar aplicación en desarrollo

```bash
pnpm dev
```

¡Listo! La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Adminer**: http://localhost:8080

## Estructura del Proyecto

```
gazelle-clone/
├── apps/
│   ├── web/           # Next.js storefront
│   ├── api/           # Express API
│   └── admin/         # Dashboard admin
├── packages/
│   ├── database/      # Prisma schema
│   ├── auth/          # Auth utilities
│   ├── ui/            # Componentes UI
│   └── utils/         # Utilidades
├── docker/
├── docs/
└── scripts/
```

## Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Iniciar todo (web + api)
pnpm dev:web          # Solo frontend
pnpm dev:api          # Solo backend

# Build producción
pnpm build            # Build completo
pnpm start            # Start producción

# Database
pnpm db:migrate       # Migraciones
pnpm db:studio        # Prisma Studio (GUI)
pnpm db:seed          # Seed inicial

# Docker
pnpm docker:up        # Start contenedores
pnpm docker:down      # Stop contenedores

# Calidad de código
pnpm lint             # ESLint
pnpm test             # Tests
```

## Primeros Pasos Después de la Instalación

### 1. Crear un Usuario Admin

Conéctate a la base de datos y crea manualmente o usa el seed:

```sql
INSERT INTO "User" (id, email, password, firstName, lastName, role)
VALUES ('admin-id', 'admin@gazelle.local', '$hashed-password', 'Admin', 'User', 'ADMIN');
```

### 2. Agregar Productos de Ejemplo

Usa Prisma Studio:

```bash
pnpm db:studio
```

Navega a la tabla `Product` y agrega algunos productos.

### 3. Configurar Stripe

1. Crea cuenta en [Stripe Dashboard](https://dashboard.stripe.com/)
2. Obtén tus keys de prueba
3. Actualiza `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### 4. Probar el Flujo Completo

1. **Como cliente**: 
   - Navega el catálogo
   - Agrega productos al carrito
   - Completa checkout

2. **Como vendedor**:
   - Usa el formulario de trade-in
   - Genera cotización
   - Acepta oferta

3. **Como admin**:
   - Revisa pedidos
   - Procesa trade-ins
   - Gestiona inventario

## Troubleshooting Común

### Error: "Cannot connect to database"

```bash
# Verifica que Docker esté corriendo
docker-compose ps

# Reinicia los contenedores
docker-compose down
docker-compose up -d

# Espera 10 segundos y retry
sleep 10
pnpm db:migrate
```

### Error: "Module not found"

```bash
# Limpia cache y reinstala
rm -rf node_modules
pnpm install
```

### Error: "Port already in use"

```bash
# Mata el proceso usando el puerto
lsof -ti:3000 | xargs kill -9  # Para puerto 3000
lsof -ti:4000 | xargs kill -9  # Para puerto 4000
```

### Error: "Prisma generate failed"

```bash
# Regenera Prisma client
cd packages/database
pnpm prisma generate
```

## Siguientes Pasos

### Personalización

1. **Branding**: Cambia logo, colores y tipografía en `apps/web`
2. **Productos**: Configura tu catálogo inicial
3. **Precios**: Ajusta pricing rules para trade-ins
4. **Envíos**: Configura carriers y zonas de envío

### Integraciones

1. **Email**: Configura SMTP para notificaciones
2. **SMS**: Integra Twilio para alerts
3. **Analytics**: Agrega Plausible/Fathom
4. **Chat**: Implementa chat en vivo

### Producción

1. **Dominio**: Compra y configura tu dominio
2. **SSL**: Certificados HTTPS
3. **CDN**: Cloudflare para assets
4. **Monitoring**: Sentry para errores
5. **Backups**: Configura backups automáticos de DB

## Recursos Adicionales

- [Documentación Completa](./docs/PROJECT_DOCS.md)
- [Schema de Base de Datos](./packages/database/prisma/schema.prisma)
- [API Endpoints](./docs/PROJECT_DOCS.md#api-endpoints-principales)
- [Roadmap](./README.md#roadmap)

## Soporte y Comunidad

- 📧 Email: support@gazelle-clone.local
- 💬 Discord: [Únete a nuestro servidor]
- 🐛 Issues: [Reporta bugs en GitHub]
- 📖 Wiki: [Documentación extendida]

## Licencia

MIT License - Libre uso para proyectos personales y comerciales.

---

**¿Listo para comenzar?** Ejecuta `pnpm dev` y empieza a construir tu imperio de dispositivos reacondicionados! 🚀
