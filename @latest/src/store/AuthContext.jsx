import { createContext, useState, useContext } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../services/authService";

const AuthContext = createContext(null)

export function AuthProvider({children}){
    const [user,setUser] = useState(() => getCurrentUser())

    async function register(name,email, password){
        const newUser = await registerUser(name,email, password)
        setUser(newUser);
        return newUser;
    }

    async function login(email, password){
        const loggedInuser = await loginUser(email, password)
        setUser(loggedInuser)
        return loggedInuser;
    }
    async function logout(){
        logoutUser();
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{user, isLoggedIn: user !== null, register, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
