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
