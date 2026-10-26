import {useState} from "react"
import {Link} from "react-rouder-dom"

function CheckoutPage(){
    const PAYMENT_METHODS = [
        {id: 1, label: "UPI", summary: "Pay using any UPI" },
        {id: 2, label: "Card", summary: "Pay with any Card"},
        {id: 3, label: "netbanking", summary: "Use Netbanking"}
 
    ]

    const [method, setMethod] = useState(PAYMENT_METHODS[0].id)
    const [placed, setPlaced] = useState(false)


    return (
        <section>
            <Link to="/"  >Back to products</Link>
        </section>
    )
}