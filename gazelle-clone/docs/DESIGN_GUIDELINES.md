# 🎨 Guía de Diseño UI/UX - Gazelle Clone

## Sistema de Diseño

### Paleta de Colores

Basada en el branding moderno de Gazelle pero actualizada:

```css
/* Primary Colors */
--primary-orange: #E85200;        /* Color principal (acciones, CTAs) */
--primary-dark: #B84100;          /* Hover states */
--primary-light: #FF6B1A;         /* Active states */

/* Secondary Colors */
--secondary-yellow: #FFD636;      /* Acentos, badges */
--secondary-blue: #007AFF;        /* Links, información */

/* Neutral Colors */
--gray-900: #232121;              /* Text primary */
--gray-700: #4A4A4A;              /* Text secondary */
--gray-500: #949494;              /* Text muted */
--gray-300: #BFBFBF;              /* Borders */
--gray-100: #F5F5F5;              /* Backgrounds */
--white: #FFFFFF;

/* Semantic Colors */
--success: #10B981;               /* Completed, approved */
--warning: #F59E0B;               /* Pending, caution */
--error: #EF4444;                 /* Errors, rejected */
--info: #3B82F6;                  /* Information */

/* Condition Colors */
--condition-excellent: #10B981;   /* Verde */
--condition-good: #3B82F6;        /* Azul */
--condition-fair: #F59E0B;        /* Ámbar */
--condition-broken: #EF4444;      /* Rojo */
```

### Tipografía

```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-display: 'Poppins', var(--font-primary);
--font-mono: 'JetBrains Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Espaciado (Spacing Scale)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Border Radius

```css
--radius-sm: 0.25rem;   /* 4px - botones pequeños */
--radius-md: 0.5rem;    /* 8px - botones, cards */
--radius-lg: 0.75rem;   /* 12px - modales */
--radius-xl: 1rem;      /* 16px - contenedores grandes */
--radius-full: 9999px;  /* Pills, avatars */
```

### Sombras (Shadows)

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

## Componentes Principales

### 1. Header/Navigation

```tsx
// Estructura del Header
<header>
  {/* Top Bar - Promociones */}
  <TopBar />
  
  {/* Main Header */}
  <MainHeader>
    <Logo />
    <SearchBar />
    <NavLinks />
    <UserActions />
    <CartIcon />
  </MainHeader>
  
  {/* Category Navigation */}
  <CategoryNav />
</header>
```

**Características:**
- Sticky header en scroll
- Búsqueda predictiva con autocomplete
- Mega menu para categorías
- Badge en carrito con cantidad
- User dropdown con historial

### 2. Product Card

```tsx
<ProductCard>
  <ProductImage />
  <ConditionBadge />      /* Excellent, Good, etc. */
  <ProductTitle />
  <ProductSpecs />        /* Capacidad, color, carrier */
  <PriceDisplay />
  <CompareAtPrice />      /* Precio tachado si hay descuento */
  <AddToCartButton />
  <WishlistButton />
</ProductCard>
```

**Estados:**
- Default
- Hover (elevación + shadow)
- Out of stock (opacity reducida)
- On sale (badge de descuento)

### 3. Trade-In Flow

#### Step 1: Device Selection
```tsx
<DeviceSelector>
  <BrandGrid />           /* Apple, Samsung, Google, etc. */
  <ModelDropdown />       /* iPhone 14, 13, 12, etc. */
  <CapacitySelector />    /* 64GB, 128GB, 256GB */
  <ColorPicker />
  <CarrierSelector />
</DeviceSelector>
```

#### Step 2: Condition Assessment
```tsx
<ConditionAssessment>
  <ConditionOption condition="excellent">
    <Icon />
    <Title>Sin defectos</Title>
    <Description>Sin rayones, funciona perfectamente</Description>
    <EstimatedValue>$450-500</EstimatedValue>
  </ConditionOption>
  
  <ConditionOption condition="good">
    <Icon />
    <Title>Signos menores</Title>
    <Description>Pequeños rayones, funciona bien</Description>
    <EstimatedValue>$350-400</EstimatedValue>
  </ConditionOption>
  
  {/* ... más condiciones */}
</ConditionAssessment>
```

#### Step 3: Quote Display
```tsx
<QuoteDisplay>
  <DeviceSummary />
  <QuoteAmount>$425.00</QuoteAmount>
  <PaymentMethodSelector />
  <ShippingLabel />
  <AcceptQuoteButton />
</QuoteDisplay>
```

### 4. Shopping Cart

```tsx
<CartSidebar>
  <CartItem>
    <ProductImage />
    <ProductDetails />
    <QuantitySelector />
    <PriceDisplay />
    <RemoveButton />
  </CartItem>
  
  <CartSummary>
    <Subtotal />
    <Shipping />
    <Tax />
    <Total />
    <CheckoutButton />
  </CartSummary>
</CartSidebar>
```

### 5. Checkout Flow

```tsx
<CheckoutSteps>
  <Step indicator={1} status="completed">
    Información de envío
  </Step>
  <Step indicator={2} status="current">
    Método de pago
  </Step>
  <Step indicator={3} status="pending">
    Confirmación
  </Step>
