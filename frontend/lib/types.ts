export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductsResponse = {
  success: boolean;
  data: Product[];
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
