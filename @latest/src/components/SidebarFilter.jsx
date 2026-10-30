import { useMemo } from "react"


function SidebarFilter({products=[], onClear}){

   const categories = useMemo(()=>{
    const counts = new Map()

    for(const product of products){
        counts.set(product.category, (counts.get(product.category) ?? 0) + 1)
    }

    return [...counts.entries()]
        .map(([name,count]) => ([name, count]))
        .sort((a, b) => a.name.localeCompare(b.name))
   }, [products])

    return(
        <aside>
            <div>
                <h2>Filters</h2>
                <button type="button" onClick={onClear} >Clear all</button>
            </div>

            <section>
                <h3 aria-label="categories" >Categories</h3>
                <ul>
                    {categories.map((category) =>{
                        <li key={category.name}>
                            <span> {category.name}</span>
                            <span>{category.count}</span>
                        </li>
                    })}
                </ul>
            </section>
        </aside>
    )
}

export default SidebarFilter;