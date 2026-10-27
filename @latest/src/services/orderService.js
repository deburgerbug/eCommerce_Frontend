import { readJSON, writeJSON } from "./storage";

export function getOrdersKey(user){
    return "orders:" + user.id
}

export function loadOrders(user){
    const orders = readJSON(getOrdersKey(user), [])
    return Array.isArray(orders) ? orders: []
}

export function saveOrder(user, order){
    const orders = loadOrders(user)
    writeJSON(getOrdersKey(user), [order, ...orders])
}