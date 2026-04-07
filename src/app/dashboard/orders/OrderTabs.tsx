"use client";

import { useState } from "react";
import OrderFilters from "./OrderFilters";
import DeliveryOrders from "./DeliveryOrders";
import type { OrderWithRelations } from "./OrderFilters";

type Tab = "all" | "delivery";

export default function OrderTabs({
  orders,
  activeDeliveryCount,
}: {
  orders: OrderWithRelations[];
  activeDeliveryCount: number;
}) {
  const [tab, setTab] = useState<Tab>("all");

  return (
    <>
      {/* Tab bar */}
      <div className="flex rounded-xl bg-white/[0.04] border border-border-subtle p-1 gap-1">
        <button
          onClick={() => setTab("all")}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
            tab === "all"
              ? "bg-gold text-black"
              : "text-txt-secondary hover:text-white"
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => setTab("delivery")}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
            tab === "delivery"
              ? "bg-gold text-black"
              : "text-txt-secondary hover:text-white"
          }`}
        >
          Delivery
          {activeDeliveryCount > 0 && (
            <span
              className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${
                tab === "delivery"
                  ? "bg-black/20 text-black"
                  : "bg-cyan-500/20 text-cyan-400"
              }`}
            >
              {activeDeliveryCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {tab === "all" ? (
        <OrderFilters orders={orders} />
      ) : (
        <DeliveryOrders orders={orders} />
      )}
    </>
  );
}
