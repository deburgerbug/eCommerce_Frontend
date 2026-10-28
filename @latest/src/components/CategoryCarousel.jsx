import { useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "react-feather";

function CategoryCarousel({ categories = [], productCount = 0, allImage = "" }) {
  const listRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selected = searchParams.get("category") || "all";
  const cards = [
    { name: "all", label: "All products", count: productCount, image: allImage },
    ...categories,
  ];
  function scroll(direction) {
    listRef.current.scrollBy({ left: direction * 220, behavior: "smooth" });
  }

  function chooseCategory(name) {
    if (name === "all") {
      navigate("/products");
    } else {
      navigate("/products?category=" + name);
    }
  }

  return (
    <section className="category-carousel">
      <div className="category-carousel-heading" >Featured Categories</div>
      <button type="button" className="category-carousel-arrow" onClick={() => scroll(-1)}>
        <ChevronLeft />
      </button>
      
      <div className="category-carousel-list" ref={listRef}>
        {cards.map((card) => (
          <button
            key={card.name}
            type="button"
            className={"category-carousel-item " + (selected === card.name ? "is-active" : "")}
            onClick={() => chooseCategory(card.name)}
          >
            {card.image && <img src={card.image} alt="" />}
            <span className="category-carousel-name">{card.label}</span>
            <span className="category-carousel-count">{card.count} products</span>
          </button>
        ))}
      </div>

      <button type="button" className="category-carousel-arrow" onClick={() => scroll(1)}>
        <ChevronRight />
      </button>
    </section>
  );
}

export default CategoryCarousel;