
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "เข้าสู่ระบบไม่สำเร็จ");
      }

      if (!data.token) {
        throw new Error("ไม่พบ Token จากเซิร์ฟเวอร์");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("member", JSON.stringify(data.member));

      navigate("/");
    } catch (err) {
      setError(err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <span>◉</span> POKÉDEX
        </Link>

        <div className="auth-pokemon">
          <img
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
            alt="Pikachu"
          />
        </div>

        <div className="auth-heading">
          <h1>Welcome Back!</h1>
          <p>เข้าสู่ระบบเพื่อออกเดินทางในโลก Pokémon</p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          ยังไม่มีบัญชี? <Link to="/register">Sign Up</Link>
        </p>

        <Link to="/" className="auth-back">
          ← กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}

export default Login;