</CheckoutSteps>
```

### 6. Product Page

```tsx
<ProductPage>
  <Breadcrumb />
  
  <ProductGallery>
    <MainImage />
    <ThumbnailGrid />
  </ProductGallery>
  
  <ProductInfo>
    <Title />
    <Reviews />
    <Price />
    <VariantSelector />
    <ConditionSelector />
    <AddToCart />
    <WishlistButton />
    
    <Features />
    <Specifications />
    <WarrantyInfo />
    <ShippingInfo />
  </ProductInfo>
  
  <RelatedProducts />
  <RecentlyViewed />
</ProductPage>
```

## Páginas Clave

### Homepage

```
┌─────────────────────────────────────┐
│         Announcement Bar            │
├─────────────────────────────────────┤
│  Logo  Search  Nav  User  Cart     │
├─────────────────────────────────────┤
│        Hero Banner (Carousel)       │
├─────────────────────────────────────┤
│    Categories Quick Links Grid      │
├─────────────────────────────────────┤
│  Featured Products (Horizontal)     │
├─────────────────────────────────────┤
│    Trade-In CTA Section             │
├─────────────────────────────────────┤
│  Best Sellers / New Arrivals        │
├─────────────────────────────────────┤
│    Why Choose Us (Trust Badges)     │
├─────────────────────────────────────┤
│         Customer Reviews            │
├─────────────────────────────────────┤
│           Newsletter Signup         │
├─────────────────────────────────────┤
│              Footer                 │
└─────────────────────────────────────┘
```

### Collection/Category Page

```
┌─────────────────────────────────────┐
│         Breadcrumb                  │
├─────────────────────────────────────┤
│  Title + Result Count + Sort        │
├──────────┬──────────────────────────┤
│ Filters  │   Product Grid           │
│ Sidebar  │   (3-4 columns)          │
│          │                          │
│ - Brand  │  [Card] [Card] [Card]   │
│ - Price  │  [Card] [Card] [Card]   │
│ - Cond.  │  [Card] [Card] [Card]   │
│ - Cap.   │                          │
│ - Color  │   Pagination             │
└──────────┴──────────────────────────┘
```

### Product Detail Page (PDP)

```
┌─────────────────────────────────────┐
│         Breadcrumb                  │
├───────────────┬─────────────────────┤
│               │  Title              │
│   Image       │  Reviews ⭐⭐⭐⭐⭐   │
│   Gallery     │  Price $XXX.XX     │
│               │                     │
│               │  Variant Selectors  │
│               │  (Color, Capacity)  │
│               │                     │
│               │  Condition Selector │
│               │                     │
│               │  Add to Cart        │
│               │  Wishlist ♥         │
│               │                     │
│               │  Trust Badges       │
├───────────────┴─────────────────────┤
│         Tabs Section                │
│  [Description] [Specs] [Shipping]   │
├─────────────────────────────────────┤
│      Related Products               │
└─────────────────────────────────────┘
```

## Animaciones y Micro-interacciones

### Button Hover
```css
.button {
  transition: all 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.button:active {
  transform: translateY(0);
}
```

### Cart Add Animation
```css
@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.cart-icon.added {
  animation: bounce 0.3s ease;
}
```

### Page Transitions
```css
.page-enter {
  opacity: 0;
  transform: translateY(10px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.3s ease;
}
```

### Loading States

**Skeleton Loader:**
```tsx
<Skeleton className="h-48 w-full rounded-lg" />
<Skeleton className="h-4 w-3/4 mt-4" />
<Skeleton className="h-4 w-1/2 mt-2" />
```

**Spinner:**
```tsx
<Spinner size="md" color="primary" />
```

## Responsive Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Phones landscape */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### Mobile Considerations

- Bottom navigation bar para móviles
- Swipe gestures en galerías
- Pull-to-refresh en listas
- Touch-friendly targets (min 44x44px)
- Keyboard-aware inputs

## Accesibilidad (WCAG 2.1 AA)

### Checklist

- [ ] Contraste de color mínimo 4.5:1
- [ ] Focus indicators visibles
- [ ] Navegación por teclado
- [ ] Screen reader support (ARIA labels)
- [ ] Alt text en imágenes
- [ ] Form labels asociados
- [ ] Error messages descriptivos
- [ ] Skip links

### ARIA Labels Ejemplo

```tsx
<button aria-label="Add iPhone 14 Pro to cart">
  Add to Cart
</button>

<nav aria-label="Main navigation">
  ...
</nav>

<div role="alert" aria-live="polite">
  Item added to cart
</div>
```

## Dark Mode (Opcional Futuro)

```css
.dark {
  --color-background: #0F0F0F;
  --color-foreground: #FFFFFF;
  --color-surface: #1A1A1A;
  --color-border: #333333;
}
```

## Herramientas Recomendadas

### Design
- **Figma**: Diseño de interfaces
- **Storybook**: Documentación de componentes
- **Chromatic**: Visual testing

### Development
- **Tailwind CSS**: Utility-first CSS
- **Shadcn/ui**: Componentes base
- **Framer Motion**: Animaciones
- **Radix UI**: Primitivas accesibles

### Testing
- **Playwright**: E2E testing
- **Lighthouse**: Performance & accessibility
- **axe-core**: Accessibility testing

---

**Nota**: Esta guía es un punto de partida. Adapta según tu marca y necesidades específicas.
