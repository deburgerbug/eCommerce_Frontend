import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "react-feather";

function CategoryCarousel({ categories = [], productCount = 0, allImage = "" }) {
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isPaused, setIsPaused] = useState(false);
  const selectedCategory = searchParams.get("category") ?? "all";
  const categoryCards = [
    { name: "all", label: "All products", count: productCount, image: allImage },
    ...categories.map((category) =>
      typeof category === "string"
        ? { name: category, label: category.replaceAll("-", " ") }
        : category,
    ),
  ];

  function scrollCategories(direction) {
    carouselRef.current?.scrollBy({
      left: direction * 220,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    if (isPaused || categoryCards.length < 2) return undefined;

    const intervalId = window.setInterval(() => {
      const carousel = carouselRef.current;
      if (!carousel) return;

      const firstCard = carousel.querySelector(".category-carousel-item");
      const gap = Number.parseFloat(window.getComputedStyle(carousel).gap) || 0;
      const scrollAmount = (firstCard?.getBoundingClientRect().width ?? 220) + gap;
      const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 2;

      carousel.scrollTo({
        left: isAtEnd ? 0 : carousel.scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [categoryCards.length, isPaused]);

  function handleCategoryClick(category) {
    const params = new URLSearchParams(searchParams);

    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    const query = params.toString();
    navigate({
      pathname: "/products",
      search: query ? `?${query}` : "",
    });
  }

  return (
    <section
      className="category-carousel"
      aria-label="Shop by category"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <button
        type="button"
        className="category-carousel-arrow"
        aria-label="Scroll categories left"
        onClick={() => scrollCategories(-1)}
      >
        <ChevronLeft aria-hidden="true" />
      </button>

      <div className="category-carousel-list" ref={carouselRef}>
        {categoryCards.map((category) => (
          <button
            key={category.name}
            type="button"
            className={`category-carousel-item ${
              selectedCategory === category.name ? "is-active" : ""
            }`}
            aria-pressed={selectedCategory === category.name}
            onClick={() => handleCategoryClick(category.name)}
          >
            {category.image && (
              <img src={category.image} alt="" loading="lazy" />
            )}
            <span className="category-carousel-name">{category.label}</span>
            {category.count != null && (
              <span className="category-carousel-count">
                {category.count} {category.count === 1 ? "product" : "products"}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="category-carousel-arrow"
        aria-label="Scroll categories right"
        onClick={() => scrollCategories(1)}
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </section>
  );
}

export default CategoryCarousel;
