import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./AuthContext.jsx"
import { getWishlistKey, loadWishlist, saveWishlist } from "../services/wishlistService.js"

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const key = getWishlistKey(user)
  const [wishlist, setWishlist] = useState(() => loadWishlist(key))

  useEffect(() => {
    setWishlist(loadWishlist(key))
  }, [key])

  function changeWishlist(next) {
    setWishlist(next)
    saveWishlist(key, next)
  }

  function isInWishlist(id) {
    return wishlist.some((item) => item.id === id)
  }

  function toggleWishlist(product) {
    if (isInWishlist(product.id)) {
      changeWishlist(wishlist.filter((item) => item.id !== product.id))
    } else {
      changeWishlist([
        ...wishlist,
        { id: product.id, title: product.title, price: product.price,
          thumbnail: product.thumbnail, category: product.category, stock: product.stock },
      ])
    }
  }

  return (
    <WishlistContext.Provider value={{ wishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === null) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}