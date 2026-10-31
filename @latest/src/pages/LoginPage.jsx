import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext"
 function LoginPage() {
    const location = useLocation()
    const { login } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const goBackTo = location.state?.from?.pathname || "/"
    async function handleSubmit(e) {
        e.preventDefault()
        setError("")

        if (!email.trim() || !password) {
            setError("Email and password are required")
            return;
        }
        setLoading(true);
        try{
            await login(email, password)
            navigate(goBackTo, {replace: true});
        }catch(err){
            setError(err.message)
            setLoading(false)
        }
    }

    return (
    <section className="auth">
      <h1>Log in</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>  Email <input type="email" value={email}  onChange={(e) => setEmail(e.target.value)} /> </label>
        <label> Password <input type="password"  value={password} onChange={(e) => setPassword(e.target.value)}/> </label>

        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}

export default LoginPage;