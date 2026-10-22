function ProductFilters({searchTerm, onSearchChange, categories, selectedCategory, onCategoryChange}){
    return (
        <div className="products-filters">
            <label>
                <span className="visually-hidden">Search Products </span>
                <input type="text" placeholder="search" value={searchTerm} onChange={onSearchChange} />
            </label>
            <label>
                <span className="visually-hidden">Filter by category</span>
                <select value={selectedCategory} onChange={onCategoryChange}>
                    <option value="all" >All</option>
                    {categories.map((category)=>(
                        <option key={category} value={category} > {category.replaceAll("-", " ")}</option>
                    ))}
                </select>
            </label>

        </div>
    )
}
export default ProductFilters;