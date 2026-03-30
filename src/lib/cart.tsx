"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types/database";

interface CartState {
  businessId: string | null;
  businessName: string | null;
  items: CartItem[];
  orderType: "pickup" | "delivery";
  tip: number; // cents
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string } // menu_item_id
  | { type: "UPDATE_QUANTITY"; payload: { menuItemId: string; quantity: number } }
  | { type: "SET_BUSINESS"; payload: { id: string; name: string } }
  | { type: "SET_ORDER_TYPE"; payload: "pickup" | "delivery" }
  | { type: "SET_TIP"; payload: number }
  | { type: "CLEAR" }
  | { type: "LOAD"; payload: CartState };

const initialState: CartState = {
  businessId: null,
  businessName: null,
  items: [],
  orderType: "pickup",
  tip: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.menu_item_id === action.payload.menu_item_id
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.menu_item_id === action.payload.menu_item_id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.menu_item_id !== action.payload),
      };
    case "UPDATE_QUANTITY":
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => i.menu_item_id !== action.payload.menuItemId
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menu_item_id === action.payload.menuItemId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    case "SET_BUSINESS":
      // If switching businesses, clear the cart
      if (state.businessId && state.businessId !== action.payload.id) {
        return {
          ...initialState,
          businessId: action.payload.id,
          businessName: action.payload.name,
        };
      }
      return {
        ...state,
        businessId: action.payload.id,
        businessName: action.payload.name,
      };
    case "SET_ORDER_TYPE":
      return { ...state, orderType: action.payload };
    case "SET_TIP":
      return { ...state, tip: action.payload };
    case "CLEAR":
      return initialState;
    case "LOAD":
      return action.payload;
    default:
      return state;
  }
}

interface CartContextValue {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "hubcity_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartState;
        dispatch({ type: "LOAD", payload: parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ state, dispatch, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
