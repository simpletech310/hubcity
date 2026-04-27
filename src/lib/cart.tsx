"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types/database";

export interface PickupLocation {
  /** "store" means the business's brick-and-mortar address; "vehicle"
   * means a specific truck/cart from the fleet. */
  kind: "store" | "vehicle";
  vehicleId?: string;
  name: string;
}

/**
 * A single-business "bag" inside the user's cart. Each bag is an
 * independent mini-cart — its own items, order type, pickup location,
 * tip — so that a shopper can simultaneously build a food order at
 * Johnson Brothers BBQ and a clothing order at a retailer without the
 * two ever mixing. Each bag checks out as its own Stripe order, and
 * each business only ever sees their own items.
 */
export interface CartBag {
  businessId: string;
  businessName: string;
  /** Optional — the business slug, used to deep-link back to the
   *  business's order page from inside the cart. */
  businessSlug: string | null;
  /** Optional — small square logo/photo URL for the bag header row. */
  businessLogoUrl: string | null;
  /** Optional — surfaces the vertical (food, retail, etc.) so the cart
   *  can show the right kicker (e.g. "RESTAURANT" vs "SHOP"). */
  businessCategory: string | null;
  items: CartItem[];
  orderType: "pickup" | "delivery";
  pickupLocation: PickupLocation | null;
  tip: number; // cents
}

interface CartState {
  bags: CartBag[];
  /**
   * The business the current /order page is scoped to. Items added via
   * the menu always land in this bag. If null, the user is viewing the
   * cart from somewhere outside a business's order page.
   */
  activeBusinessId: string | null;
}

interface ActiveBusinessDescriptor {
  id: string;
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  category?: string | null;
}

type CartAction =
  | {
      type: "ADD_ITEM";
      payload: {
        /** Business descriptor so we can create the bag on first add. */
        business: ActiveBusinessDescriptor;
        item: CartItem;
      };
    }
  | {
      type: "REMOVE_ITEM";
      payload: { businessId: string; menuItemId: string; variantId?: string };
    }
  | {
      type: "UPDATE_QUANTITY";
      payload: {
        businessId: string;
        menuItemId: string;
        variantId?: string;
        quantity: number;
      };
    }
  | {
      type: "UPDATE_INSTRUCTIONS";
      payload: {
        businessId: string;
        menuItemId: string;
        variantId?: string;
        instructions: string | undefined;
      };
    }
  | { type: "SET_ACTIVE_BUSINESS"; payload: ActiveBusinessDescriptor | null }
  | {
      type: "SET_ORDER_TYPE";
      payload: { businessId: string; orderType: "pickup" | "delivery" };
    }
  | {
      type: "SET_PICKUP_LOCATION";
      payload: { businessId: string; location: PickupLocation | null };
    }
  | { type: "SET_TIP"; payload: { businessId: string; tip: number } }
  | { type: "CLEAR_BAG"; payload: { businessId: string } }
  | { type: "CLEAR" }
  | { type: "LOAD"; payload: CartState };

const initialState: CartState = {
  bags: [],
  activeBusinessId: null,
};

function matchItem(
  item: CartItem,
  menuItemId: string,
  variantId?: string
): boolean {
  return (
    item.menu_item_id === menuItemId &&
    (item.variant_id ?? undefined) === variantId
  );
}

function upsertBag(
  bags: CartBag[],
  descriptor: ActiveBusinessDescriptor
): CartBag[] {
  const existing = bags.find((b) => b.businessId === descriptor.id);
  if (existing) {
    // Refresh any display fields that may have changed (name, logo).
    return bags.map((b) =>
      b.businessId === descriptor.id
        ? {
            ...b,
            businessName: descriptor.name ?? b.businessName,
            businessSlug: descriptor.slug ?? b.businessSlug,
            businessLogoUrl: descriptor.logoUrl ?? b.businessLogoUrl,
            businessCategory: descriptor.category ?? b.businessCategory,
          }
        : b
    );
  }
  return [
    ...bags,
    {
      businessId: descriptor.id,
      businessName: descriptor.name,
      businessSlug: descriptor.slug ?? null,
      businessLogoUrl: descriptor.logoUrl ?? null,
      businessCategory: descriptor.category ?? null,
      items: [],
      orderType: "pickup",
      pickupLocation: null,
      tip: 0,
    },
  ];
}

