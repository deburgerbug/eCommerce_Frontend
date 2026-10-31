
import { useMemo } from "react";
import "../styles/SidebarFilter.css";

function SidebarFilter({ products = [], onClear }) {
  const categories = useMemo(() => {
    const counts = new Map();

    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  return (
    <aside className="sidebar" aria-label="Product filters">
      <div className="sidebar-header">
        <h2>Filters</h2>
        <button type="button" className="sidebar-clear" onClick={onClear}>
          Clear all
        </button>
      </div>

      <section className="sidebar-section" aria-labelledby="sidebar-categories-heading">
        <h3 id="sidebar-categories-heading">Categories</h3>
        <ul className="sidebar-categories">
          {categories.map((category) => (
            <li key={category.name}>
              <span className="sidebar-category-name">
                {category.name.replaceAll("-", " ")}
              </span>
              <span className="sidebar-count">{category.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

export default SidebarFilter;

