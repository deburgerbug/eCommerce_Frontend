import { readJSON, writeJSON } from "./storage"
export const GUEST_CART_KEY = "cart:guest"

export function loadCart(key){
    const items = readJSON(key, [])

    if(Array.isArray(items)) {
        return items;
    }
    return [];
}
export function getCartKey(user){
    if(user === null){
        return GUEST_CART_KEY
    }
    return  "cart:" + user.id
}

export function saveCart(key, items){
    writeJSON(key, items)
}