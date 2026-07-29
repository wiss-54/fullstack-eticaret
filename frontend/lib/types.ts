export type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  createdAt: string;
};

export type VariantAxisValue = {
  id: number;
  label: string;
  colorHex: string | null;
  sortOrder: number;
};

export type VariantAxis = {
  id: number;
  name: string;
  displayStyle: 'list' | 'button' | 'color';
  sortOrder: number;
  values: VariantAxisValue[];
};

export type VariantSelection = {
  axisId: number;
  axisValueId: number;
  label: string;
  colorHex: string | null;
};

export type ProductVariant = {
  id: number;
  productId: number;
  optionKey: string;
  sku: string | null;
  price: number | null;
  stock: number;
  isActive: boolean;
  sortOrder: number;
  selections: VariantSelection[];
};

export type VariantAxisInput = {
  name: string;
  displayStyle?: 'list' | 'button' | 'color';
  sortOrder?: number;
  values: { label: string; colorHex?: string | null; sortOrder?: number }[];
};

export type VariantRowInput = {
  valueLabels: string[];
  sku?: string | null;
  price?: number | null;
  stock?: number;
  isActive?: boolean;
  sortOrder?: number;
};

export type ProductOptionChoice = {
  id: number;
  label: string;
  priceDelta: number;
  sortOrder: number;
};

export type ProductOption = {
  id: number;
  productId?: number;
  label: string;
  optionType: 'select' | 'text';
  required: boolean;
  sortOrder: number;
  choices: ProductOptionChoice[];
};

export type ProductOptionInput = {
  label: string;
  optionType: 'select' | 'text';
  required?: boolean;
  sortOrder?: number;
  choices?: { label: string; priceDelta?: number; sortOrder?: number }[];
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  imageUrls?: string[];
  categoryId: number | null;
  categoryName: string | null;
  productType: 'simple' | 'variant';
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
  options?: ProductOption[];
  variantAxes?: VariantAxis[];
  variants?: ProductVariant[];
};

export type ProductsResponse = {
  success: boolean;
  data: Product[];
};

export type User = {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  emailVerified: boolean;
  shippingFullName?: string | null;
  shippingCity?: string | null;
  shippingDistrict?: string | null;
  shippingAddressLine?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'cancelled';

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  variantId: number | null;
  productName: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  selectedOptions: { optionId: number; label: string; value: string; priceDelta?: number }[];
  customerNote: string | null;
  sortOrder: number;
};

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled';

export type Order = {
  id: number;
  publicCode: string;
  userId: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus?: PaymentStatus | string;
  paymentProvider?: string | null;
  providerPaymentId?: string | null;
  paidAt?: string | null;
  stockReserved?: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string;
  shippingCity?: string | null;
  shippingDistrict?: string | null;
  shippingAddressLine?: string | null;
  orderNote: string | null;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type StoreTextStyle = {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  color?: 'default' | 'accent' | 'muted' | 'light' | 'custom';
  customColor?: string;
  lineHeight?: 'tight' | 'normal' | 'relaxed' | 'loose';
  letterSpacing?: 'tight' | 'normal' | 'wide';
  uppercase?: boolean;
  italic?: boolean;
};

export type StoreTextStyles = Record<string, StoreTextStyle>;

export type StoreFeatureCard = {
  title: string;
  text: string;
};

export type StoreSection =
  | { id: string; type: 'hero'; enabled: boolean }
  | { id: string; type: 'features'; enabled: boolean }
  | { id: string; type: 'products'; enabled: boolean }
  | {
      id: string;
      type: 'rich_text';
      enabled: boolean;
      title: string;
      body: string;
      align?: 'left' | 'center';
    }
  | {
      id: string;
      type: 'banner';
      enabled: boolean;
      title: string;
      body: string;
      ctaLabel?: string;
      ctaHref?: string;
      tone?: 'accent' | 'muted' | 'dark';
    }
  | {
      id: string;
      type: 'cta';
      enabled: boolean;
      title: string;
      body: string;
      ctaLabel: string;
      ctaHref: string;
    };

export type StoreThemeId = 'classic-amber' | 'modern-slate' | 'soft-blush' | 'bold-ink';

export type StoreSettings = {
  brandName: string;
  logoUrl: string | null;
  accentColor: string;
  themeId: StoreThemeId;
  surfaceStyle: 'warm' | 'cool' | 'soft' | 'contrast';
  radiusStyle: 'soft' | 'rounded' | 'sharp';
  buttonStyle: 'pill' | 'rounded' | 'square';
  heroLayout: 'split' | 'centered' | 'minimal';
  heroTextItemsOrder?: Array<'eyebrow' | 'title' | 'subtitle' | 'ctas'>;
  heroCtaButtonsOrder?: Array<'primary' | 'secondary'>;
  heroFeatureSide?: 'left' | 'right';
  fontStyle: 'classic' | 'modern' | 'elegant';
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  featureCards: StoreFeatureCard[];
  productsEyebrow: string;
  productsTitle: string;
  productsSubtitle: string;
  navItem1Label: string;
  navItem1Href: string;
  navItem2Label: string;
  navItem2Href: string;
  footerLeft: string;
  footerRight: string;
  currencyCode: string;
  currencyDecimals: number;
  textStyles?: StoreTextStyles;
  sections: StoreSection[];
  updatedAt?: string;
};

export type StoreThemePreset = {
  id: StoreThemeId;
  name: string;
  description: string;
  previewAccent: string;
};

export type ServiceCheck = {
  status: 'up' | 'down';
  latencyMs?: number;
  statusCode?: number;
  error?: string;
};

export type SystemStatus = {
  checkedAt: string;
  deploy: {
    commit: string;
    deployedAt: string;
  } | null;
  services: {
    database: ServiceCheck;
    api: ServiceCheck;
    shop: ServiceCheck;
    adminPanel: ServiceCheck;
    backend: {
      status: 'up';
      uptimeSeconds: number;
      memoryMb: number;
    };
  };
  server: {
    hostname: string;
    loadAverage: number[];
    freeMemoryMb: number;
    totalMemoryMb: number;
  };
  stats: {
    productCount: number | null;
  };
  links: {
    githubActions: string;
  };
};
