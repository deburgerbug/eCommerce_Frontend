import { useEffect, useRef, useState } from "react";

function CategoryCarousel({categories,selectedCategory,onSelectCategory,totalCount,}) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    function updateScrollButtons() {
      setCanScrollLeft(track.scrollLeft > 1);
      setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 1,);
    }
    updateScrollButtons();
    track.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      track.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [categories]);

  function scrollTrack(direction) {
    const track = trackRef.current;
    if (!track) return;

    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  const categoryCards = [{name: "all", label: "All products", count: totalCount, image: null},
    ...categories.map((category) => ({...category, label: category.name.replaceAll("-", " ") }))];

  return (
    <section className="category-carousel" aria-label="Browse product categories">
      <div className="category-carousel-heading">
        <h2>Shop by category</h2>
        <div className="category-carousel-controls">
          <button
            type="button"
            onClick={() => scrollTrack(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={() => scrollTrack(1)}
            disabled={!canScrollRight}
            aria-label="Scroll categories right"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <ul className="category-carousel-track" ref={trackRef}>
        {categoryCards.map((category) => (
          <li className="category-carousel-item" key={category.name}>
            <button
              className="category-card"
              type="button"
              aria-pressed={selectedCategory === category.name}
              onClick={() => onSelectCategory(category.name)}
            >
              {category.image ? (
                <img
                  className="category-card-image"
                  src={category.image}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <span
                  className="category-card-placeholder"
                  aria-hidden="true"
                />
              )}
              <span className="category-card-shade" aria-hidden="true" />
              <span className="category-card-content">
                <span className="category-card-name">{category.label}</span>
                <span className="category-card-count">
                  {category.count}{" "}
                  {category.count === 1 ? "product" : "products"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CategoryCarousel;
