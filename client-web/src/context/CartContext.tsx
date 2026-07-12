import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";

export interface CartItem {
  id: string; 
  brand: string;
  name: string;
  storage: string;
  color: string;
  condition: string;
  price: number;
  imageUrl: string;
  quantity: number;
  maxStock: number; 
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "id" | "quantity">, quantity: number, maxStock: number) => { success: boolean; message: string };
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  clearCart: () => void; // Added
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const MAX_PER_CUSTOMER = 5;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("ikphones_cart");
    if (!saved) return [];
    
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((item: any) => ({
        ...item,
        quantity: item.quantity || 1,
        maxStock: item.maxStock || 1,
        price: item.price || 0
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("ikphones_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ikphones_cart" && e.newValue) {
        setCart(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const addToCart = useCallback((item: Omit<CartItem, "id" | "quantity">, quantity: number, maxStock: number) => {
    const id = `${item.brand}-${item.name}-${item.storage}-${item.color}-${item.condition}`.replace(/\s+/g, '-').toLowerCase();
    
    let result = { success: false, message: "" };

    setCart((prev) => {
      const existingItemIndex = prev.findIndex((i) => i.id === id);
      const currentCartQty = existingItemIndex >= 0 ? prev[existingItemIndex].quantity : 0;
      const absoluteMax = Math.min(maxStock, MAX_PER_CUSTOMER);

      if (currentCartQty + quantity > absoluteMax) {
        if (maxStock < MAX_PER_CUSTOMER) {
          result = { success: false, message: `Only ${maxStock} left in stock.` };
        } else {
          result = { success: false, message: `Limit of ${MAX_PER_CUSTOMER} per customer.` };
        }
        return prev; 
      }

      result = { success: true, message: `Added ${quantity} to bag.` };

      if (existingItemIndex >= 0) {
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += quantity;
        newCart[existingItemIndex].maxStock = maxStock; 
        return newCart;
      }

      return [...prev, { ...item, id, quantity, maxStock }];
    });

    return result;
  }, []);

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        const validQuantity = Math.max(1, Math.min(newQuantity, Math.min(item.maxStock, MAX_PER_CUSTOMER)));
        return { ...item, quantity: validQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};