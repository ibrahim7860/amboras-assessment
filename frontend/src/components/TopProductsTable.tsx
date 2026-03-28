"use client";

interface Product {
  productId: string;
  productName: string;
  revenue: number;
  unitsSold: number;
}

export function TopProductsTable({ products }: { products: Product[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-medium text-gray-500">Top Products</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="pb-3 pr-4">#</th>
              <th className="pb-3 pr-4">Product</th>
              <th className="pb-3 pr-4 text-right">Revenue</th>
              <th className="pb-3 text-right">Units</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.productId}
                className={index % 2 === 1 ? "bg-gray-50" : ""}
              >
                <td className="py-2.5 pr-4 font-medium text-gray-400">
                  {index + 1}
                </td>
                <td className="py-2.5 pr-4 font-medium text-gray-900">
                  {product.productName}
                </td>
                <td className="py-2.5 pr-4 text-right text-gray-700">
                  ${product.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 text-right text-gray-700">
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
