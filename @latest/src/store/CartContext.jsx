import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  function addToCart(product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) =>item.id === product.id ? { ...item, quantity: item.quantity + 1 }: item);
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  }
  function removeFromCart(productId){
    setCart((currentCart)=>currentCart.filter((item)=> item.id !== productId))
  }
  function increaseQuantity(productId){
    setCart((currentCart) => currentCart.flatMap((item) =>item.id === productId ? {...item, quantity: item.quantity + 1}: item));
  }
  function decreaseQuantity(productId){
    setCart((currentCart => currentCart.map((item) => {
        if(item.id !== productId) return [item];
        if(item.quantity === 1) return [];
        return [{...item, quantity: item.quantity - 1}]
    }) ))
  }
  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, increaseQuantity, decreaseQuantity }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(){
    const context = useContext(CartContext);

    if(context === null){
        throw new Error("useCart used within a CartProvider")
    }
    return context;
}