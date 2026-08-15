import { useState } from "react";
import restaurantImage from "../assets/restaurant.jpeg";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5050";

function UserIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.6-4 3-6 7-6s6.4 2 7 6" /></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage(`Welcome, ${data.user.name}`);
      onLogin();
    } catch (error) {
      console.error("Login request failed:", error);
      setIsError(true);
      setMessage("Unable to connect to the server");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="pos-login">
      <section className="login-side" aria-labelledby="login-heading">
        <div className="login-box">
          <div className="shield" aria-hidden="true">
            <svg viewBox="0 0 64 72"><path d="M32 4c9 7 18 8 27 8v18c0 18-10 30-27 38C15 60 5 48 5 30V12c9 0 18-1 27-8Z" /><circle cx="32" cy="27" r="8" /><path d="M18 51c1-10 6-15 14-15s13 5 14 15" /></svg>
          </div>
          <h1 id="login-heading">Staff Login</h1>
          <p>Enter your account details to continue</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <div className="simple-input"><UserIcon /><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>

            <label htmlFor="password">Password</label>
            <div className="simple-input"><LockIcon /><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>

            <button type="submit" disabled={isLoading}>{isLoading ? "Signing in..." : "Login"}</button>
          </form>

          {message && <p className={`login-message ${isError ? "error" : "success"}`} role="status">{message}</p>}
        </div>
      </section>

      <section className="brand-side" style={{ backgroundImage: `url(${restaurantImage})` }} aria-label="Lumora point of sale">
        <div className="brand-overlay" />
        <div className="pos-brand">
          <svg viewBox="0 0 90 80" aria-hidden="true"><path d="M8 12h12l9 40h42l9-29H25" /><circle cx="37" cy="66" r="6" /><circle cx="67" cy="66" r="6" /><path d="m40 18 7-10 7 10 7-10 7 10" /></svg>
          <div><strong>LUMORA</strong><span>P·O·S</span></div>
          <p>Point of Sale Software</p>
        </div>
      </section>
    </main>
  );
}

export default Login;
