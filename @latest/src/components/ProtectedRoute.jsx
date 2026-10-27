import { useAuth } from "../store/AuthContext";
import {useLocation, Navigate, Outlet} from "react-router-dom"
function ProtectedRoute(){
    const { isLoggedIn } = useAuth()
    const  location  = useLocation()

    if(!isLoggedIn){
        return <Navigate to="/login" replace state={{from: location}} ></Navigate>
    }
    return <Outlet/>
}

export default ProtectedRoute;