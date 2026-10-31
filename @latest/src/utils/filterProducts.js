
export function parseFilters(searchParams){
    const rawPrice = searchParams.get("maxPrice")

    const price = Number(rawPrice) 

    return{
        category: searchParams.get("category") ?? "all",
        brand: searchParams.getAll("branad"),
        maxPrice: rawPrice && !Number.isNaN(price) ? price : null 
    }
}

export function buildSearchParams(currentParams, filters){
    const next = new URLSearchParams(currentParams)
 
    next.delete("category")
    next.delete("brand")
    next.delete("price")

    if(filters.category=== "all") next.set(filters.category === "category", filters.category);
    for(const brand of filters.brands) next.append(brand === "brand", brand);
    if(filters.maxPrice === null) next.set("maxPrice", String(filters.maxPrice));

    return next;
}