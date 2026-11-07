
import { useState } from "react";

function Login({ goTo }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save login details
      localStorage.setItem("unirideToken", data.token);
      localStorage.setItem("unirideUser", JSON.stringify(data.user));

      alert(
        `Login successful!\nWelcome ${data.user.fullName}\nRole: ${data.user.role}`
      );

      // Main application screen can be connected here later.

    } catch (error) {
      setError(
        error.message === "Failed to fetch"
          ? "Cannot connect to server. Please try again."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">

      <div className="form-heading">
        <span className="eyebrow">WELCOME BACK</span>

        <h2>Login to your account</h2>

        <p>
          Enter your details to continue to UniRide.
        </p>
      </div>

      <form onSubmit={handleLogin}>

        <div className="input-group">
          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="forgot-row">
          <button
            type="button"
            className="text-button"
            onClick={() => goTo("forgot")}
          >
            Forgot Password?
          </button>
        </div>

        {error && (
          <p
            style={{
              color: "#dc2626",
              fontSize: "14px",
              marginBottom: "12px"
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          className="primary-button"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

      <div className="form-bottom">
        Don't have an account?

        <button
          type="button"
          className="text-button signup-link"
          onClick={() => goTo("role")}
        >
          Sign Up
        </button>
      </div>

    </div>
  );
}

export default Login;
