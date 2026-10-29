import banner1 from "../assets/grocery-banner.img"
import banner2 from "../assets/grocery-banner-2.img"

const BANNERS = [
    {image:banner1, alt: "First Banner", title: "Fruits & Vegetables", text:"Get upto 50% off", link:""},
    {image:banner2, alt: "Second Banner",title: "Great Kitchen Utensils", text: "Get upto 30% off", link: "" }
]
function Banner(){
    return(
        <div>
            {BANNERS.map(()=>{
                
            })}
        </div>
    )
}

export default Banner;