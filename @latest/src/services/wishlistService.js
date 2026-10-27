import { readJSON, writeJSON } from "./storage.JS"

export function getWishlistKey(user) {
  return user === null ? "wishlist:guest" : "wishlist:" + user.id
}

export function loadWishlist(key) {
  const items = readJSON(key, [])
  return Array.isArray(items) ? items : []
}

export function saveWishlist(key, items) {
  writeJSON(key, items)
}