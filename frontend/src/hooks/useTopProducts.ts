import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Product {
  productId: string;
  productName: string;
  revenue: number;
  unitsSold: number;
}

export function useTopProducts(period: string) {
  const { token } = useAuth();

  const { data, error, isLoading } = useSWR<Product[]>(
    token ? `/analytics/top-products?period=${period}&limit=10` : null,
    swrFetcher,
    { refreshInterval: 60000 }
  );

  return { products: data, isLoading, error };
}
