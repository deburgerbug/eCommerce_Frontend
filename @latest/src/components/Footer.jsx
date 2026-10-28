import { Link } from "react-router-dom";
import "../styles/Footer.css"
const FOOTER_COLUMNS = [
    {
        title: "Shop",
        links: [
            {label: "All products", to: "/products"},
            {label: "Cart", to:"/cart"},
            {label: "Wishlist", to:"/wishlist"}
        ]
    },
    {
        title:"Account",
        links:[
            {label:"Login", to:"/login"},
            {label:"Register", to:"/register"},
            {label:"Orders", to:"/orders"}
        ]
    }
]

function Footer(){

    return (
        <footer className="footer" >
            <div className="footer-inner" >
                <div className="footer-brand" >
                    <h2>BhikarChot Store</h2>
                    <p>Fresh Products on Click</p>
                </div>
                {FOOTER_COLUMNS.map((column) => (
                    <nav className="footer-column" key={column.title} aria-label={column.title} >
                        <h3>{column.title}</h3>
                        <ul>
                            {column.links.map((link) =>(
                                <li key={link.to}>
                                    <Link to={link.to}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}
            </div>
            <p className="footer-copy" >&copy; {new Date().getFullYear()} BhikarChot Store. All rights reserved.</p>
        </footer>
    )
}

export default Footer;