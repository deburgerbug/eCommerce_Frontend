import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import slide1 from "../assets/slide-1.jpg"
import slide2 from "../assets/slider-2.jpg"
import "../styles/heroSlider.css"
const SLIDES= [
        {image: slide1,  alt: "First slide", title: "Free Shipping on first order", text:"Great deals on anything you need", link: "/products"},
        {image: slide2,  alt: "Second slide", title: "Opening Sale discount on 50%", text: "Shop our popular products and save more", link: "/products"}
    ]

const INTERVAL_MS = 3000 
function HeroSlider(){
    
    const [index, setIndex] = useState(0)

    useEffect(()=>{
        const id = setInterval(()=>{
            setIndex((current)=> (current + 1) % SLIDES.length)

        }, INTERVAL_MS)

        return () => clearInterval(id)
    }, [])



    return (
        <section className="hero-slider" >
            <div className="hero-slider-track" style={{ transform: `translateX(-${index * 100}%)` }}>
                {SLIDES.map((slide) => (
                    <div className="hero-slide" key={slide.alt} >
                        <img src={slide.image} alt={slide.alt} />
                        <div className="hero-slide-content" >
                            <h2>{slide.title}</h2>
                            <p>{slide.text}</p>
                            <Link to={slide.link} className="hero-slide-button">Shop now</Link>
                        </div>
                    </div>
                ))}
                <h2> </h2>
            </div>
        </section>
    )
}
export default HeroSlider;