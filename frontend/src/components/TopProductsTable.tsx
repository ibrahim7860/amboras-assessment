"use client";

interface Product {
  productId: string;
  productName: string;
  revenue: number;
  unitsSold: number;
}

const RANK_COLORS: Record<number, string> = {
  1: "text-[#fbbf24]",
  2: "text-[#94a3b8]",
  3: "text-[#d97706]",
};

export function TopProductsTable({ products }: { products: Product[] }) {
  return (
    <div className="card-elevated p-0">
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Top Products
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              <th className="px-6 py-3 pr-4">#</th>
              <th className="py-3 pr-4">Product</th>
              <th className="py-3 pr-4 text-right">Revenue</th>
              <th className="py-3 pr-6 text-right">Units</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.productId}
                className={`transition-colors hover:bg-white/[0.02] ${
                  index % 2 === 1 ? "bg-white/[0.01]" : ""
                } ${index < products.length - 1 ? "border-b border-border-subtle" : ""}`}
              >
                <td className={`px-6 py-3 pr-4 font-mono text-xs font-semibold ${RANK_COLORS[index + 1] || "text-text-tertiary"}`}>
                  {String(index + 1).padStart(2, "0")}
                </td>
                <td className="py-3 pr-4 font-medium text-text-primary">
                  {product.productName}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-sm font-semibold text-kpi-revenue">
                  ${product.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 pr-6 text-right font-mono text-sm font-semibold text-text-secondary">
                  {product.unitsSold.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
