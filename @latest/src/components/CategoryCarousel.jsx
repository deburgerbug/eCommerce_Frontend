import { useState } from "react";
import { useSearchParams } from "react-router-dom";

function CategoryCarousel({ categories = [] }) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const [currentIndex, setCurrentIndex] = useState(0)

    function handleNext() {
        if (currentIndex < categories.length - 1) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    function 

    return (
        <section className="category-carousel" aria-label="Shop by category">
            <button
                type="button"
                className="category-carousel-arrow"
                aria-label="Scroll categories left"
                onClick={() => scrollCategories(-1)}
                disabled={!canScrollLeft}
                style={{ opacity: canScrollLeft ? 1 : 0.3, pointerEvents: canScrollLeft ? "auto" : "none" }}
            >
                <ChevronLeft aria-hidden="true" />
            </button>

            <div
                className="category-carousel-list"
                ref={carouselRef}
                style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none" }}
            >
                {categories.map((category) => (
                    <button
                        key={category}
                        type="button"
                        className="category-carousel-item"
                        onClick={() => handleCategoryClick(category)}
                    >
                        {(category || "").replaceAll("-", " ")}
                    </button>
                ))}
            </div>

            <button
                type="button"
                className="category-carousel-arrow"
                aria-label="Scroll categories right"
                onClick={() => scrollCategories(1)}
                disabled={!canScrollRight}
                style={{ opacity: canScrollRight ? 1 : 0.3, pointerEvents: canScrollRight ? "auto" : "none" }}
            >
                <ChevronRight aria-hidden="true" />
            </button>
        </section>
    )
}

export default CategoryCarousel;


// import { useRef } from "react"
// import { useNavigate, useSearchParams } from "react-router-dom"
// import { ChevronLeft, ChevronRight } from "react-feather"

// function CategoryCarousel({ categories = [] }) {
//   const carouselRef = useRef(null)
//   const navigate = useNavigate()
//   const [searchParams] = useSearchParams()

//   function scrollCategories(direction) {
//     carouselRef.current?.scrollBy({
//       left: direction * 240,
//       behavior: "smooth",
//     })
//   }

//   function handleCategoryClick(category) {
//     const params = new URLSearchParams(searchParams)
//     params.set("category", category)

//     navigate({
//       pathname: "/products",
//       search: params.toString(),
//     })
//   }

//   return (
//     <section className="category-carousel" aria-label="Shop by category">
//       <button
//         type="button"
//         className="category-carousel-arrow"
//         aria-label="Scroll categories left"
//         onClick={() => scrollCategories(-1)}
//       >
//         <ChevronLeft aria-hidden="true" />
//       </button>

//       <div className="category-carousel-list" ref={carouselRef}>
//         {categories.map((category) => (
//           <button
//             key={category}
//             type="button"
//             className="category-carousel-item"
//             onClick={() => handleCategoryClick(category)}
//           >
//             {category.replaceAll("-", " ")}
//           </button>
//         ))}
//       </div>

//       <button
//         type="button"
//         className="category-carousel-arrow"
//         aria-label="Scroll categories right"
//         onClick={() => scrollCategories(1)}
//       >
//         <ChevronRight aria-hidden="true" />
//       </button>
//     </section>
//   )
// }

// export default CategoryCarousel