function mapBag(
  bags: CartBag[],
  businessId: string,
  fn: (bag: CartBag) => CartBag
): CartBag[] {
  return bags.map((b) => (b.businessId === businessId ? fn(b) : b));
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { business, item } = action.payload;
      const ensured = upsertBag(state.bags, business);
      return {
        ...state,
        bags: mapBag(ensured, business.id, (bag) => {
          const existing = bag.items.find((i) =>
            matchItem(i, item.menu_item_id, item.variant_id)
          );
          if (existing) {
            return {
              ...bag,
              items: bag.items.map((i) =>
                matchItem(i, item.menu_item_id, item.variant_id)
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { ...bag, items: [...bag.items, item] };
        }),
      };
    }
    case "REMOVE_ITEM": {
      const { businessId, menuItemId, variantId } = action.payload;
      const bags = mapBag(state.bags, businessId, (bag) => ({
        ...bag,
        items: bag.items.filter((i) => !matchItem(i, menuItemId, variantId)),
      }));
      // Drop bag if empty
      return { ...state, bags: bags.filter((b) => b.items.length > 0) };
    }
    case "UPDATE_QUANTITY": {
      const { businessId, menuItemId, variantId, quantity } = action.payload;
      if (quantity <= 0) {
        const bags = mapBag(state.bags, businessId, (bag) => ({
          ...bag,
          items: bag.items.filter((i) => !matchItem(i, menuItemId, variantId)),
        }));
        return { ...state, bags: bags.filter((b) => b.items.length > 0) };
      }
      return {
        ...state,
        bags: mapBag(state.bags, businessId, (bag) => ({
          ...bag,
          items: bag.items.map((i) =>
            matchItem(i, menuItemId, variantId) ? { ...i, quantity } : i
          ),
        })),
      };
    }
    case "UPDATE_INSTRUCTIONS": {
      const { businessId, menuItemId, variantId, instructions } =
        action.payload;
      return {
        ...state,
        bags: mapBag(state.bags, businessId, (bag) => ({
          ...bag,
          items: bag.items.map((i) =>
            matchItem(i, menuItemId, variantId)
              ? { ...i, special_instructions: instructions }
              : i
          ),
        })),
      };
    }
    case "SET_ACTIVE_BUSINESS": {
      if (!action.payload) {
        return { ...state, activeBusinessId: null };
      }
      return {
        ...state,
        activeBusinessId: action.payload.id,
        // Don't create an empty bag on mount — only create one once an
        // item actually gets added. This keeps the cart tidy when a
        // user just browses a menu without adding anything.
        bags: state.bags.some((b) => b.businessId === action.payload!.id)
          ? upsertBag(state.bags, action.payload)
          : state.bags,
      };
    }
    case "SET_ORDER_TYPE": {
      const { businessId, orderType } = action.payload;
      return {
        ...state,
        bags: mapBag(state.bags, businessId, (bag) => ({ ...bag, orderType })),
      };
    }
    case "SET_PICKUP_LOCATION": {
      const { businessId, location } = action.payload;
      return {
        ...state,
        bags: mapBag(state.bags, businessId, (bag) => ({
          ...bag,
          pickupLocation: location,
        })),
      };
    }
    case "SET_TIP": {
      const { businessId, tip } = action.payload;
      return {
        ...state,
        bags: mapBag(state.bags, businessId, (bag) => ({ ...bag, tip })),
      };
    }
    case "CLEAR_BAG":
      return {
        ...state,
        bags: state.bags.filter((b) => b.businessId !== action.payload.businessId),
      };
    case "CLEAR":
      return { ...initialState, activeBusinessId: state.activeBusinessId };
    case "LOAD":
      return action.payload;
    default:
      return state;
  }
}

export function bagSubtotal(bag: CartBag): number {
  return bag.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function bagItemCount(bag: CartBag): number {
  return bag.items.reduce((sum, item) => sum + item.quantity, 0);
}

interface CartContextValue {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  /** The bag for the business the user is currently shopping. May be
   *  undefined if they haven't added anything yet at the active
   *  business. */
  activeBag: CartBag | undefined;
  /** All bags the shopper currently has in flight, across every
   *  business they've shopped at. */
  bags: CartBag[];
  /** Subtotal for the ACTIVE bag only (cents). Used by OrderView. */
  subtotal: number;
  /** Item count for the ACTIVE bag only. Used by OrderView. */
  itemCount: number;
  /** Item count across every bag — for the global cart badge. */
  totalItemCount: number;
  /** Subtotal across every bag. */
  totalSubtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "knect_cart_v2";
const LEGACY_CART_STORAGE_KEY = "knect_cart";

// Legacy (single-bag) shape from before multi-business carts shipped.
interface LegacyCartState {
  businessId: string | null;
  businessName: string | null;
  items: CartItem[];
  orderType: "pickup" | "delivery";
  pickupLocation: PickupLocation | null;
  tip: number;
}

function migrateLegacy(legacy: LegacyCartState): CartState {
  if (!legacy.businessId || legacy.items.length === 0) {
    return initialState;
  }
  return {
    activeBusinessId: legacy.businessId,
    bags: [
      {
        businessId: legacy.businessId,
        businessName: legacy.businessName ?? "Your Order",
        businessSlug: null,
        businessLogoUrl: null,
        businessCategory: null,
        items: legacy.items,
        orderType: legacy.orderType,
        pickupLocation: legacy.pickupLocation,
        tip: legacy.tip,
      },
    ],
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load from localStorage on mount — prefer the v2 key, fall back to
  // the legacy key and migrate in place.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartState;
        if (Array.isArray(parsed.bags)) {
          dispatch({ type: "LOAD", payload: parsed });
          return;
        }
      }
      const legacyStored = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
      if (legacyStored) {
        const legacy = JSON.parse(legacyStored) as LegacyCartState;
        dispatch({ type: "LOAD", payload: migrateLegacy(legacy) });
        // Remove the legacy key so we don't migrate twice.
        localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage on change. Also dispatch a custom in-tab
  // event so the top-nav <CartIconButton> can refresh its badge
  // without waiting for a full re-render of the provider tree.
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent("cart-changed"));
    } catch {
      // ignore
    }
  }, [state]);

  const value = useMemo<CartContextValue>(() => {
    const activeBag = state.activeBusinessId
      ? state.bags.find((b) => b.businessId === state.activeBusinessId)
      : undefined;
    const subtotal = activeBag ? bagSubtotal(activeBag) : 0;
    const itemCount = activeBag ? bagItemCount(activeBag) : 0;
    const totalItemCount = state.bags.reduce(
      (sum, bag) => sum + bagItemCount(bag),
      0
    );
    const totalSubtotal = state.bags.reduce(
      (sum, bag) => sum + bagSubtotal(bag),
      0
    );
    return {
      state,
      dispatch,
      activeBag,
      bags: state.bags,
      subtotal,
      itemCount,
      totalItemCount,
      totalSubtotal,
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
