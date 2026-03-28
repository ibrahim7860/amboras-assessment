"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface EventCounts {
  [key: string]: number;
}

const LABEL_MAP: Record<string, string> = {
  page_views: "Page Views",
  add_to_cart: "Add to Cart",
  purchases: "Purchases",
  signups: "Signups",
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#1c1c20] px-3 py-2 text-xs shadow-lg ring-1 ring-white/[0.06]">
      <p className="font-medium text-[#a1a1aa]">{label}</p>
      <p className="mt-0.5 font-mono font-semibold text-white">
        {payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export function RevenueChart({ eventCounts }: { eventCounts: EventCounts }) {
  const data = Object.entries(eventCounts).map(([key, count]) => ({
    name: LABEL_MAP[key] || key.replace(/_/g, " "),
    count,
  }));

  return (
    <div className="card-elevated p-6">
      <h3 className="mb-6 text-sm font-semibold text-text-primary">
        Event Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#63636e", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#818cf8"
            fill="url(#colorCount)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#818cf8", stroke: "#09090b", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
