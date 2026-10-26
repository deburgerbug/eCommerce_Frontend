import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext"
import "../styles/navbar.css"
 function LoginPage() {
    const { login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    let goBackTo = "/"

    async function handleSubmit(e) {
        e.preventDefault()
        setError(false)

        if (!email.trim() === "" || !password === "") {
            setError("email and passowrd is required")
            return;
        }
        setLoading(true);
        try{
            await login(email, password)
            Navigate(goBackTo, {replace: true});
        }catch(err){
            setError(err.message)
            setLoading(false)
        }
    }

    return (
    <section className="auth">
      <h1>Log in</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

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