const proceFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
})

export function formatPrice(value){
    return proceFormatter.format(value ?? 0)
}

export function formatCategory(slug=""){
    return slug.replaceAll("-", "").replace(/\b\w/g, (char)=> char.toUpperCase())
}

export function formatdate(iso){
    return new Date(iso).toLocaleDateString(undefined,{
        day: "numeric",
        month: "short",
        year: 'numeric'
    })
}