import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./AuthContext";
import { getCartKey, loadCart, saveCart } from "../services/cartServices";
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const { user } = useAuth()
  const cartKey = getCartKey(user)

  const [cart, setCart] = useState(() => loadCart(cartKey));


  useEffect(() => {
    setCart(loadCart(cartKey))
  }, [cartKey])

  function changeCart(newCart){
    setCart(newCart)
    saveCart(cartKey, newCart)
  }

  function addToCart(product) {
    const existingItem = cart.find((item) => item.id === product.id)

    if(existingItem){
      const newCart = cart.map((item)=> {
        if(item.id === product.id){
          return {...item, quantity: item.quantity + 1}
        }
        return item;
      })
      changeCart(newCart);
    }else{
      const newItem = {
        id: product.id, title: product.title, price: product.price, thumbnail: product.thumbnail, stock: product.stock, category: product.category, quantity: 1
      };
      changeCart([...cart, newItem])
    }
  }
  function removeFromCart(productId) {
    const newCart = cart.filter((item) => item.id !== productId)
    changeCart(newCart)
  }

  function increaseQuantity(productId) {
    const newCart = [];

    for (const item of cart){
      if(item.id !== productId){
        newCart.push(item);
      }else if (item.quantity > 1) {
        newCart.push({...item, quantity: item.quantity + 1})
      }
      changeCart(newCart);
    }
  }
  function decreaseQuantity(productId) {
    const newCart = [];

    for (const item of cart) {
      if(item.id !== productId) {
        newCart.push(item);
      }else if (item.quantity > 1){
        newCart.push({...item ,quantity: item.quantity - 1})
      }
    }
  }
  function clearCart(){
    changeCart([])
  }
  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart}}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (context === null) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context;
}