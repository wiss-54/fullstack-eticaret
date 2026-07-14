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
  categoryId: number | null;
  categoryName: string | null;
  productType: 'simple' | 'variant';
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

export type Order = {
  id: number;
  userId: number;
  status: OrderStatus;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string;
  orderNote: string | null;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type StoreFeatureCard = {
  title: string;
  text: string;
};

export type StoreSettings = {
  brandName: string;
  logoUrl: string | null;
  accentColor: string;
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
  footerLeft: string;
  footerRight: string;
  updatedAt?: string;
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
