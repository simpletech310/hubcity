"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart";
import type { MenuItem } from "@/types/database";

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { dispatch } = useCart();

  function handleAdd() {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      },
    });
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-bold truncate">{item.name}</h3>
          {item.description && (
            <p className="text-[11px] text-txt-secondary mt-0.5 line-clamp-2">
              {item.description}
            </p>
          )}
          <p className="text-sm font-heading font-bold text-gold mt-1.5">
            ${(item.price / 100).toFixed(2)}
          </p>
        </div>
        <Button size="sm" onClick={handleAdd} className="shrink-0 mt-1">
          Add
        </Button>
      </div>
    </Card>
  );
}
