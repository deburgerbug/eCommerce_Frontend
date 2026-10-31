import FaStar from "react-icons/fa"
function Rating({value=0, count}){
    return (
        <span className="rating" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`} >
            <FaStar aria-hidden="true"/>
            <span>{value.toFixed(1)} </span>
            {count !==undefined && <span className="rating-count" >({count}) </span> }
        </span>
        
    )
}

export default Rating;